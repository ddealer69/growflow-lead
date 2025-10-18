import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Building2, Globe, Calendar, Users, ExternalLink, Search, Play, Eye, EyeOff, Loader2, Copy, Wand2 } from "lucide-react";
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

interface LeadFilters {
  // Contact-Level Filters
  jobTitle: string;
  seniorityLevel: string;
  department: string;
  country: string;
  city: string;
  keywords: string;
  
  // Company-Level Filters
  industry: string;
  companySize: string;
  revenueRange: string;
  techStack: string;
  hiringKeywords: string;
  
  // Meta Filters
  searchType: string;
  booleanMode: boolean;
}

interface CreateQueryForm {
  name: string;
  query_string: string;
  company_banner_id: string;
  pages_requested: number;
  dedupe_mode: string;
  notes: string;
  
  // Enhanced lead filters
  leadFilters: LeadFilters;
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
    notes: "",
    leadFilters: {
      jobTitle: "",
      seniorityLevel: "",
      department: "",
      country: "",
      city: "",
      keywords: "",
      industry: "",
      companySize: "",
      revenueRange: "",
      techStack: "",
      hiringKeywords: "",
      searchType: "linkedin",
      booleanMode: false
    }
  });
  const [creatingQuery, setCreatingQuery] = useState(false);
  const [processingQueries, setProcessingQueries] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<{[queryId: string]: SearchResult[]}>({});
  const [loadingResults, setLoadingResults] = useState<Set<string>>(new Set());
  const [visibleResults, setVisibleResults] = useState<Set<string>>(new Set());
  const [loadingExistingQueries, setLoadingExistingQueries] = useState(false);
  const [enrichingLeads, setEnrichingLeads] = useState<Set<string>>(new Set());
  
  // Results table view state
  const [showResultsTable, setShowResultsTable] = useState(false);
  const [selectedQueryForResults, setSelectedQueryForResults] = useState<SearchQuery | null>(null);
  
  // Company view section state
  const [activeSection, setActiveSection] = useState<'company' | 'leads'>('company');
  
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

  // Function to generate and set the LinkedIn query
  const handleGenerateQuery = () => {
    const generatedQuery = generateLinkedInQuery(queryForm.leadFilters);
    setQueryForm(prev => ({
      ...prev,
      query_string: generatedQuery
    }));
    
    toast({
      title: "Query Generated",
      description: "LinkedIn search query has been generated from your filters",
    });
  };

  // Function to copy query to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Query copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Function to generate LinkedIn search query from filters
  const generateLinkedInQuery = (filters: LeadFilters): string => {
    const queryParts: string[] = [];
    
    // Handle job title (can be multiple separated by commas)
    if (filters.jobTitle.trim()) {
      const titles = filters.jobTitle.split(',').map(t => t.trim()).filter(t => t);
      if (titles.length === 1) {
        queryParts.push(`"${titles[0]}"`);
      } else if (titles.length > 1) {
        queryParts.push(`(${titles.map(t => `"${t}"`).join(' OR ')})`);
      }
    }
    
    // Handle seniority level
    if (filters.seniorityLevel.trim()) {
      queryParts.push(`"${filters.seniorityLevel}"`);
    }
    
    // Handle department
    if (filters.department.trim()) {
      queryParts.push(`"${filters.department}"`);
    }
    
    // Handle country/region
    if (filters.country.trim()) {
      const countries = filters.country.split(',').map(c => c.trim()).filter(c => c);
      if (countries.length === 1) {
        queryParts.push(`"${countries[0]}"`);
      } else if (countries.length > 1) {
        queryParts.push(`(${countries.map(c => `"${c}"`).join(' OR ')})`);
      }
    }
    
    // Handle city
    if (filters.city.trim()) {
      queryParts.push(`"${filters.city}"`);
    }
    
    // Handle company size
    if (filters.companySize.trim()) {
      queryParts.push(`("${filters.companySize} employees")`);
    }
    
    // Handle industry
    if (filters.industry.trim()) {
      const industries = filters.industry.split(',').map(i => i.trim()).filter(i => i);
      if (industries.length === 1) {
        queryParts.push(`"${industries[0]}"`);
      } else if (industries.length > 1) {
        queryParts.push(`(${industries.map(i => `"${i}"`).join(' OR ')})`);
      }
    }
    
    // Handle revenue range
    if (filters.revenueRange.trim()) {
      queryParts.push(`"${filters.revenueRange}"`);
    }
    
    // Handle tech stack
    if (filters.techStack.trim()) {
      const techItems = filters.techStack.split(',').map(t => t.trim()).filter(t => t);
      if (techItems.length === 1) {
        queryParts.push(`"${techItems[0]}"`);
      } else if (techItems.length > 1) {
        queryParts.push(`(${techItems.map(t => `"${t}"`).join(' OR ')})`);
      }
    }
    
    // Handle keywords
    if (filters.keywords.trim()) {
      const keywords = filters.keywords.split(',').map(k => k.trim()).filter(k => k);
      keywords.forEach(keyword => {
        queryParts.push(`"${keyword}"`);
      });
    }
    
    // Handle hiring keywords
    if (filters.hiringKeywords.trim()) {
      const hiringKeywords = filters.hiringKeywords.split(',').map(h => h.trim()).filter(h => h);
      hiringKeywords.forEach(keyword => {
        queryParts.push(`"${keyword}"`);
      });
    }
    
    // Add site restriction based on search type
    const siteRestriction = filters.searchType === 'linkedin' ? 'site:linkedin.com/in' : 
                           filters.searchType === 'crunchbase' ? 'site:crunchbase.com' :
                           filters.searchType === 'apollo' ? 'site:apollo.io' : 'site:linkedin.com/in';
    queryParts.push(siteRestriction);
    
    return queryParts.filter(Boolean).join(' ');
  };

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
    setActiveSection('company'); // Reset to company section
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
          notes: "",
          leadFilters: {
            jobTitle: "",
            seniorityLevel: "",
            department: "",
            country: "",
            city: "",
            keywords: "",
            industry: "",
            companySize: "",
            revenueRange: "",
            techStack: "",
            hiringKeywords: "",
            searchType: "linkedin",
            booleanMode: false
          }
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
        </div>

        {/* Section Navigation */}
        <div className="flex items-center gap-4 border-b">
          <button
            onClick={() => setActiveSection('company')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'company'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Building2 className="h-4 w-4 mr-2 inline" />
            Company Information
          </button>
          <button
            onClick={() => setActiveSection('leads')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'leads'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Search className="h-4 w-4 mr-2 inline" />
            Get Leads
          </button>
        </div>

        {/* Company Information Section */}
        {activeSection === 'company' && (
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
        )}

        {/* Get Leads Section */}
        {activeSection === 'leads' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowQueryForm(true)} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Create Search Query
              </Button>
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
            <CardContent className="space-y-6">
              {/* Basic Query Information */}
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

              {/* Enhanced Lead Filters */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Smart Query Builder</h3>
                  <Badge variant="outline">Build LinkedIn queries automatically</Badge>
                </div>
                
                <Tabs defaultValue="contact" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="contact">Contact Level</TabsTrigger>
                    <TabsTrigger value="company">Company Level</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  {/* Contact Level Filters */}
                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="job_title">Job Title / Role</Label>
                        <Input
                          id="job_title"
                          value={queryForm.leadFilters.jobTitle}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, jobTitle: e.target.value}
                          }))}
                          placeholder="e.g., CEO, CTO, Marketing Manager"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate multiple titles with commas
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="seniority_level">Seniority Level</Label>
                        <Select 
                          value={queryForm.leadFilters.seniorityLevel}
                          onValueChange={(value) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, seniorityLevel: value}
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select seniority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C-Level">C-Level</SelectItem>
                            <SelectItem value="VP">VP</SelectItem>
                            <SelectItem value="Director">Director</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Associate">Associate</SelectItem>
                            <SelectItem value="Entry Level">Entry Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Select 
                          value={queryForm.leadFilters.department}
                          onValueChange={(value) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, department: value}
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Product">Product</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Engineering">Engineering</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="country">Country / Region</Label>
                        <Input
                          id="country"
                          value={queryForm.leadFilters.country}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, country: e.target.value}
                          }))}
                          placeholder="e.g., India, United States, UAE"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate multiple countries with commas
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="city">City (Optional)</Label>
                        <Input
                          id="city"
                          value={queryForm.leadFilters.city}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, city: e.target.value}
                          }))}
                          placeholder="e.g., Mumbai, New York"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="keywords">Professional Keywords</Label>
                        <Input
                          id="keywords"
                          value={queryForm.leadFilters.keywords}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, keywords: e.target.value}
                          }))}
                          placeholder="e.g., AI automation, cloud adoption"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Interest areas or expertise keywords
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Company Level Filters */}
                  <TabsContent value="company" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={queryForm.leadFilters.industry}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, industry: e.target.value}
                          }))}
                          placeholder="e.g., SaaS, Fintech, Healthcare"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate multiple industries with commas
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="company_size">Company Size</Label>
                        <Select 
                          value={queryForm.leadFilters.companySize}
                          onValueChange={(value) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, companySize: value}
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10</SelectItem>
                            <SelectItem value="11-50">11-50</SelectItem>
                            <SelectItem value="51-200">51-200</SelectItem>
                            <SelectItem value="201-1000">201-1000</SelectItem>
                            <SelectItem value="1000+">1000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="revenue_range">Revenue / Funding Stage</Label>
                        <Input
                          id="revenue_range"
                          value={queryForm.leadFilters.revenueRange}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, revenueRange: e.target.value}
                          }))}
                          placeholder="e.g., Series A, >$1M, $10M-$100M"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="tech_stack">Tech Stack</Label>
                        <Input
                          id="tech_stack"
                          value={queryForm.leadFilters.techStack}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, techStack: e.target.value}
                          }))}
                          placeholder="e.g., AWS, HubSpot, Salesforce"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Technologies used by target companies
                        </p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="hiring_keywords">Hiring Trends</Label>
                        <Input
                          id="hiring_keywords"
                          value={queryForm.leadFilters.hiringKeywords}
                          onChange={(e) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, hiringKeywords: e.target.value}
                          }))}
                          placeholder="e.g., AI Engineer, DevOps, Sales Manager"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Roles companies are actively hiring for
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Settings */}
                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="search_type">Search Platform</Label>
                        <Select 
                          value={queryForm.leadFilters.searchType}
                          onValueChange={(value) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, searchType: value}
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="crunchbase">Crunchbase</SelectItem>
                            <SelectItem value="apollo">Apollo</SelectItem>
                            <SelectItem value="google">General Google</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="boolean_mode"
                          checked={queryForm.leadFilters.booleanMode}
                          onCheckedChange={(checked) => setQueryForm(prev => ({
                            ...prev, 
                            leadFilters: {...prev.leadFilters, booleanMode: !!checked}
                          }))}
                        />
                        <Label htmlFor="boolean_mode">Advanced Boolean Mode</Label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Generate Query Button */}
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={handleGenerateQuery}
                    className="gap-2"
                    variant="outline"
                  >
                    <Wand2 className="h-4 w-4" />
                    Generate LinkedIn Query
                  </Button>
                </div>
              </div>

              {/* Generated Query Display */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="query_string">Generated Search Query</Label>
                  {queryForm.query_string && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(queryForm.query_string)}
                      className="h-6 px-2 text-xs gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  )}
                </div>
                <Textarea
                  id="query_string"
                  value={queryForm.query_string}
                  onChange={(e) => setQueryForm(prev => ({...prev, query_string: e.target.value}))}
                  placeholder="Generated query will appear here, or you can manually enter a custom query"
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This query will be used with Google Custom Search API. You can modify it manually if needed.
                </p>
              </div>

              {/* Advanced Settings */}
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
                                setSelectedQueryForResults(query);
                                setShowResultsTable(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Show Results Table
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
          </div>
        )}

        {/* Glass UI Results Table Overlay */}
        {showResultsTable && selectedQueryForResults && searchResults[selectedQueryForResults.id] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => {
                setShowResultsTable(false);
                setSelectedQueryForResults(null);
              }}
            />
            
            {/* Glass UI Modal */}
            <div 
              className="relative w-full max-w-7xl max-h-[90vh] bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowResultsTable(false);
                      setSelectedQueryForResults(null);
                    }}
                    className="gap-2 hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Close
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Search Results: {selectedQueryForResults.name}</h2>
                    <p className="text-sm text-gray-600">
                      {searchResults[selectedQueryForResults.id].length} results from "{selectedQueryForResults.query_string}"
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={
                    selectedQueryForResults.status === "completed" ? "default" : 
                    selectedQueryForResults.status === "processing" ? "secondary" : 
                    selectedQueryForResults.status === "failed" ? "destructive" : "outline"
                  }
                >
                  {selectedQueryForResults.status}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Query Summary */}
                <div className="mb-6 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Pages:</span>
                      <span className="ml-1 text-gray-900">{selectedQueryForResults.pages_fetched}/{selectedQueryForResults.pages_requested}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Results:</span>
                      <span className="ml-1 text-gray-900">{searchResults[selectedQueryForResults.id].length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-1 text-gray-900">{new Date(selectedQueryForResults.created_at).toLocaleString()}</span>
                    </div>
                    {selectedQueryForResults.finished_at && (
                      <div>
                        <span className="font-medium text-gray-700">Finished:</span>
                        <span className="ml-1 text-gray-900">{new Date(selectedQueryForResults.finished_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions and Progress */}
                <div className="mb-6 flex flex-col gap-4">
                  {/* Enrich Button */}
                  {searchResults[selectedQueryForResults.id] && searchResults[selectedQueryForResults.id].length > 0 && (
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={() => enrichLeadsIndividually(selectedQueryForResults.id)}
                        disabled={
                          enrichingLeads.has(selectedQueryForResults.id) || 
                          !sessionVars || 
                          (enrichmentProgress[selectedQueryForResults.id] && !enrichmentProgress[selectedQueryForResults.id].isRunning && enrichmentProgress[selectedQueryForResults.id].completed === enrichmentProgress[selectedQueryForResults.id].total)
                        }
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/20"
                      >
                        {enrichingLeads.has(selectedQueryForResults.id) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Users className="h-4 w-4 mr-2" />
                        )}
                        {enrichingLeads.has(selectedQueryForResults.id) 
                          ? "Enriching..." 
                          : enrichmentProgress[selectedQueryForResults.id] && !enrichmentProgress[selectedQueryForResults.id].isRunning && enrichmentProgress[selectedQueryForResults.id].completed === enrichmentProgress[selectedQueryForResults.id].total
                            ? `Enriched ${searchResults[selectedQueryForResults.id].length} Leads ✓`
                            : `Enrich ${searchResults[selectedQueryForResults.id].length} Leads`
                        }
                      </Button>
                    </div>
                  )}

                  {/* Progress Counter */}
                  {enrichmentProgress[selectedQueryForResults.id] && (
                    <div className="p-4 bg-blue-100/30 backdrop-blur-sm rounded-xl border border-blue-200/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {enrichmentProgress[selectedQueryForResults.id].completed}/{enrichmentProgress[selectedQueryForResults.id].total}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-green-700">✓ Successful: {enrichmentProgress[selectedQueryForResults.id].successful}</span>
                        <span className="text-sm text-red-700">✗ Failed: {enrichmentProgress[selectedQueryForResults.id].failed}</span>
                      </div>
                      {enrichmentProgress[selectedQueryForResults.id].isRunning && (
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{
                              width: `${(enrichmentProgress[selectedQueryForResults.id].completed / enrichmentProgress[selectedQueryForResults.id].total) * 100}%`
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Results Table */}
                <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="text-gray-700 font-semibold">Title</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Link</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Position</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-700 font-semibold">Snippet</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults[selectedQueryForResults.id].map((result) => (
                          <TableRow key={result.id} className="border-white/10 hover:bg-white/10">
                            <TableCell>
                              <div className="font-medium text-sm max-w-xs text-gray-900">
                                {result.title}
                              </div>
                            </TableCell>
                            <TableCell>
                              <a 
                                href={result.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline text-xs break-all max-w-sm truncate inline-block"
                                title={result.link}
                              >
                                <ExternalLink className="h-3 w-3 inline mr-1" />
                                {result.link.length > 50 ? `${result.link.substring(0, 50)}...` : result.link}
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs bg-white/20 border-white/30">
                                Page {result.page_number} - #{result.position}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {result.is_processed ? (
                                <Badge variant="default" className="text-xs">
                                  Enriched
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-gray-200/50">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-gray-600 max-w-md line-clamp-2">
                                {result.snippet}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
}