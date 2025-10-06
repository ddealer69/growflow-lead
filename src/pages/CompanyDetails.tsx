import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Flag } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
}

interface Banner {
  id: string;
  name: string;
  description: string | null;
  target_audience: string | null;
  value_proposition: string | null;
  created_at: string;
}

export default function CompanyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_audience: "",
    value_proposition: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const [companyRes, bannersRes] = await Promise.all([
      supabase.from("companies").select("*").eq("id", id).single(),
      supabase.from("company_banners").select("*").eq("company_id", id).eq("is_deleted", false).order("created_at", { ascending: false }),
    ]);

    if (companyRes.error) {
      toast.error("Failed to load company");
      navigate("/companies");
      return;
    }

    setCompany(companyRes.data);
    setBanners(bannersRes.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const { data: userData } = await supabase.from("users").select("account_id").single();
    
    if (!userData?.account_id) {
      toast.error("Account information not found");
      return;
    }

    const { error } = await supabase.from("company_banners").insert({
      company_id: id,
      account_id: userData.account_id,
      name: formData.name,
      description: formData.description || null,
      target_audience: formData.target_audience || null,
      value_proposition: formData.value_proposition || null,
    });

    if (error) {
      toast.error("Failed to create banner");
      console.error(error);
    } else {
      toast.success("Banner created successfully");
      setOpen(false);
      setFormData({ name: "", description: "", target_audience: "", value_proposition: "" });
      loadData();
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!company) {
    return <div className="text-muted-foreground">Company not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate("/companies")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.industry && (
              <p className="text-muted-foreground">{company.industry}</p>
            )}
          </div>
        </div>
        {company.description && (
          <p className="mt-4 text-muted-foreground">{company.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Banners</h2>
          <p className="text-muted-foreground">Marketing campaigns and target segments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Banner</DialogTitle>
                <DialogDescription>Add a new marketing banner or campaign</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-name">Banner Name *</Label>
                  <Input
                    id="banner-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-description">Description</Label>
                  <Textarea
                    id="banner-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Textarea
                    id="target-audience"
                    placeholder="Who is this banner targeting?"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value-prop">Value Proposition</Label>
                  <Textarea
                    id="value-prop"
                    placeholder="What value are you offering?"
                    value={formData.value_proposition}
                    onChange={(e) => setFormData({ ...formData, value_proposition: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Banner</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No banners yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first marketing banner
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  {banner.name}
                </CardTitle>
                {banner.description && (
                  <CardDescription>{banner.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {banner.target_audience && (
                  <div>
                    <p className="text-sm font-medium mb-1">Target Audience</p>
                    <p className="text-sm text-muted-foreground">{banner.target_audience}</p>
                  </div>
                )}
                {banner.value_proposition && (
                  <div>
                    <p className="text-sm font-medium mb-1">Value Proposition</p>
                    <p className="text-sm text-muted-foreground">{banner.value_proposition}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
