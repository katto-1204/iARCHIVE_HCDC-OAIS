import * as React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import { Database, Shield, Zap, Lock, Globe } from "lucide-react";
import { supabase } from "./lib/supabase";

import Home from "@/pages/Home";

// Page Imports
import Login from "./pages/Login";
import Register from "./pages/Register";
import Collections from "./pages/Collections";
import MaterialDetail from "./pages/MaterialDetail";
import About from "./pages/About";
import Features from "./pages/Features";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMaterials from "./pages/admin/Materials";
import AdminRequests from "./pages/admin/Requests";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminUsers from "./pages/admin/Users";
import AdminCategories from "./pages/admin/Categories";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminUserAccounts from "./pages/admin/UserAccounts";
import AdminFeedback from "./pages/admin/Feedback";
import ArchivistDashboard from "./pages/archivist/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import AccessedMaterials from "./pages/student/AccessedMaterials";
import Profile from "./pages/Profile";
import RequestAccess from "./pages/RequestAccess";
import Feedback from "./pages/Feedback";
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
      <Route path="/features" component={Features} />
      <Route path="/terms" component={Terms} />
      <Route path="/feedback" component={Feedback} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/collections" component={AdminMaterials} />
      <Route path="/admin/requests" component={AdminRequests} />
      <Route path="/admin/audit" component={AdminAuditLogs} />
      
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/user-accounts" component={AdminUserAccounts} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/feedback" component={AdminFeedback} />
      <Route path="/admin/profile" component={Profile} />
      
      <Route path="/archivist" component={ArchivistDashboard} />
      <Route path="/archivist/collections" component={AdminMaterials} />
      <Route path="/archivist/categories" component={AdminCategories} />
      <Route path="/archivist/requests" component={AdminRequests} />
      <Route path="/archivist/profile" component={Profile} />
      
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/accessed" component={AccessedMaterials} />
      <Route path="/student/profile" component={Profile} />
      <Route path="/request-access" component={RequestAccess} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 800);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    const phaseTimer = setInterval(() => {
       setPhase(p => (p + 1) % 4);
    }, 1500);

    return () => {
      clearInterval(timer);
      clearInterval(phaseTimer);
    };
  }, [onFinish]);

  const phases = ["Encrypting Handshake", "Synchronizing Archive", "Verified Authority", "System Ready"];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a1628] flex flex-col items-center justify-center overflow-hidden">
      {/* Premium Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0a1628] to-black opacity-100" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/5 via-transparent to-transparent opacity-60" />
      
      {/* Moving Particles/Grid Effect */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] animate-grid-flow" />
      
      {/* Dynamic Light Blurs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-12">
        {/* White Logo with Premium Glow */}
        <div className="relative mb-16 group">
          <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full scale-150 animate-pulse-glow" />
          <div className="relative z-10 transition-transform duration-1000 hover:scale-105">
            <img 
               src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} 
               alt="iArchive Logo" 
               className="w-48 h-48 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-fade-in"
            />
          </div>
        </div>
        
        {/* System Title */}
        <div className="text-center space-y-6 mb-20 animate-fade-in-up">
          <h1 className="text-5xl font-black text-white tracking-[0.25em] uppercase leading-none">
            iArchive
          </h1>
          <div className="flex items-center justify-center gap-6">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
            <p className="text-white/40 font-black text-[9px] uppercase tracking-[0.5em] whitespace-nowrap">
              Institutional Digital Memory
            </p>
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
          </div>
        </div>

        {/* Elite Progress Indicator */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{phases[phase]}</span>
             </div>
             <span className="text-xs font-black text-white/60 tracking-widest">{progress}%</span>
          </div>
          
          <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Loading Metrics Row */}
        <div className="mt-8 grid grid-cols-3 gap-8 w-full">
           <div className="flex flex-col items-center gap-1 opacity-20">
              <Shield className="w-3.5 h-3.5 text-white" />
              <span className="text-[7px] font-black text-white uppercase tracking-widest text-center">Encrypted</span>
           </div>
           <div className="flex flex-col items-center gap-1 opacity-20">
              <Globe className="w-3.5 h-3.5 text-white" />
              <span className="text-[7px] font-black text-white uppercase tracking-widest text-center">Global Node</span>
           </div>
           <div className="flex flex-col items-center gap-1 opacity-20">
              <Lock className="w-3.5 h-3.5 text-white" />
              <span className="text-[7px] font-black text-white uppercase tracking-widest text-center">Secure</span>
           </div>
        </div>
      </div>
      
      {/* Institutional Footer */}
      <div className="absolute bottom-16 flex flex-col items-center gap-4 animate-fade-in opacity-30">
        <div className="flex items-center gap-6">
           <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Preservation</span>
           <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
           <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Integrity</span>
           <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
           <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Access</span>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = React.useState(() => {
    // Check if splash was already shown in this session
    return !sessionStorage.getItem("iarchive_splash_shown");
  });

  React.useEffect(() => {
    // Listen for auth changes to sync token for the legacy fetch interceptor
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        localStorage.setItem("iarchive_token", session.access_token);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem("iarchive_token");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
