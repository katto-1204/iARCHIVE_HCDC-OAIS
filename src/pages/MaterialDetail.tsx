import * as React from "react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import {
  FileText, Download, Lock, ArrowLeft, CheckCircle,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, ExternalLink,
  Database, HardDrive, Calendar, User, Tag, BookOpen, AlertTriangle
} from "lucide-react";
import { useGetMaterial, useGetMe } from "@workspace/api-client-react";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 py-3 border-b border-border/50 last:border-0">
      <dt className="text-sm text-muted-foreground font-medium">{label}</dt>
      <dd className="text-sm text-foreground font-normal">{value}</dd>
    </div>
  );
}

function IsadSection({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-1.5 bg-[#0a1628] text-white text-xs font-bold px-2.5 py-1 rounded-md">
          ISAD(G) {num}
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
      </div>
      <dl className="bg-white rounded-xl border border-border/60">{children}</dl>
    </div>
  );
}

export default function MaterialDetail() {
  const [, params] = useRoute("/materials/:id");
  const { data: material, isLoading } = useGetMaterial(params?.id || "", {
    query: { enabled: !!params?.id },
  });
  const { data: user } = useGetMe({ query: { retry: false } });
  const [activeTab, setActiveTab] = React.useState<"details" | "dc" | "related">("details");
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  const fmt = (d?: string | null) => {
    if (!d) return null;
    try { return format(new Date(d), "yyyy-MM-dd"); } catch { return d; }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4169E1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading material...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Material Not Found</h2>
          <p className="text-muted-foreground mb-6">This archival record does not exist or has been removed.</p>
          <Link href="/collections">
            <button className="bg-[#4169E1] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#3558c8] transition-colors">
              Back to Collections
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const accessBadge = {
    public: { label: "PUBLIC", className: "bg-[#4169E1]/10 text-[#4169E1] border border-[#4169E1]/20" },
    restricted: { label: "RESTRICTED", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    confidential: { label: "CONFIDENTIAL", className: "bg-[#960000]/10 text-[#960000] border border-[#960000]/20" },
  }[material.access] ?? { label: material.access.toUpperCase(), className: "bg-muted text-muted-foreground border border-border" };

  const fixityVerified = material.fixityStatus === "verified" || material.sha256;
  const canDownload = material.access === "public" || user?.role === "admin" || user?.role === "archivist";

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      {/* ─── TOP NAV ─── */}
      <header className="bg-white border-b border-border/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#4169E1] flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[#0a1628]">iArchive</span>
          </div>
          <Link href="/collections">
            <button className="flex items-center gap-2 text-sm font-semibold text-foreground border border-border px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
        </div>
      </header>

      {/* ─── BREADCRUMB ─── */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>›</span>
        <Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link>
        <span>›</span>
        <span className="text-foreground font-medium truncate max-w-xs">{material.title}</span>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* ─── LEFT PANEL ─── */}
          <div className="space-y-5">
            {/* Preview Card */}
            <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="bg-[#0a1628] text-white text-xs font-bold px-2.5 py-1 rounded">OAIS AIP</span>
                  <span className="text-xs font-mono text-muted-foreground">{material.aipId || "AIP-0000-0001"}</span>
                </div>
                {fixityVerified && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Checksum Verified
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div className="h-72 bg-[#f7f8fc] flex flex-col items-center justify-center relative">
                {material.thumbnailUrl ? (
                  <img src={material.thumbnailUrl} alt={material.title} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-28 bg-white border-2 border-border rounded-lg shadow-md flex items-center justify-center mx-auto mb-4 relative">
                      <FileText className="w-10 h-10 text-[#4169E1]/30" />
                      <div className="absolute top-2 right-2 w-3 h-3 bg-[#960000]/20 rounded-sm" />
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4169E1]/20 rounded-b" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{material.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{material.format || "application/pdf"}</p>
                  </div>
                )}
              </div>

              {/* View controls */}
              <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {[{ icon: ZoomIn }, { icon: ZoomOut }, { icon: RotateCcw }, { icon: Maximize2 }].map(({ icon: Icon }, i) => (
                    <button key={i} className="w-9 h-9 rounded-lg border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                {material.pages && (
                  <span className="text-sm text-muted-foreground font-medium">{material.pages} pages</span>
                )}
              </div>
            </div>

            {/* OAIS Preservation Info */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-3">
                <span className="bg-[#0a1628] text-white text-xs font-bold px-2.5 py-1 rounded">OAIS</span>
                <span className="text-sm font-bold text-foreground">ISO 14721:2012 — Preservation Information</span>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "SIP", value: material.sipId || "SIP-0000-001", sub: "Submission Information Package", mono: true },
                  { label: "AIP", value: material.aipId || "AIP-0000-001", sub: "Archival Information Package", mono: true },
                  { label: "INGEST", value: fmt(material.ingestDate) || "—", sub: material.ingestBy ? `By ${material.ingestBy}` : "Ingest date", mono: false },
                  { label: "FIXITY", value: fixityVerified ? "✓ Verified" : "Pending", sub: material.sha256 ? "SHA-256 checksum valid" : "Not yet computed", isGreen: fixityVerified, mono: false },
                  { label: "FORMAT", value: material.format || "—", sub: "MIME type", mono: false },
                  { label: "CAPTURE", value: material.scanner || "—", sub: material.resolution ? `${material.resolution} DPI` : "Capture device", mono: false },
                ].map((item, i) => (
                  <div key={i} className="bg-[#f7f8fc] rounded-xl p-4 border border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                    <p className={`text-sm font-bold mb-0.5 ${item.isGreen ? "text-emerald-600" : "text-[#4169E1]"} ${item.mono ? "font-mono" : ""}`}>
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Items */}
            {material.relatedItems && material.relatedItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
                <h3 className="text-base font-bold text-foreground mb-4">Related Items</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {material.relatedItems.map((rel) => (
                    <Link key={rel.id} href={`/materials/${rel.id}`}>
                      <div className="flex items-center gap-3 p-4 border border-border/60 rounded-xl hover:border-[#4169E1]/30 hover:bg-[#4169E1]/5 transition-all cursor-pointer group">
                        <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-foreground group-hover:text-[#4169E1] transition-colors truncate">{rel.title}</p>
                          <p className="text-xs text-muted-foreground">{rel.categoryName} · {rel.date ? fmt(rel.date) : "—"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div className="space-y-5">
            {/* Title card - sticky */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 lg:sticky lg:top-20">
              <div className="flex flex-wrap gap-2 mb-4">
                {material.categoryName && (
                  <span className="bg-[#0a1628] text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide">
                    {material.categoryName}
                  </span>
                )}
                <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide ${accessBadge.className}`}>
                  {accessBadge.label}
                </span>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-md capitalize">
                  {material.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#0a1628] mb-5 leading-snug">{material.title}</h1>

              {/* Tabs */}
              <div className="border-b border-border/60 mb-5">
                <div className="flex gap-1">
                  {(["details", "dc", "related"] as const).map((tab) => {
                    const labels = { details: "Details", dc: "Dublin Core", related: "Related Items" };
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab
                          ? "border-[#4169E1] text-[#4169E1]"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab: ISAD(G) Details */}
              {activeTab === "details" && (
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                  <IsadSection num={1} title="IDENTITY STATEMENT">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Ref. Code" value={material.materialId} />
                      <Field label="Title" value={material.title} />
                      <Field label="Alt. Title" value={material.altTitle} />
                      <Field label="Date" value={fmt(material.date)} />
                      <Field label="Level" value="Item" />
                      <Field label="Extent" value={material.pages ? `${material.pages} pages` : material.fileSize ? `${material.fileSize}` : undefined} />
                    </div>
                  </IsadSection>
                  <IsadSection num={2} title="CONTEXT">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Creator" value={material.creator} />
                      <Field label="Publisher" value={material.publisher} />
                      <Field label="Contributor" value={material.contributor} />
                      <Field label="Archival History" value={material.archivalHistory} />
                      <Field label="Custodial History" value={material.custodialHistory} />
                    </div>
                  </IsadSection>
                  <IsadSection num={3} title="CONTENT & STRUCTURE">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Scope & Content" value={material.scopeContent} />
                      <Field label="Arrangement" value={material.arrangement} />
                      <Field label="Description" value={material.description} />
                      <Field label="Language" value={material.language} />
                      <Field label="Format" value={material.format} />
                    </div>
                  </IsadSection>
                  <IsadSection num={4} title="ACCESS & USE">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Access Level" value={material.access} />
                      <Field label="Rights" value={material.rights} />
                      <Field label="Physical Location" value={material.physicalLocation} />
                      <Field label="Physical Condition" value={material.physicalCondition} />
                    </div>
                  </IsadSection>
                </div>
              )}

              {/* Tab: Dublin Core */}
              {activeTab === "dc" && (
                <div className="max-h-[55vh] overflow-y-auto pr-1">
                  <dl className="bg-[#f7f8fc] rounded-xl border border-border/60 divide-y divide-border/50">
                    <div className="px-5"><Field label="dc:title" value={material.title} /></div>
                    <div className="px-5"><Field label="dc:creator" value={material.creator} /></div>
                    <div className="px-5"><Field label="dc:subject" value={material.subject} /></div>
                    <div className="px-5"><Field label="dc:description" value={material.description} /></div>
                    <div className="px-5"><Field label="dc:publisher" value={material.publisher} /></div>
                    <div className="px-5"><Field label="dc:contributor" value={material.contributor} /></div>
                    <div className="px-5"><Field label="dc:date" value={fmt(material.date)} /></div>
                    <div className="px-5"><Field label="dc:type" value={material.type || "Text"} /></div>
                    <div className="px-5"><Field label="dc:format" value={material.format} /></div>
                    <div className="px-5"><Field label="dc:identifier" value={material.identifier || material.materialId} /></div>
                    <div className="px-5"><Field label="dc:source" value={material.source} /></div>
                    <div className="px-5"><Field label="dc:language" value={material.language} /></div>
                    <div className="px-5"><Field label="dc:relation" value={material.relation} /></div>
                    <div className="px-5"><Field label="dc:coverage" value={material.coverage} /></div>
                    <div className="px-5"><Field label="dc:rights" value={material.rights} /></div>
                  </dl>
                </div>
              )}

              {/* Tab: Related */}
              {activeTab === "related" && (
                <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
                  {(material.relatedItems?.length ?? 0) === 0 ? (
                    <div className="text-center py-10">
                      <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No related items found.</p>
                    </div>
                  ) : (
                    material.relatedItems?.map((rel) => (
                      <Link key={rel.id} href={`/materials/${rel.id}`}>
                        <div className="flex items-center gap-3 p-3.5 border border-border/60 rounded-xl hover:border-[#4169E1]/40 hover:bg-[#4169E1]/5 transition-all cursor-pointer group">
                          <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold group-hover:text-[#4169E1] transition-colors">{rel.title}</p>
                            <p className="text-xs text-muted-foreground">{rel.categoryName} · {fmt(rel.date) || "—"}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Download Button */}
              <div className="mt-5 pt-5 border-t border-border/60">
                {canDownload && material.fileUrl ? (
                  <button onClick={() => setShowDownloadModal(true)} className="w-full bg-[#0a1628] hover:bg-[#4169E1] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                    <Download className="w-5 h-5" /> Download
                  </button>
                ) : canDownload && !material.fileUrl ? (
                  <button disabled className="w-full bg-muted text-muted-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <Download className="w-5 h-5" /> No File Attached
                  </button>
                ) : (
                  <Link
                    href={`/register?materialId=${encodeURIComponent(material.id)}&title=${encodeURIComponent(material.title)}&date=${encodeURIComponent(material.date ?? "")}&cover=${encodeURIComponent(material.thumbnailUrl ?? "")}`}
                  >
                    <button className="w-full bg-[#960000] hover:bg-[#7a0000] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" /> Request Access
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-3 text-[#960000]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-lg">Download Disabled</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Direct downloading is currently disabled by repository policy. Please submit an access request or contact the archive administrator for controlled release.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDownloadModal(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50">
                Close
              </button>
              <Link href="/register">
                <button onClick={() => setShowDownloadModal(false)} className="px-4 py-2 rounded-lg bg-[#960000] text-white text-sm font-semibold hover:bg-[#7a0000]">
                  Request Access
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
