import { PublicLayout } from "@/components/layout";
import { Database, ShieldCheck, BookOpenText, ScrollText } from "lucide-react";

export default function About() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#f7f8fc] pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 md:p-10 mb-8">
            <div className="inline-flex items-center gap-2 bg-[#960000]/10 text-[#960000] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              <Database className="w-3.5 h-3.5" />
              About iArchive
            </div>
            <h1 className="text-4xl font-bold text-[#0a1628] mb-4">Institutional Digital Archives for HCDC</h1>
            <p className="text-muted-foreground leading-relaxed">
              iArchive provides systematic digital access to Holy Cross of Davao College's historical materials.
              This web-based platform enables administrators to catalog and preserve institutional records while
              offering researchers, students, alumni, and the community searchable access to yearbooks, photographs,
              newspapers, and historical documents-transforming institutional heritage into accessible educational resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#4169E1]" />
                <h2 className="text-xl font-bold text-[#0a1628]">Mission</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To safeguard Holy Cross of Davao College's institutional heritage through systematic digitization and
                standardized archival practices, bridging the past and present by providing accessible digital access
                to historical materials. iArchive fosters educational discovery, supports scholarly research, and strengthens
                community connections, illuminating the institution's identity, achievements, and evolution for students,
                alumni, researchers, and all stakeholders across generations.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-4">
                <BookOpenText className="w-5 h-5 text-[#960000]" />
                <h2 className="text-xl font-bold text-[#0a1628]">Usually Archived</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Yearbooks</li>
                <li>Book of Abstracts</li>
                <li>Newsletters</li>
                <li>Short Videos</li>
                <li>Institutional records and historical documents</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
            <div className="flex items-center gap-3 mb-4">
              <ScrollText className="w-5 h-5 text-[#4169E1]" />
              <h2 className="text-xl font-bold text-[#0a1628]">About OAIS</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              iArchive aligns with the Open Archival Information System (OAIS, ISO 14721) reference model to structure
              long-term digital preservation workflows: ingest, archival storage, data management, administration,
              preservation planning, and access. This ensures archival objects remain authentic, discoverable, and usable
              over time despite changes in formats and technology.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
