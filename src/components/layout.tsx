import * as React from "react";
import { Link, useLocation } from "wouter";
import { Library, LayoutDashboard, Database, Users, GitPullRequest, Search, FileText, Settings, LogOut, Menu, X, Bell, Loader2 } from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "./ui-components";
import { cn } from "@/lib/utils";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/20">
      <header className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        isScrolled || location !== "/" ? "bg-white/90 backdrop-blur-lg border-border/50 shadow-sm py-3" : "bg-transparent border-transparent py-5"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20icon.png`} alt="iArchive icon" className="w-12 h-12 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <div>
              <h1 className="font-display font-black text-2xl leading-none text-primary uppercase tracking-tight">iArchive</h1>
              <p className={cn("text-[9px] font-bold tracking-[0.2em] uppercase mt-1", isScrolled || location !== "/" ? "text-muted-foreground" : "text-primary/70")}>HCDC Digital Collections</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
            <Link href="/collections" className="text-foreground/80 hover:text-accent transition-colors">Collections</Link>
            <button onClick={() => {
              if (location !== '/') {
                setLocation('/#features');
              } else {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }
            }} className="text-foreground/80 hover:text-accent transition-colors cursor-pointer">Features</button>
            <Link href="/about" className="text-foreground/80 hover:text-accent transition-colors">About OAIS</Link>
            <Link href="/terms" className="text-foreground/80 hover:text-accent transition-colors">Terms</Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link href={user.role === 'admin' ? '/admin' : '/collections'} className="text-sm font-semibold text-primary">
                  Welcome, {user.name}
                </Link>
                <Button variant="outline" size="sm" onClick={() => setLocation(user.role === 'admin' ? '/admin' : '/collections')}>Dashboard</Button>
              </div>
            ) : (
              <Button variant="accent" size="sm" onClick={() => setLocation('/login')}>Sign In / Register</Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
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
              Preserving HCDC's institutional memory, digitally forever. Compliant with OAIS, ISAD(G), and Dublin Core standards.
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
  const { mutate: logoutMutate } = useLogout();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

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
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
        { icon: Database, label: "Collections", href: "/admin/collections" },
        { icon: FileText, label: "Categories", href: "/admin/categories" },
        { icon: GitPullRequest, label: "Requests", href: "/admin/requests" },
        { icon: Users, label: "Users", href: "/admin/users" },
        { icon: Bell, label: "Announcements", href: "/admin/announcements" },
        { icon: Search, label: "Audit Logs", href: "/admin/audit" },
      ]
    : user.role === "archivist"
      ? [
          { icon: LayoutDashboard, label: "Dashboard", href: "/archivist" },
          { icon: Database, label: "Collections", href: "/archivist/collections" },
          { icon: FileText, label: "Categories", href: "/archivist/categories" },
          { icon: GitPullRequest, label: "Requests", href: "/archivist/requests" },
        ]
      : [
          { icon: LayoutDashboard, label: "Dashboard", href: "/student" },
          { icon: Database, label: "Browse Collections", href: "/collections" },
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
        <div className="h-16 flex items-center px-6 border-b border-white/10 bg-black/10">
          <img src={`${import.meta.env.BASE_URL}logos/iarchive%20icon.png`} className="w-8 h-8 object-contain mr-3" alt="Logo" />
          <h2 className="font-display font-bold text-xl tracking-tight uppercase">
            {user.role === "admin" ? "Admin" : user.role === "archivist" ? "Archivist" : "Student"}
          </h2>
        </div>
        <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const active = location === link.href || (link.href !== '/admin' && link.href !== '/archivist' && location.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors font-medium text-sm group",
                  active ? `${roleActiveBg} text-white shadow-md` : "text-white/70 hover:bg-white/10 hover:text-white"
                )}>
                  <link.icon className={cn("w-5 h-5 mr-3 transition-transform group-hover:scale-110", active ? "text-white" : "text-white/50")} />
                  {link.label}
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
              <p className="text-xs text-white/50 capitalize truncate">{user.role}</p>
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

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300 flex flex-col min-h-screen", sidebarOpen ? "ml-64" : "ml-0")}>
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
