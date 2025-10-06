import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Search, Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, accountId } = useAuth();
  const [stats, setStats] = useState({
    companies: 0,
    banners: 0,
    leads: 0,
    campaigns: 0,
  });

  useEffect(() => {
    // For now, we'll show placeholder stats
    // In the future, you can fetch real data using the accountId
    setStats({
      companies: 0, // Will be fetched from API using accountId
      banners: 0, // Will be fetched from API using accountId
      leads: 0, // Will be implemented in Phase 2
      campaigns: 0, // Will be implemented in Phase 2
    });
  }, [accountId]);

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
        <p className="text-muted-foreground">Welcome to LeadFlow, {user?.full_name}!</p>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
          <CardDescription>Current session details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Name:</span> {user?.full_name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Email:</span> {user?.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">Role:</span> {user?.role}
              </div>
              <div className="text-sm">
                <span className="font-medium">Status:</span> 
                <span className={`ml-1 ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">User ID:</span> 
                <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">{user?.id}</code>
              </div>
              <div className="text-sm">
                <span className="font-medium">Account ID:</span> 
                <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">{user?.account_id}</code>
              </div>
              <div className="text-sm">
                <span className="font-medium">Last Login:</span> 
                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Full JSON Response */}
          <details className="mt-4">
            <summary className="text-sm font-medium cursor-pointer hover:text-primary">
              View Full Login Response
            </summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
              {JSON.stringify({
                success: true,
                message: "Authentication successful.",
                user: user
              }, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Account ID: {accountId?.slice(0, 8)}...
              </p>
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
          <p className="text-sm">✅ Account ID stored for backend access</p>
          <p className="text-sm">✅ User session management</p>
          <p className="text-sm">✅ Company and banner management</p>
          <p className="text-sm text-muted-foreground">⏳ GetLeads workflow (Phase 2)</p>
          <p className="text-sm text-muted-foreground">⏳ Campaign management (Phase 2)</p>
          <p className="text-sm text-muted-foreground">⏳ Social content generation (Phase 2)</p>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              🔑 Account ID Available
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              The account ID (<code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{accountId}</code>) is now stored and can be used for all backend API calls to access account-specific data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
