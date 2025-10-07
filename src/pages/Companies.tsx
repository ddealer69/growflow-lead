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

interface Banner {
  id: string;
  company_id: string;
  name: string;
  logo_url: string | null;
  signature: string | null;
  metadata: {
    purpose?: string;
    department?: string;
    [key: string]: any;
  } | null;
  created_by: string;
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
  
  // Banner management state
  const [bannerOpen, setBannerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerFormData, setBannerFormData] = useState({
    name: "",
    logo_url: "",
    signature: "",
    purpose: "",
    department: "",
  });
  const [companyBanners, setCompanyBanners] = useState<{[key: string]: Banner[]}>({});
  
  // Company detail view state
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<Company | null>(null);
  const [showingDetail, setShowingDetail] = useState(false);
  
  const navigate = useNavigate();

  // Use the user ID from AuthContext instead of fetching from Supabase
  const userId = user?.id;

  useEffect(() => {
    if (currentAccountId) {
      loadCompanies();
    } else {
      // If no accountId, stop loading
      setLoading(false);
    }
  }, [currentAccountId]);

  useEffect(() => {
    // Load banners for all companies when companies are loaded
    async function loadAllBanners() {
      const bannerPromises = companies.map(async (company) => {
        const banners = await fetchCompanyBanners(company.id);
        return { companyId: company.id, banners };
      });
      
      const results = await Promise.all(bannerPromises);
      const bannerMap: {[key: string]: Banner[]} = {};
      
      results.forEach(({ companyId, banners }) => {
        bannerMap[companyId] = banners;
      });
      
      setCompanyBanners(bannerMap);
    }
    
    if (companies.length > 0) {
      loadAllBanners();
    }
  }, [companies]);



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

  async function fetchCompanyBanners(companyId: string): Promise<Banner[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/companies/${companyId}/banners`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return data.banners || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Fetch company banners error:', error);
      return [];
    }
  }

  async function handleBannerAction(company: Company) {
    setSelectedCompany(company);
    
    // Fetch existing banners for this company
    const banners = await fetchCompanyBanners(company.id);
    setCompanyBanners(prev => ({ ...prev, [company.id]: banners }));
    
    if (banners.length > 0) {
      // If banner exists, set up for editing
      const existingBanner = banners[0]; // Assuming one banner per company
      setEditingBanner(existingBanner);
      setBannerFormData({
        name: existingBanner.name,
        logo_url: existingBanner.logo_url || "",
        signature: existingBanner.signature || "",
        purpose: existingBanner.metadata?.purpose || "",
        department: existingBanner.metadata?.department || "",
      });
    } else {
      // Reset form for creating new banner
      setEditingBanner(null);
      setBannerFormData({
        name: `${company.name} - Banner`,
        logo_url: "",
        signature: "",
        purpose: "",
        department: "",
      });
    }
    
    setBannerOpen(true);
  }

  async function handleBannerSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedCompany || !userId) {
      toast.error("Missing required information");
      return;
    }

    try {
      const payload = {
        company_id: selectedCompany.id,
        name: bannerFormData.name,
        logo_url: bannerFormData.logo_url || null,
        signature: bannerFormData.signature || null,
        metadata: {
          purpose: bannerFormData.purpose || null,
          department: bannerFormData.department || null,
        },
        created_by: userId,
      };

      const url = editingBanner 
        ? `${API_CONFIG.BASE_URL}/company-banners/${editingBanner.id}`
        : `${API_CONFIG.BASE_URL}/company-banners`;
      
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Banner ${editingBanner ? 'updated' : 'created'} successfully`);
        setBannerOpen(false);
        setSelectedCompany(null);
        setEditingBanner(null);
        
        // Refresh the banners for this company
        const updatedBanners = await fetchCompanyBanners(selectedCompany.id);
        setCompanyBanners(prev => ({ ...prev, [selectedCompany.id]: updatedBanners }));
      } else {
        toast.error(data.message || `Failed to ${editingBanner ? 'update' : 'create'} banner`);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error('Banner operation error:', error);
    }
  }

  function resetBannerForm() {
    setBannerFormData({
      name: "",
      logo_url: "",
      signature: "",
      purpose: "",
      department: "",
    });
  }

  function handleCompanyCardClick(company: Company) {
    setSelectedCompanyDetail(company);
    setShowingDetail(true);
  }

  function handleBackToCompanies() {
    setSelectedCompanyDetail(null);
    setShowingDetail(false);
  }

  const handleRefreshCompany = async (companyId: string) => {
    try {
      const updatedCompany = await fetchCompanyDetails(companyId);
      if (updatedCompany) {
        setCompanies(prev => prev.map(c => c.id === companyId ? updatedCompany : c));
        
        // If this is the currently viewed detail company, update it too
        if (selectedCompanyDetail?.id === companyId) {
          setSelectedCompanyDetail(updatedCompany);
        }
        
        toast.success('Company refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing company:', error);
      toast.error('Failed to refresh company');
    }
  };

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

  // If showing company detail, render the detail view
  if (showingDetail && selectedCompanyDetail) {
    const selectedCompanyBanners = companyBanners[selectedCompanyDetail.id] || [];
    
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleBackToCompanies}
            className="gap-2"
          >
            ← Back to Companies
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{selectedCompanyDetail.name}</h1>
            <p className="text-muted-foreground">Company Details</p>
          </div>
        </div>

        {/* Company Detail Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                  <p className="text-base">{selectedCompanyDetail.name}</p>
                </div>
                
                {selectedCompanyDetail.domain && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                    <a
                      href={`https://${selectedCompanyDetail.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedCompanyDetail.domain}
                    </a>
                  </div>
                )}
                
                {selectedCompanyDetail.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-base leading-relaxed">{selectedCompanyDetail.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {selectedCompanyDetail.metadata?.industry && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                    <p className="text-base">{selectedCompanyDetail.metadata.industry}</p>
                  </div>
                )}
                
                {selectedCompanyDetail.metadata?.size && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Company Size</Label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {selectedCompanyDetail.metadata.size}
                    </span>
                  </div>
                )}
                
                {selectedCompanyDetail.metadata?.location && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {selectedCompanyDetail.metadata.location}
                    </span>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCompanyDetail.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedCompanyDetail.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company ID</Label>
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {selectedCompanyDetail.id}
                  </code>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Account ID</Label>
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {selectedCompanyDetail.account_id}
                  </code>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="text-base">{new Date(selectedCompanyDetail.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-base">{new Date(selectedCompanyDetail.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Company Banner
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBannerAction(selectedCompanyDetail)}
                >
                  {selectedCompanyBanners.length > 0 ? 'Update Banner' : 'Create Banner'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCompanyBanners.length > 0 ? (
                <div className="space-y-4">
                  {selectedCompanyBanners.map((banner) => (
                    <div key={banner.id} className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Banner Name</Label>
                        <p className="text-base">{banner.name}</p>
                      </div>
                      
                      {banner.logo_url && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Logo URL</Label>
                          <a
                            href={banner.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {banner.logo_url}
                          </a>
                        </div>
                      )}
                      
                      {banner.signature && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Email Signature</Label>
                          <pre className="text-sm bg-muted p-3 rounded-md font-mono whitespace-pre-wrap">
                            {banner.signature}
                          </pre>
                        </div>
                      )}
                      
                      {banner.metadata && (
                        <div className="flex gap-2">
                          {banner.metadata.purpose && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {banner.metadata.purpose}
                            </span>
                          )}
                          {banner.metadata.department && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              {banner.metadata.department}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No banner configured for this company</p>
                  <Button
                    size="sm"
                    onClick={() => handleBannerAction(selectedCompanyDetail)}
                  >
                    Create Banner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => handleEdit(selectedCompanyDetail)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Company
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleRefreshCompany(selectedCompanyDetail.id)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Details
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedCompanyDetail)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Company
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto font-mono">
              {JSON.stringify(selectedCompanyDetail, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Banner Management Dialog */}
        <Dialog open={bannerOpen} onOpenChange={(isOpen) => {
          setBannerOpen(isOpen);
          if (!isOpen) {
            setSelectedCompany(null);
            setEditingBanner(null);
            resetBannerForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleBannerSubmit}>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl">
                  {editingBanner ? 'Update Company Banner' : 'Create Company Banner'}
                </DialogTitle>
                <DialogDescription>
                  {editingBanner 
                    ? 'Update your company banner information' 
                    : 'Create a new banner for your company'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Company and User Info Display */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Company</Label>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{selectedCompany?.name}</div>
                      <code className="text-xs text-muted-foreground">
                        ID: {selectedCompany?.id}
                      </code>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-sm font-medium">Created By</Label>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm">{user?.full_name}</div>
                      <code className="text-xs text-muted-foreground">
                        ID: {userId || 'Loading...'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Banner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Banner Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banner-name" className="text-sm font-medium">
                        Banner Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="banner-name"
                        placeholder="Enter banner name"
                        value={bannerFormData.name}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, name: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo-url" className="text-sm font-medium">Logo URL</Label>
                      <Input
                        id="logo-url"
                        placeholder="https://example.com/logo.png"
                        value={bannerFormData.logo_url}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, logo_url: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Banner Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purpose" className="text-sm font-medium">Purpose</Label>
                      <Input
                        id="purpose"
                        placeholder="e.g., Sales campaigns"
                        value={bannerFormData.purpose}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, purpose: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                      <Input
                        id="department"
                        placeholder="e.g., Sales"
                        value={bannerFormData.department}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, department: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Signature</h3>
                  <div className="space-y-2">
                    <Label htmlFor="signature" className="text-sm font-medium">Signature Template</Label>
                    <Textarea
                      id="signature"
                      placeholder="Best regards,&#10;Your Name&#10;Company Name&#10;www.company.com"
                      value={bannerFormData.signature}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, signature: e.target.value })}
                      className="min-h-[120px] resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use line breaks to format your signature as needed
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setBannerOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-6"
                  disabled={!bannerFormData.name.trim() || !userId}
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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

        {/* Banner Management Dialog */}
        <Dialog open={bannerOpen} onOpenChange={(isOpen) => {
          setBannerOpen(isOpen);
          if (!isOpen) {
            setSelectedCompany(null);
            setEditingBanner(null);
            resetBannerForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleBannerSubmit}>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl">
                  {editingBanner ? 'Update Company Banner' : 'Create Company Banner'}
                </DialogTitle>
                <DialogDescription>
                  {editingBanner 
                    ? 'Update your company banner information' 
                    : 'Create a new banner for your company'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Company and User Info Display */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Company</Label>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{selectedCompany?.name}</div>
                      <code className="text-xs text-muted-foreground">
                        ID: {selectedCompany?.id}
                      </code>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-sm font-medium">Created By</Label>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm">{user?.full_name}</div>
                      <code className="text-xs text-muted-foreground">
                        ID: {userId || 'Loading...'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Banner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Banner Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banner-name" className="text-sm font-medium">
                        Banner Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="banner-name"
                        placeholder="Enter banner name"
                        value={bannerFormData.name}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, name: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo-url" className="text-sm font-medium">Logo URL</Label>
                      <Input
                        id="logo-url"
                        placeholder="https://example.com/logo.png"
                        value={bannerFormData.logo_url}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, logo_url: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Banner Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purpose" className="text-sm font-medium">Purpose</Label>
                      <Input
                        id="purpose"
                        placeholder="e.g., Sales campaigns"
                        value={bannerFormData.purpose}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, purpose: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                      <Input
                        id="department"
                        placeholder="e.g., Sales"
                        value={bannerFormData.department}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, department: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Signature</h3>
                  <div className="space-y-2">
                    <Label htmlFor="signature" className="text-sm font-medium">Signature Template</Label>
                    <Textarea
                      id="signature"
                      placeholder="Best regards,&#10;Your Name&#10;Company Name&#10;www.company.com"
                      value={bannerFormData.signature}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, signature: e.target.value })}
                      className="min-h-[120px] resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use line breaks to format your signature as needed
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setBannerOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-6"
                  disabled={!bannerFormData.name.trim() || !userId}
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
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
            <Card 
              key={company.id} 
              className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
              onClick={() => handleCompanyCardClick(company)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="relative w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                        {companyBanners[company.id]?.length > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" 
                               title="Has banner" />
                        )}
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

                  {/* Banner Status */}
                  {companyBanners[company.id]?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-600 font-medium">
                        Banner configured
                      </span>
                    </div>
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
                      handleBannerAction(company);
                    }}
                  >
                    <Image className="h-3.5 w-3.5 mr-1.5" />
                    {companyBanners[company.id]?.length > 0 ? 'Update Banner' : 'Add Banner'}
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
