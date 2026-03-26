import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { Database, FolderTree, GitPullRequest } from "lucide-react";
import { useGetStats } from "@workspace/api-client-react";

export default function ArchivistDashboard() {
  const { data: stats } = useGetStats();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Archivist Workspace</h1>
        <p className="text-muted-foreground">Cataloging, metadata enrichment, and access workflow processing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4" /> Total Materials</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.totalMaterials ?? 0}</p></CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderTree className="w-4 h-4" /> Categories</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.totalCategories ?? 0}</p></CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><GitPullRequest className="w-4 h-4" /> Pending Requests</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.pendingRequests ?? 0}</p></CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
