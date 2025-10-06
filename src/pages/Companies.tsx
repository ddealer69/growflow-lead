import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, ExternalLink, Edit, Trash2, Image, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_CONFIG } from "@/config/api";

interface Company {
  id: string;
  account_id: string;
  name: string;
  domain: string | null;
  notes: string | null;
  metadata: {
    industry?: string;
    size?: string;
    location?: string;
    [key: string]: any;
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Companies() {
  const { accountId, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Use accountId from context or fallback to user.account_id
  const currentAccountId = accountId || user?.account_id;
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    notes: "",
    industry: "",
    size: "",
    location: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (currentAccountId) {
      loadCompanies();
    } else {
      // If no accountId, stop loading
      setLoading(false);
    }
  }, [currentAccountId]);

  async function loadCompanies() {
    if (!currentAccountId) {
      setLoading(false);
      return;
    }

    try {
      // Use the more robust account-specific endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounts/${currentAccountId}/companies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 404) {
        // Account might not exist or no companies found
        setCompanies([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies || []);
        if (data.companies?.length > 0) {
          toast.success(`Loaded ${data.companies.length} companies`);
        }
      } else {
        toast.error(data.message || "Failed to load companies");
        setCompanies([]);
      }
    } catch (error) {
      console.error('Load companies error:', error);
      toast.error("Network error. Please try again.");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompanyDetails(companyId: string): Promise<Company | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/companies/${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return data.company;
      } else {
        toast.error("Failed to load company details");
        return null;
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error('Fetch company details error:', error);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentAccountId) {
      toast.error("Account information not found");
      return;
    }

    try {
      const payload = {
        account_id: currentAccountId,
        name: formData.name,
        domain: formData.domain || null,
        notes: formData.notes || null,
        metadata: {
          industry: formData.industry || null,
          size: formData.size || null,
          location: formData.location || null,
        }
      };

      const url = editingCompany 
        ? `${API_CONFIG.BASE_URL}/companies/${editingCompany.id}`
        : `${API_CONFIG.BASE_URL}/companies`;
      
      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Company ${editingCompany ? 'updated' : 'created'} successfully`);
        setOpen(false);
        setEditingCompany(null);
        resetForm();
        
        if (editingCompany) {
          // If editing, reload companies list
          loadCompanies();
        } else {
          // If creating new company, add it to the list immediately
          if (data.company) {
            setCompanies(prev => [...prev, data.company]);
          } else {
            // Fallback to reloading all companies
            loadCompanies();
          }
        }
      } else {
        toast.error(data.message || `Failed to ${editingCompany ? 'update' : 'create'} company`);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error('Company operation error:', error);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      domain: "",
      notes: "",
      industry: "",
      size: "",
      location: "",
    });
  }

  function handleEdit(company: Company) {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      domain: company.domain || "",
      notes: company.notes || "",
      industry: company.metadata?.industry || "",
      size: company.metadata?.size || "",
      location: company.metadata?.location || "",
    });
    setOpen(true);
  }

  async function handleDelete(company: Company) {
    if (!confirm(`Are you sure you want to delete "${company.name}"?`)) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/companies/${company.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Company deleted successfully");
        loadCompanies();
      } else {
        toast.error("Failed to delete company");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error('Delete company error:', error);
    }
  }

  async function handleRefreshCompany(companyId: string) {
    try {
      const updatedCompany = await fetchCompanyDetails(companyId);
      if (updatedCompany) {
        setCompanies(prev => 
          prev.map(company => 
            company.id === companyId ? updatedCompany : company
          )
        );
        toast.success("Company details refreshed");
      }
    } catch (error) {
      console.error('Refresh company error:', error);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!currentAccountId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your company profiles</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-4">⚠️ Account information not found</div>
            <p className="text-muted-foreground mb-4">
              Please sign out and sign in again to refresh your session.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage your company profiles and business information</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Account:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono">
              {currentAccountId}
            </code>
            {companies.length > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {companies.length} {companies.length === 1 ? 'company' : 'companies'}
                </span>
              </>
            )}
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingCompany(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl">
                  {editingCompany ? 'Edit Company' : 'Create New Company'}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany 
                    ? 'Update your company information and settings' 
                    : 'Add a new company profile to your account'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Account ID Display */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Account</Label>
                  </div>
                  <code className="text-sm font-mono text-muted-foreground">
                    {currentAccountId}
                  </code>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter company name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="domain" className="text-sm font-medium">Website Domain</Label>
                      <Input
                        id="domain"
                        placeholder="example.com"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Company Details</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Technology"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-sm font-medium">Company Size</Label>
                      <Input
                        id="size"
                        placeholder="e.g., Medium"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., San Francisco"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional information about the company..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-6"
                  disabled={!formData.name.trim()}
                >
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first company to start managing your business profiles and generate leads
            </p>
            <Button onClick={() => setOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{company.name}</div>
                        {company.metadata?.industry && (
                          <div className="text-sm text-muted-foreground font-normal mt-1">
                            {company.metadata.industry}
                          </div>
                        )}
                      </div>
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshCompany(company.id);
                      }}
                      title="Refresh company details"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(company);
                      }}
                      title="Edit company"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(company);
                      }}
                      title="Delete company"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Company Details */}
                <div className="space-y-3">
                  {company.domain && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.domain}
                      </a>
                    </div>
                  )}

                  {company.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {company.notes}
                    </p>
                  )}

                  {/* Metadata */}
                  {company.metadata && (
                    <div className="flex flex-wrap gap-2">
                      {company.metadata.size && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {company.metadata.size}
                        </span>
                      )}
                      {company.metadata.location && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {company.metadata.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(company);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info("Company banner functionality coming soon!");
                    }}
                  >
                    <Image className="h-3.5 w-3.5 mr-1.5" />
                    Banner
                  </Button>
                </div>

                {/* Company ID and Created Date */}
                <div className="pt-2 border-t border-muted/50">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Created</span>
                      <span>{new Date(company.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ID</span>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {company.id.slice(0, 8)}...
                      </code>
                    </div>
                  </div>
                </div>

                {/* Expandable Full Data */}
                <details className="group/details">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <span>View Full Data</span>
                    <span className="transition-transform group-open/details:rotate-90">▶</span>
                  </summary>
                  <pre className="mt-3 bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">
                    {JSON.stringify(company, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
