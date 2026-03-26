import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { Database, FolderTree, GitPullRequest } from "lucide-react";
import { useGetStats } from "@workspace/api-client-react";

export default function ArchivistDashboard() {
  const { data: stats } = useGetStats();

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-3 bg-[#4169E1]/10 border border-[#4169E1]/20 rounded-2xl px-4 py-2 mb-4">
          <Database className="w-5 h-5 text-[#4169E1]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4169E1]">Archivist Workspace</p>
        </div>
        <h1 className="text-3xl font-display font-bold text-[#4169E1]">Cataloging & Access Workflow</h1>
        <p className="text-muted-foreground">Metadata enrichment, controlled access review, and preserving HCDC history with OAIS standards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-gradient-to-b from-[#4169E1]/5 to-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-[#4169E1]" /> Total Materials
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.totalMaterials ?? 0}</p></CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-b from-[#4169E1]/5 to-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#4169E1]" /> Categories
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.totalCategories ?? 0}</p></CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-b from-[#4169E1]/5 to-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-[#4169E1]" /> Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.pendingRequests ?? 0}</p></CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
