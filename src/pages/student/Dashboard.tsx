import { Link } from "wouter";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui-components";
import { BookOpen, Search, Shield } from "lucide-react";

export default function StudentDashboard() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-3 bg-[#960000]/10 border border-[#960000]/20 rounded-2xl px-4 py-2 mb-4">
          <BookOpen className="w-5 h-5 text-[#960000]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#960000]">Student Portal</p>
        </div>
        <h1 className="text-3xl font-display font-bold text-[#960000]">Discover & Request Access</h1>
        <p className="text-muted-foreground">Browse open collections, then request access to restricted materials with a clear research purpose.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-gradient-to-b from-[#960000]/5 to-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#960000]" /> Public Resources
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Explore yearbooks, photos, and institutional publications.</p></CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-b from-[#960000]/5 to-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-[#960000]" /> Discover
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Use search and filters to find relevant historical records.</p></CardContent>
        </Card>
        <Card className="border-none shadow-md bg-gradient-to-b from-[#960000]/5 to-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#960000]" /> Request Workflow
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Submit and track your access requests for restricted items.</p></CardContent>
        </Card>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/collections"><Button>Browse Collections</Button></Link>
        <Link href="/about"><Button variant="outline">About OAIS</Button></Link>
      </div>
    </AdminLayout>
  );
}
