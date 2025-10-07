import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Building2, 
  Flag, 
  User, 
  Plus, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Share2,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  FileText,
  Copy,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_CONFIG } from "@/config/api";
import { toast } from "sonner";

interface Banner {
  id: string;
  name: string;
  logo_url: string;
  signature: string;
  metadata?: any;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  domain: string;
  notes: string;
  metadata?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  banners: Banner[];
}

interface Generation {
  id: string;
  account_id: string;
  company_id: string;
  platform: string;
  query: string;
  status: string;
  generated_posts?: {
    posts: any[];
  };
  created_at: string;
  completed_at?: string;
}

interface GenerationFormData {
  platform: string;
  query: string;
  company_banner_id: string;
  include_past: boolean;
}

const platformIcons = {
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  blog: FileText
};

const platformColors = {
  linkedin: "text-blue-600",
  instagram: "text-pink-600",
  youtube: "text-red-600",
  facebook: "text-blue-500",
  blog: "text-gray-600"
};

export default function Social() {
  const { user, accountId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'companies' | 'generation-form' | 'generations' | 'generation-detail'>('companies');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<GenerationFormData>({
    platform: '',
    query: '',
    company_banner_id: '',
    include_past: false
  });

  useEffect(() => {
    if (accountId) {
      fetchCompaniesWithBanners();
    }
  }, [accountId]);

  const fetchCompaniesWithBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounts/${accountId}/companies-with-banners`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data?.companies || []);
      } else {
        console.error('Failed to fetch companies with banners');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerations = async (companyId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/companies/${companyId}/social-generations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGenerations(data.generations || []);
      } else {
        console.error('Failed to fetch generations');
        setGenerations([]);
      }
    } catch (error) {
      console.error('Error fetching generations:', error);
      toast.error('Failed to load generations');
      setGenerations([]);
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedCompany || !selectedBanner) return;

    try {
      const payload = {
        account_id: accountId,
        company_id: selectedCompany.id,
        platform: formData.platform,
        query: formData.query,
        company_banner_id: formData.company_banner_id || selectedBanner.id,
        requested_by: user?.id,
        include_past: formData.include_past
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/social-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully generated ${formData.platform} content!`);
        setIsGenerateDialogOpen(false);
        resetForm();
        // Refresh generations for this company
        fetchGenerations(selectedCompany.id);
        setView('generations');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      query: '',
      company_banner_id: '',
      include_past: false
    });
  };

  const copyToClipboard = async (text: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(postId));
      toast.success('Copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatPostForCopy = (post: any, platform: string) => {
    let formattedText = '';
    
    if (post.title) {
      formattedText += `${post.title}\n\n`;
    }
    
    if (post.content) {
      formattedText += `${post.content}\n\n`;
    }
    
    if (post.caption) {
      formattedText += `${post.caption}\n\n`;
    }
    
    if (post.hashtags && post.hashtags.length > 0) {
      formattedText += `${post.hashtags.join(' ')}\n\n`;
    }
    
    if (post.call_to_action) {
      formattedText += `${post.call_to_action}`;
    }
    
    return formattedText.trim();
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    fetchGenerations(company.id);
    setView('generations');
  };

  const handleBannerSelect = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData(prev => ({ ...prev, company_banner_id: banner.id }));
    setView('generation-form');
  };

  const handleGenerationSelect = (generation: Generation) => {
    setSelectedGeneration(generation);
    setView('generation-detail');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'processing': return Clock;
      default: return Clock;
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading social content generator...</div>;
  }

  // Header with user info
  const renderHeader = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Content Generator</h1>
          <p className="text-muted-foreground">Generate AI-powered social media content</p>
        </div>
        {view !== 'companies' && (
          <Button variant="outline" onClick={() => {
            if (view === 'generation-detail') {
              setView('generations');
            } else if (view === 'generations') {
              setView('companies');
            } else {
              setView('companies');
            }
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>
      
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Account ID:</span>
              <code className="bg-muted px-1 py-0.5 rounded text-xs">{accountId}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Created By:</span>
              <code className="bg-muted px-1 py-0.5 rounded text-xs">{user?.id}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Companies view
  if (view === 'companies') {
    return (
      <div className="space-y-6">
        {renderHeader()}

        {companies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No companies found</p>
              <p className="text-sm text-muted-foreground">Create companies in the Companies section first</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Card key={company.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {company.name}
                  </CardTitle>
                  <CardDescription>
                    Company ID: <code className="text-xs">{company.id}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{company.domain}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={company.is_active ? "default" : "secondary"}>
                        {company.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {company.banners.length} banner{company.banners.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Banners:</h4>
                    <div className="space-y-1">
                      {company.banners.slice(0, 2).map((banner) => (
                        <div key={banner.id} className="flex items-center justify-between text-xs">
                          <span className="truncate">{banner.name}</span>
                          <code className="text-xs bg-muted px-1 rounded">{banner.id.slice(0, 8)}...</code>
                        </div>
                      ))}
                      {company.banners.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{company.banners.length - 2} more...
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleCompanySelect(company)}
                  >
                    View Generations
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Generations view
  if (view === 'generations') {
    return (
      <div className="space-y-6">
        {renderHeader()}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedCompany?.name}
                </CardTitle>
                <CardDescription>
                  Company ID: <code className="text-xs">{selectedCompany?.id}</code>
                </CardDescription>
              </div>
              <Button onClick={() => setView('generation-form')}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCompany?.banners && selectedCompany.banners.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Available Banners:</h4>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {selectedCompany.banners.map((banner) => (
                    <Card key={banner.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleBannerSelect(banner)}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          <span className="text-sm font-medium">{banner.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Banner ID: {banner.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created by: {banner.created_by.slice(0, 8)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {generations.length === 0 ? (
              <div className="text-center py-8">
                <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No content generated yet</p>
                <p className="text-sm text-muted-foreground">Generate your first social media content</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {generations.map((generation) => {
                  const StatusIcon = getStatusIcon(generation.status);
                  const PlatformIcon = platformIcons[generation.platform as keyof typeof platformIcons] || Share2;
                  
                  return (
                    <Card key={generation.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerationSelect(generation)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <PlatformIcon className={`h-4 w-4 ${platformColors[generation.platform as keyof typeof platformColors] || 'text-gray-600'}`} />
                              <span className="font-medium capitalize">{generation.platform}</span>
                              <Badge variant={getStatusBadgeVariant(generation.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {generation.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {generation.query}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(generation.created_at).toLocaleString()}
                              </div>
                              {generation.completed_at && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Completed: {new Date(generation.completed_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generation form view
  if (view === 'generation-form') {
    return (
      <div className="space-y-6">
        {renderHeader()}

        <Card>
          <CardHeader>
            <CardTitle>Generate Social Content</CardTitle>
            <CardDescription>
              Create AI-powered content for {selectedCompany?.name} using {selectedBanner?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      LinkedIn
                    </div>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </div>
                  </SelectItem>
                  <SelectItem value="youtube">
                    <div className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      YouTube
                    </div>
                  </SelectItem>
                  <SelectItem value="facebook">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-500" />
                      Facebook
                    </div>
                  </SelectItem>
                  <SelectItem value="blog">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      Blog Post
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="query">Content Query *</Label>
              <Textarea
                id="query"
                value={formData.query}
                onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
                placeholder="Generate professional posts about AI in digital marketing for B2B SaaS companies"
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. Be specific about the content type, tone, and target audience.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={selectedCompany?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Banner</Label>
                <Input value={selectedBanner?.name || ''} disabled />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include_past"
                checked={formData.include_past}
                onChange={(e) => setFormData(prev => ({ ...prev, include_past: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="include_past" className="text-sm">
                Include past generations in context
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setView('generations')}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateContent}
                disabled={!formData.platform || !formData.query || formData.query.length < 10}
              >
                Generate Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generation detail view
  if (view === 'generation-detail' && selectedGeneration) {
    const PlatformIcon = platformIcons[selectedGeneration.platform as keyof typeof platformIcons] || Share2;
    const StatusIcon = getStatusIcon(selectedGeneration.status);

    return (
      <div className="space-y-6">
        {renderHeader()}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PlatformIcon className={`h-5 w-5 ${platformColors[selectedGeneration.platform as keyof typeof platformColors] || 'text-gray-600'}`} />
              <CardTitle className="capitalize">{selectedGeneration.platform} Content Generation</CardTitle>
              <Badge variant={getStatusBadgeVariant(selectedGeneration.status)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {selectedGeneration.status}
              </Badge>
            </div>
            <CardDescription>
              Generation ID: <code className="text-xs">{selectedGeneration.id}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Query</h4>
              <p className="text-sm bg-muted p-3 rounded">{selectedGeneration.query}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span> {new Date(selectedGeneration.created_at).toLocaleString()}
              </div>
              {selectedGeneration.completed_at && (
                <div>
                  <span className="font-medium">Completed:</span> {new Date(selectedGeneration.completed_at).toLocaleString()}
                </div>
              )}
            </div>

            {selectedGeneration.generated_posts?.posts && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Generated Content ({selectedGeneration.generated_posts.posts.length} posts)</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allPostsContent = selectedGeneration.generated_posts.posts
                        .map((post, index) => {
                          const formattedPost = formatPostForCopy(post, selectedGeneration.platform);
                          return `--- Post ${index + 1} ---\n${formattedPost}`;
                        })
                        .join('\n\n');
                      copyToClipboard(allPostsContent, `${selectedGeneration.id}-all-posts`);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy All Posts
                  </Button>
                </div>
                <div className="space-y-4">
                  {selectedGeneration.generated_posts.posts.map((post, index) => {
                    const postId = `${selectedGeneration.id}-post-${index}`;
                    const isCopied = copiedItems.has(postId);
                    const formattedContent = formatPostForCopy(post, selectedGeneration.platform);
                    
                    return (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {post.title && (
                                <h5 className="font-medium mb-2">{post.title}</h5>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(formattedContent, postId)}
                              className="ml-2 flex-shrink-0"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {post.content && (
                            <div className="mb-3">
                              <pre className="whitespace-pre-wrap text-sm">{post.content}</pre>
                            </div>
                          )}
                          {post.caption && (
                            <div className="mb-3">
                              <h6 className="text-xs font-medium text-muted-foreground mb-1">CAPTION:</h6>
                              <p className="text-sm">{post.caption}</p>
                            </div>
                          )}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="mb-2">
                              <div className="flex flex-wrap gap-1">
                                {post.hashtags.map((tag: string, tagIndex: number) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {post.call_to_action && (
                            <div className="text-sm text-muted-foreground mb-2">
                              <strong>CTA:</strong> {post.call_to_action}
                            </div>
                          )}
                          {post.post_type && (
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {post.post_type.replace('_', ' ')}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                Post #{index + 1}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}