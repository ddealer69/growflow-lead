import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Globe, Calendar, Users, ExternalLink, Loader2, Mail, Send, ArrowLeft, Code, Eye, Plus, Play, Pause, Clock, Search, Trash2 } from "lucide-react";
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

interface Campaign {
  id: string;
  account_id: string;
  company_id: string;
  company_banner_id: string;
  smtp_credential_id: string;
  name: string;
  campaign_type: string;
  subject_template: string;
  body_template: string;
  send_rate_per_hour: number;
  max_retries: number;
  status: "draft" | "running" | "paused" | "completed" | "failed";
  scheduled_at?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
  updated_at: string;
}

interface CampaignsResponse {
  success: boolean;
  message: string;
  campaigns: Campaign[];
}

interface BannersResponse {
  success: boolean;
  message: string;
  banners: Banner[];
}

interface SmtpCredential {
  id: string;
  account_id: string;
  display_name: string;
  smtp_host: string;
  smtp_port: number;
  username: string;
  auth_type: string;
  verified: boolean;
  last_verified_at?: string;
  rate_limit_per_hour: number;
  metadata?: any;
  created_at: string;
}

interface SmtpCredentialsResponse {
  success: boolean;
  message: string;
  smtp_credentials: SmtpCredential[];
}

interface Lead {
  id: string;
  company_id: string;
  full_name: string;
  title: string;
  location: string;
  email?: string;
  phone?: string;
  source_link: string;
  source_username: string;
  company_name: string;
  enrichment_status: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  enrichment_payload?: {
    basic_info?: {
      first_name?: string;
      last_name?: string;
      headline?: string;
      about?: string;
      profile_picture_url?: string;
      current_company?: string;
      location?: {
        city?: string;
        country?: string;
        full?: string;
      };
    };
    experience?: Array<{
      company: string;
      title: string;
      description?: string;
      duration?: string;
      location?: string;
    }>;
  };
}

interface LeadsResponse {
  success: boolean;
  message: string;
  leads: Lead[];
}

interface CampaignLead {
  id: string;
  campaign_id: string;
  query_id: string;
  status: "queued" | "scheduled" | "sent" | "failed";
  send_attempts: number;
  scheduled_at?: string;
  personalization_vars?: {
    source_link?: string;
    full_name?: string;
    source_name?: string;
    title?: string;
    company_name?: string;
  };
  created_at: string;
}

interface CreateCampaignLeadRequest {
  campaign_id: string;
  query_id: string;
  status: "queued" | "scheduled";
  send_attempts: number;
  scheduled_at?: string;
}

interface CreateCampaignLeadResponse {
  success: boolean;
  message: string;
  campaign_lead: CampaignLead;
}

interface CampaignLeadsResponse {
  success: boolean;
  message: string;
  campaign_leads: CampaignLead[];
}

interface CreateCampaignForm {
  name: string;
  subject_template: string;
  body_template: string;
  company_banner_id: string;
  smtp_credential_id: string;
  campaign_type: string;
  send_rate_per_hour: number;
  max_retries: number;
  scheduled_at: string;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const { user, accountId } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [smtpCredentials, setSmtpCredentials] = useState<SmtpCredential[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [loadingSmtp, setLoadingSmtp] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null);
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [customHtmlTemplate, setCustomHtmlTemplate] = useState("");
  const [isTemplateModified, setIsTemplateModified] = useState(false);
  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([]);
  const [loadingCampaignLeads, setLoadingCampaignLeads] = useState(false);
  const [addingLeads, setAddingLeads] = useState(false);
  const [showCampaignLeads, setShowCampaignLeads] = useState(false);
  const [selectedCampaignForLeads, setSelectedCampaignForLeads] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState<CreateCampaignForm>({
    name: "",
    subject_template: "",
    body_template: "",
    company_banner_id: "",
    smtp_credential_id: "",
    campaign_type: "email",
    send_rate_per_hour: 50,
    max_retries: 3,
    scheduled_at: ""
  });

  // Demo HTML template for email campaigns
  const demoHtmlTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Blue Email Template</title>
  <style>
    /* MOBILE - some clients ignore media queries but many support them */
    @media only screen and (max-width:600px) {
      .container { width: 100% !important; }
      .stack { display:block !important; width:100% !important; }
      .hero-img { width:100% !important; height:auto !important; }
      .padding-sm { padding: 12px !important; }
      .h1 { font-size: 22px !important; line-height: 28px !important; }
      .p { font-size: 15px !important; line-height:22px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f3f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f6fb;">
    <tr>
      <td align="center" style="padding:24px;">
        <!-- Container -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(3, 48, 86, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:18px 24px; background: linear-gradient(90deg,#0b6fed 0%, #2aa0ff 100%); color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <img src="https://via.placeholder.com/120x36?text=${selectedCompany?.name || 'Logo'}" alt="Company Logo" width="120" style="display:block; border:0; outline:none; text-decoration:none;">
                  </td>
                  <td align="right" style="vertical-align:middle; color:#ffffff; font-size:14px;">
                    <span style="opacity:0.95;">${selectedCompany?.name || 'Awesome Product'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:28px 24px 8px 24px; text-align:center;">
              <h1 class="h1" style="margin:0; font-size:28px; line-height:36px; color:#033a66;">Hello, \{\{first_name\}\} 👋</h1>
              <p class="p" style="margin:12px 0 0 0; font-size:16px; line-height:24px; color:#4b6b88;">
                Welcome to <strong>${selectedCompany?.name || 'Awesome Product'}</strong> — here's a quick summary of what's new.
              </p>
            </td>
          </tr>

          <!-- Hero image -->
          <tr>
            <td style="padding:18px 24px; text-align:center;">
              <img class="hero-img" src="https://via.placeholder.com/520x220.png?text=Campaign+Hero+Image" alt="Hero image" width="520" style="display:block; width:100%; max-width:520px; border-radius:8px; border:0; outline:none;">
            </td>
          </tr>

          <!-- Content row -->
          <tr>
            <td style="padding:16px 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="stack" style="width:50%; padding-right:12px; vertical-align:top;">
                    <h3 style="margin:0 0 8px 0; font-size:18px; color:#033a66;">Feature Update</h3>
                    <p style="margin:0; font-size:14px; color:#4b6b88; line-height:20px;">
                      We shipped a faster onboarding flow and improved analytics to help you measure impact in minutes.
                    </p>
                  </td>
                  <td class="stack" style="width:50%; padding-left:12px; vertical-align:top;">
                    <h3 style="margin:0 0 8px 0; font-size:18px; color:#033a66;">Pro Tip</h3>
                    <p style="margin:0; font-size:14px; color:#4b6b88; line-height:20px;">
                      Use the new integrations panel to connect your tools — setup takes less than 2 minutes.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 24px 28px 24px; text-align:center;">
              <a href="https://example.com/get-started" style="display:inline-block; text-decoration:none; border-radius:8px; padding:12px 22px; font-weight:600; font-size:16px; color:#ffffff; background: linear-gradient(90deg,#0b6fed 0%, #2aa0ff 100%); box-shadow:0 6px 14px rgba(10, 88, 200, 0.12);">
                Get started — it's free
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 24px;">
              <hr style="border:none; height:1px; background:#eef4fb; margin:0;">
            </td>
          </tr>

          <!-- Footer content -->
          <tr>
            <td style="padding:18px 24px; font-size:13px; color:#6b7b8f;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:top;">
                    <strong style="color:#033a66;">${selectedCompany?.name || 'Awesome Product'}</strong><br>
                    ${selectedCompany?.domain ? `${selectedCompany.domain}` : '123 Blueway St. · Suite 400'}<br>
                    City, Country
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <a href="https://example.com/preferences" style="color:#2aa0ff; text-decoration:none; font-size:13px;">Manage preferences</a><br>
                    <a href="https://example.com/unsubscribe" style="color:#9fbfe8; text-decoration:none; font-size:13px;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Small legal -->
          <tr>
            <td style="padding:0 24px 20px 24px; font-size:12px; color:#9aa9bf; text-align:center;">
              <span>© \{\{year\}\} ${selectedCompany?.name || 'Awesome Product'}. All rights reserved.</span>
            </td>
          </tr>
        </table>
        <!-- /Container -->
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Get the current template (custom if modified, otherwise demo)
  const getCurrentTemplate = () => {
    return isTemplateModified && customHtmlTemplate ? customHtmlTemplate : demoHtmlTemplate;
  };

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
    fetchCampaigns(company.id);
    fetchBanners(company.id);
    fetchSmtpCredentials();
    toast({
      title: "Company Selected",
      description: `Opening campaigns for ${company.name}`,
    });
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setCampaigns([]);
    setBanners([]);
    setSmtpCredentials([]);
    setShowCreateCampaign(false);
    setShowLeadForm(false);
    setCreatedCampaign(null);
  };

  const fetchCampaigns = async (companyId: string) => {
    setLoadingCampaigns(true);
    try {
      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/api/campaigns/companies/${companyId}`);
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error fetching campaigns, using mock data:', networkError);
        setCampaigns([
          {
            id: 'mock-campaign-1',
            account_id: accountId || 'mock-account',
            company_id: companyId,
            company_banner_id: 'mock-banner-1',
            smtp_credential_id: 'mock-smtp-1',
            name: 'Demo Email Campaign',
            campaign_type: 'email',
            subject_template: 'Welcome to {{company_name}}!',
            body_template: '<h1>Hello {{contact_name}}</h1><p>Welcome to our platform!</p>',
            send_rate_per_hour: 50,
            max_retries: 3,
            status: 'draft' as const,
            scheduled_at: null,
            total_recipients: 0,
            sent_count: 0,
            delivered_count: 0,
            opened_count: 0,
            clicked_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        toast({
          title: "Demo Mode",
          description: "Showing demo campaigns (backend not available)",
        });
        setLoadingCampaigns(false);
        return;
      }

      if (!response.ok) {
        // If API is not available, use mock data for development
        if (response.status === 404) {
          console.warn('Campaign API not available, using mock data');
          setCampaigns([
            {
              id: 'mock-campaign-1',
              account_id: accountId || 'mock-account',
              company_id: companyId,
              company_banner_id: 'mock-banner-1',
              smtp_credential_id: 'mock-smtp-1',
              name: 'Demo Email Campaign',
              campaign_type: 'email',
              subject_template: 'Welcome to {{company_name}}!',
              body_template: '<h1>Hello {{contact_name}}</h1><p>Welcome to our platform!</p>',
              send_rate_per_hour: 50,
              max_retries: 3,
              status: 'draft' as const,
              scheduled_at: null,
              total_recipients: 0,
              sent_count: 0,
              delivered_count: 0,
              opened_count: 0,
              clicked_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
          toast({
            title: "Info",
            description: "Showing demo campaigns (API not available)",
          });
          setLoadingCampaigns(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CampaignsResponse = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns || []);
        toast({
          title: "Success",
          description: `Found ${data.campaigns?.length || 0} campaigns`,
        });
      } else {
        throw new Error(data.message || "Failed to fetch campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
      // Don't show error toast for 404 - just means no campaigns exist yet
      if (error instanceof Error && !error.message.includes('404')) {
        toast({
          title: "Info",
          description: "No campaigns found for this company",
        });
      }
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchBanners = async (companyId: string) => {
    setLoadingBanners(true);
    try {
      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/companies/${companyId}/banners`);
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error fetching banners, using mock data:', networkError);
        setBanners([
          {
            id: 'mock-banner-1',
            name: 'Demo Company Banner',
            logo_url: 'https://via.placeholder.com/200x50/007bff/ffffff?text=Demo+Banner',
            signature: 'Best regards, Demo Company Team',
            metadata: {},
            created_by: user?.id || 'mock-user',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-banner-2', 
            name: 'Holiday Banner',
            logo_url: 'https://via.placeholder.com/200x50/ff6b6b/ffffff?text=Holiday+Banner',
            signature: 'Happy Holidays, Demo Company',
            metadata: {},
            created_by: user?.id || 'mock-user',
            is_active: false,
            created_at: new Date().toISOString()
          }
        ]);
        setLoadingBanners(false);
        return;
      }

      if (!response.ok) {
        // If API is not available, use mock banners for development
        if (response.status === 404) {
          console.warn('Banners API not available, using mock data');
          setBanners([
            {
              id: 'mock-banner-1',
              name: 'Demo Company Banner',
              logo_url: 'https://via.placeholder.com/200x50/007bff/ffffff?text=Demo+Banner',
              signature: 'Best regards, Demo Company Team',
              metadata: {},
              created_by: user?.id || 'mock-user',
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-banner-2', 
              name: 'Holiday Banner',
              logo_url: 'https://via.placeholder.com/200x50/ff6b6b/ffffff?text=Holiday+Banner',
              signature: 'Happy Holidays, Demo Company',
              metadata: {},
              created_by: user?.id || 'mock-user',
              is_active: false,
              created_at: new Date().toISOString()
            }
          ]);
          setLoadingBanners(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BannersResponse = await response.json();
      
      if (data.success) {
        setBanners(data.banners || []);
      } else {
        throw new Error(data.message || "Failed to fetch banners");
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      setBanners([]);
    } finally {
      setLoadingBanners(false);
    }
  };

  const fetchSmtpCredentials = async () => {
    if (!accountId) return;
    
    setLoadingSmtp(true);
    try {
      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/accounts/${accountId}/smtp-credentials`);
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error fetching SMTP credentials, using mock data:', networkError);
        setSmtpCredentials([
          {
            id: 'mock-smtp-1',
            account_id: accountId || 'mock-account',
            display_name: 'Demo SMTP Server',
            smtp_host: 'smtp.example.com',
            smtp_port: 587,
            username: 'demo@example.com',
            auth_type: 'password',
            verified: true,
            last_verified_at: new Date().toISOString(),
            rate_limit_per_hour: 100,
            metadata: {},
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-smtp-2',
            account_id: accountId || 'mock-account',
            display_name: 'Backup SMTP Server',
            smtp_host: 'smtp.backup.com',
            smtp_port: 465,
            username: 'backup@example.com',
            auth_type: 'password',
            verified: false,
            last_verified_at: null,
            rate_limit_per_hour: 50,
            metadata: {},
            created_at: new Date().toISOString()
          }
        ]);
        setLoadingSmtp(false);
        return;
      }

      if (!response.ok) {
        // If API is not available, use mock SMTP credentials for development
        if (response.status === 404) {
          console.warn('SMTP credentials API not available, using mock data');
          setSmtpCredentials([
            {
              id: 'mock-smtp-1',
              account_id: accountId || 'mock-account',
              display_name: 'Demo SMTP Server',
              smtp_host: 'smtp.example.com',
              smtp_port: 587,
              username: 'demo@example.com',
              auth_type: 'password',
              verified: true,
              last_verified_at: new Date().toISOString(),
              rate_limit_per_hour: 100,
              metadata: {},
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-smtp-2',
              account_id: accountId || 'mock-account',
              display_name: 'Backup SMTP Server',
              smtp_host: 'smtp.backup.com',
              smtp_port: 465,
              username: 'backup@example.com',
              auth_type: 'password',
              verified: false,
              last_verified_at: null,
              rate_limit_per_hour: 50,
              metadata: {},
              created_at: new Date().toISOString()
            }
          ]);
          setLoadingSmtp(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SmtpCredentialsResponse = await response.json();
      
      if (data.success) {
        setSmtpCredentials(data.smtp_credentials || []);
      } else {
        throw new Error(data.message || "Failed to fetch SMTP credentials");
      }
    } catch (error) {
      console.error("Error fetching SMTP credentials:", error);
      setSmtpCredentials([]);
    } finally {
      setLoadingSmtp(false);
    }
  };

  const createCampaign = async () => {
    console.log('createCampaign called - checking prerequisites');
    if (!selectedCompany || !user?.id || !accountId) {
      console.log('Missing prerequisites:', { selectedCompany: !!selectedCompany, userId: !!user?.id, accountId: !!accountId });
      toast({
        title: "Error",
        description: "Missing required information to create campaign",
        variant: "destructive",
      });
      return;
    }

    console.log('Prerequisites ok, starting campaign creation');
    setCreatingCampaign(true);
    try {
      const campaignData = {
        account_id: accountId,
        company_id: selectedCompany.id,
        created_by: user.id,
        name: campaignForm.name,
        campaign_type: campaignForm.campaign_type,
        subject_template: campaignForm.subject_template,
        body_template: campaignForm.body_template,
        company_banner_id: campaignForm.company_banner_id || null,
        smtp_credential_id: campaignForm.smtp_credential_id || null,
        send_rate_per_hour: campaignForm.send_rate_per_hour,
        max_retries: campaignForm.max_retries,
        scheduled_at: campaignForm.scheduled_at || null
      };

      let response;
      try {
        console.log('Attempting fetch to:', `${API_CONFIG.BASE_URL}/api/campaigns`);
        console.log('Campaign data:', campaignData);
        response = await fetch(`${API_CONFIG.BASE_URL}/api/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData)
        });
        console.log('Fetch successful, response:', response);
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error creating campaign, using mock campaign:', networkError);
        console.log('Creating mock campaign due to network error');
        const mockCampaign: Campaign = {
          id: `mock-campaign-${Date.now()}`,
          account_id: accountId,
          company_id: selectedCompany.id,
          company_banner_id: campaignForm.company_banner_id || 'mock-banner',
          smtp_credential_id: campaignForm.smtp_credential_id || 'mock-smtp',
          name: campaignForm.name,
          campaign_type: campaignForm.campaign_type,
          subject_template: campaignForm.subject_template,
          body_template: campaignForm.body_template,
          send_rate_per_hour: campaignForm.send_rate_per_hour,
          max_retries: campaignForm.max_retries,
          status: 'draft' as const,
          scheduled_at: campaignForm.scheduled_at || null,
          total_recipients: 0,
          sent_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCampaigns(prev => [...prev, mockCampaign]);
        setCreatedCampaign(mockCampaign);
        setShowCreateCampaign(false);
        setShowLeadForm(true);
        setCampaignForm({
          name: "",
          subject_template: "",
          body_template: "",
          company_banner_id: "",
          smtp_credential_id: "",
          campaign_type: "email",
          send_rate_per_hour: 50,
          max_retries: 3,
          scheduled_at: ""
        });
        toast({
          title: "Demo Mode",
          description: "Mock campaign created successfully (backend not available)",
        });
        setCreatingCampaign(false);
        return;
      }

      if (!response.ok) {
        // If API is not available, create a mock campaign for development
        if (response.status === 404 || response.status === 0) {
          console.warn('Campaign creation API not available, creating mock campaign');
          const mockCampaign: Campaign = {
            id: `mock-campaign-${Date.now()}`,
            account_id: accountId,
            company_id: selectedCompany.id,
            company_banner_id: campaignForm.company_banner_id || 'mock-banner',
            smtp_credential_id: campaignForm.smtp_credential_id || 'mock-smtp',
            name: campaignForm.name,
            campaign_type: campaignForm.campaign_type,
            subject_template: campaignForm.subject_template,
            body_template: campaignForm.body_template,
            send_rate_per_hour: campaignForm.send_rate_per_hour,
            max_retries: campaignForm.max_retries,
            status: 'draft' as const,
            scheduled_at: campaignForm.scheduled_at || null,
            total_recipients: 0,
            sent_count: 0,
            delivered_count: 0,
            opened_count: 0,
            clicked_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setCampaigns(prev => [...prev, mockCampaign]);
          setCreatedCampaign(mockCampaign);
          setShowCreateCampaign(false);
          setShowLeadForm(true);
          setCampaignForm({
            name: "",
            subject_template: "",
            body_template: "",
            company_banner_id: "",
            smtp_credential_id: "",
            campaign_type: "email",
            send_rate_per_hour: 50,
            max_retries: 3,
            scheduled_at: ""
          });
          toast({
            title: "Demo Mode",
            description: "Mock campaign created successfully (API not available)",
          });
          setCreatingCampaign(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCampaigns(prev => [...prev, data.campaign]);
        setCreatedCampaign(data.campaign);
        setShowCreateCampaign(false);
        setShowLeadForm(true);
        setCampaignForm({
          name: "",
          subject_template: "",
          body_template: "",
          company_banner_id: "",
          smtp_credential_id: "",
          campaign_type: "email",
          send_rate_per_hour: 50,
          max_retries: 3,
          scheduled_at: ""
        });
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
      } else {
        throw new Error(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const fetchLeads = async (companyId: string) => {
    setLoadingLeads(true);
    try {
      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/api/leads/companies/${companyId}`);
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error fetching leads, using mock data:', networkError);
        const mockLeads: Lead[] = [
          {
            id: 'mock-lead-1',
            company_id: companyId,
            full_name: 'John Doe',
            title: 'Senior Software Engineer',
            location: 'New York, NY',
            email: 'john.doe@example.com',
            phone: '+1-555-0123',
            source_link: 'https://linkedin.com/in/johndoe',
            source_username: 'johndoe',
            company_name: selectedCompany?.name || 'Tech Corp',
            enrichment_status: 'enriched',
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-lead-2',
            company_id: companyId,
            full_name: 'Jane Smith',
            title: 'Product Manager',
            location: 'San Francisco, CA',
            email: 'jane.smith@example.com',
            phone: '+1-555-0124',
            source_link: 'https://linkedin.com/in/janesmith',
            source_username: 'janesmith',
            company_name: selectedCompany?.name || 'Tech Corp',
            enrichment_status: 'enriched',
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-lead-3',
            company_id: companyId,
            full_name: 'Mike Johnson',
            title: 'Marketing Director',
            location: 'Chicago, IL',
            email: 'mike.johnson@example.com',
            phone: '+1-555-0125',
            source_link: 'https://linkedin.com/in/mikejohnson',
            source_username: 'mikejohnson',
            company_name: selectedCompany?.name || 'Tech Corp',
            enrichment_status: 'enriched',
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setLeads(mockLeads);
        toast({
          title: "Demo Mode",
          description: "Showing demo leads (backend not available)",
        });
        setLoadingLeads(false);
        return;
      }

      if (!response.ok) {
        // If API is not available, use mock leads for development
        if (response.status === 404 || response.status === 0) {
          console.warn('Leads API not available, using mock data');
          const mockLeads: Lead[] = [
            {
              id: 'mock-lead-1',
              company_id: companyId,
              full_name: 'John Doe',
              title: 'Senior Software Engineer',
              location: 'New York, NY',
              email: 'john.doe@example.com',
              phone: '+1-555-0123',
              source_link: 'https://linkedin.com/in/johndoe',
              source_username: 'johndoe',
              company_name: selectedCompany?.name || 'Tech Corp',
              enrichment_status: 'enriched',
              is_archived: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'mock-lead-2',
              company_id: companyId,
              full_name: 'Jane Smith',
              title: 'Product Manager',
              location: 'San Francisco, CA',
              email: 'jane.smith@example.com',
              phone: '+1-555-0124',
              source_link: 'https://linkedin.com/in/janesmith',
              source_username: 'janesmith',
              company_name: selectedCompany?.name || 'Tech Corp',
              enrichment_status: 'enriched',
              is_archived: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'mock-lead-3',
              company_id: companyId,
              full_name: 'Mike Johnson',
              title: 'Marketing Director',
              location: 'Chicago, IL',
              email: 'mike.johnson@example.com',
              phone: '+1-555-0125',
              source_link: 'https://linkedin.com/in/mikejohnson',
              source_username: 'mikejohnson',
              company_name: selectedCompany?.name || 'Tech Corp',
              enrichment_status: 'enriched',
              is_archived: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setLeads(mockLeads);
          toast({
            title: "Demo Mode",
            description: "Showing demo leads (API not available)",
          });
          setLoadingLeads(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LeadsResponse = await response.json();
      
      if (data.success) {
        console.log('Leads API response:', data);
        setLeads(data.leads || []);
        toast({
          title: "Success",
          description: `Found ${data.leads?.length || 0} leads for this company`,
        });
      } else {
        throw new Error(data.message || "Failed to fetch leads");
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLeads([]);
      toast({
        title: "Info",
        description: "No leads found for this company",
      });
    } finally {
      setLoadingLeads(false);
    }
  };

  const addLeadsToCampaign = async () => {
    if (!createdCampaign || selectedLeads.length === 0) {
      toast({
        title: "Error",
        description: "No campaign or leads selected",
        variant: "destructive",
      });
      return;
    }

    setAddingLeads(true);
    try {
      const campaignLeadPromises = selectedLeads.map(async (leadId) => {
        const lead = leads.find(l => l.id === leadId);
        const campaignLeadData: CreateCampaignLeadRequest = {
          campaign_id: createdCampaign.id,
          query_id: leadId, // Using lead ID as query_id
          status: "queued",
          send_attempts: 0,
          scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Schedule 1 hour from now
        };

        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/campaign-leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaignLeadData)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: CreateCampaignLeadResponse = await response.json();
          return data.campaign_lead;
        } catch (error) {
          // Fallback to mock data if API is not available
          console.warn('Campaign lead creation API not available, using mock data:', error);
          const mockCampaignLead: CampaignLead = {
            id: `mock-campaign-lead-${Date.now()}-${leadId}`,
            campaign_id: createdCampaign.id,
            query_id: leadId,
            status: "queued",
            send_attempts: 0,
            scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            personalization_vars: {
              source_link: lead?.source_link || 'https://linkedin.com/in/placeholder',
              full_name: lead?.full_name || 'Unknown Lead',
              source_name: lead?.source_username || 'unknown',
              title: lead?.title || 'Unknown Title',
              company_name: lead?.company_name || selectedCompany?.name || 'Unknown Company'
            },
            created_at: new Date().toISOString()
          };
          return mockCampaignLead;
        }
      });

      const newCampaignLeads = await Promise.all(campaignLeadPromises);
      setCampaignLeads(newCampaignLeads);
      
      toast({
        title: "Success",
        description: `Added ${selectedLeads.length} leads to campaign "${createdCampaign.name}"`,
      });

      // Show campaign leads view
      setShowLeadForm(false);
      setShowCampaignLeads(true);
      setSelectedLeads([]);

    } catch (error) {
      console.error('Error adding leads to campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add leads to campaign",
        variant: "destructive",
      });
    } finally {
      setAddingLeads(false);
    }
  };

  const fetchCampaignLeads = async (campaignId: string) => {
    setLoadingCampaignLeads(true);
    try {
      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/api/campaign-leads/campaigns/${campaignId}`);
      } catch (networkError) {
        // Handle network errors with mock data
        console.warn('Network error fetching campaign leads, using mock data:', networkError);
        const mockCampaignLeads: CampaignLead[] = [
          {
            id: 'mock-campaign-lead-1',
            campaign_id: campaignId,
            query_id: 'mock-lead-1',
            status: 'scheduled',
            send_attempts: 0,
            scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            personalization_vars: {
              source_link: 'https://linkedin.com/in/johndoe',
              full_name: 'John Doe',
              source_name: 'johndoe',
              title: 'Senior Software Engineer',
              company_name: selectedCompany?.name || 'Tech Corp'
            },
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-campaign-lead-2',
            campaign_id: campaignId,
            query_id: 'mock-lead-2',
            status: 'queued',
            send_attempts: 0,
            personalization_vars: {
              source_link: 'https://linkedin.com/in/janesmith',
              full_name: 'Jane Smith',
              source_name: 'janesmith',
              title: 'Product Manager',
              company_name: selectedCompany?.name || 'Tech Corp'
            },
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-campaign-lead-3',
            campaign_id: campaignId,
            query_id: 'mock-lead-3',
            status: 'queued',
            send_attempts: 1,
            scheduled_at: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
            personalization_vars: {
              source_link: 'https://linkedin.com/in/mikejohnson',
              full_name: 'Mike Johnson',
              source_name: 'mikejohnson',
              title: 'Marketing Director',
              company_name: selectedCompany?.name || 'Tech Corp'
            },
            created_at: new Date().toISOString()
          }
        ];
        setCampaignLeads(mockCampaignLeads);
        setLoadingCampaignLeads(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 404 || response.status === 0) {
          console.warn('Campaign leads API not available, using mock data');
          const mockCampaignLeads: CampaignLead[] = [
            {
              id: 'mock-campaign-lead-1',
              campaign_id: campaignId,
              query_id: 'mock-lead-1',
              status: 'scheduled',
              send_attempts: 0,
              scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              personalization_vars: {
                source_link: 'https://linkedin.com/in/johndoe',
                full_name: 'John Doe',
                source_name: 'johndoe',
                title: 'Senior Software Engineer',
                company_name: selectedCompany?.name || 'Tech Corp'
              },
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-campaign-lead-2',
              campaign_id: campaignId,
              query_id: 'mock-lead-2',
              status: 'queued',
              send_attempts: 0,
              personalization_vars: {
                source_link: 'https://linkedin.com/in/janesmith',
                full_name: 'Jane Smith',
                source_name: 'janesmith',
                title: 'Product Manager',
                company_name: selectedCompany?.name || 'Tech Corp'
              },
              created_at: new Date().toISOString()
            }
          ];
          setCampaignLeads(mockCampaignLeads);
          setLoadingCampaignLeads(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CampaignLeadsResponse = await response.json();
      
      if (data.success) {
        setCampaignLeads(data.campaign_leads || []);
      } else {
        throw new Error(data.message || "Failed to fetch campaign leads");
      }
    } catch (error) {
      console.error("Error fetching campaign leads:", error);
      setCampaignLeads([]);
    } finally {
      setLoadingCampaignLeads(false);
    }
  };

  const createCampaignAndShowLeads = async () => {
    console.log('createCampaignAndShowLeads called - checking prerequisites');
    if (!selectedCompany || !user?.id || !accountId) {
      console.log('Missing prerequisites:', { selectedCompany: !!selectedCompany, userId: !!user?.id, accountId: !!accountId });
      toast({
        title: "Error",
        description: "Missing required information to create campaign",
        variant: "destructive",
      });
      return;
    }

    if (!campaignForm.name || !campaignForm.subject_template) {
      toast({
        title: "Error",
        description: "Please fill in campaign name and subject template first",
        variant: "destructive",
      });
      return;
    }

    console.log('Prerequisites ok, starting campaign creation and lead fetching');
    setCreatingCampaign(true);
    try {
      const campaignData = {
        account_id: accountId,
        company_id: selectedCompany.id,
        created_by: user.id,
        name: campaignForm.name,
        campaign_type: campaignForm.campaign_type,
        subject_template: campaignForm.subject_template,
        body_template: campaignForm.body_template,
        company_banner_id: campaignForm.company_banner_id || null,
        smtp_credential_id: campaignForm.smtp_credential_id || null,
        send_rate_per_hour: campaignForm.send_rate_per_hour,
        max_retries: campaignForm.max_retries,
        scheduled_at: campaignForm.scheduled_at || null
      };

      let response;
      let mockCampaign: Campaign;
      
      try {
        console.log('Attempting fetch to:', `${API_CONFIG.BASE_URL}/api/campaigns`);
        console.log('Campaign data:', campaignData);
        response = await fetch(`${API_CONFIG.BASE_URL}/api/campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData)
        });
        console.log('Fetch successful, response:', response);
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error creating campaign, using mock campaign:', networkError);
        console.log('Creating mock campaign due to network error');
        mockCampaign = {
          id: `mock-campaign-${Date.now()}`,
          account_id: accountId,
          company_id: selectedCompany.id,
          company_banner_id: campaignForm.company_banner_id || 'mock-banner',
          smtp_credential_id: campaignForm.smtp_credential_id || 'mock-smtp',
          name: campaignForm.name,
          campaign_type: campaignForm.campaign_type,
          subject_template: campaignForm.subject_template,
          body_template: campaignForm.body_template,
          send_rate_per_hour: campaignForm.send_rate_per_hour,
          max_retries: campaignForm.max_retries,
          status: 'draft' as const,
          scheduled_at: campaignForm.scheduled_at || null,
          total_recipients: 0,
          sent_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCampaigns(prev => [...prev, mockCampaign]);
        setCreatedCampaign(mockCampaign);
        setShowCreateCampaign(false);
        
        // Fetch leads for the company
        await fetchLeads(selectedCompany.id);
        setShowLeadForm(true);
        
        setCampaignForm({
          name: "",
          subject_template: "",
          body_template: "",
          company_banner_id: "",
          smtp_credential_id: "",
          campaign_type: "email",
          send_rate_per_hour: 50,
          max_retries: 3,
          scheduled_at: ""
        });
        toast({
          title: "Demo Mode",
          description: "Mock campaign created successfully (backend not available)",
        });
        setCreatingCampaign(false);
        return;
      }

      if (!response.ok) {
        // If API is not available, create a mock campaign for development
        if (response.status === 404 || response.status === 0) {
          console.warn('Campaign creation API not available, creating mock campaign');
          mockCampaign = {
            id: `mock-campaign-${Date.now()}`,
            account_id: accountId,
            company_id: selectedCompany.id,
            company_banner_id: campaignForm.company_banner_id || 'mock-banner',
            smtp_credential_id: campaignForm.smtp_credential_id || 'mock-smtp',
            name: campaignForm.name,
            campaign_type: campaignForm.campaign_type,
            subject_template: campaignForm.subject_template,
            body_template: campaignForm.body_template,
            send_rate_per_hour: campaignForm.send_rate_per_hour,
            max_retries: campaignForm.max_retries,
            status: 'draft' as const,
            scheduled_at: campaignForm.scheduled_at || null,
            total_recipients: 0,
            sent_count: 0,
            delivered_count: 0,
            opened_count: 0,
            clicked_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setCampaigns(prev => [...prev, mockCampaign]);
          setCreatedCampaign(mockCampaign);
          setShowCreateCampaign(false);
          
          // Fetch leads for the company
          await fetchLeads(selectedCompany.id);
          setShowLeadForm(true);
          
          setCampaignForm({
            name: "",
            subject_template: "",
            body_template: "",
            company_banner_id: "",
            smtp_credential_id: "",
            campaign_type: "email",
            send_rate_per_hour: 50,
            max_retries: 3,
            scheduled_at: ""
          });
          toast({
            title: "Demo Mode",
            description: "Mock campaign created successfully (API not available)",
          });
          setCreatingCampaign(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCampaigns(prev => [...prev, data.campaign]);
        setCreatedCampaign(data.campaign);
        setShowCreateCampaign(false);
        
        // Fetch leads for the company
        await fetchLeads(selectedCompany.id);
        setShowLeadForm(true);
        
        setCampaignForm({
          name: "",
          subject_template: "",
          body_template: "",
          company_banner_id: "",
          smtp_credential_id: "",
          campaign_type: "email",
          send_rate_per_hour: 50,
          max_retries: 3,
          scheduled_at: ""
        });
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
      } else {
        throw new Error(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setDeletingCampaign(campaignId);
    try {
      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/api/campaigns/${campaignId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error deleting campaign, using mock deletion:', networkError);
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
        toast({
          title: "Demo Mode",
          description: "Campaign deleted successfully (backend not available)",
        });
        setDeletingCampaign(null);
        return;
      }

      if (!response.ok) {
        // If API is not available, remove from local state for development
        if (response.status === 404 || response.status === 0) {
          console.warn('Campaign deletion API not available, removing from local state');
          setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
          toast({
            title: "Demo Mode",
            description: "Campaign deleted successfully (API not available)",
          });
          setDeletingCampaign(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
        toast({
          title: "Success",
          description: "Campaign deleted successfully",
        });
      } else {
        throw new Error(data.message || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setDeletingCampaign(null);
    }
  };

  return (
    <div className="space-y-6">
      {selectedCompany ? (
        showCampaignLeads && selectedCampaignForLeads ? (
          // Campaign Leads Table View Only
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setShowCampaignLeads(false);
                        setSelectedCampaignForLeads(null);
                        setCampaignLeads([]);
                      }}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Campaigns
                    </Button>
                    Campaign Leads - {selectedCampaignForLeads.name}
                  </CardTitle>
                  <CardDescription>
                    Manage and monitor leads for campaign "{selectedCampaignForLeads.name}"
                  </CardDescription>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchCampaignLeads(selectedCampaignForLeads.id);
                    toast({
                      title: "Refreshed",
                      description: "Campaign leads refreshed",
                    });
                  }}
                  disabled={loadingCampaignLeads}
                >
                  {loadingCampaignLeads ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campaign Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-2 text-blue-800">Campaign Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className="ml-2" variant={
                      selectedCampaignForLeads.status === "running" ? "default" : 
                      selectedCampaignForLeads.status === "completed" ? "secondary" : 
                      selectedCampaignForLeads.status === "failed" ? "destructive" : 
                      selectedCampaignForLeads.status === "paused" ? "outline" : "secondary"
                    }>
                      {selectedCampaignForLeads.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Total Leads:</span> {campaignLeads.length}
                  </div>
                  <div>
                    <span className="font-medium">Recipients:</span> {selectedCampaignForLeads.total_recipients}
                  </div>
                  <div>
                    <span className="font-medium">Sent:</span> {selectedCampaignForLeads.sent_count}
                  </div>
                </div>
              </div>

              {/* Campaign Leads Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Campaign Leads ({campaignLeads.length})</h4>
                  {loadingCampaignLeads && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
                
                {loadingCampaignLeads ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse border rounded-lg p-4">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : campaignLeads.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignLeads.map((campaignLead) => {
                          // Get lead information from the original leads array or use personalization vars
                          const leadInfo = leads.find(l => l.id === campaignLead.query_id);
                          const displayName = campaignLead.personalization_vars?.full_name || 
                                            leadInfo?.full_name || 'Unknown Lead';
                          const displayTitle = campaignLead.personalization_vars?.title || 
                                             leadInfo?.title || 'No Title';
                          const displayCompany = campaignLead.personalization_vars?.company_name || 
                                               selectedCompany?.name || 'Unknown Company';
                          const displayLink = campaignLead.personalization_vars?.source_link || 
                                            leadInfo?.source_link;
                          
                          return (
                            <TableRow key={campaignLead.id}>
                              <TableCell>
                                <div className="font-medium">{displayName}</div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {campaignLead.query_id}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{displayTitle}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{displayCompany}</div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 text-sm">
                                  {leadInfo?.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {leadInfo.email}
                                    </div>
                                  )}
                                  {leadInfo?.phone && (
                                    <div className="text-xs text-muted-foreground">
                                      📞 {leadInfo.phone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    campaignLead.status === "scheduled" ? "default" : 
                                    campaignLead.status === "sent" ? "secondary" : 
                                    campaignLead.status === "failed" ? "destructive" : "outline"
                                  }
                                >
                                  {campaignLead.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{campaignLead.send_attempts}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  {campaignLead.scheduled_at ? 
                                    new Date(campaignLead.scheduled_at).toLocaleString() : 
                                    'Not scheduled'
                                  }
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {displayLink && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => window.open(displayLink, '_blank')}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Campaign Leads Found</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      No leads have been added to this campaign yet.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
        // Company Campaign Detail View
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToCompanies}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Companies
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{selectedCompany.name} Campaigns</h1>
                <p className="text-muted-foreground">
                  Email and LinkedIn campaign management for {selectedCompany.name}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateCampaign(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Campaign
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
                            {banner.signature && (
                              <p className="text-sm text-muted-foreground">{banner.signature}</p>
                            )}
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

          {/* Campaigns List */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Campaigns ({campaigns.length})
                    {loadingCampaigns && (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {loadingCampaigns 
                      ? "Loading campaigns..." 
                      : "Manage your email campaigns"
                    }
                  </CardDescription>
                </div>
                {!loadingCampaigns && (
                  <Button 
                    onClick={() => setShowCreateCampaign(true)}
                    size="sm"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Campaign
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => {
                        setSelectedCampaignForLeads(campaign);
                        fetchCampaignLeads(campaign.id);
                        setShowCampaignLeads(true);
                        toast({
                          title: "Loading Campaign Leads",
                          description: `Loading leads for "${campaign.name}"`,
                        });
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{campaign.subject_template}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              campaign.status === "running" ? "default" : 
                              campaign.status === "completed" ? "secondary" : 
                              campaign.status === "failed" ? "destructive" : 
                              campaign.status === "paused" ? "outline" : "secondary"
                            }
                            className="flex items-center gap-1"
                          >
                            {campaign.status === "running" && <Play className="h-3 w-3" />}
                            {campaign.status === "paused" && <Pause className="h-3 w-3" />}
                            {campaign.status === "draft" && <Clock className="h-3 w-3" />}
                            {campaign.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCampaign(campaign.id);
                            }}
                            disabled={deletingCampaign === campaign.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingCampaign === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Recipients:</span>
                          <div className="text-muted-foreground">{campaign.total_recipients}</div>
                        </div>
                        <div>
                          <span className="font-medium">Sent:</span>
                          <div className="text-muted-foreground">{campaign.sent_count}</div>
                        </div>
                        <div>
                          <span className="font-medium">Delivered:</span>
                          <div className="text-muted-foreground">{campaign.delivered_count}</div>
                        </div>
                        <div>
                          <span className="font-medium">Opened:</span>
                          <div className="text-muted-foreground">{campaign.opened_count}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Created: {new Date(campaign.created_at).toLocaleString()}</span>
                        <span className="text-primary font-medium">Click to view leads →</span>
                        {campaign.scheduled_at && (
                          <span>Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Campaigns Found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    No campaigns found for {selectedCompany.name}.
                    <br />
                    Create your first campaign to get started.
                  </p>
                  <Button 
                    onClick={() => setShowCreateCampaign(true)} 
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Campaign Form */}
          {showCreateCampaign && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
                <CardDescription>
                  Create an email campaign for {selectedCompany.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="campaign_name">Campaign Name</Label>
                    <Input
                      id="campaign_name"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm(prev => ({...prev, name: e.target.value}))}
                      placeholder="e.g., Holiday Newsletter 2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign_subject">Email Subject Template</Label>
                    <Input
                      id="campaign_subject"
                      value={campaignForm.subject_template}
                      onChange={(e) => setCampaignForm(prev => ({...prev, subject_template: e.target.value}))}
                      placeholder="e.g., Exciting updates from {{company_name}}!"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="banner_select">Company Banner</Label>
                    <Select 
                      value={campaignForm.company_banner_id} 
                      onValueChange={(value) => setCampaignForm(prev => ({...prev, company_banner_id: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a banner" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingBanners ? (
                          <SelectItem value="" disabled>Loading banners...</SelectItem>
                        ) : banners.length > 0 ? (
                          banners.map((banner) => (
                            <SelectItem key={banner.id} value={banner.id}>
                              {banner.name} {banner.is_active ? "(Active)" : "(Inactive)"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No banners found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="smtp_select">SMTP Server</Label>
                    <Select 
                      value={campaignForm.smtp_credential_id} 
                      onValueChange={(value) => setCampaignForm(prev => ({...prev, smtp_credential_id: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select SMTP server" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSmtp ? (
                          <SelectItem value="" disabled>Loading SMTP servers...</SelectItem>
                        ) : smtpCredentials.length > 0 ? (
                          smtpCredentials.map((smtp) => (
                            <SelectItem key={smtp.id} value={smtp.id}>
                              {smtp.display_name} {smtp.verified ? "✓" : "⚠️"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No SMTP servers found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduled_at">Schedule (Optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={campaignForm.scheduled_at}
                    onChange={(e) => setCampaignForm(prev => ({...prev, scheduled_at: e.target.value}))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="send_rate">Send Rate (emails/hour)</Label>
                    <Input
                      id="send_rate"
                      type="number"
                      min="1"
                      max="1000"
                      value={campaignForm.send_rate_per_hour}
                      onChange={(e) => setCampaignForm(prev => ({...prev, send_rate_per_hour: parseInt(e.target.value) || 50}))}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_retries">Max Retries</Label>
                    <Input
                      id="max_retries"
                      type="number"
                      min="0"
                      max="10"
                      value={campaignForm.max_retries}
                      onChange={(e) => setCampaignForm(prev => ({...prev, max_retries: parseInt(e.target.value) || 3}))}
                      placeholder="3"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="body_template">Email Body Template</Label>
                  <Textarea
                    id="body_template"
                    value={campaignForm.body_template}
                    onChange={(e) => setCampaignForm(prev => ({...prev, body_template: e.target.value}))}
                    placeholder="Enter your email HTML template or use the template below..."
                    rows={6}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const currentTemplate = getCurrentTemplate();
                      setCampaignForm(prev => ({...prev, body_template: currentTemplate}));
                      toast({
                        title: "Template Applied",
                        description: isTemplateModified ? "Custom template applied to campaign" : "Demo template applied to campaign",
                      });
                    }}
                  >
                    {isTemplateModified ? "Use Custom Template" : "Use Demo Template"}
                  </Button>
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
                  <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createCampaign} 
                    disabled={creatingCampaign || !campaignForm.name || !campaignForm.subject_template || !campaignForm.company_banner_id || !campaignForm.smtp_credential_id}
                  >
                    {creatingCampaign && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Campaign
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={createCampaignAndShowLeads}
                    disabled={!campaignForm.name || !campaignForm.subject_template || creatingCampaign}
                  >
                    {creatingCampaign ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      "Create & Select Leads →"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lead Selection Form */}
          {showLeadForm && createdCampaign && (
            <Card>
              <CardHeader>
                <CardTitle>Select Leads for Campaign</CardTitle>
                <CardDescription>
                  Select leads for "{createdCampaign.name}" campaign from {selectedCompany.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Campaign Details Display */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2 text-blue-800">Campaign Information:</h4>
                  <div className="grid gap-2 text-sm text-blue-700">
                    <div><span className="font-medium">Company:</span> {selectedCompany.name}</div>
                    <div><span className="font-medium">Campaign ID:</span> <code>{createdCampaign.id}</code></div>
                    <div><span className="font-medium">Campaign Name:</span> {createdCampaign.name}</div>
                    <div><span className="font-medium">Subject Template:</span> {createdCampaign.subject_template}</div>
                    <div><span className="font-medium">Status:</span> <Badge variant="secondary">{createdCampaign.status}</Badge></div>
                  </div>
                </div>

                {/* Leads List with Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Available Leads ({leads.length})</h4>
                    {loadingLeads && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  
                  {loadingLeads ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse border rounded-lg p-4">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : leads.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedLeads.length === leads.length) {
                              setSelectedLeads([]);
                            } else {
                              setSelectedLeads(leads.map(lead => lead.id));
                            }
                          }}
                        >
                          {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {selectedLeads.length} of {leads.length} leads selected
                        </span>
                      </div>
                      
                      {leads.map((lead) => {
                        console.log('Rendering lead:', lead);
                        return (
                          <div 
                            key={lead.id} 
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedLeads.includes(lead.id) 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => {
                              setSelectedLeads(prev => 
                                prev.includes(lead.id)
                                  ? prev.filter(id => id !== lead.id)
                                  : [...prev, lead.id]
                              );
                            }}
                          >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <input
                                  type="checkbox"
                                  checked={selectedLeads.includes(lead.id)}
                                  onChange={() => {
                                    setSelectedLeads(prev => 
                                      prev.includes(lead.id)
                                        ? prev.filter(id => id !== lead.id)
                                        : [...prev, lead.id]
                                    );
                                  }}
                                  className="rounded"
                                />
                                <h5 className="font-medium">
                                  {lead.full_name || 'Unknown Lead'}
                                </h5>
                                {lead.title && (
                                  <Badge variant="secondary" className="text-xs">
                                    {lead.title}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {lead.email || 'No email'}
                              </p>
                              {lead.location && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  📍 {lead.location}
                                </p>
                              )}
                              {lead.phone && (
                                <p className="text-xs text-muted-foreground">
                                  📞 {lead.phone}
                                </p>
                              )}
                              {lead.source_link && (
                                <a 
                                  href={lead.source_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  LinkedIn Profile <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <Badge variant={!lead.is_archived ? "default" : "secondary"}>
                              {!lead.is_archived ? "Active" : "Archived"}
                            </Badge>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Leads Found</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        No leads found for {selectedCompany.name}.
                        <br />
                        Try importing leads or using the lead generation tools.
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowLeadForm(false);
                      setSelectedLeads([]);
                      setLeads([]);
                      setCreatedCampaign(null);
                    }}
                  >
                    Back to Campaigns
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Import Leads",
                          description: "Lead import functionality coming soon!",
                        });
                      }}
                    >
                      Import More Leads
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        if (selectedLeads.length === 0) {
                          toast({
                            title: "No Leads Selected",
                            description: "Please select at least one lead for the campaign",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        addLeadsToCampaign();
                      }}
                      disabled={selectedLeads.length === 0 || addingLeads}
                    >
                      {addingLeads ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding Leads...
                        </>
                      ) : (
                        `Add ${selectedLeads.length} Leads to Campaign`
                      )}
                    </Button>
                  </div>
                </div>

                {/* API Debug for Lead Selection */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">API Debug - Lead Selection:</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Leads Fetch Endpoint:</span>
                      <code className="ml-1 text-xs bg-white px-1 py-0.5 rounded">
                        GET {API_CONFIG.BASE_URL}/api/leads/companies/{selectedCompany.id}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Total Leads Found:</span>
                      <code className="ml-1 text-xs bg-white px-1 py-0.5 rounded">
                        {leads.length}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Selected Lead IDs:</span>
                      <code className="ml-1 text-xs bg-white px-1 py-0.5 rounded">
                        [{selectedLeads.join(', ')}]
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Sample Lead Data:</span>
                      {leads.length > 0 && (
                        <pre className="mt-1 text-xs bg-white p-2 rounded-md overflow-x-auto max-h-32 overflow-y-auto">
                          {JSON.stringify(leads[0], null, 2)}
                        </pre>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Leads cURL:</span>
                      <pre className="mt-2 text-xs bg-white p-3 rounded-md overflow-x-auto">
{`curl -X GET "${API_CONFIG.BASE_URL}/api/leads/companies/${selectedCompany.id}" \\
  -H "Content-Type: application/json"`}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* HTML Email Template Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Campaign Template
                {isTemplateModified && (
                  <Badge variant="secondary" className="ml-2">
                    Modified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Preview and edit email campaign templates for {selectedCompany.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML Code
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="space-y-4">
                  <div className="border rounded-lg bg-gray-50 p-4">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-full">
                      <iframe
                        srcDoc={getCurrentTemplate()}
                        className="w-full h-[600px] border-0 rounded-lg"
                        title="Email Template Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      This is a live preview of your email template with {selectedCompany.name}'s branding
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomHtmlTemplate(demoHtmlTemplate);
                          setIsTemplateModified(false);
                          toast({
                            title: "Template Reset",
                            description: "Template reset to default demo template",
                          });
                        }}
                        disabled={!isTemplateModified}
                      >
                        Reset to Default
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentTemplate = getCurrentTemplate();
                          setCampaignForm(prev => ({...prev, body_template: currentTemplate}));
                          toast({
                            title: "Template Applied",
                            description: "Current template applied to campaign form",
                          });
                        }}
                      >
                        Apply to Campaign
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={isTemplateModified ? customHtmlTemplate : demoHtmlTemplate}
                      onChange={(e) => {
                        setCustomHtmlTemplate(e.target.value);
                        setIsTemplateModified(true);
                      }}
                      className="font-mono text-xs min-h-[600px] max-h-[600px] overflow-y-auto bg-gray-900 text-gray-100 border-gray-700"
                      placeholder="Enter your HTML email template..."
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 hover:bg-white text-black"
                        onClick={() => {
                          navigator.clipboard.writeText(getCurrentTemplate());
                          toast({
                            title: "Copied!",
                            description: "HTML code copied to clipboard",
                          });
                        }}
                      >
                        Copy HTML
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 hover:bg-white text-black"
                        onClick={() => {
                          setCustomHtmlTemplate(demoHtmlTemplate);
                          setIsTemplateModified(false);
                          toast({
                            title: "Template Reset",
                            description: "Template reset to default",
                          });
                        }}
                        disabled={!isTemplateModified}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {isTemplateModified 
                        ? `Custom HTML template for ${selectedCompany.name}. Variables like {{first_name}} and {{year}} will be replaced during sending.`
                        : `Default HTML template for ${selectedCompany.name}. Variables like {{first_name}} and {{year}} will be replaced during sending.`
                      }
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const currentTemplate = getCurrentTemplate();
                          setCampaignForm(prev => ({...prev, body_template: currentTemplate}));
                          toast({
                            title: "Template Applied",
                            description: "Current template applied to campaign form",
                          });
                        }}
                      >
                        Apply to Campaign
                      </Button>
                      {isTemplateModified && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            // Save the template (you can add API call here to save to backend)
                            toast({
                              title: "Template Saved",
                              description: "Custom template saved successfully",
                            });
                          }}
                        >
                          Save Template
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        )
      ) : (
        // Companies List View
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Campaigns</h1>
              <p className="text-muted-foreground">
                Email and LinkedIn campaign management - Account ID: 
                <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">{accountId}</code>
              </p>
            </div>
            <Button onClick={fetchCompanies} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Refresh Companies"
              )}
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
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-primary/50"
              onClick={() => handleCompanyClick(company)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
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
                  {/* Company Status and Banner Count */}
                  <div className="flex items-center justify-between">
                    <Badge variant={company.is_active ? "default" : "secondary"}>
                      {company.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {company.banners.length} Banner{company.banners.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Campaign Actions Preview */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>Email Campaigns</span>
                    <Send className="h-3 w-3 ml-2" />
                    <span>LinkedIn Outreach</span>
                  </div>
                  
                  {/* Company Notes */}
                  {company.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {company.notes}
                    </p>
                  )}

                  {/* Active Banners Preview */}
                  {company.banners.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Active Banners:</p>
                      <div className="flex flex-wrap gap-1">
                        {company.banners.slice(0, 3).map((banner) => (
                          <Badge 
                            key={banner.id} 
                            variant={banner.is_active ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {banner.name}
                          </Badge>
                        ))}
                        {company.banners.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{company.banners.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Company Creation Date */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
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
            <Button 
              onClick={() => navigate('/companies')} 
              className="mt-4"
              variant="outline"
            >
              Go to Companies
            </Button>
          </CardContent>
        </Card>
      )}

          {/* API Debug Information */}
          <Card>
            <CardHeader>
              <CardTitle>API Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">Account ID:</span> 
                  <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">{accountId}</code>
                </div>
                <div>
                  <span className="font-medium">Companies Endpoint:</span> 
                  <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">
                    GET {API_CONFIG.BASE_URL}/accounts/{accountId}/companies-with-banners
                  </code>
                </div>
                <div>
                  <span className="font-medium">Total Companies:</span> 
                  <span className="ml-1">{companies.length}</span>
                </div>
                <div>
                  <span className="font-medium">Total Banners:</span> 
                  <span className="ml-1">{companies.reduce((total, company) => total + company.banners.length, 0)}</span>
                </div>
                <div>
                  <span className="font-medium">cURL Command:</span>
                  <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X GET "${API_CONFIG.BASE_URL}/accounts/${accountId}/companies-with-banners" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
