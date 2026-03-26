import * as React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Page Imports
import Home from "./pages/Home";
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
import ArchivistDashboard from "./pages/archivist/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import RequestAccess from "./pages/RequestAccess";

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
  if (response.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/') {
    localStorage.removeItem("iarchive_token");
    window.location.href = "/login";
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
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/archivist" component={ArchivistDashboard} />
      <Route path="/archivist/collections" component={AdminMaterials} />
      <Route path="/archivist/categories" component={AdminCategories} />
      <Route path="/archivist/requests" component={AdminRequests} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/request-access" component={RequestAccess} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
