import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components";
import { Database, FolderTree, Users, GitPullRequest, Activity, TrendingUp, ShieldCheck } from "lucide-react";
import { useGetStats } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { data: stats } = useGetStats();

  const statCards = [
    { title: "Total Materials", value: stats?.totalMaterials || 0, icon: Database, color: "text-[#0B3D91]", bg: "bg-[#0B3D91]/10" },
    { title: "Categories", value: stats?.totalCategories || 0, icon: FolderTree, color: "text-[#0B3D91]", bg: "bg-[#0B3D91]/10" },
    { title: "Pending Requests", value: stats?.pendingRequests || 0, icon: GitPullRequest, color: "text-[#960000]", bg: "bg-[#960000]/10" },
    { title: "Active Users", value: stats?.totalUsers || 0, icon: Users, color: "text-[#4169E1]", bg: "bg-[#4169E1]/10" },
  ];

  // Mock data for the chart since the backend doesn't provide historical stats yet
  const chartData = [
    { name: 'Jan', ingestions: 12, requests: 4 },
    { name: 'Feb', ingestions: 19, requests: 7 },
    { name: 'Mar', ingestions: 15, requests: 5 },
    { name: 'Apr', ingestions: 22, requests: 12 },
    { name: 'May', ingestions: 28, requests: 18 },
    { name: 'Jun', ingestions: 35, requests: 24 },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#0B3D91]/10 text-[#0B3D91] border border-[#0B3D91]/20 rounded-full px-3 py-1 text-xs font-bold mb-3 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> System Administrator
          </div>
          <h1 className="text-4xl font-display font-bold text-[#0a1628]">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System-wide metrics, archival activities, and user management.</p>
        </div>
        <div className="mt-4 md:mt-0 text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          System Status: <span className="font-semibold text-emerald-600">Online & Secured</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110 ${card.bg}`} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground/30" />
              </div>
              <h3 className="text-4xl font-bold font-display text-[#0a1628] mb-1">{card.value}</h3>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-border/50 bg-white">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0a1628]">
              <Activity className="w-5 h-5 text-[#4169E1]" /> Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngestions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4169E1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4169E1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#960000" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#960000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="ingestions" name="New Materials" stroke="#4169E1" strokeWidth={3} fillOpacity={1} fill="url(#colorIngestions)" />
                  <Area type="monotone" dataKey="requests" name="Access Requests" stroke="#960000" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md border-none bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-[radial-gradient(circle_at_center,_rgba(65,105,225,0.4),_transparent_60%)] blur-2xl pointer-events-none" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-white text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <button className="w-full text-left p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-semibold border border-white/10 text-sm flex justify-between items-center group">
                + Ingest New Material <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button className="w-full text-left p-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-semibold border border-white/10 text-sm flex justify-between items-center group">
                + Add Collection Series <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <button className="w-full text-left p-3.5 rounded-xl bg-[#4169E1]/40 border border-[#4169E1]/50 hover:bg-[#4169E1]/60 transition-colors font-semibold text-sm flex justify-between items-center group text-blue-50">
                Review Access Requests <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 bg-white">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold text-[#0a1628] flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" /> Recent Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {stats?.recentActivity?.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#4169E1] shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-[#0a1628]">
                        <span className="font-bold">{log.userName}</span> {log.action}{' '}
                        <span className="font-mono bg-muted px-1 py-0.5 rounded text-[10px] text-muted-foreground ml-1">
                          {log.entityType}
                        </span>
                      </p>
                      <span className="text-[10px] font-medium text-muted-foreground/60 block mt-1">
                        {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                  <div className="p-6 text-center text-xs font-medium text-muted-foreground">No recent activity recorded.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
