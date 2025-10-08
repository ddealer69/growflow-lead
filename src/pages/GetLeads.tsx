import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Globe, Calendar, Users, ExternalLink, Search, Play, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_CONFIG } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: string;
  name: string;
  logo_url?: string;
  signature?: string;
  metadata?: any;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  domain?: string;
  notes?: string;
  metadata?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  banners: Banner[];
}

interface CompaniesResponse {
  success: boolean;
  message: string;
  data: {
    account_id: string;
    companies: Company[];
    total_companies: number;
    total_banners: number;
  };
}

interface SearchQuery {
  id: string;
  account_id: string;
  company_id: string;
  name: string;
  query_string: string;
  pages_requested: number;
  pages_fetched: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  finished_at?: string;
}

interface SearchResult {
  id: string;
  query_id: string;
  page_number: number;
  position: number;
  title: string;
  link: string;
  snippet: string;
  is_processed: boolean;
  created_at: string;
}

interface CreateQueryForm {
  name: string;
  query_string: string;
  company_banner_id: string;
  pages_requested: number;
  dedupe_mode: string;
  notes: string;
}

export default function GetLeads() {
  const navigate = useNavigate();
  const { user, accountId } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryForm, setQueryForm] = useState<CreateQueryForm>({
    name: "",
    query_string: "",
    company_banner_id: "",
    pages_requested: 5,
    dedupe_mode: "per_company",
    notes: ""
  });
  const [creatingQuery, setCreatingQuery] = useState(false);
  const [processingQueries, setProcessingQueries] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<{[queryId: string]: SearchResult[]}>({});
  const [loadingResults, setLoadingResults] = useState<Set<string>>(new Set());
  const [visibleResults, setVisibleResults] = useState<Set<string>>(new Set());
  const [loadingExistingQueries, setLoadingExistingQueries] = useState(false);
  const [enrichingLeads, setEnrichingLeads] = useState<Set<string>>(new Set());
  
  // Session variables for the current company context
  const [sessionVars, setSessionVars] = useState<{
    account_id: string;
    company_id: string;
    company_banner_id: string;
    created_by: string;
    source_query_id: string;
  } | null>(null);
  
  // Enrichment progress tracking
  const [enrichmentProgress, setEnrichmentProgress] = useState<{[queryId: string]: {
    total: number;
    completed: number;
    successful: number;
    failed: number;
    isRunning: boolean;
  }}>({});

  useEffect(() => {
    if (accountId) {
      fetchCompanies();
    }
  }, [accountId]);

  const fetchCompanies = async () => {
    if (!accountId) {
      toast({
        title: "Error",
        description: "No account ID found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/accounts/${accountId}/companies-with-banners`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CompaniesResponse = await response.json();
      
      if (data.success) {
        setCompanies(data.data.companies);
        toast({
          title: "Success",
          description: `Found ${data.data.total_companies} companies with ${data.data.total_banners} banners`,
        });
      } else {
        throw new Error(data.message || "Failed to fetch companies");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    fetchExistingQueries(company.id);
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setShowQueryForm(false);
    setQueries([]);
    setSearchResults({});
    setVisibleResults(new Set());
    // Clear session variables and enrichment progress when going back
    setSessionVars(null);
    setEnrichmentProgress({});
  };

  const fetchExistingQueries = async (companyId: string) => {
    setLoadingExistingQueries(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/search/companies/${companyId}/queries`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setQueries(data.queries || []);
        
        // Save session variables from the first query if available
        if (data.queries && data.queries.length > 0) {
          const firstQuery = data.queries[0];
          setSessionVars({
            account_id: firstQuery.account_id,
            company_id: firstQuery.company_id,
            company_banner_id: firstQuery.company_banner_id,
            created_by: firstQuery.created_by,
            source_query_id: firstQuery.id // Will be updated when selecting specific query
          });
          
          toast({
            title: "Success",
            description: `Found ${data.queries.length} existing queries for this company`,
          });
        }
      } else {
        throw new Error(data.message || "Failed to fetch existing queries");
      }
    } catch (error) {
      console.error("Error fetching existing queries:", error);
      // Don't show error toast for 404 or when no queries exist - this is expected
      if (error instanceof Error && !error.message.includes('404')) {
        toast({
          title: "Info",
          description: "No existing queries found for this company",
        });
      }
      setQueries([]);
    } finally {
      setLoadingExistingQueries(false);
    }
  };

  const createSearchQuery = async () => {
    if (!selectedCompany || !user?.id || !accountId) {
      toast({
        title: "Error",
        description: "Missing required information to create query",
        variant: "destructive",
      });
      return;
    }

    setCreatingQuery(true);
    try {
      const queryData = {
        account_id: accountId,
        company_id: selectedCompany.id,
        created_by: user.id,
        query_string: queryForm.query_string,
        name: queryForm.name,
        company_banner_id: queryForm.company_banner_id,
        pages_requested: queryForm.pages_requested,
        dedupe_mode: queryForm.dedupe_mode,
        notes: queryForm.notes
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/search/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setQueries(prev => [...prev, data.query]);
        setShowQueryForm(false);
        setQueryForm({
          name: "",
          query_string: "",
          company_banner_id: "",
          pages_requested: 5,
          dedupe_mode: "per_company",
          notes: ""
        });
        toast({
          title: "Success",
          description: "Search query created successfully",
        });
      } else {
        throw new Error(data.message || "Failed to create query");
      }
    } catch (error) {
      console.error("Error creating query:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create query",
        variant: "destructive",
      });
    } finally {
      setCreatingQuery(false);
    }
  };

  const processSearchQuery = async (queryId: string) => {
    setProcessingQueries(prev => new Set([...prev, queryId]));
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/search/queries/${queryId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the query status in our local state
        setQueries(prev => prev.map(q => 
          q.id === queryId 
            ? { ...q, status: data.query.status, pages_fetched: data.query.pages_fetched, finished_at: data.query.finished_at }
            : q
        ));
        toast({
          title: "Success",
          description: `Query processed successfully. Saved ${data.total_results_saved} results across ${data.query.pages_fetched} pages`,
        });
      } else {
        throw new Error(data.message || "Failed to process query");
      }
    } catch (error) {
      console.error("Error processing query:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process query",
        variant: "destructive",
      });
    } finally {
      setProcessingQueries(prev => {
        const newSet = new Set(prev);
        newSet.delete(queryId);
        return newSet;
      });
    }
  };

  const fetchSearchResults = async (queryId: string) => {
    setLoadingResults(prev => new Set([...prev, queryId]));
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/search/queries/${queryId}/results`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(prev => ({
          ...prev,
          [queryId]: data.results
        }));
        
        // Update session vars with the current query ID for enrichment
        if (sessionVars) {
          setSessionVars(prev => prev ? {
            ...prev,
            source_query_id: queryId
          } : null);
        }
        
        toast({
          title: "Success",
          description: `Retrieved ${data.results.length} search results`,
        });
      } else {
        throw new Error(data.message || "Failed to fetch results");
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch results",
        variant: "destructive",
      });
    } finally {
      setLoadingResults(prev => {
        const newSet = new Set(prev);
        newSet.delete(queryId);
        return newSet;
      });
    }
  };

  const enrichLeadsIndividually = async (queryId: string) => {
    const results = searchResults[queryId];
    if (!results || results.length === 0) {
      toast({
        title: "Error",
        description: "No search results found to enrich",
        variant: "destructive",
      });
      return;
    }

    if (!sessionVars) {
      toast({
        title: "Error",
        description: "Session variables not found. Please reload the queries.",
        variant: "destructive",
      });
      return;
    }

    // Initialize progress tracking
    setEnrichmentProgress(prev => ({
      ...prev,
      [queryId]: {
        total: results.length,
        completed: 0,
        successful: 0,
        failed: 0,
        isRunning: true
      }
    }));

    setEnrichingLeads(prev => new Set([...prev, queryId]));

    try {
      console.log("Starting individual lead enrichment:", {
        queryId,
        totalLeads: results.length,
        sessionVars,
        endpoint: `${API_CONFIG.BASE_URL}/api/leads/new-lead-123/enrich`
      });

      // Process leads one by one
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        try {
          const requestBody = {
            account_id: sessionVars.account_id,
            company_id: sessionVars.company_id,
            created_by: sessionVars.created_by,
            company_banner_id: sessionVars.company_banner_id,
            source_query_id: queryId,
            google_result_id: result.id
          };

          console.log(`Enriching lead ${i + 1}/${results.length}:`, {
            leadId: result.id,
            title: result.title,
            requestBody
          });

          const response = await fetch(`${API_CONFIG.BASE_URL}/api/leads/${result.id}/enrich`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Lead ${i + 1} enriched successfully:`, data);
            
            // Update progress - successful
            setEnrichmentProgress(prev => ({
              ...prev,
              [queryId]: {
                ...prev[queryId],
                completed: i + 1,
                successful: prev[queryId].successful + 1
              }
            }));

            // Mark this result as processed
            setSearchResults(prev => ({
              ...prev,
              [queryId]: prev[queryId].map(r => 
                r.id === result.id ? { ...r, is_processed: true } : r
              )
            }));

          } else {
            console.error(`Failed to enrich lead ${i + 1}:`, response.status);
            
            // Update progress - failed
            setEnrichmentProgress(prev => ({
              ...prev,
              [queryId]: {
                ...prev[queryId],
                completed: i + 1,
                failed: prev[queryId].failed + 1
              }
            }));
          }

        } catch (leadError) {
          console.error(`Error enriching lead ${i + 1}:`, leadError);
          
          // Update progress - failed
          setEnrichmentProgress(prev => ({
            ...prev,
            [queryId]: {
              ...prev[queryId],
              completed: i + 1,
              failed: prev[queryId].failed + 1
            }
          }));
        }

        // Small delay between requests to avoid overwhelming the API
        if (i < results.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Final update
      setEnrichmentProgress(prev => ({
        ...prev,
        [queryId]: {
          ...prev[queryId],
          isRunning: false
        }
      }));

      const finalProgress = enrichmentProgress[queryId];
      if (finalProgress) {
        toast({
          title: "Enrichment Complete",
          description: `Processed ${finalProgress.total} leads - ${finalProgress.successful} successful, ${finalProgress.failed} failed`,
        });
      }

    } catch (error) {
      console.error("Error in individual enrichment process:", error);
      
      // Update progress - mark as not running
      setEnrichmentProgress(prev => ({
        ...prev,
        [queryId]: {
          ...prev[queryId],
          isRunning: false
        }
      }));

      toast({
        title: "Error Enriching Leads",
        description: error instanceof Error ? error.message : "Failed to enrich leads",
        variant: "destructive",
      });
    } finally {
      setEnrichingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(queryId);
        return newSet;
      });
    }
  };

  // Company detail view
  if (selectedCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToCompanies}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{selectedCompany.name}</h1>
              <p className="text-muted-foreground">
                Company Details & Lead Generation
                {loadingExistingQueries && (
                  <span className="ml-2 text-xs">
                    <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                    Loading existing queries...
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowQueryForm(true)} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Create Search Query
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Name:</span> {selectedCompany.name}
              </div>
              {selectedCompany.domain && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Domain:</span>
                  <a 
                    href={`https://${selectedCompany.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {selectedCompany.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant={selectedCompany.is_active ? "default" : "secondary"} className="ml-2">
                  {selectedCompany.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(selectedCompany.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span> {new Date(selectedCompany.updated_at).toLocaleString()}
              </div>
              {selectedCompany.notes && (
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedCompany.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Banners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Banners ({selectedCompany.banners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCompany.banners.length > 0 ? (
                <div className="space-y-4">
                  {selectedCompany.banners.map((banner) => (
                    <div key={banner.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-medium">{banner.name}</h4>
                          {banner.logo_url && (
                            <img 
                              src={banner.logo_url} 
                              alt={`${banner.name} logo`}
                              className="h-8 w-auto"
                            />
                          )}
                          {banner.signature && (
                            <p className="text-sm text-muted-foreground">{banner.signature}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(banner.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={banner.is_active ? "default" : "secondary"}>
                          {banner.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No banners found for this company.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search Query Form */}
        {showQueryForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Search Query</CardTitle>
              <CardDescription>
                Generate leads for {selectedCompany.name} using Google Custom Search API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="query_name">Query Name</Label>
                  <Input
                    id="query_name"
                    value={queryForm.name}
                    onChange={(e) => setQueryForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g., Software Engineers Search"
                  />
                </div>
                <div>
                  <Label htmlFor="banner_select">Company Banner</Label>
                  <Select 
                    value={queryForm.company_banner_id} 
                    onValueChange={(value) => setQueryForm(prev => ({...prev, company_banner_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a banner" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCompany.banners.map((banner) => (
                        <SelectItem key={banner.id} value={banner.id}>
                          {banner.name} {banner.is_active ? "(Active)" : "(Inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="query_string">Search Query String</Label>
                <Input
                  id="query_string"
                  value={queryForm.query_string}
                  onChange={(e) => setQueryForm(prev => ({...prev, query_string: e.target.value}))}
                  placeholder="e.g., site:linkedin.com/in/ software engineer"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="pages_requested">Pages Requested</Label>
                  <Input
                    id="pages_requested"
                    type="number"
                    min="1"
                    max="100"
                    value={queryForm.pages_requested}
                    onChange={(e) => setQueryForm(prev => ({...prev, pages_requested: parseInt(e.target.value) || 5}))}
                  />
                </div>
                <div>
                  <Label htmlFor="dedupe_mode">Dedupe Mode</Label>
                  <Select 
                    value={queryForm.dedupe_mode} 
                    onValueChange={(value) => setQueryForm(prev => ({...prev, dedupe_mode: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_company">Per Company</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={queryForm.notes}
                  onChange={(e) => setQueryForm(prev => ({...prev, notes: e.target.value}))}
                  placeholder="e.g., Search for senior software engineers with 5+ years experience"
                  rows={3}
                />
              </div>

              {/* Pre-filled values display */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Pre-filled Information:</h4>
                <div className="grid gap-2 text-sm">
                  <div><span className="font-medium">Account ID:</span> <code>{accountId}</code></div>
                  <div><span className="font-medium">Company ID:</span> <code>{selectedCompany.id}</code></div>
                  <div><span className="font-medium">Created By:</span> <code>{user?.id}</code></div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowQueryForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createSearchQuery} 
                  disabled={creatingQuery || !queryForm.name || !queryForm.query_string || !queryForm.company_banner_id}
                >
                  {creatingQuery && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Query
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Queries */}
        {(queries.length > 0 || loadingExistingQueries) && (
          <Card>
            <CardHeader>
              <CardTitle>
                Search Queries ({queries.length})
                {loadingExistingQueries && (
                  <Loader2 className="h-4 w-4 ml-2 inline animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                {loadingExistingQueries 
                  ? "Loading existing queries for this company..." 
                  : "Manage your search queries and view results"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queries.map((query) => (
                  <div key={query.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{query.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{query.query_string}</p>
                      </div>
                      <Badge 
                        variant={
                          query.status === "completed" ? "default" : 
                          query.status === "processing" ? "secondary" : 
                          query.status === "failed" ? "destructive" : "outline"
                        }
                      >
                        {query.status}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm mb-4">
                      <div><span className="font-medium">Pages:</span> {query.pages_fetched}/{query.pages_requested}</div>
                      <div><span className="font-medium">Created:</span> {new Date(query.created_at).toLocaleString()}</div>
                      {query.finished_at && (
                        <div><span className="font-medium">Finished:</span> {new Date(query.finished_at).toLocaleString()}</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => processSearchQuery(query.id)}
                        disabled={processingQueries.has(query.id) || query.status === "completed" || query.status === "processing"}
                      >
                        {processingQueries.has(query.id) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {query.status === "completed" ? "Processed" : "Process Query"}
                      </Button>
                      
                      {query.status === "completed" && (
                        <>
                          {!searchResults[query.id] ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchSearchResults(query.id)}
                              disabled={loadingResults.has(query.id)}
                            >
                              {loadingResults.has(query.id) ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4 mr-2" />
                              )}
                              Load Results
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVisibleResults(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(query.id)) {
                                    newSet.delete(query.id);
                                  } else {
                                    newSet.add(query.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              {visibleResults.has(query.id) ? (
                                <EyeOff className="h-4 w-4 mr-2" />
                              ) : (
                                <Eye className="h-4 w-4 mr-2" />
                              )}
                              {visibleResults.has(query.id) ? "Hide Results" : "Show Results"}
                            </Button>
                          )}
                          
                          {searchResults[query.id] && searchResults[query.id].length > 0 && (
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => enrichLeadsIndividually(query.id)}
                                disabled={
                                  enrichingLeads.has(query.id) || 
                                  !sessionVars || 
                                  (enrichmentProgress[query.id] && !enrichmentProgress[query.id].isRunning && enrichmentProgress[query.id].completed === enrichmentProgress[query.id].total)
                                }
                                title={
                                  !sessionVars ? "Load results first to enable enrichment" : 
                                  (enrichmentProgress[query.id] && !enrichmentProgress[query.id].isRunning && enrichmentProgress[query.id].completed === enrichmentProgress[query.id].total) ? "Enrichment completed" : ""
                                }
                                className={
                                  enrichmentProgress[query.id] && !enrichmentProgress[query.id].isRunning && enrichmentProgress[query.id].completed === enrichmentProgress[query.id].total
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }
                              >
                                {enrichingLeads.has(query.id) ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : enrichmentProgress[query.id] && !enrichmentProgress[query.id].isRunning && enrichmentProgress[query.id].completed === enrichmentProgress[query.id].total ? (
                                  <Users className="h-4 w-4 mr-2 opacity-50" />
                                ) : (
                                  <Users className="h-4 w-4 mr-2" />
                                )}
                                {enrichingLeads.has(query.id) 
                                  ? "Enriching..." 
                                  : enrichmentProgress[query.id] && !enrichmentProgress[query.id].isRunning && enrichmentProgress[query.id].completed === enrichmentProgress[query.id].total
                                    ? `Enriched ${searchResults[query.id].length} Leads ✓`
                                    : `Enrich ${searchResults[query.id].length} Leads`
                                }
                              </Button>
                              
                              {/* Progress Counter */}
                              {enrichmentProgress[query.id] && (
                                <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span>Progress:</span>
                                    <span className="font-medium">
                                      {enrichmentProgress[query.id].completed}/{enrichmentProgress[query.id].total}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-green-600">✓ Successful: {enrichmentProgress[query.id].successful}</span>
                                    <span className="text-red-600">✗ Failed: {enrichmentProgress[query.id].failed}</span>
                                  </div>
                                  {enrichmentProgress[query.id].isRunning && (
                                    <div className="mt-1">
                                      <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div 
                                          className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                                          style={{
                                            width: `${(enrichmentProgress[query.id].completed / enrichmentProgress[query.id].total) * 100}%`
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults[query.id] && visibleResults.has(query.id) && (
                      <div className="mt-4 border-t pt-4">
                        <h5 className="font-medium mb-3">Search Results ({searchResults[query.id].length})</h5>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {searchResults[query.id].map((result) => (
                            <div key={result.id} className="bg-muted p-3 rounded">
                              <div className="flex items-start justify-between mb-2">
                                <h6 className="font-medium text-sm line-clamp-1">{result.title}</h6>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Page {result.page_number} - #{result.position}
                                  </Badge>
                                  {result.is_processed && (
                                    <Badge variant="default" className="text-xs">
                                      Enriched
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <a 
                                href={result.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline break-all"
                              >
                                {result.link}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.snippet}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Lead ID: <code className="bg-background px-1 rounded">{result.id}</code>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


      </div>
    );
  }

  // Companies list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Get Leads</h1>
          <p className="text-muted-foreground">
            Collect leads using Google Custom Search API - Account ID: 
            <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">{accountId}</code>
          </p>
        </div>
        <Button onClick={fetchCompanies} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : companies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card 
              key={company.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCompanyClick(company)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {company.name}
                </CardTitle>
                {company.domain && (
                  <CardDescription className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {company.domain}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={company.is_active ? "default" : "secondary"}>
                      {company.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {company.banners.length} Banner{company.banners.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {company.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {company.notes}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(company.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Companies Found</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              No companies found for account ID: {accountId}
              <br />
              Try creating some companies first or check your account permissions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-medium">Companies Endpoint:</span> 
              <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">
                GET {API_CONFIG.BASE_URL}/accounts/{accountId}/companies-with-banners
              </code>
            </div>
            <div>
              <span className="font-medium">Individual Lead Enrich Endpoint:</span> 
              <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">
                POST {API_CONFIG.BASE_URL}/api/leads/{"{leadId}"}/enrich
              </code>
            </div>
            {sessionVars && (
              <div>
                <span className="font-medium">Current Session Variables:</span>
                <div className="mt-2 bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="grid gap-1 text-xs">
                    <div><span className="font-medium">Account ID:</span> <code>{sessionVars.account_id}</code></div>
                    <div><span className="font-medium">Company ID:</span> <code>{sessionVars.company_id}</code></div>
                    <div><span className="font-medium">Company Banner ID:</span> <code>{sessionVars.company_banner_id}</code></div>
                    <div><span className="font-medium">Created By:</span> <code>{sessionVars.created_by}</code></div>
                    <div><span className="font-medium">Source Query ID:</span> <code>{sessionVars.source_query_id}</code></div>
                  </div>
                </div>
              </div>
            )}
            <div>
              <span className="font-medium">Companies cURL:</span>
              <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X GET "${API_CONFIG.BASE_URL}/accounts/${accountId}/companies-with-banners" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
            <div>
              <span className="font-medium">Individual Lead Enrich cURL (example):</span>
              <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "${API_CONFIG.BASE_URL}/api/leads/new-lead-123/enrich" \\
  -H "Content-Type: application/json" \\
  -d '{
    "account_id": "0cba4319-1bac-4399-a616-caf4367790fd",
    "company_id": "9302e04a-d558-4e9c-b4ae-548c8146082a",
    "created_by": "406f34af-9d1e-44d2-82c3-d910afe7fb5b",
    "company_banner_id": "d70b795e-7041-495d-bc4c-2408bfdb7b48",
    "source_query_id": "26b49b5a-4036-43f4-85a7-fdace10e3b0f",
    "google_result_id": "906a61d4-9e9b-44df-81a2-0d4b3d685d70"
  }'`}
              </pre>
            </div>
            {sessionVars && (
              <div>
                <span className="font-medium">Current cURL (with session vars):</span>
                <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "${API_CONFIG.BASE_URL}/api/leads/{LEAD_ID}/enrich" \\
  -H "Content-Type: application/json" \\
  -d '{
    "account_id": "${sessionVars.account_id}",
    "company_id": "${sessionVars.company_id}",
    "created_by": "${sessionVars.created_by}",
    "company_banner_id": "${sessionVars.company_banner_id}",
    "source_query_id": "${sessionVars.source_query_id}",
    "google_result_id": "{GOOGLE_RESULT_ID}"
  }'`}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}