import * as React from "react";
import { Link, useLocation } from "wouter";
import { Library, LayoutDashboard, Database, Users, GitPullRequest, Search, FileText, Settings, LogOut, Menu, X, Bell, Loader2, User, UserCog, LogIn, MessageSquare } from "lucide-react";
import { useGetMe, useLogout, useGetAccessRequests, useGetAuditLogs, useGetUsers, useGetFeedbacks } from "@workspace/api-client-react";
import { Button } from "./ui-components";
import { cn } from "@/lib/utils";
import { PublicNavbar } from "./PublicNavbar";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/20">
      <PublicNavbar isTransparentOnTop={false} />

      <main className="flex-1 pt-20">
        {children}
      </main>

      <footer className="bg-primary text-primary-foreground py-12 border-t-4 border-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Library className="w-6 h-6 text-accent" />
              <h2 className="font-display font-bold text-2xl text-white">iArchive</h2>
            </div>
            <p className="text-primary-foreground/70 max-w-sm">
              Preserving HCDC's institutional memory, digitally forever. Aligned with OAIS, ISAD(G), and Dublin Core standards.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Navigation</h4>
            <ul className="space-y-2 text-primary-foreground/70">
              <li><Link href="/" className="hover:text-accent">Home</Link></li>
              <li><Link href="/collections" className="hover:text-accent">Collections</Link></li>
              <li><Link href="/login" className="hover:text-accent">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-primary-foreground/70">
              <li><Link href="/terms" className="hover:text-accent">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const { data: reqData } = useGetAccessRequests({ status: 'pending' });
  const pendingReqCount = reqData?.requests?.length || 0;
  const { data: pendingUsersData } = useGetUsers({ status: 'pending' });
  const pendingUsersCount = pendingUsersData?.users?.length || 0;
  const { data: auditData } = useGetAuditLogs({ limit: 5 });
  const auditBadge = auditData?.logs?.length ? "New" : undefined;
  const { mutate: logoutMutate } = useLogout();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  const { data: feedbackData } = useGetFeedbacks();
  const unreadFeedbackCount = feedbackData?.filter((f: any) => f.status === 'unread').length || 0;

  // Auto-open sidebar on desktop, closed on mobile
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  React.useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/login";
      return;
    }
    if (!isLoading && user) {
      if (user.role === "admin" && !location.startsWith("/admin")) setLocation("/admin");
      if (user.role === "archivist" && !location.startsWith("/archivist")) setLocation("/archivist");
      if (user.role === "student" && !location.startsWith("/student")) setLocation("/student");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const links = user.role === "admin"
    ? [
      { icon: LayoutDashboard, label: "Metadata Dashboard", href: "/admin", badge: unreadFeedbackCount || undefined },
      { icon: Database, label: "Archival Materials", href: "/admin/collections" },
      { icon: FileText, label: "Categories", href: "/admin/categories" },
      { icon: GitPullRequest, label: "Requests", href: "/admin/requests", badge: pendingReqCount },
      { icon: UserCog, label: "Admin Accounts", href: "/admin/users", badge: pendingUsersCount },
      { icon: Users, label: "User Accounts", href: "/admin/user-accounts" },
      { icon: Bell, label: "Announcements", href: "/admin/announcements" },
      { icon: Search, label: "Audit Logs", href: "/admin/audit", badge: auditBadge },
      { icon: User, label: "My Profile", href: "/admin/profile" },
    ]
    : user.role === "archivist"
      ? [
        { icon: LayoutDashboard, label: "Dashboard", href: "/archivist" },
        { icon: Database, label: "Archival Materials", href: "/archivist/collections" },
        { icon: FileText, label: "Categories", href: "/archivist/categories" },
        { icon: GitPullRequest, label: "Requests", href: "/archivist/requests", badge: pendingReqCount },
        { icon: User, label: "My Profile", href: "/archivist/profile" },
      ]
      : [
        { icon: LayoutDashboard, label: "Dashboard", href: "/student" },
        { icon: Database, label: "Browse Collections", href: "/collections" },
        { icon: User, label: "My Profile", href: "/student/profile" },
      ];

  const roleAsideBg =
    user.role === "admin" ? "bg-[#0B2D5A]" : user.role === "archivist" ? "bg-[#000000]" : "bg-[#960000]";
  const roleActiveBg =
    user.role === "admin" ? "bg-[#0B3D91]" : user.role === "archivist" ? "bg-[#1A1A1A]" : "bg-[#B91C1C]";

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className={cn(
        `fixed inset-y-0 left-0 z-40 w-64 ${roleAsideBg} text-white transition-transform duration-300 flex flex-col border-r border-white/10 shadow-2xl`,
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black/10">
          <div className="flex items-center">
            <div className="mr-3">
              <span className="font-display font-bold text-base tracking-tight leading-none">iArchive</span>
              <p className="text-[7px] font-bold tracking-[0.15em] uppercase text-white/50 mt-0.5">HCDC</p>
            </div>
            <span className="text-white/30 mr-3">|</span>
            <h2 className="font-display font-bold text-xl tracking-tight uppercase">
              {user.role === "admin" ? "Admin" : user.role === "archivist" ? "Archivist" : "User"}
            </h2>
          </div>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const active = location === link.href || (link.href !== '/admin' && link.href !== '/archivist' && location.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors font-medium text-sm group",
                  active ? `${roleActiveBg} text-white shadow-md` : "text-white/70 hover:bg-white/10 hover:text-white"
                )}>
                  <link.icon className={cn("w-5 h-5 mr-3 transition-transform group-hover:scale-110", active ? "text-white" : "text-white/50")} />
                  <span className="flex-1">{link.label}</span>
                  {link.badge ? (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{link.badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-white/10 bg-black/10">
          <Link href="/terms" className="mb-3 flex items-center px-2 text-xs text-white/50 hover:text-white transition-colors">
            Terms of Use
          </Link>
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white uppercase border border-white/10">{user.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 uppercase truncate">{user.role === "student" ? "USER" : user.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10" onClick={() => {
            logoutMutate(undefined, {
              onSuccess: () => {
                localStorage.removeItem("iarchive_token");
                window.location.href = "/";
              }
            });
          }}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300 flex flex-col min-h-screen", sidebarOpen ? "lg:ml-64" : "ml-0")}>
        <header className="h-16 bg-white border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setLocation('/')}>View Public Site</Button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
