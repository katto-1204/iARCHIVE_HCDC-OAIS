import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Button, Input } from "@/components/ui-components";
import { Textarea } from "@/components/ui/textarea";
import { useGetMe, useUpdateProfile } from "@/lib/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Mail, Building, FileText, Save, Loader2, ShieldCheck, Settings, Pencil, MapPin, Briefcase } from "lucide-react";

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
        toast({ title: "Profile Updated", description: "Your profile information has been saved successfully." });
        setIsEditing(false);
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;

  const roleLabel = (user?.userCategory || user?.role || "student").toUpperCase();
  const initials = (user?.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-medium text-[#0a1628] tracking-tight">Account Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your personal information and research preferences.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto bg-[#4169E1] hover:bg-[#3558c0] text-white shadow-lg shadow-[#4169E1]/20 rounded-xl h-11 px-6 gap-2 transition-all">
                <Pencil className="w-4 h-4" /> Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); if(user) setForm({name: user.name, institution: user.institution||"", purpose: user.purpose||""}); }} className="flex-1 sm:flex-none border-border/60 hover:bg-muted/50 rounded-xl h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" form="profile-form" disabled={isPending} className="flex-1 sm:flex-none bg-[#960000] hover:bg-[#7a0000] text-white shadow-lg shadow-[#960000]/20 rounded-xl h-11 px-6 gap-2 transition-all">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Identity Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden relative">
              {/* Background accent */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#0a1628] to-[#1e3a8a] opacity-90" />
              <div className="absolute top-0 left-0 right-0 h-32 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%3E%3Cpath%20d%3D%22M0%200h40v40H0z%22%20fill%3D%22none%22/%3E%3Cpath%20d%3D%22M20%200l20%2020-20%2020L0%2020z%22%20fill%3D%22rgba(255,255,255,0.03)%22/%3E%3C/svg%3E')] opacity-30 mix-blend-overlay pointer-events-none" />
              
              <div className="px-6 pb-8 pt-16 relative z-10 flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-xl mb-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl font-display font-bold text-[#0a1628]">
                    {initials}
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-[#0a1628] tracking-tight">{user?.name}</h2>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4169E1]/10 text-[#4169E1] text-xs font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" /> {roleLabel}
                </div>
                
                <div className="w-full h-px bg-border/40 my-6" />
                
                <div className="w-full space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</span>
                    <span className="text-[#0a1628] font-medium text-right">Davao City, PH</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Account</span>
                    <span className="text-emerald-600 font-bold text-right flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-emerald-900 mb-1">Identity Verified</h3>
              <p className="text-xs text-emerald-700/80 leading-relaxed mb-4">Your account is fully verified for accessing restricted digital materials.</p>
              <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl h-10 text-xs font-bold uppercase tracking-wider">
                <Settings className="w-3.5 h-3.5 mr-2" /> Security Preferences
              </Button>
            </div>
          </div>

          {/* Right Column: Edit Forms & Details */}
          <div className="lg:col-span-2 space-y-6">
            <form id="profile-form" onSubmit={handleSubmit} className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 sm:p-8">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                <Mail className="w-4 h-4" /> General Information
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#0a1628]">Full Name</label>
                    <Input 
                      value={isEditing ? form.name : (user?.name || "")} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      disabled={!isEditing}
                      className="h-12 rounded-xl bg-muted/20 border-border/50 disabled:opacity-80 disabled:bg-muted/40 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#0a1628]">Email Address (Cannot be changed)</label>
                    <Input 
                      value={user?.email || ""} 
                      disabled 
                      className="h-12 rounded-xl border-border/50 bg-muted/40 opacity-80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0a1628]">Institution / Affiliation</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={isEditing ? form.institution : (user?.institution || "None provided")} 
                      onChange={e => setForm({...form, institution: e.target.value})}
                      disabled={!isEditing}
                      placeholder="e.g. Holy Cross of Davao College"
                      className="pl-11 h-12 rounded-xl bg-muted/20 border-border/50 disabled:opacity-80 disabled:bg-muted/40 font-medium"
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="bg-white rounded-3xl border border-border/60 shadow-sm p-6 sm:p-8">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Research Profile
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#0a1628]">Primary Research Purpose</label>
                {isEditing ? (
                  <Textarea 
                    value={form.purpose} 
                    onChange={e => setForm({...form, purpose: e.target.value})}
                    placeholder="Describe your research focus or why you are accessing the digital archives..."
                    className="min-h-[140px] rounded-xl bg-muted/20 border-border/50 p-4 font-medium resize-none"
                  />
                ) : (
                  <div className="min-h-[140px] rounded-xl bg-muted/30 border border-border/30 p-5">
                    {user?.purpose ? (
                      <p className="text-sm leading-relaxed text-[#0a1628]">{user.purpose}</p>
                    ) : (
                      <p className="text-sm leading-relaxed text-muted-foreground italic">No research purpose has been specified. Click 'Edit Profile' to add your research goals and assist archivists in providing better recommendations.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
