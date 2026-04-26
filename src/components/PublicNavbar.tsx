import * as React from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, LayoutDashboard, LogIn, MessageSquare } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export function PublicNavbar({ isTransparentOnTop = false }: { isTransparentOnTop?: boolean }) {
  const [scrollY, setScrollY] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { data: user } = useGetMe();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const sq = encodeURIComponent(searchTerm.trim());
      const searchUrl = `/collections?search=${sq}`;
      
      // If we're already on collections, we can just update the URL search params
      // which will trigger the useEffect in Collections.tsx that listens to window.location.search
      if (window.location.pathname === "/collections") {
        const newUrl = `${window.location.pathname}?search=${sq}`;
        window.history.pushState({}, '', newUrl);
        // Dispatch an event so wouter/etc can see the change if needed, 
        // or just rely on the fact that we've updated the URL and and the page might need a trigger
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        setLocation(searchUrl);
      }
    }
  };

  const NavButton = ({ href, children }: { href: string, children: React.ReactNode }) => {
    const active = location === href || (href.includes("#") && location === href.split("#")[0]); 
    return (
      <Link href={href}>
        <button className={`px-4 py-2 rounded-full transition-all duration-300 font-bold relative group ${active ? 'text-white bg-white/10 shadow-inner' : 'hover:text-white hover:bg-white/10 text-white/70'}`}>
          {children}
          {active && <span className="absolute left-1/2 -bottom-[5px] -translate-x-1/2 w-4 h-1 bg-white/40 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" />}
        </button>
      </Link>
    );
  };

  React.useEffect(() => {
    if (!isTransparentOnTop) return;
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTransparentOnTop]);

  // If we're not transparent on top, act as if we're always scrolled past 500px so it strictly uses the dark pill
  const isScrolled = !isTransparentOnTop || scrollY > 500;

  return (
    <header className={`fixed inset-x-0 z-50 transition-all duration-500 pointer-events-none ${isScrolled ? 'top-2' : 'top-4'}`}>
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between md:justify-center relative">
        
        {/* Outside Logo & Identity (Top state for Home page) */}
        <div className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 items-center gap-6 pointer-events-auto transition-all duration-500 origin-left ${
          isScrolled ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
        }`}>
          <Link href="/">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive logo" className="h-[42px] w-auto hover:opacity-90 transition-opacity" />
          </Link>
          <Link href="/about" className="text-white/80 hover:text-white font-medium text-sm transition-colors whitespace-nowrap mt-1">
            About iArchive
          </Link>
        </div>

        {/* Compact Pill Navbar */}
        <div className={`pointer-events-auto relative flex items-center justify-between rounded-full transition-all duration-500 shadow-xl ring-1 ring-white/5 ${
          isScrolled
            ? 'bg-[#6b0000] border border-[#960000]/40 backdrop-blur-xl px-5 py-1.5 md:py-1 gap-2 w-full md:w-fit'
            : 'bg-[#5a0000]/60 backdrop-blur-xl border border-red-400/15 px-4 py-1.5 md:py-1 gap-1 w-full md:w-fit'
        }`}>
          
          {/* Logo & Identity INSIDE pill (Visible when scrolled or on other pages) */}
          <div className={`hidden md:flex items-center overflow-hidden transition-all duration-500 ease-in-out ${
            isScrolled ? 'max-w-[250px] opacity-100 pr-6 pl-1' : 'max-w-0 opacity-0 pr-0 pl-0'
          }`}>
            <div className="flex items-center gap-5">
              <Link href="/" className="shrink-0 flex items-center">
                <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive logo" className="h-8 w-auto object-contain" />
              </Link>
              <div className="w-px h-4 bg-white/20"></div>
              <Link href="/about" className="text-white/80 hover:text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0">
                About iArchive
              </Link>
            </div>
          </div>

          {/* Mobile Logo inside pill (Always visible on mobile) */}
          <Link href="/" className="md:hidden flex items-center shrink-0 pl-1">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive logo" className="h-[30px] w-auto object-contain" />
          </Link>

          {/* Nav Links (Centered) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <NavButton href="/collections">Collections</NavButton>
            <NavButton href="/features">Features</NavButton>
            <NavButton href="/terms">Terms</NavButton>
          </nav>

          {/* Right-side Quick Search & User Chip */}
          <div className={`hidden md:flex items-center gap-4 transition-all duration-500 ${isScrolled ? 'ml-0' : 'ml-1 pl-3 border-l border-white/10'}`}>
            <div className="relative group">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchSubmit}
                className="bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 focus:bg-white/10 text-white text-sm rounded-full pl-9 pr-4 py-1.5 w-40 focus:w-56 transition-all outline-none placeholder:text-white/40"
              />
            </div>
            
            {user && (
              <div className="flex items-center">
                <div className="w-px h-6 bg-white/20 mr-4"></div>
                <Link href={user.role === 'admin' ? "/admin" : user.role === 'archivist' ? "/archivist" : "/student"}>
                  <div className="flex items-center gap-3 hover:bg-white/10 p-1 pr-3 rounded-full transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-[#4169E1] flex items-center justify-center text-white shrink-0 shadow-md">
                      <span className="text-xs font-bold">{user.name?.charAt(0).toUpperCase() || <span className="w-4 h-4 rounded-full bg-white/50" />}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-0.5">{user.role}</span>
                      <span className="text-sm font-bold text-white group-hover:text-white/90 leading-none">{user.name}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu icon */}
          <button
            className="md:hidden p-2 text-white/80 hover:text-white pointer-events-auto"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#0a1628] border-l border-white/10 shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <span className="text-white font-display font-bold">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/60 hover:text-white bg-white/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4 text-white font-medium">
              <Link href="/collections">
                <span className="py-2 border-b border-white/10 block cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Collections</span>
              </Link>
              <Link href="/about">
                <span className="py-2 border-b border-white/10 block cursor-pointer" onClick={() => setMobileMenuOpen(false)}>About iArchive</span>
              </Link>
              <Link href="/features">
                <span className="py-2 border-b border-white/10 block cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Features</span>
              </Link>
              <Link href="/terms">
                <span className="py-2 border-b border-white/10 block cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Terms</span>
              </Link>
            </div>
            <div className="mt-auto">
              {user ? (
                <Link href={user.role === 'admin' ? "/admin" : user.role === 'archivist' ? "/archivist" : "/student"}>
                  <button className="w-full flex justify-center items-center gap-2 bg-[#4169E1] text-white py-3 rounded-xl font-bold">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </button>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="w-full flex justify-center items-center gap-2 bg-white/10 text-white py-3 rounded-xl font-bold">
                    <LogIn className="w-4 h-4" /> Login
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Button */}
      <Link href="/feedback" className="pointer-events-auto fixed bottom-5 left-5 z-[100] bg-[#4169E1] hover:bg-[#3558c8] text-white flex items-center gap-1.5 px-2 py-1 rounded-md shadow-[0_4px_15px_rgba(65,105,225,0.2)] hover:shadow-[0_4px_25px_rgba(65,105,225,0.4)] transform hover:-translate-y-0.5 transition-all group border border-white/10">
        <MessageSquare className="w-3 h-3 group-hover:scale-110 transition-transform" />
        <span className="font-bold text-[10px] tracking-tight">Feedback</span>
      </Link>
    </header>
  );
}
