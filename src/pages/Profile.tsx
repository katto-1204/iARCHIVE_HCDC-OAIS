import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui-components";
import { Textarea } from "@/components/ui/textarea";
import { useGetMe, useUpdateProfile } from "@/lib/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { User, Building, FileText, Save, Loader2, Shield } from "lucide-react";

export default function Profile() {
  const { data: user, isLoading } = useGetMe();
  const { mutate: update, isPending } = useUpdateProfile();
  const { toast } = useToast();

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
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-[#0a1628]">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information and research details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <Input 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <Input value={user?.email || ""} disabled className="bg-muted/50 cursor-not-allowed" />
                    <p className="text-[10px] text-muted-foreground italic">Email changes require support contact.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Institution / Affiliation</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      className="pl-9"
                      value={form.institution} 
                      onChange={e => setForm({...form, institution: e.target.value})}
                      placeholder="e.g. Holy Cross of Davao College"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Research Purpose / Field</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea 
                      className="pl-9 min-h-[120px]"
                      value={form.purpose} 
                      onChange={e => setForm({...form, purpose: e.target.value})}
                      placeholder="Describe your research field or why you are accessing the archive..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isPending} className="gap-2 shadow-lg px-8">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-border/50 bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-primary" /> Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/10 shadow-sm">
                <span className="text-xs font-bold text-muted-foreground uppercase">Role</span>
                <span className="text-sm font-bold text-primary uppercase tracking-tight">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/10 shadow-sm">
                <span className="text-xs font-bold text-muted-foreground uppercase">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-tight">{user?.status}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
                Your account is currently {user?.status}. Your role determines your access permissions within the digital repository.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
