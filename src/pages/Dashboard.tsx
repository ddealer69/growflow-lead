import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Search, Mail } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    banners: 0,
    leads: 0,
    campaigns: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const [companies, banners] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("company_banners").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        companies: companies.count || 0,
        banners: banners.count || 0,
        leads: 0, // Will be implemented in Phase 2
        campaigns: 0, // Will be implemented in Phase 2
      });
    }

    loadStats();
  }, []);

  const statCards = [
    { title: "Companies", value: stats.companies, icon: Building2, color: "text-primary" },
    { title: "Banners", value: stats.banners, icon: Users, color: "text-accent" },
    { title: "Leads", value: stats.leads, icon: Search, color: "text-success" },
    { title: "Campaigns", value: stats.campaigns, icon: Mail, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to LeadFlow</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Phase 1 Foundation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">✅ Multi-tenant authentication enabled</p>
          <p className="text-sm">✅ Database schema with RLS policies</p>
          <p className="text-sm">✅ Company and banner management</p>
          <p className="text-sm text-muted-foreground">⏳ GetLeads workflow (Phase 2)</p>
          <p className="text-sm text-muted-foreground">⏳ Campaign management (Phase 2)</p>
          <p className="text-sm text-muted-foreground">⏳ Social content generation (Phase 2)</p>
        </CardContent>
      </Card>
    </div>
  );
}
