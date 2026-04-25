import * as React from "react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { MessageSquare, Send, CheckCircle2, ArrowLeft, Lightbulb, Bug, Heart, Sparkles, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useSubmitFeedback } from "@/lib/api-client-react";

export default function Feedback() {
  const submitFeedback = useSubmitFeedback();
  const [submitted, setSubmitted] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState("suggestion");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      await submitFeedback.mutateAsync({
        data: {
          type: selectedType,
          message: (formData.get("message") as string),
          name: (formData.get("name") as string),
          email: (formData.get("email") as string),
        }
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Feedback submission error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-[#4169E1]/10">
      <PublicNavbar isTransparentOnTop={false} />

      {/* Header with high-end aesthetic */}
      <div className="bg-[#0a1628] relative overflow-hidden pt-32 pb-44">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#4169E1]/15 rounded-full blur-[140px] animate-float-slow" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#960000]/10 rounded-full blur-[120px] animate-float-slower" />
          <div className="absolute inset-0 bg-grid-white animate-grid-flow opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a1628]/50 to-[#f8fafc]" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-fade-in">
              <Sparkles className="w-3 h-3 text-[#4169E1]" /> Voices of iArchive
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight animate-fade-in-up">
              Shape the <span className="font-serif italic bg-gradient-to-r from-[#4169E1] via-[#7c94e8] to-[#4169E1] text-transparent bg-clip-text bg-[length:200%_auto] animate-gradient-x">Future</span> of our History
            </h1>
            <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Our digital heritage belongs to everyone. Help us refine the repository by sharing your thoughts, reporting issues, or suggesting new features.
            </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-32 pb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Why Feedback Matters (Sidebar on large, top on small) */}
          <div className="lg:col-span-4 space-y-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white">
              <h3 className="text-sm font-black text-[#0a1628] uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4169E1]" /> Impact Areas
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0a1628] text-sm mb-1">Usability</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Tell us how we can make navigation and discovery smoother for researchers.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-red-50 flex items-center justify-center">
                    <Bug className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0a1628] text-sm mb-1">Technical Integrity</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Report broken links, metadata errors, or display glitches in the collection.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0a1628] text-sm mb-1">Appreciation</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Found something helpful? Let our archivists know their work is appreciated.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#4169E1] rounded-[2.5rem] p-8 shadow-xl shadow-blue-200/50 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-24 h-24" />
              </div>
              <h3 className="text-lg font-black mb-2 relative z-10">Direct Support</h3>
              <p className="text-blue-100/80 text-sm leading-relaxed mb-6 relative z-10">
                Need immediate archival assistance or special access requests?
              </p>
              <Link href="/request-access">
                <button className="w-full bg-white text-[#4169E1] py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all relative z-10">
                  Contact Archivist
                </button>
              </Link>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="lg:col-span-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/40 p-8 md:p-12 border border-white">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                      <div>
                        <label className="text-xs font-black text-[#0a1628] uppercase tracking-[0.2em] mb-4 block">What is on your mind?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { id: "suggestion", label: "Suggestion", icon: Lightbulb, color: "blue" },
                              { id: "bug", label: "Bug Report", icon: Bug, color: "red" },
                              { id: "compliment", label: "Compliment", icon: Heart, color: "emerald" }
                            ].map((item) => (
                              <label key={item.id} className="relative flex cursor-pointer group">
                                <input 
                                  type="radio" 
                                  name="type" 
                                  className="peer sr-only" 
                                  checked={selectedType === item.id}
                                  onChange={() => setSelectedType(item.id)} 
                                />
                                <div className={`w-full flex flex-col items-center gap-3 px-4 py-5 rounded-3xl border-2 border-slate-100 bg-slate-50 transition-all duration-300 group-hover:border-slate-200 peer-checked:bg-white peer-checked:shadow-xl peer-checked:border-${item.color}-500/50 peer-checked:ring-4 peer-checked:ring-${item.color}-500/10`}>
                                    <div className={`w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${selectedType === item.id ? `text-${item.color}-600 bg-${item.color}-50` : 'text-slate-400'}`}>
                                      <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-bold tracking-tight ${selectedType === item.id ? `text-${item.color}-700` : 'text-slate-500'}`}>
                                      {item.label}
                                    </span>
                                </div>
                              </label>
                            ))}
                        </div>
                      </div>

                      <div className="relative group">
                         <label htmlFor="message" className="text-xs font-black text-[#0a1628] uppercase tracking-[0.2em] mb-4 block">Detailed Message</label>
                         <textarea 
                            id="message" 
                            name="message"
                            rows={6} 
                            placeholder="Please share as much detail as possible to help us understand..." 
                            required
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 text-sm md:text-base focus:outline-none focus:bg-white focus:border-[#4169E1]/50 focus:ring-4 focus:ring-[#4169E1]/5 transition-all outline-none resize-none placeholder:text-slate-400"
                          ></textarea>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label htmlFor="name" className="text-xs font-black text-[#0a1628] uppercase tracking-[0.2em] block">Your Name (Optional)</label>
                            <input 
                              type="text" 
                              id="name" 
                              name="name"
                              placeholder="e.g. Juan De La Cruz"
                              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-base focus:outline-none focus:bg-white focus:border-[#4169E1]/50 focus:ring-4 focus:ring-[#4169E1]/5 transition-all outline-none" 
                            />
                          </div>
                          <div className="space-y-4">
                            <label htmlFor="email" className="text-xs font-black text-[#0a1628] uppercase tracking-[0.2em] block">Email Address (Optional)</label>
                            <input 
                              type="email" 
                              id="email" 
                              name="email"
                              placeholder="juan@hcdc.edu.ph"
                              className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-base focus:outline-none focus:bg-white focus:border-[#4169E1]/50 focus:ring-4 focus:ring-[#4169E1]/5 transition-all outline-none" 
                            />
                          </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={submitFeedback.isPending}
                        className="mt-4 flex items-center justify-center gap-3 w-full bg-[#4169E1] hover:bg-[#3558c8] disabled:bg-[#4169E1]/50 text-white h-16 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all transform hover:-translate-y-1 shadow-xl shadow-[#4169E1]/20 hover:shadow-2xl hover:shadow-[#4169E1]/30"
                      >
                          {submitFeedback.isPending ? "Sending Thought..." : "Submit to Repository"} 
                          <Send className="w-5 h-5 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                      <p className="text-center text-[10px] text-slate-400 font-medium tracking-wide">
                        Your feedback is stored securely and reviewed weekly by our archival team.
                      </p>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
                      <div className="relative mb-10">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white relative z-10 shadow-xl shadow-emerald-500/30 transform rotate-6">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-[#0a1628] mb-4">Submission Captured</h3>
                      <p className="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
                          We've successfully received your perspective. Contributors like you help iArchive remain the premier digital gateway to HCDC's history.
                      </p>
                      <Link href="/">
                          <button className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all hover:scale-105 shadow-xl shadow-slate-900/10">
                              <ArrowLeft className="w-5 h-5" /> Return to Archives
                          </button>
                      </Link>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
