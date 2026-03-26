import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button, Input } from "@/components/ui-components";
import { Search, UserCheck, UserX, Trash2, Users, Clock, ShieldCheck } from "lucide-react";
import { useGetUsers, useApproveUser, useRejectUser, useDeleteUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const [tab, setTab] = React.useState<"pending" | "active" | "rejected">("pending");
  const [search, setSearch] = React.useState("");
  const { data, isLoading, refetch } = useGetUsers({ status: tab as any });
  const { mutate: approve } = useApproveUser();
  const { mutate: reject } = useRejectUser();
  const { mutate: remove } = useDeleteUser();
  const { toast } = useToast();

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

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "success" | "accent"> = {
      admin: "accent",
      archivist: "success",
      user: "default",
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
    { id: "pending", label: "Pending Approval", icon: Clock },
    { id: "active", label: "Active Users", icon: UserCheck },
    { id: "rejected", label: "Rejected", icon: UserX },
  ] as const;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">User Management</h1>
          <p className="text-muted-foreground">Review registrations and manage user access to iArchive.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-4 py-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary">
            {data?.users?.length || 0} {tab} users
          </span>
        </div>
      </div>

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
                      {tab === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                          onClick={() => handleDelete(user.id, user.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </Button>
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
    </AdminLayout>
  );
}
