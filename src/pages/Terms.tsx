import { PublicLayout } from "@/components/layout";

export default function Terms() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#f7f8fc] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 md:p-10">
            <h1 className="text-3xl font-bold text-[#0a1628] mb-3">Terms of Use</h1>
            <p className="text-sm text-muted-foreground mb-8">
              By using iArchive, you agree to responsible, academic, and lawful use of Holy Cross of Davao College archival resources.
            </p>
            <div className="space-y-5 text-sm text-muted-foreground">
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
