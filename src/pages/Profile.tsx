import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Button, Input } from "@/components/ui-components";
import { Textarea } from "@/components/ui/textarea";
import { useGetMe, useUpdateProfile } from "@/lib/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Mail, Building, FileText, Save, Loader2, ShieldCheck, Settings, Pencil, Calendar } from "lucide-react";

export default function Profile() {
  const { data: user, isLoading } = useGetMe();
  const { mutate: update, isPending } = useUpdateProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    institution: "",
    purpose: ""
  });

  React.useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        institution: user.institution || "",
        purpose: user.purpose || ""
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({ data: form }, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your profile information has been saved." });
        setIsEditing(false);
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;

  const roleLabel = (user?.userCategory || user?.role || "student").toUpperCase();
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "N/A";
  const initials = (user?.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {/* Cover Banner */}
          <div className="h-36 bg-gradient-to-r from-[#960000] to-[#6b0000] relative">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22/%3E%3C/filter%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20filter%3D%22url(%23n)%22/%3E%3C/svg%3E')]" />
          </div>

          {/* Avatar & Name Section */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-10 relative z-10">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-[#960000] shrink-0">
                {initials}
              </div>

              {/* Name & Meta */}
              <div className="flex-1 pt-2 sm:pt-0">
                <h2 className="text-2xl font-bold text-[#0a1628]">{user?.name || "User"}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#960000] text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    {roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Member Since {memberSince}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                {!isEditing ? (
                  <>
                    <Button variant="outline" className="gap-2 h-10 rounded-xl border-border/60" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit Profile
                    </Button>
                    <Button variant="default" className="gap-2 h-10 rounded-xl bg-[#0a1628] hover:bg-[#0a1628]/90">
                      <Settings className="w-3.5 h-3.5" /> Account Settings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="h-10 rounded-xl border-border/60" onClick={() => { setIsEditing(false); if (user) setForm({ name: user.name || "", institution: user.institution || "", purpose: user.purpose || "" }); }}>
                      Cancel
                    </Button>
                    <Button type="submit" form="profile-form" disabled={isPending} className="gap-2 h-10 rounded-xl bg-[#4169E1] hover:bg-[#3558c0]">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Contact Information */}
              <div>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                    <div className="w-9 h-9 rounded-lg bg-[#4169E1]/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-[#4169E1]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Primary Email</p>
                      <p className="text-sm font-semibold text-[#0a1628] truncate">{user?.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                    <div className="w-9 h-9 rounded-lg bg-[#4169E1]/10 flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4 text-[#4169E1]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Institution / Affiliation</p>
                      {isEditing ? (
                        <Input value={form.institution} onChange={e => setForm({...form, institution: e.target.value})} placeholder="e.g. HCDC" className="mt-1 h-9 text-sm" />
                      ) : (
                        <p className="text-sm font-semibold text-[#0a1628]">{user?.institution || "Not specified"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Profile */}
              <div>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Research Profile</h3>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/30 min-h-[124px]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#960000]/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#960000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Primary Research Purpose</p>
                      {isEditing ? (
                        <Textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Describe your research purpose..." className="mt-1 min-h-[80px] text-sm" />
                      ) : (
                        <p className={`text-sm mt-1 leading-relaxed ${user?.purpose ? 'font-medium text-[#0a1628]' : 'text-muted-foreground italic'}`}>
                          {user?.purpose || '"No research purpose has been specified for this account. You can update this in your profile settings."'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit form (hidden, for submit binding) */}
            {isEditing && (
              <form id="profile-form" onSubmit={handleSubmit} className="mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" required className="mt-1" />
                  </div>
                </div>
              </form>
            )}

            {/* Verified Account Banner */}
            <div className="mt-8 flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-900">Verified Research Account</p>
                <p className="text-xs text-emerald-600">Your credentials have been verified by the HCDC Archival Administration team.</p>
              </div>
              <a href="/terms" className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider hover:underline shrink-0">Privacy Charter</a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
