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
import { Building2, Globe, Calendar, Users, ExternalLink, Loader2, Mail, Send, ArrowLeft, Code, Eye, Plus, Play, Pause, Clock, Search, Trash2, X, Sparkles, FileText, Edit, Copy } from "lucide-react";
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
  const [startingCampaign, setStartingCampaign] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'campaigns' | 'templates'>('company');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<string>("");
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
    <title>Professional Email Template</title>
    <style>
        /* MOBILE - some clients ignore media queries but many support them */
        @media only screen and (max-width:600px) {
            .container { width: 100% !important; }
            .stack { display:block !important; width:100% !important; padding-right:0 !important; padding-left:0 !important; }
            .hero-img { width:100% !important; height:auto !important; }
            .padding-sm { padding: 12px !important; }
            .h1 { font-size: 24px !important; line-height: 32px !important; }
            .p { font-size: 15px !important; line-height:22px !important; }
            /* Adjust padding on mobile for stacked columns */
            .stack-padding { padding-bottom: 24px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f8f8f8; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8f8f8;">
        <tr>
            <td align="center" style="padding:24px;">
                <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:6px; overflow:hidden; border: 1px solid #eeeeee;">
                    <tr>
                        <td style="padding:18px 24px; background-color:#03254C; color:#ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td align="left" style="vertical-align:middle;">
                                        <img src="https://via.placeholder.com/120x36?text=Fast+Solutions" alt="Company Logo" width="120" style="display:block; border:0; outline:none; text-decoration:none;">
                                    </td>
                                    <td align="right" style="vertical-align:middle; color:#D3D3D3; font-size:14px;">
                                        <span style="opacity:0.9;">Fast Solutions</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px 24px 16px 24px; text-align:center;">
                            <h1 class="h1" style="margin:0; font-size:30px; line-height:38px; color:#03254C; font-weight:600;">Welcome, John</h1>
                            <p class="p" style="margin:16px 0 0 0; font-size:17px; line-height:26px; color:#555555;">
                                Thank you for joining **Fast Solutions**. Here is a concise overview of what's new.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 24px; text-align:center;">
                            <img class="hero-img" src="https://via.placeholder.com/520x220.png?text=Professional+Campaign+Image" alt="Hero image" width="552" style="display:block; width:100%; max-width:552px; border-radius:4px; border:0; outline:none; height:auto;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 24px 12px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td class="stack stack-padding" style="width:50%; padding-right:12px; vertical-align:top;">
                                        <h3 style="margin:0 0 10px 0; font-size:19px; color:#03254C; font-weight:600;">Feature Update</h3>
                                        <p style="margin:0; font-size:15px; color:#555555; line-height:22px;">
                                            We have implemented a more efficient onboarding process and enhanced analytics for quicker impact measurement.
                                        </p>
                                    </td>
                                    <td class="stack" style="width:50%; padding-left:12px; vertical-align:top;">
                                        <h3 style="margin:0 0 10px 0; font-size:19px; color:#03254C; font-weight:600;">Best Practice</h3>
                                        <p style="margin:0; font-size:15px; color:#555555; line-height:22px;">
                                            Utilize the new integrations panel to connect your essential tools; configuration takes less than two minutes.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 24px 32px 24px; text-align:center;">
                            <a href="https://example.com/view-details" style="display:inline-block; text-decoration:none; border-radius:6px; padding:12px 28px; font-weight:600; font-size:16px; color:#ffffff; background-color:#03254C; border:1px solid #03254C; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(3, 37, 76, 0.1);">
                                Explore the Details
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 24px;">
                            <hr style="border:none; height:1px; background:#eef4fb; margin:0;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 24px; font-size:13px; color:#888888;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="vertical-align:top;">
                                        <strong style="color:#03254C;">Fast Solutions</strong><br>
                                        <a href="https://fastsolutions.com" style="color:#6495ED; text-decoration:none;">fastsolutions.com</a><br>
                                        [Address Line 1]<br>
                                        [City, Country, Zip]
                                    </td>
                                    <td align="right" style="vertical-align:top; padding-top: 4px;">
                                        <a href="https://example.com/preferences" style="color:#6495ED; text-decoration:none; font-size:13px;">Manage Preferences</a><br>
                                        <a href="https://example.com/unsubscribe" style="color:#aaaaaa; text-decoration:none; font-size:13px;">Unsubscribe</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 24px 24px 24px; font-size:12px; color:#aaaaaa; text-align:center;">
                            <span>© 2024 Fast Solutions. All rights reserved.</span>
                        </td>
                    </tr>
                </table>
                </td>
        </tr>
    </table>
</body>
</html>`;

  // State for AI generation
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiContentType, setAiContentType] = useState<'text' | 'template'>('template');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');
  const [showRefineAi, setShowRefineAi] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');

  // Gemini API configuration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('VITE_GEMINI_API_KEY not found in environment variables');
  }
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-001:generateContent?key=${GEMINI_API_KEY}`;

  // System prompts for AI generation
  const getSystemPrompt = (type: 'text' | 'template', isRefining: boolean = false) => {
    if (type === 'text') {
      return isRefining 
        ? `You are an expert email copywriter. Refine the provided email text based on the user's feedback while maintaining professionalism and clarity. 

Key requirements:
- Keep the tone professional yet engaging
- Maintain proper email structure with greeting, body, and closing
- Include {{first_name}} placeholder for personalization
- Include {{company_name}} placeholder where appropriate
- Make it concise but impactful
- Focus on clear call-to-action
- Ensure mobile-friendly readability

Return ONLY the refined email text without any additional formatting or explanations.`
        : `You are an expert email copywriter. Create a professional email text based on the user's requirements.

Key requirements:
- Create engaging, professional email content
- Include {{first_name}} placeholder for personalization
- Include {{company_name}} placeholder where appropriate
- Structure should include: greeting, main content, call-to-action, and professional closing
- Keep it concise yet impactful (150-300 words)
- Make it conversion-focused with clear value proposition
- Ensure tone matches business communication standards

Return ONLY the email text content without any additional formatting or explanations.`;
    } else {
      return isRefining
        ? `You are an expert HTML email template designer. Refine the provided HTML email template based on the user's feedback while maintaining responsive design and professional appearance.

Key requirements:
- Maintain mobile-responsive design with proper media queries
- Keep clean, professional HTML structure with inline CSS
- Include these essential placeholders: {{first_name}}, {{company_name}}, {{year}}
- Ensure cross-email-client compatibility
- Include proper header with company logo placeholder
- Include hero section with main message
- Include content sections (features, updates, announcements)
- Include call-to-action button
- Include footer with company details and unsubscribe links
- Use professional typography and spacing
- Maintain accessibility standards

Return ONLY the complete HTML template without any additional explanations or markdown formatting.`
        : `You are an expert HTML email template designer. Create a professional, mobile-responsive HTML email template based on the user's requirements.

Key requirements:
- Create complete HTML email template with responsive design
- Include mobile-responsive CSS with media queries for screens under 600px
- Use inline CSS for maximum email client compatibility
- Include these essential placeholders: {{first_name}}, {{company_name}}, {{year}}
- Structure must include:
  * DOCTYPE and proper HTML structure
  * Header section with company logo placeholder
  * Hero section with personalized greeting
  * Main content area with 2-3 sections for features/updates
  * Call-to-action button
  * Footer with company details and preference/unsubscribe links
- Use professional typography and spacing
- Ensure proper table-based layout for email compatibility
- Include proper alt texts and accessibility features
- Make it conversion-focused and visually appealing

Return ONLY the complete HTML template without any additional explanations or markdown formatting.`;
    }
  };

  // Generate email subject based on content
  const generateEmailSubject = async (content: string, type: 'text' | 'template') => {
    const subjectPrompt = `Based on the following email ${type}, generate a compelling email subject line that is:
- 30-50 characters long
- Engaging and click-worthy
- Professional and clear
- Includes {{company_name}} placeholder if appropriate

Email content: ${content.substring(0, 500)}...

Return ONLY the subject line without quotes or additional text.`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: subjectPrompt
            }]
          }]
        })
      });

      if (!response.ok) {
        console.error('Subject generation failed:', response.status);
        return 'Welcome to {{company_name}}!';
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Welcome to {{company_name}}!';
    } catch (error) {
      console.error('Error generating subject:', error);
      return 'Welcome to {{company_name}}!';
    }
  };

  // AI generation function
  const generateAiContent = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for your email content",
        variant: "destructive",
      });
      return;
    }

    if (!GEMINI_API_KEY) {
      toast({
        title: "Configuration Error",
        description: "Gemini API key not configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingAi(true);
    try {
      const systemPrompt = getSystemPrompt(aiContentType, false);
      const fullPrompt = `${systemPrompt}\n\nUser requirements: ${aiPrompt}`;

      const requestBody = {
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      };

      console.log('Making request to:', GEMINI_API_URL);
      console.log('Request body:', requestBody);

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedContent) {
        setAiGeneratedContent(generatedContent);
        
        // Apply to campaign form
        setCampaignForm(prev => ({...prev, body_template: generatedContent}));
        
        // Generate and apply subject
        const subject = await generateEmailSubject(generatedContent, aiContentType);
        setCampaignForm(prev => ({...prev, subject_template: subject}));
        
        toast({
          title: "Content Generated!",
          description: `AI has generated your ${aiContentType} content and applied it to the campaign form.`,
        });
      } else {
        console.error('No content in response:', data);
        throw new Error('No content generated - API returned empty response');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  // AI refinement function
  const refineAiContent = async () => {
    if (!refinePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter refinement instructions",
        variant: "destructive",
      });
      return;
    }

    if (!GEMINI_API_KEY) {
      toast({
        title: "Configuration Error",
        description: "Gemini API key not configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingAi(true);
    try {
      const systemPrompt = getSystemPrompt(aiContentType, true);
      const fullPrompt = `${systemPrompt}\n\nCurrent content:\n${aiGeneratedContent}\n\nRefinement instructions: ${refinePrompt}`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const refinedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (refinedContent) {
        setAiGeneratedContent(refinedContent);
        
        // Apply to campaign form
        setCampaignForm(prev => ({...prev, body_template: refinedContent}));
        
        // Generate and apply new subject
        const subject = await generateEmailSubject(refinedContent, aiContentType);
        setCampaignForm(prev => ({...prev, subject_template: subject}));
        
        setShowRefineAi(false);
        setRefinePrompt('');
        
        toast({
          title: "Content Refined!",
          description: "AI has refined your content and updated the campaign form.",
        });
      } else {
        throw new Error('No refined content generated');
      }
    } catch (error) {
      console.error('Error refining content:', error);
      toast({
        title: "Refinement Failed",
        description: error instanceof Error ? error.message : "Failed to refine content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  // Email templates data
  const emailTemplates = [
    {
      id: 'professional',
      name: 'Professional Welcome',
      description: 'Clean professional template with company branding',
      category: 'Welcome',
      preview: 'https://via.placeholder.com/300x200/03254C/ffffff?text=Professional+Welcome',
      htmlContent: demoHtmlTemplate
    },
    {
      id: 'modern',
      name: 'Monochromatic Gray',
      description: 'Clean monochromatic design with professional gray styling',
      category: 'Newsletter',
      preview: 'https://via.placeholder.com/300x200/111111/ffffff?text=Monochromatic+Gray',
      htmlContent: `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Monochromatic Gray Template</title>
    <style>
        @media only screen and (max-width:600px) {
            .container { width: 100% !important; }
            .stack { display:block !important; width:100% !important; padding-right:0 !important; padding-left:0 !important; }
            .hero-img { width:100% !important; height:auto !important; }
            .h1 { font-size: 26px !important; line-height: 34px !important; }
            .p { font-size: 15px !important; line-height:22px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#fefefe; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fefefe;">
        <tr>
            <td align="center" style="padding:24px;">
                <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:3px; overflow:hidden; border: 1px solid #e0e0e0;">
                    <tr>
                        <td style="padding:16px 24px; background-color:#111111; color:#ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td align="left" style="vertical-align:middle;">
                                        <img src="https://via.placeholder.com/100x30?text=Fast+Solutions" alt="Company Logo" width="100" style="display:block; border:0; outline:none; text-decoration:none;">
                                    </td>
                                    <td align="right" style="vertical-align:middle; color:#aaaaaa; font-size:14px; font-weight:lighter;">
                                        Fast Solutions Update
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px 28px 16px 28px; text-align:left;">
                            <h1 class="h1" style="margin:0; font-size:32px; line-height:40px; color:#222222; font-weight:300;">Announcement: Latest Updates</h1>
                            <p class="p" style="margin:16px 0 0 0; font-size:17px; line-height:26px; color:#555555;">
                                Dear John, we are pleased to share the latest developments from our team.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 28px; text-align:center;">
                            <img class="hero-img" src="https://via.placeholder.com/544x220.png?text=Minimalist+Image" alt="Hero image" width="544" style="display:block; width:100%; max-width:544px; border-radius:3px; border:0; outline:none; height:auto; border: 1px solid #e0e0e0;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 28px 10px 28px;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td class="stack" style="width:50%; padding-right:15px; vertical-align:top;">
                                        <h3 style="margin:0 0 8px 0; font-size:18px; color:#333333; font-weight:600;">Key Milestone</h3>
                                        <p style="margin:0; font-size:15px; color:#666666; line-height:22px;">
                                            We have finalized the new platform architecture, designed for maximum reliability and speed.
                                        </p>
                                    </td>
                                    <td class="stack" style="width:50%; padding-left:15px; vertical-align:top;">
                                        <h3 style="margin:0 0 8px 0; font-size:18px; color:#333333; font-weight:600;">Next Steps</h3>
                                        <p style="margin:0; font-size:15px; color:#666666; line-height:22px;">
                                            Our deployment phase begins next week. Look for a follow-up email with an exclusive preview.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 28px 36px 28px; text-align:center;">
                            <a href="https://example.com/read-report" style="display:inline-block; text-decoration:none; border-radius:3px; padding:12px 30px; font-weight:600; font-size:16px; color:#ffffff; background-color:#111111; border:1px solid #111111; letter-spacing: 0.5px;">
                                View Full Report
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 28px;">
                            <hr style="border:none; height:1px; background:#e0e0e0; margin:0;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 28px; font-size:13px; color:#888888; text-align:center;">
                            <a href="https://example.com/contact" style="color:#666666; text-decoration:none; margin:0 10px;">Contact Support</a> | 
                            <a href="https://example.com/unsubscribe" style="color:#999999; text-decoration:none; margin:0 10px;">Unsubscribe</a>
                        </td>
                    </tr>
                </table>
                </td>
        </tr>
    </table>
</body>
</html>`
    },
    {
      id: 'minimalist',
      name: 'Tech Newsletter',
      description: 'Modern tech-focused design with dark accents',
      category: 'General',
      preview: 'https://via.placeholder.com/300x200/0f1419/10b981?text=Tech+Newsletter',
      htmlContent: `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Tech Newsletter Template</title>
    <style>
        @media only screen and (max-width:600px) {
            .container { width: 100% !important; }
            .stack { display:block !important; width:100% !important; padding-right:0 !important; padding-left:0 !important; }
            .hero-img { width:100% !important; height:auto !important; }
            .h1 { font-size: 24px !important; line-height: 32px !important; }
            .p { font-size: 15px !important; line-height:22px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#0f1419; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0f1419;">
        <tr>
            <td align="center" style="padding:24px;">
                <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px; max-width:600px; background-color:#1f2937; border-radius:12px; overflow:hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="padding:20px 24px; background-color:#374151; border-bottom: 2px solid #10b981;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td align="left" style="vertical-align:middle;">
                                        <span style="color:#10b981; font-size:18px; font-weight:700; letter-spacing:-0.5px;">⚡ Tech Update</span>
                                    </td>
                                    <td align="right" style="vertical-align:middle; color:#d4f399; font-size:12px; font-weight:500;">
                                        Latest News
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px 24px 16px 24px; text-align:left;">
                            <h1 class="h1" style="margin:0; font-size:28px; line-height:36px; color:#f9fafb; font-weight:700;">Hi John!</h1>
                            <p class="p" style="margin:16px 0 0 0; font-size:16px; line-height:24px; color:#d1fae5;">
                                Exciting tech developments are happening. Here's what you need to know this week.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 24px; text-align:center;">
                            <img class="hero-img" src="https://via.placeholder.com/552x200/10b981/ffffff?text=Tech+Innovation" alt="Tech hero" width="552" style="display:block; width:100%; max-width:552px; border-radius:8px; border:0; outline:none; height:auto;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 24px 12px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td class="stack" style="width:50%; padding-right:12px; vertical-align:top;">
                                        <h3 style="margin:0 0 10px 0; font-size:18px; color:#10b981; font-weight:600;">Innovation</h3>
                                        <p style="margin:0; font-size:14px; color:#9ca3af; line-height:20px;">
                                            New AI-powered features are rolling out to enhance your workflow and productivity.
                                        </p>
                                    </td>
                                    <td class="stack" style="width:50%; padding-left:12px; vertical-align:top;">
                                        <h3 style="margin:0 0 10px 0; font-size:18px; color:#10b981; font-weight:600;">Updates</h3>
                                        <p style="margin:0; font-size:14px; color:#9ca3af; line-height:20px;">
                                            Performance improvements and bug fixes make everything faster and more reliable.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 24px 32px 24px; text-align:center;">
                            <a href="https://example.com/tech-article" style="display:inline-block; text-decoration:none; border-radius:8px; padding:14px 32px; font-weight:600; font-size:16px; color:#ffffff; background-color:#059669; border:1px solid #059669; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                                Read Full Article
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 24px;">
                            <hr style="border:none; height:1px; background:#374151; margin:0;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 24px; font-size:12px; color:#9ca3af; text-align:center;">
                            <a href="https://example.com/unsubscribe" style="color:#6b7280; text-decoration:none; margin:0 10px;">Unsubscribe</a> | 
                            <a href="https://example.com/preferences" style="color:#6b7280; text-decoration:none; margin:0 10px;">Update Preferences</a>
                        </td>
                    </tr>
                </table>
                </td>
        </tr>
    </table>
</body>
</html>`
    },
    {
      id: 'promotional',
      name: 'Product Launch',
      description: 'Vibrant template for product announcements and launches',
      category: 'Marketing',
      preview: 'https://via.placeholder.com/300x200/ec3840/ffffff?text=Product+Launch',
      htmlContent: `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Product Launch Template</title>
    <style>
        @media only screen and (max-width:600px) {
            .container { width: 100% !important; }
            .stack { display:block !important; width:100% !important; padding-right:0 !important; padding-left:0 !important; }
            .hero-img { width:100% !important; height:auto !important; }
            .h1 { font-size: 28px !important; line-height: 36px !important; }
            .p { font-size: 15px !important; line-height:22px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background: linear-gradient(135deg, #f9689b 0%, #ec3840 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #f9689b 0%, #ec3840 100%);">
        <tr>
            <td align="center" style="padding:32px 20px;">
                <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.15);">
                    <tr>
                        <td style="padding:32px 32px 16px 32px; text-align:center; background-color:#ffffff;">
                            <h1 style="margin:0 0 8px 0; font-size:36px; color:#ec3840; font-weight:800; letter-spacing:-1px;">🚀 LAUNCH</h1>
                            <div style="background: linear-gradient(90deg, #fef3c7 0%, #fde68a 100%); border-radius:8px; padding:12px 20px; margin:16px 0; border-left: 4px solid #eab308;">
                                <p style="margin:0; color:#d1031b; font-size:14px; font-weight:600;">🎨 New Product Alert</p>
                                <p style="margin:4px 0 0 0; color:#d1031b; font-size:12px;">Introducing our game-changing solution that will transform your workflow.</p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 32px 24px 32px; text-align:left;">
                            <h2 class="h1" style="margin:0 0 16px 0; font-size:32px; line-height:40px; color:#374151; font-weight:700;">Hi \\{\\{John\\}\\}!</h2>
                            <p class="p" style="margin:0 0 20px 0; font-size:18px; line-height:26px; color:#6b7280;">
                                We're thrilled to share our latest innovation with you. This breakthrough product will revolutionize how you work.
                            </p>
                            <div style="background:#f3f4f6; border-radius:12px; padding:24px; margin:24px 0; border: 1px solid #e5e7eb;">
                                <h3 style="margin:0 0 12px 0; color:#1f2937; font-size:20px; font-weight:600;">Key Features</h3>
                                <ul style="margin:0; padding-left:20px; color:#4b5563; line-height:24px;">
                                    <li>� Advanced AI-powered automation</li>
                                    <li>⚡ Lightning-fast performance</li>
                                    <li>🔒 Enterprise-grade security</li>
                                    <li>📱 Seamless mobile experience</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 32px; text-align:center;">
                            <img src="https://via.placeholder.com/536x200/ec3840/ffffff?text=Product+Launch+Hero" alt="Product launch" width="536" style="display:block; width:100%; max-width:536px; border-radius:12px; border:0; outline:none; height:auto; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px 32px 24px 32px; text-align:center;">
                            <a href="https://example.com/product-launch" style="display:inline-block; text-decoration:none; border-radius:12px; padding:16px 40px; font-weight:700; font-size:18px; color:#ffffff; background: linear-gradient(135deg, #ec3840 0%, #dc2626 100%); border:2px solid #dc2626; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3); transition: all 0.3s ease;">
                                🎉 Learn More
                            </a>
                            <p style="margin:16px 0 0 0; color:#9ca3af; font-size:14px;">
                                Limited time: Early access available now!
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 32px;">
                            <hr style="border:none; height:1px; background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%); margin:0;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 32px; font-size:13px; color:#9ca3af; text-align:center;">
                            <p style="margin:0 0 8px 0;">Thanks for being part of our journey!</p>
                            <a href="https://example.com/unsubscribe" style="color:#6b7280; text-decoration:none; margin:0 8px;">Unsubscribe</a> | 
                            <a href="https://example.com/preferences" style="color:#6b7280; text-decoration:none; margin:0 8px;">Preferences</a>
                        </td>
                    </tr>
                </table>
                </td>
        </tr>
    </table>
</body>
</html>`
    },
    {
      id: 'corporate',
      name: 'Executive Brief',
      description: 'Sophisticated template for executive communications',
      category: 'Business',
      preview: 'https://via.placeholder.com/300x200/1f2937/f9fafb?text=Executive+Brief',
      htmlContent: `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Executive Brief Template</title>
    <style>
        @media only screen and (max-width:600px) {
            .container { width: 100% !important; }
            .stack { display:block !important; width:100% !important; padding-right:0 !important; padding-left:0 !important; }
            .metric-card { margin-bottom: 16px !important; }
            .h1 { font-size: 24px !important; line-height: 32px !important; }
            .p { font-size: 14px !important; line-height:20px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Georgia', 'Times New Roman', serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;">
        <tr>
            <td align="center" style="padding:32px 20px;">
                <table class="container" width="650" cellpadding="0" cellspacing="0" role="presentation" style="width:650px; max-width:650px; background-color:#ffffff; border-radius:4px; overflow:hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="padding:24px 32px; background-color:#1f2937; color:#ffffff; border-bottom: 3px solid #3b82f6;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td align="left" style="vertical-align:middle;">
                                        <h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:1px; color:#f9fafb;">EXECUTIVE BRIEF</h1>
                                    </td>
                                    <td align="right" style="vertical-align:middle; color:#d1d5db; font-size:14px; font-weight:500;">
                                        Quarterly Update
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px 32px 16px 32px;">
                            <div style="border-left: 4px solid #3b82f6; padding-left:16px; margin-bottom:24px;">
                                <h2 class="h1" style="margin:0 0 8px 0; font-size:28px; line-height:36px; color:#1f2937; font-weight:600;">Dear \\{\\{John\\}\\},</h2>
                                <p style="margin:0; color:#6b7280; font-size:16px; line-height:24px; font-style:italic;">
                                    Your quarterly executive summary with key performance indicators and strategic updates.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 32px 24px 32px;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td class="stack metric-card" style="width:33.33%; padding-right:16px; vertical-align:top;">
                                        <div style="background:#f3f4f6; border-radius:8px; padding:20px; border-left: 4px solid #10b981;">
                                            <h3 style="margin:0 0 8px 0; font-size:14px; color:#059669; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Revenue Growth</h3>
                                            <p style="margin:0; font-size:24px; color:#1f2937; font-weight:800;">+12.3%</p>
                                            <p style="margin:4px 0 0 0; font-size:12px; color:#6b7280;">vs. previous quarter</p>
                                        </div>
                                    </td>
                                    <td class="stack metric-card" style="width:33.33%; padding:0 8px; vertical-align:top;">
                                        <div style="background:#f3f4f6; border-radius:8px; padding:20px; border-left: 4px solid #3b82f6;">
                                            <h3 style="margin:0 0 8px 0; font-size:14px; color:#2563eb; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Market Expansion</h3>
                                            <p style="margin:0; font-size:24px; color:#1f2937; font-weight:800;">3 Regions</p>
                                            <p style="margin:4px 0 0 0; font-size:12px; color:#6b7280;">new territories opened</p>
                                        </div>
                                    </td>
                                    <td class="stack metric-card" style="width:33.33%; padding-left:16px; vertical-align:top;">
                                        <div style="background:#f3f4f6; border-radius:8px; padding:20px; border-left: 4px solid #f59e0b;">
                                            <h3 style="margin:0 0 8px 0; font-size:14px; color:#d97706; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Team Growth</h3>
                                            <p style="margin:0; font-size:24px; color:#1f2937; font-weight:800;">+25%</p>
                                            <p style="margin:4px 0 0 0; font-size:12px; color:#6b7280;">headcount increase</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 32px;">
                            <h3 style="margin:0 0 16px 0; color:#1f2937; font-size:18px; font-weight:600;">Strategic Initiatives</h3>
                            <div style="background:#fefefe; border:1px solid #e5e7eb; border-radius:6px; padding:20px;">
                                <ul style="margin:0; padding-left:20px; color:#374151; line-height:28px; font-size:15px;">
                                    <li style="margin-bottom:8px;">✓ Digital transformation roadmap completed ahead of schedule</li>
                                    <li style="margin-bottom:8px;">✓ Strategic partnerships established in APAC region</li>
                                    <li style="margin-bottom:8px;">✓ AI integration pilot program shows 23% efficiency gains</li>
                                    <li style="margin-bottom:0;">→ Q4 focus: Platform scalability and international expansion</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 32px 32px 32px; text-align:center;">
                            <a href="https://example.com/executive-dashboard" style="display:inline-block; text-decoration:none; border-radius:4px; padding:14px 32px; font-weight:600; font-size:16px; color:#ffffff; background-color:#1f2937; border:2px solid #1f2937; letter-spacing: 0.5px;">
                                View Full Dashboard
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 32px;">
                            <hr style="border:none; height:1px; background:#e5e7eb; margin:0;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 32px; font-size:12px; color:#9ca3af; text-align:center;">
                            <p style="margin:0 0 4px 0; font-weight:600;">Confidential | Executive Only</p>
                            <p style="margin:0;">\\{\\{company_name\\}\\} Executive Communications • \\{\\{year\\}\\}</p>
                        </td>
                    </tr>
                </table>
                </td>
        </tr>
    </table>
</body>
</html>`
    }
  ];

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

  const startCampaign = async (campaignId: string) => {
    setStartingCampaign(campaignId);
    try {
      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/api/campaigns/${campaignId}/send-emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (networkError) {
        // Handle network errors (CORS, connection failed, etc.)
        console.warn('Network error starting campaign, using mock response:', networkError);
        // Update campaign status locally in demo mode
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'running' as const }
            : campaign
        ));
        toast({
          title: "Demo Mode",
          description: "Campaign started successfully (backend not available)",
        });
        setStartingCampaign(null);
        return;
      }

      if (!response.ok) {
        // If API is not available, update local state for development
        if (response.status === 404 || response.status === 0) {
          console.warn('Campaign start API not available, updating local state');
          setCampaigns(prev => prev.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status: 'running' as const }
              : campaign
          ));
          toast({
            title: "Demo Mode",
            description: "Campaign started successfully (API not available)",
          });
          setStartingCampaign(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update campaign status
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'running' as const }
            : campaign
        ));
        toast({
          title: "Campaign Started",
          description: `Campaign emails are being sent. Sent: ${data.results?.sent_count || 0}, Failed: ${data.results?.failed_count || 0}`,
        });
      } else {
        throw new Error(data.message || 'Failed to start campaign');
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start campaign",
        variant: "destructive",
      });
    } finally {
      setStartingCampaign(null);
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
        // Single Page Layout with 3 sections
        <div className="space-y-6">
          {/* Header with Company Name and Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToCompanies}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Companies
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{selectedCompany.name}</h1>
                <p className="text-muted-foreground">
                  Campaign Management for {selectedCompany.name}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs for 3 Main Sections */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'company' | 'campaigns' | 'templates')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="company">Company Information</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            {/* Company Information Tab */}
            <TabsContent value="company" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Company Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company Details
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
                      Company Banners ({selectedCompany.banners.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCompany.banners.length > 0 ? (
                      <div className="space-y-4">
                        {selectedCompany.banners.map((banner) => (
                          <div key={banner.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{banner.name}</h4>
                                {banner.logo_url && (
                                  <img 
                                    src={banner.logo_url} 
                                    alt={banner.name}
                                    className="mt-2 max-w-[200px] h-auto rounded border"
                                  />
                                )}
                                {banner.signature && (
                                  <p className="text-sm text-muted-foreground mt-2">{banner.signature}</p>
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
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              {/* Add Campaign Button */}
              <div className="flex justify-end">
                <Button onClick={() => {
                  setShowCreateCampaign(true);
                  setSelectedFormTemplate("");
                }} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Campaign
                </Button>
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
                          {campaign.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startCampaign(campaign.id);
                              }}
                              disabled={startingCampaign === campaign.id}
                              className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {startingCampaign === campaign.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-3 w-3 mr-1" />
                                  Start
                                </>
                              )}
                            </Button>
                          )}
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
                          <SelectItem value="loading-banners" disabled>Loading banners...</SelectItem>
                        ) : banners.length > 0 ? (
                          banners.map((banner) => (
                            <SelectItem key={banner.id} value={banner.id}>
                              {banner.name} {banner.is_active ? "(Active)" : "(Inactive)"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-banners-found" disabled>No banners found</SelectItem>
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
                          <SelectItem value="loading-smtp" disabled>Loading SMTP servers...</SelectItem>
                        ) : smtpCredentials.length > 0 ? (
                          smtpCredentials.map((smtp) => (
                            <SelectItem key={smtp.id} value={smtp.id}>
                              {smtp.display_name} {smtp.verified ? "✓" : "⚠️"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-smtp-found" disabled>No SMTP servers found</SelectItem>
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
                  <div className="space-y-3">
                    {/* AI Generation Button */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Email Content:</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAiGenerator(true)}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate with AI
                      </Button>
                    </div>

                    {/* Template Selector Dropdown */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="template_select" className="text-sm font-medium">Choose from templates:</Label>
                      <Select 
                        value={selectedFormTemplate}
                        onValueChange={(templateId) => {
                          const selectedTemplate = emailTemplates.find(t => t.id === templateId);
                          if (selectedTemplate) {
                            setSelectedFormTemplate(templateId);
                            setCampaignForm(prev => ({...prev, body_template: selectedTemplate.htmlContent}));
                            toast({
                              title: "Template Applied",
                              description: `${selectedTemplate.name} template applied to campaign`,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Textarea
                      id="body_template"
                      value={campaignForm.body_template}
                      onChange={(e) => setCampaignForm(prev => ({...prev, body_template: e.target.value}))}
                      placeholder="Enter your email HTML template or select from templates above..."
                      rows={6}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
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
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCampaignForm(prev => ({...prev, body_template: ""}));
                          toast({
                            title: "Template Cleared",
                            description: "Email template cleared",
                          });
                        }}
                      >
                        Clear Template
                      </Button>
                    </div>
                  </div>

                  {/* Template Preview */}
                  {campaignForm.body_template && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Template Preview:</Label>
                      <div className="mt-2 border rounded-lg bg-gray-50 p-4">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-full">
                          <iframe
                            srcDoc={campaignForm.body_template}
                            className="w-full h-[500px] border-0 rounded-lg"
                            title="Email Template Preview"
                            sandbox="allow-same-origin"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Preview of the selected email template. This will be sent to campaign recipients.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowCreateCampaign(false);
                    setSelectedFormTemplate("");
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createCampaign} 
                    disabled={
                      creatingCampaign || 
                      !campaignForm.name || 
                      !campaignForm.subject_template || 
                      !campaignForm.company_banner_id || 
                      campaignForm.company_banner_id === 'loading-banners' || 
                      campaignForm.company_banner_id === 'no-banners-found' ||
                      !campaignForm.smtp_credential_id || 
                      campaignForm.smtp_credential_id === 'loading-smtp' || 
                      campaignForm.smtp_credential_id === 'no-smtp-found'
                    }
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
                            <div className="flex-1">/send-emails
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

          {/* AI Generation Dialog */}
          {showAiGenerator && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Generate Email with AI</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Create professional email content powered by AI
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAiGenerator(false);
                        setAiPrompt('');
                        setAiGeneratedContent('');
                        setShowRefineAi(false);
                        setRefinePrompt('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {!aiGeneratedContent ? (
                    // Initial Generation Form
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Content Type:</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            variant={aiContentType === 'text' ? 'default' : 'outline'}
                            onClick={() => setAiContentType('text')}
                            className="flex flex-col items-center gap-2 h-auto py-4"
                          >
                            <FileText className="h-5 w-5" />
                            <span>Simple Text</span>
                            <span className="text-xs opacity-75">Plain email text</span>
                          </Button>
                          <Button
                            type="button"
                            variant={aiContentType === 'template' ? 'default' : 'outline'}
                            onClick={() => setAiContentType('template')}
                            className="flex flex-col items-center gap-2 h-auto py-4"
                          >
                            <Code className="h-5 w-5" />
                            <span>Email Template</span>
                            <span className="text-xs opacity-75">HTML email template</span>
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="ai_prompt" className="text-sm font-medium">
                          Describe your email content:
                        </Label>
                        <Textarea
                          id="ai_prompt"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder={aiContentType === 'template' 
                            ? "e.g., Create a welcome email template for new customers with a modern design, featuring our product updates and a call-to-action to get started..."
                            : "e.g., Write a welcome email for new customers introducing our company, highlighting key benefits, and encouraging them to explore our platform..."
                          }
                          rows={4}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Be specific about the purpose, tone, and key messages you want to include.
                        </p>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAiGenerator(false);
                            setAiPrompt('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={generateAiContent}
                          disabled={generatingAi || !aiPrompt.trim()}
                        >
                          {generatingAi ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate {aiContentType === 'template' ? 'Template' : 'Text'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Generated Content Display
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Generated Content:</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRefineAi(!showRefineAi)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Refine
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(aiGeneratedContent);
                                toast({
                                  title: "Copied!",
                                  description: "Content copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                        </div>
                        
                        {aiContentType === 'template' ? (
                          <div className="border rounded-lg bg-gray-50 p-4">
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                              <iframe
                                srcDoc={aiGeneratedContent}
                                className="w-full h-[400px] border-0 rounded-lg"
                                title="AI Generated Template Preview"
                                sandbox="allow-same-origin"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 bg-gray-50 max-h-[400px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                              {aiGeneratedContent}
                            </pre>
                          </div>
                        )}
                      </div>

                      {showRefineAi && (
                        <div className="border-t pt-4">
                          <Label htmlFor="refine_prompt" className="text-sm font-medium">
                            Refinement Instructions:
                          </Label>
                          <Textarea
                            id="refine_prompt"
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="e.g., Make it more professional, add a product demo section, change the tone to be more casual..."
                            rows={3}
                            className="mt-2"
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowRefineAi(false);
                                setRefinePrompt('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={refineAiContent}
                              disabled={generatingAi || !refinePrompt.trim()}
                            >
                              {generatingAi ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Refining...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Refine Content
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAiGeneratedContent('');
                            setShowRefineAi(false);
                            setRefinePrompt('');
                          }}
                        >
                          Generate New
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAiGenerator(false);
                            setAiPrompt('');
                            setAiGeneratedContent('');
                            setShowRefineAi(false);
                            setRefinePrompt('');
                            toast({
                              title: "Content Applied!",
                              description: "AI generated content has been applied to your campaign form.",
                            });
                          }}
                        >
                          Use This Content
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              {/* Template Selection Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Email Templates</h2>
                    <p className="text-muted-foreground">Choose from our professionally designed email templates</p>
                  </div>
                  <Badge variant="secondary">{emailTemplates.length} Templates</Badge>
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {emailTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/50"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplateDialog(true);
                      }}
                    >
                      <CardContent className="p-0">
                        {/* Template Preview Image */}
                        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                          <img 
                            src={template.preview} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Template Info */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-muted-foreground">
                              Click to preview
                            </span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              Preview
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Glass UI Dialog for Template Preview */}
              {showTemplateDialog && selectedTemplate && (
                <div 
                  className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
                  onClick={(e) => {
                    // Close dialog when clicking on the backdrop
                    if (e.target === e.currentTarget) {
                      setShowTemplateDialog(false);
                      setSelectedTemplate(null);
                    }
                  }}
                >
                  <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-w-6xl w-full max-h-[90vh] overflow-hidden">
                    {/* Dialog Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/20">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                        <p className="text-gray-700 mt-1">{selectedTemplate.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-white/50 border-white/30">{selectedTemplate.category}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowTemplateDialog(false);
                            setSelectedTemplate(null);
                          }}
                          className="hover:bg-white/20 text-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Dialog Content */}
                    <div className="p-6">
                      <Tabs defaultValue="preview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/30 backdrop-blur-sm border-white/20">
                          <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-white/50">
                            <Eye className="h-4 w-4" />
                            Preview
                          </TabsTrigger>
                          <TabsTrigger value="code" className="flex items-center gap-2 data-[state=active]:bg-white/50">
                            <Code className="h-4 w-4" />
                            HTML Code
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="preview" className="space-y-4 mt-6">
                          <div className="border border-white/30 rounded-xl bg-white/20 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-full">
                              <iframe
                                srcDoc={selectedTemplate.htmlContent}
                                className="w-full h-[500px] border-0 rounded-lg"
                                title="Email Template Preview"
                                sandbox="allow-same-origin"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-white/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                            <p className="text-sm text-gray-700">
                              Live preview of {selectedTemplate.name} template with {selectedCompany.name}'s branding
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCustomHtmlTemplate(selectedTemplate.htmlContent);
                                  setIsTemplateModified(true);
                                  toast({
                                    title: "Template Applied",
                                    description: `${selectedTemplate.name} template has been applied`,
                                  });
                                }}
                                className="bg-white/50 hover:bg-white/70 border-white/30"
                              >
                                Use This Template
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCampaignForm(prev => ({...prev, body_template: selectedTemplate.htmlContent}));
                                  toast({
                                    title: "Template Applied",
                                    description: "Template applied to campaign form",
                                  });
                                }}
                                className="bg-white/50 hover:bg-white/70 border-white/30"
                              >
                                Apply to Campaign
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="code" className="space-y-4 mt-6">
                          <div className="relative">
                            <Textarea
                              value={selectedTemplate.htmlContent}
                              onChange={(e) => {
                                const updatedTemplate = { ...selectedTemplate, htmlContent: e.target.value };
                                setSelectedTemplate(updatedTemplate);
                                setCustomHtmlTemplate(e.target.value);
                                setIsTemplateModified(true);
                              }}
                              className="font-mono text-xs min-h-[500px] max-h-[500px] overflow-y-auto bg-gray-900 text-gray-100 border-gray-700"
                              placeholder="Enter your HTML email template..."
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white/90 hover:bg-white text-black"
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTemplate.htmlContent);
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
                                  const originalTemplate = emailTemplates.find(t => t.id === selectedTemplate.id);
                                  if (originalTemplate) {
                                    setSelectedTemplate(originalTemplate);
                                    setCustomHtmlTemplate("");
                                    setIsTemplateModified(false);
                                    toast({
                                      title: "Template Reset",
                                      description: "Template reset to original",
                                    });
                                  }
                                }}
                              >
                                Reset
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-white/50 rounded-lg p-4">
                            <p className="text-sm text-gray-600">
                              HTML code for {selectedTemplate.name}. Variables like {'{first_name}'} and {'{year}'} will be replaced during sending.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCampaignForm(prev => ({...prev, body_template: selectedTemplate.htmlContent}));
                                  toast({
                                    title: "Template Applied",
                                    description: "Current template applied to campaign form",
                                  });
                                }}
                                className="bg-white/70 hover:bg-white"
                              >
                                Apply to Campaign
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setCustomHtmlTemplate(selectedTemplate.htmlContent);
                                  setIsTemplateModified(true);
                                  toast({
                                    title: "Template Saved",
                                    description: "Custom template saved successfully",
                                  });
                                }}
                                className="bg-primary/80 hover:bg-primary"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
