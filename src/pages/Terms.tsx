import { PublicLayout } from "@/components/layout";
import { AlertTriangle, BookOpenCheck, Lock, Scale } from "lucide-react";

export default function Terms() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#f7f8fc] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="rounded-3xl border border-border/60 bg-white shadow-sm overflow-hidden mb-6">
            <div className="p-8 md:p-10 bg-gradient-to-br from-white via-white to-[#f7f8fc] border-b border-border/60">
              <div className="inline-flex items-center gap-2 bg-[#960000]/10 text-[#960000] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                <Scale className="w-3.5 h-3.5" />
                Terms of Use
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a1628] mb-3">Responsible Use of HCDC Archival Resources</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                By using iArchive, you agree to responsible, academic, and lawful use of Holy Cross of Davao College archival resources.
              </p>
            </div>

            {/* Quick highlights */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: BookOpenCheck, t: "Academic Use", d: "Use materials for education, research, and institutional purposes." },
                { icon: Lock, t: "Controlled Access", d: "Restricted items require approval and role-based permission." },
                { icon: AlertTriangle, t: "Rights & Integrity", d: "No redistribution of protected content; downloads may be restricted." },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-border/60 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <c.icon className={`w-4 h-4 ${c.t === "Academic Use" ? "text-[#4169E1]" : c.t === "Controlled Access" ? "text-[#960000]" : "text-amber-600"}`} />
                    <p className="text-sm font-bold text-[#0a1628]">{c.t}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Full terms */}
          <div className="bg-white rounded-3xl border border-border/60 shadow-sm p-8 md:p-10">
            <h2 className="text-xl font-bold text-[#0a1628] mb-4">Full Terms</h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p><span className="font-semibold text-foreground">1.</span> Materials are provided for educational, research, and institutional purposes.</p>
              <p><span className="font-semibold text-foreground">2.</span> Access to restricted and confidential records is governed by role-based permissions and approval workflows.</p>
              <p><span className="font-semibold text-foreground">3.</span> Download of archival files may be restricted by policy to preserve rights, integrity, and custodial controls.</p>
              <p><span className="font-semibold text-foreground">4.</span> Users must provide accurate information when requesting access and must not redistribute protected content.</p>
              <p><span className="font-semibold text-foreground">5.</span> All user activity can be logged for security, compliance, and records management.</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
