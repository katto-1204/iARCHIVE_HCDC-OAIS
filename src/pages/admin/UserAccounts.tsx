import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { Search, UserCheck, UserX, Trash2, Users, Clock, ShieldCheck, Shield, Eye, Upload, Edit, Settings, UserPlus, FileText, Loader2, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetUsers, useApproveUser, useRejectUser, useDeleteUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserAccounts() {
  const [tab, setTab] = React.useState<"active" | "pending" | "rejected">("active");
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "student" | "alumni" | "researcher" | "faculty">("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const { data, isLoading, refetch } = useGetUsers({ status: tab as any });
  const { mutate: approve, isPending: isApproving } = useApproveUser();
  const { mutate: reject, isPending: isRejecting } = useRejectUser();
  const { mutate: remove, isPending: isDeleting } = useDeleteUser();
  const { toast } = useToast();

  // Deletion State
  const [deleteDialog, setDeleteDialog] = React.useState<{id: string, name: string} | null>(null);
  // View Details
  const [viewingUser, setViewingUser] = React.useState<any>(null);

  // Rejection reason modal state
  const [rejectDialog, setRejectDialog] = React.useState<{id: string, name: string} | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  // Reset page on tab/filter change
  React.useEffect(() => { setCurrentPage(1); }, [tab, search, roleFilter]);

  const handleApprove = (id: string) => {
    approve({ id }, {
      onSuccess: () => {
        toast({ title: "User Approved", description: "The user account has been activated." });
        refetch();
      },
      onError: () => toast({ title: "Error", description: "Failed to approve user.", variant: "destructive" })
    });
  };

  const handleReject = (id: string, name: string) => {
    setRejectDialog({ id, name });
    setRejectReason("");
  };

  const confirmReject = () => {
    if (!rejectDialog) return;
    reject({ id: rejectDialog.id, data: { reason: rejectReason } }, {
      onSuccess: () => {
        toast({ title: "User Rejected", description: `${rejectDialog.name}'s registration has been denied.` });
        setRejectDialog(null);
        setRejectReason("");
        refetch();
      },
      onError: () => toast({ title: "Error", description: "Failed to reject user.", variant: "destructive" })
    });
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ id, name });
  };

  const confirmDelete = () => {
    if (deleteDialog) {
      remove({ id: deleteDialog.id }, {
        onSuccess: () => {
          toast({ title: "Deleted", description: "User has been removed." });
          setDeleteDialog(null);
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
      student: "default",
    };
    return <Badge variant={variants[role] || "default"} className="capitalize">{role}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    if (!category) return <span className="text-muted-foreground/40 italic">—</span>;
    const colors: Record<string, string> = {
      student: "bg-blue-50 text-blue-700 border-blue-200",
      alumni: "bg-amber-50 text-amber-700 border-amber-200",
      researcher: "bg-purple-50 text-purple-700 border-purple-200",
      faculty: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    const colorClass = colors[category.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200";
    return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${colorClass}`}>{category}</span>;
  };

  // Filter: exclude admin/archivist (those belong to Admin Accounts page)
  const filtered = React.useMemo(() => {
    const isAdminAccount = (u: any) => {
      const role = String(u?.role || "").toLowerCase();
      const category = String(u?.userCategory || "").toLowerCase();
      return role === "admin" || role === "archivist" || category === "administrator" || category === "staff";
    };
    let list = (data?.users || []).filter((u: any) => !isAdminAccount(u));
    
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u: any) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.institution || "").toLowerCase().includes(q) ||
        (u.userCategory || "").toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      list = list.filter((u: any) => (u.userCategory || u.role || "").toLowerCase() === roleFilter);
    }

    return list;
  }, [data?.users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Count stats
  const allUsers = (data?.users || []).filter((u: any) => {
    const role = String(u?.role || "").toLowerCase();
    const category = String(u?.userCategory || "").toLowerCase();
    return !(role === "admin" || role === "archivist" || category === "administrator" || category === "staff");
  });
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allUsers.forEach((u: any) => {
      const cat = (u.userCategory || u.role || "uncategorized").toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allUsers]);

  const tabConfig = [
    { id: "active", label: "Active Users", icon: ShieldCheck, color: "text-emerald-600" },
    { id: "pending", label: "Pending Approval", icon: Clock, color: "text-amber-600" },
    { id: "rejected", label: "Rejected Users", icon: UserX, color: "text-red-600" },
  ] as const;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#0a1628]">User Accounts</h1>
          <p className="text-muted-foreground">Manage all user accounts — Students, Alumni, Researchers, and Faculty.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-4 py-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {filtered.length} user(s)
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: allUsers.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
          { label: "Students", value: categoryCounts["student"] || 0, icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
          { label: "Alumni", value: categoryCounts["alumni"] || 0, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { label: "Researchers", value: categoryCounts["researcher"] || 0, icon: FileText, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
        ].map(stat => (
          <Card key={stat.label} className={`shadow-sm border ${stat.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0a1628]">{stat.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
        {/* Tab Navigation */}
        <div className="border-b px-4 flex gap-6">
          {tabConfig.map(t => (
            <button
              key={t.id}
              className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon className={`w-4 h-4 ${tab === t.id ? t.color : ''}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="p-5 border-b bg-muted/5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              className="pl-9 bg-muted/50"
              placeholder="Search by name, email, institution, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
              <SelectTrigger className="w-[160px] h-9 bg-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="researcher">Researcher</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden lg:table-cell">Institution</TableHead>
                <TableHead className="hidden xl:table-cell">Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16">
                    <div className="h-8 w-full rounded-md bg-muted/40 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="w-10 h-10 opacity-20" />
                    <p>No {tab} users found{search ? ` matching "${search}"` : ""}.</p>
                    {tab === 'pending' && <p className="text-sm">All registrations have been processed.</p>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user: any) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium block">{user.name}</span>
                        <span className="text-[11px] text-muted-foreground md:hidden">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>{getCategoryBadge(user.userCategory || user.role)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{user.institution || <span className="text-muted-foreground/40 italic">—</span>}</TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {user.createdAt ? (() => {
                      const date = new Date(user.createdAt);
                      return isNaN(date.getTime()) ? "N/A" : format(date, 'MMM d, yyyy');
                    })() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1"
                        onClick={() => setViewingUser(user)}
                      >
                        <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">View</span>
                      </Button>
                      {tab === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                            onClick={() => handleApprove(user.id)}
                            disabled={isApproving || isRejecting}
                          >
                            {isApproving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-1"
                            onClick={() => handleReject(user.id, user.name)}
                            disabled={isApproving || isRejecting}
                          >
                            {isRejecting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserX className="w-3.5 h-3.5" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}
                      {tab === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Remove</span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/5">
            <p className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} users
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              ).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 p-0 text-xs ${currentPage === page ? 'bg-primary text-white' : ''}`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ User Details Modal ═══ */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border-none p-0 shadow-2xl">
          <div className="h-2 bg-[#4169E1]" />
          <div className="p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-display font-bold text-[#0a1628]">User Details</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium">
                      Reviewing account for <span className="text-[#0a1628] font-bold">{viewingUser?.name}</span>
                    </DialogDescription>
                  </div>
                </div>
                {viewingUser && (
                  <Badge variant={viewingUser.status === 'pending' ? 'default' : viewingUser.status === 'active' ? 'success' : 'outline'} className={`uppercase tracking-widest text-[10px] px-3 py-1 shadow-sm ${viewingUser.status === 'rejected' ? 'text-red-600 border-red-200 bg-red-50' : ''}`}>
                    {viewingUser.status}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 block">Personal Information</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Full Name</p>
                        <p className="text-sm font-bold text-[#0a1628] truncate">{viewingUser?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Email Address</p>
                        <p className="text-sm font-bold text-[#0a1628] truncate">{viewingUser?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 block">Affiliation</label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Institution</p>
                      <p className="text-sm font-bold text-[#0a1628]">{viewingUser?.institution || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 block">Account Details</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">User Category</p>
                        <div className="mt-0.5">{viewingUser ? getCategoryBadge(viewingUser.userCategory || viewingUser.role) : null}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Registration Date</p>
                        <p className="text-sm font-bold text-[#0a1628]">
                          {viewingUser?.createdAt ? format(new Date(viewingUser.createdAt), 'MMMM d, yyyy HH:mm') : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-full">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 block">Research Purpose / Field</label>
                <div className="p-5 bg-muted/20 border-2 border-dashed border-muted-foreground/10 rounded-2xl">
                  <p className="text-sm text-[#0a1628] font-medium leading-relaxed italic">
                    "{viewingUser?.purpose || "The user did not specify a research purpose for this account application."}"
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-muted/50">
              <Button variant="ghost" onClick={() => setViewingUser(null)} className="font-bold">Close</Button>
              
              {(viewingUser?.status === "pending" || tab === "pending") && (
                <div className="flex flex-1 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 font-bold h-12 rounded-xl transition-all active:scale-[0.98]"
                    onClick={() => { handleReject(viewingUser.id, viewingUser.name); setViewingUser(null); }}
                    disabled={isRejecting}
                  >
                    {isRejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
                    Deny
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                    onClick={() => { handleApprove(viewingUser.id); setViewingUser(null); }}
                    disabled={isApproving}
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                </div>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Confirm Deletion Modal ═══ */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove {deleteDialog?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteDialog(null)} disabled={isDeleting}>Cancel</Button>
            <Button 
              className="bg-red-600 text-white hover:bg-red-700 font-bold" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Rejection Reason Modal ═══ */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border-none p-0 shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-700" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                  <UserX className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-[#0a1628]">Reject Application</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Rejecting <span className="font-semibold text-[#0a1628]">{rejectDialog?.name}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0a1628]">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete information, unverifiable institution, duplicate account..."
                className="w-full min-h-[100px] rounded-xl border border-border/60 bg-muted/30 p-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 resize-none"
              />
              <p className="text-[11px] text-muted-foreground">This reason will be shown to the user when they try to log in.</p>
            </div>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setRejectDialog(null)} disabled={isRejecting}>Cancel</Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700 font-bold gap-2"
                onClick={confirmReject}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</>
                ) : (
                  <><UserX className="w-4 h-4" /> Confirm Rejection</>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
