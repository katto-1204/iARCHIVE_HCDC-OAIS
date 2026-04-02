import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { Search, UserCheck, UserX, Trash2, Users, Clock, ShieldCheck, Shield, Eye, Upload, Edit, Settings } from "lucide-react";
import { useGetUsers, useApproveUser, useRejectUser, useDeleteUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface AdminPermissions {
  view: boolean;
  upload: boolean;
  edit: boolean;
  delete: boolean;
  manageUsers: boolean;
}

const DEFAULT_PERMISSIONS: Record<string, AdminPermissions> = {
  admin: { view: true, upload: true, edit: true, delete: true, manageUsers: true },
  archivist: { view: true, upload: true, edit: true, delete: false, manageUsers: false },
  student: { view: true, upload: false, edit: false, delete: false, manageUsers: false },
};

const PERMISSION_LABELS = [
  { key: "view", label: "View Materials", icon: Eye, desc: "Browse and view archival materials" },
  { key: "upload", label: "Upload / Ingest", icon: Upload, desc: "Upload new materials into the archive" },
  { key: "edit", label: "Edit Metadata", icon: Edit, desc: "Modify metadata fields on materials" },
  { key: "delete", label: "Delete Materials", icon: Trash2, desc: "Permanently delete archival items" },
  { key: "manageUsers", label: "Manage Users", icon: Users, desc: "Approve/reject users, change roles" },
] as const;

export default function AdminUsers() {
  const [tab, setTab] = React.useState<"active" | "pending" | "rejected">("active");
  const [search, setSearch] = React.useState("");
  const { data, isLoading, refetch } = useGetUsers({ status: tab as any });
  const { mutate: approve } = useApproveUser();
  const { mutate: reject } = useRejectUser();
  const { mutate: remove } = useDeleteUser();
  const { toast } = useToast();

  // Permissions management
  const [permissionsOpen, setPermissionsOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [userPerms, setUserPerms] = React.useState<AdminPermissions>(DEFAULT_PERMISSIONS.admin);

  const handleApprove = (id: string) => {
    approve({ id }, {
      onSuccess: () => {
        toast({ title: "User Approved", description: "The user account has been activated." });
        refetch();
      },
      onError: () => toast({ title: "Error", description: "Failed to approve user.", variant: "destructive" })
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Enter reason for rejection (optional):");
    if (reason !== null) {
      reject({ id }, {
        onSuccess: () => {
          toast({ title: "User Rejected", description: "The registration has been denied." });
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to reject user.", variant: "destructive" })
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Permanently delete user "${name}"? This cannot be undone.`)) {
      remove({ id }, {
        onSuccess: () => {
          toast({ title: "Deleted", description: "User has been removed." });
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" })
      });
    }
  };

  const openPermissions = (user: any) => {
    setEditingUser(user);
    setUserPerms(DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.student);
    setPermissionsOpen(true);
  };

  const savePermissions = () => {
    toast({
      title: "Permissions Updated",
      description: `Access control for ${editingUser?.name} has been saved.`,
    });
    setPermissionsOpen(false);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "success" | "accent"> = {
      admin: "accent",
      archivist: "success",
      student: "default",
    };
    return <Badge variant={variants[role] || "default"} className="capitalize">{role}</Badge>;
  };

  const filtered = data?.users?.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.institution || "").toLowerCase().includes(search.toLowerCase())
  );

  const tabConfig = [
    { id: "active", label: "Admin Accounts", icon: ShieldCheck },
    { id: "pending", label: "Pending Approval", icon: Clock },
    { id: "rejected", label: "Rejected", icon: UserX },
  ] as const;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#0a1628]">Admin Accounts & User Management</h1>
          <p className="text-muted-foreground">Manage role-based permissions and review registration requests.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-4 py-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary">
            {data?.users?.length || 0} {tab} users
          </span>
        </div>
      </div>

      {/* Permission Matrix Card (shown on Active tab) */}
      {tab === "active" && (
        <Card className="mb-6 shadow-sm border-border/50 bg-white">
          <CardHeader className="border-b border-border/50 pb-3">
            <CardTitle className="text-sm font-bold text-[#0a1628] flex items-center gap-2 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-[#4169E1]" /> Role Permission Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-bold text-muted-foreground">Permission</th>
                    <th className="text-center py-3 px-4 font-bold text-[#960000]">Admin</th>
                    <th className="text-center py-3 px-4 font-bold text-emerald-600">Archivist</th>
                    <th className="text-center py-3 px-4 font-bold text-[#4169E1]">Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {PERMISSION_LABELS.map(p => (
                    <tr key={p.key} className="hover:bg-muted/10">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <p.icon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-semibold text-foreground text-xs">{p.label}</span>
                            <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                          </div>
                        </div>
                      </td>
                      {(["admin", "archivist", "student"] as const).map(role => (
                        <td key={role} className="text-center py-2.5 px-4">
                          {DEFAULT_PERMISSIONS[role][p.key as keyof AdminPermissions] ? (
                            <span className="text-emerald-500 font-bold">✔</span>
                          ) : (
                            <span className="text-red-300">✘</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="border-b px-4 flex gap-6">
          {tabConfig.map(t => (
            <button
              key={t.id}
              className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              className="pl-9 bg-muted/50"
              placeholder="Search by name, email, institution..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground">Loading users...</TableCell></TableRow>
            ) : (filtered?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-10 h-10 opacity-20" />
                    <p>No {tab} users found.</p>
                    {tab === 'pending' && <p className="text-sm">All registrations have been processed.</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map(user => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.institution || <span className="text-muted-foreground/40 italic">—</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{user.userCategory || <span className="text-muted-foreground/40 italic">—</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {user.createdAt ? (() => {
                      const date = new Date(user.createdAt);
                      return isNaN(date.getTime()) ? "N/A" : format(date, 'MMM d, yyyy');
                    })() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tab === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#4169E1] border-[#4169E1]/20 hover:bg-[#4169E1]/10 gap-1"
                            onClick={() => openPermissions(user)}
                          >
                            <Settings className="w-3.5 h-3.5" /> Permissions
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() => handleDelete(user.id, user.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </Button>
                        </>
                      )}
                      {tab === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                            onClick={() => handleApprove(user.id)}
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-1"
                            onClick={() => handleReject(user.id)}
                          >
                            <UserX className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </>
                      )}
                      {tab === 'rejected' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                            onClick={() => handleApprove(user.id)}
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Re-approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(user.id, user.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ═══ Permissions Dialog ═══ */}
      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Configure Permissions
            </DialogTitle>
            <DialogDescription>
              Set access control for <strong>{editingUser?.name}</strong> ({editingUser?.role}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {PERMISSION_LABELS.map(p => (
              <div key={p.key} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <p.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                  </div>
                </div>
                <Switch
                  checked={userPerms[p.key as keyof AdminPermissions]}
                  onCheckedChange={(checked) => setUserPerms({ ...userPerms, [p.key]: checked })}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPermissionsOpen(false)}>Cancel</Button>
            <Button onClick={savePermissions} className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
