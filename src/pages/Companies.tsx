import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  created_at: string;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    description: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load companies");
      console.error(error);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const { data: userData } = await supabase.from("users").select("account_id").single();
    
    if (!userData?.account_id) {
      toast.error("Account information not found");
      return;
    }

    const { error } = await supabase.from("companies").insert({
      name: formData.name,
      website: formData.website || null,
      industry: formData.industry || null,
      description: formData.description || null,
      account_id: userData.account_id,
    });

    if (error) {
      toast.error("Failed to create company");
      console.error(error);
    } else {
      toast.success("Company created successfully");
      setOpen(false);
      setFormData({ name: "", website: "", industry: "", description: "" });
      loadCompanies();
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your company profiles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Company</DialogTitle>
                <DialogDescription>Add a new company to your account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Company</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first company
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card 
              key={company.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => navigate(`/companies/${company.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {company.name}
                </CardTitle>
                {company.industry && (
                  <CardDescription>{company.industry}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {company.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {company.description}
                  </p>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit website
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
