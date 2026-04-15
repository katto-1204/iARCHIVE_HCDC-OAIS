import * as React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import { Database } from "lucide-react";

import Home from "@/pages/Home";

// Page Imports
import Login from "./pages/Login";
import Register from "./pages/Register";
import Collections from "./pages/Collections";
import MaterialDetail from "./pages/MaterialDetail";
import About from "./pages/About";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMaterials from "./pages/admin/Materials";
import AdminRequests from "./pages/admin/Requests";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminUsers from "./pages/admin/Users";
import AdminCategories from "./pages/admin/Categories";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminUserAccounts from "./pages/admin/UserAccounts";
import ArchivistDashboard from "./pages/archivist/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import Profile from "./pages/Profile";
import RequestAccess from "./pages/RequestAccess";
import NotFound from "@/pages/not-found";

// Intercept global fetch to attach JWT from localStorage for @workspace/api-client-react hooks
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("iarchive_token");
  if (token) {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    init = { ...(init ?? {}), headers };
  }
  const response = await originalFetch(input, init);
  if (response.status === 401) {
    const isProtectedPath = ['/admin', '/archivist', '/student'].some(p => window.location.pathname.startsWith(p));
    if (isProtectedPath && window.location.pathname !== '/login') {
      localStorage.removeItem("iarchive_token");
      window.location.href = "/login";
    }
  }
  return response;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      gcTime: 10 * 60_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/collections" component={Collections} />
      <Route path="/materials/:id" component={MaterialDetail} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/collections" component={AdminMaterials} />
      <Route path="/admin/requests" component={AdminRequests} />
      <Route path="/admin/audit" component={AdminAuditLogs} />
      
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/user-accounts" component={AdminUserAccounts} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/profile" component={Profile} />
      
      <Route path="/archivist" component={ArchivistDashboard} />
      <Route path="/archivist/collections" component={AdminMaterials} />
      <Route path="/archivist/categories" component={AdminCategories} />
      <Route path="/archivist/requests" component={AdminRequests} />
      <Route path="/archivist/profile" component={Profile} />
      
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/profile" component={Profile} />
      <Route path="/request-access" component={RequestAccess} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 600);
          return 100;
        }
        return prev + 2;
      });
    }, 25);
    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#960000] flex flex-col items-center justify-center overflow-hidden">
      {/* Premium Red Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7a0000] via-[#960000] to-[#5a0000] animate-gradient-xy opacity-80" />
      <div className="absolute inset-0 bg-grid-white animate-grid-flow opacity-[0.05]" />
      
      {/* Dynamic Light Effects */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-400/20 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-black/40 rounded-full blur-[120px] animate-float-slower" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo without box, just floating with high-end glow */}
        <div className="relative mb-12 group animate-fade-in-up">
          <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse-glow" />
          <img 
             src={`${import.meta.env.BASE_URL}logos/iarchive%20icon.png`} 
             alt="iArchive Logo" 
             className="w-40 h-40 object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          />
        </div>
        
        <div className="text-center space-y-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h1 className="text-6xl font-display font-black text-white tracking-[0.2em] uppercase drop-shadow-lg">
            iArchive
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-white/30" />
            <p className="text-white/80 font-bold text-[10px] uppercase tracking-[0.5em]">
              HCDC Digital Collections
            </p>
            <div className="h-px w-8 bg-white/30" />
          </div>
        </div>

        {/* Improved Loading Bar - Slim and Premium */}
        <div className="mt-20 w-72 group">
          <div className="flex justify-between items-end mb-2 px-1">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest animate-pulse">Initializing System</span>
            <span className="text-xs font-mono text-white/60">{progress}%</span>
          </div>
          <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden relative">
            <div 
              className="absolute inset-y-0 left-0 bg-white transition-all duration-300 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-12 flex flex-col items-center gap-3 animate-fade-in opacity-40">
        <div className="text-white text-[10px] uppercase tracking-[0.3em] font-bold">
          Preservation · Integrity · Access
        </div>
        <div className="h-4 w-px bg-gradient-to-b from-white to-transparent" />
      </div>
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = React.useState(() => {
    // Check if splash was already shown in this session
    return !sessionStorage.getItem("iarchive_splash_shown");
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem("iarchive_splash_shown", "true");
    setShowSplash(false);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
       {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
