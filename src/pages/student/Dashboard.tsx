import { Link } from "wouter";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-components";
import { BookOpen, Search, Shield, Megaphone, ArrowRight, Clock, Star, ArrowUpRight } from "lucide-react";
import { useGetAnnouncements, useGetMaterials } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { data: announcements } = useGetAnnouncements();
  const activeAnnouncements = (announcements ?? []).filter((a: any) => a.isActive);
  const { data: materialsData } = useGetMaterials({ access: "public", limit: 5 });

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#960000]/10 text-[#960000] border border-[#960000]/20 rounded-full px-3 py-1 text-xs font-bold mb-3 uppercase tracking-widest">
            <BookOpen className="w-4 h-4" /> Student Portal
          </div>
          <h1 className="text-4xl font-display font-bold text-[#0a1628]">Discover & Request Access</h1>
          <p className="text-muted-foreground mt-2">Browse open collections and submit requests for restricted materials.</p>
        </div>
        <div className="mt-4 md:mt-0 text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl border border-border/50 flex flex-col items-end">
          <span className="text-[#960000]">Status: Verified</span>
          <span className="text-xs font-normal">Standard access limits apply</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/collections" className="group block">
              <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-[#960000]/5 group-hover:bg-[#960000]/10 transition-colors" />
                <CardContent className="p-6 relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#960000]/10 flex items-center justify-center mb-4 text-[#960000] group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[#0a1628] mb-1">Public Resources</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-grow">Explore yearbooks, photos, and institutional publications.</p>
                  <ArrowRight className="w-4 h-4 text-[#960000] mt-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/collections" className="group block">
              <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-[#960000]/5 group-hover:bg-[#960000]/10 transition-colors" />
                <CardContent className="p-6 relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#960000]/10 flex items-center justify-center mb-4 text-[#960000] group-hover:scale-110 transition-transform">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[#0a1628] mb-1">Discover Options</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-grow">Use advanced search and filters to find records.</p>
                  <ArrowRight className="w-4 h-4 text-[#960000] mt-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                </CardContent>
              </Card>
            </Link>

            <Link href="#requests" className="group block">
              <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-[#960000]/5 group-hover:bg-[#960000]/10 transition-colors" />
                <CardContent className="p-6 relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#960000]/10 flex items-center justify-center mb-4 text-[#960000] group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[#0a1628] mb-1">Request Workflow</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-grow">Track access requests for restricted items.</p>
                  <ArrowRight className="w-4 h-4 text-[#960000] mt-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="border-none shadow-md overflow-hidden bg-gradient-to-r from-[#960000] to-[#7a0000] text-white">
            <CardContent className="p-8 md:p-10 relative">
              <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-lg">
                <h2 className="text-2xl font-bold mb-3">Begin Your Research</h2>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Ready to dive into the Holy Cross of Davao College archives? Start browsing thousands of historical materials curated by our expert archivists.
                </p>
                <Link href="/collections">
                  <button className="bg-white text-[#960000] font-bold py-3 px-6 rounded-xl hover:bg-red-50 transition-colors shadow-lg active:scale-95">
                    Browse the Collection
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Announcements & Recent */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-border/50 bg-white">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <h2 className="text-sm font-bold flex items-center gap-2 text-[#0a1628] uppercase tracking-wider">
                <Megaphone className="w-4 h-4 text-[#960000]" /> Notice Board
              </h2>
            </div>
            <div className="p-0 max-h-[400px] overflow-y-auto custom-scroll">
              {activeAnnouncements.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {activeAnnouncements.map((ann: any) => (
                    <div key={ann.id} className="p-5 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm text-[#0a1628] group-hover:text-[#960000] transition-colors">{ann.title}</h3>
                        <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap bg-muted px-2 py-0.5 rounded-full">
                          {format(new Date(ann.createdAt), "MMM d")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Megaphone className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">No recent announcements from the admin office.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="shadow-sm border-border/50 bg-white">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <h2 className="text-sm font-bold flex items-center gap-2 text-[#0a1628] uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-emerald-600" /> Accessible to You
              </h2>
            </div>
            <div className="p-0">
              {(materialsData?.materials?.length ?? 0) > 0 ? (
                <div className="divide-y divide-border/50">
                  {materialsData?.materials?.slice(0, 4).map((mat: any) => (
                    <Link key={mat.id} href={`/materials/${mat.id}`}>
                      <div className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-[#0a1628] group-hover:text-[#960000] transition-colors line-clamp-1">{mat.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{mat.categoryName || 'General Collection'}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-[#960000]" />
                      </div>
                    </Link>
                  ))}
                  <Link href="/collections?access=public">
                    <div className="p-3 text-center text-xs font-semibold text-[#4169E1] hover:bg-muted/30 transition-colors cursor-pointer bg-muted/10">
                      View all public resources →
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">Your reading history will appear here once you start exploring materials.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
