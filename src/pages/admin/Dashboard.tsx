import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui-components";
import { Database, FolderTree, Users, GitPullRequest, Activity } from "lucide-react";
import { useGetStats } from "@workspace/api-client-react";

export default function AdminDashboard() {
  const { data: stats } = useGetStats();

  const statCards = [
    { title: "Total Materials", value: stats?.totalMaterials || 0, icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Categories", value: stats?.totalCategories || 0, icon: FolderTree, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Pending Requests", value: stats?.pendingRequests || 0, icon: GitPullRequest, color: "text-rose-500", bg: "bg-rose-500/10" },
    { title: "Active Users", value: stats?.totalUsers || 0, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Dashboard Overview</h1>
        <p className="text-muted-foreground">System-wide metrics and recent archival activities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <Card key={i} className="border-none shadow-md">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg} ${card.color}`}>
                <card.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-bold font-display">{card.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-2 shadow-md border-none">
          <CardHeader className="border-b">
            <CardTitle className="text-xl flex items-center"><Activity className="w-5 h-5 mr-2 text-accent" /> Recent Audit Trail</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {stats?.recentActivity?.slice(0, 8).map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-semibold">{log.userName}</span> {log.action} <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{log.entityType}</span> {log.entityId}</p>
                    {log.details && <p className="text-xs text-muted-foreground mt-1">{log.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">No recent activity recorded.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none bg-gradient-to-br from-primary to-primary/90 text-white">
          <CardHeader>
            <CardTitle className="text-white text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10">
              + Ingest New Material
            </button>
            <button className="w-full text-left p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10">
              + Add Collection Series
            </button>
            <button className="w-full text-left p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10">
              Review Access Requests
            </button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
