import * as React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui-components";
import { useGetAccessRequests, useApproveRequest, useRejectRequest, useGetMe, useGetIngestRequests, useApproveIngestRequest, useRejectIngestRequest, useUpdateMaterial } from "@workspace/api-client-react";
import { getMaterialById, saveMaterial, addActivity } from "@/data/storage";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AdminRequests() {
  const { data: me } = useGetMe();
  const [mode, setMode] = React.useState<"access" | "ingest">("access");
  const [tab, setTab] = React.useState<"pending" | "approved" | "rejected">("pending");
  const { data, isLoading, refetch: refetchAccess } = useGetAccessRequests({ status: tab });
  const { data: ingestData, isLoading: ingestLoading, refetch: refetchIngest } = useGetIngestRequests({ status: tab });
  
  const { mutate: approve, isPending: isApproving } = useApproveRequest();
  const { mutate: reject, isPending: isRejecting } = useRejectRequest();
  const { mutate: approveIngest, isPending: isApprovingIngest } = useApproveIngestRequest();
  const { mutate: rejectIngest, isPending: isRejectingIngest } = useRejectIngestRequest();
  const { toast } = useToast();

  // Optimistic UI state to hide processed items immediately
  const [hiddenItems, setHiddenItems] = React.useState<Set<string>>(new Set());

  // Dialog states
  const [approveAccessDialog, setApproveAccessDialog] = React.useState<{id: string, title: string} | null>(null);
  const [rejectAccessDialog, setRejectAccessDialog] = React.useState<{id: string, title: string} | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const [approveIngestDialog, setApproveIngestDialog] = React.useState<{id: string, title: string} | null>(null);
  const [rejectIngestDialog, setRejectIngestDialog] = React.useState<{id: string, title: string} | null>(null);

  const confirmApproveAccess = () => {
    if (!approveAccessDialog) return;
    const reqId = approveAccessDialog.id;
    approve({ id: reqId }, {
      onSuccess: () => {
        toast({ title: "Approved", description: "Request granted." });
        setHiddenItems(prev => new Set(prev).add(reqId));
        refetchAccess();
        setApproveAccessDialog(null);
      },
      onError: () => {
        toast({ title: "Approval Failed", description: "Could not approve this request.", variant: "destructive" });
      }
    });
  };

  const confirmRejectAccess = () => {
    if (!rejectAccessDialog) return;
    const reqId = rejectAccessDialog.id;
    reject({ id: reqId, data: { reason: rejectReason } }, {
      onSuccess: () => {
        toast({ title: "Rejected", description: "Request denied." });
        setHiddenItems(prev => new Set(prev).add(reqId));
        refetchAccess();
        setRejectAccessDialog(null);
        setRejectReason("");
      },
      onError: () => {
        toast({ title: "Rejection Failed", description: "Could not reject this request.", variant: "destructive" });
      }
    });
  };

  const { mutateAsync: updateMaterialAsync } = useUpdateMaterial();

  const confirmApproveIngest = async () => {
    if (!approveIngestDialog) return;
    const reqId = approveIngestDialog.id;
    
    // Attempt local approval
    const material = getMaterialById(reqId);
    if (material) {
      const updatedOpts = {
        ...material,
        approvalStatus: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: me?.name || "Admin",
      };
      await saveMaterial(updatedOpts as any);
      
      try {
        await updateMaterialAsync({ id: reqId, data: { approvalStatus: "approved", approvedAt: updatedOpts.approvedAt, approvedBy: updatedOpts.approvedBy } });
      } catch (e) {
        // fail silently for offline/fallback mode
      }

      addActivity({
        user: me?.name || "Admin",
        actionType: "approve",
        description: `Approved material: ${material.title} (Hierarchy: ${material.hierarchyPath || "Unassigned"})`,
        materialId: material.uniqueId,
      });
    }

    approveIngest({ id: reqId }, {
      onSuccess: () => {
        toast({ title: "Approved", description: "Ingest request approved." });
        setHiddenItems(prev => new Set(prev).add(reqId));
        refetchIngest();
        setApproveIngestDialog(null);
      },
      onError: () => {
        toast({ title: "Operation partial", description: "Updated locally but backend sync failed." });
        refetchIngest();
        setApproveIngestDialog(null);
      }
    });
  };

  const confirmRejectIngest = async () => {
    if (!rejectIngestDialog) return;
    const reqId = rejectIngestDialog.id;
    const material = getMaterialById(reqId);
    if (material) {
      await saveMaterial({
        ...material,
        approvalStatus: "rejected",
        approvedAt: undefined,
        approvedBy: undefined,
      } as any);

      try {
        await updateMaterialAsync({ id: reqId, data: { approvalStatus: "rejected", approvedAt: null, approvedBy: null } });
      } catch (e) {
        // fail silently for offline/fallback mode
      }

      addActivity({
        user: me?.name || "Admin",
        actionType: "reject",
        description: `Rejected material: ${material.title} (Hierarchy: ${material.hierarchyPath || "Unassigned"})`,
        materialId: material.uniqueId,
      });
    }

    rejectIngest({ id: reqId }, {
      onSuccess: () => {
        toast({ title: "Rejected", description: "Ingest request rejected." });
        setHiddenItems(prev => new Set(prev).add(reqId));
        refetchIngest();
        setRejectIngestDialog(null);
      },
      onError: () => {
        toast({ title: "Operation partial", description: "Updated locally but backend sync failed." });
        refetchIngest();
        setRejectIngestDialog(null);
      }
    });
  };

  const filteredIngest = (ingestData ?? []).filter((req: any) => req.status === tab);
  const accessRequests = data?.requests ?? [];
  const requestRows = (mode === "access" ? accessRequests : filteredIngest).filter((r: any) => !hiddenItems.has(r.id));

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Access Requests</h1>
        <p className="text-muted-foreground">Manage researcher requests for restricted material access.</p>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 pt-6 pb-2">
          <div className="bg-muted/30 p-1.5 rounded-xl inline-flex mb-6 w-full max-w-md shadow-inner">
            {(["access", "ingest"] as const).map((m) => (
              <button
                key={m}
                className={`flex-1 py-2.5 text-sm font-bold capitalize rounded-lg transition-all duration-200 ${mode === m ? 'bg-white text-[#4169E1] shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setMode(m)}
              >
                {m === "access" ? "Access Requests" : "Ingest Approvals"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-b border-border/40">
            {(["pending", "approved", "rejected"] as const).map(t => (
              <button 
                key={t}
                className={`px-6 py-3 text-sm font-bold capitalize transition-colors border-b-2 relative -mb-px ${tab === t ? 'border-[#4169E1] text-[#4169E1]' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60'}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Material Requested</TableHead>
              <TableHead>{mode === "access" ? "Purpose" : "Hierarchy"}</TableHead>
              <TableHead>Status</TableHead>
              {tab === 'pending' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mode === "access" && isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24">
                <div className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading requests...</span>
                </div>
              </TableCell></TableRow>
            ) : mode === "access" && accessRequests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No {tab} requests found.</TableCell></TableRow>
            ) : mode === "ingest" && filteredIngest.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No {tab} ingest approvals found.</TableCell></TableRow>
            ) : (
              requestRows.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="whitespace-nowrap">
                    {(() => {
                      const dateStr = mode === "access" ? req.createdAt : req.requestedAt;
                      if (!dateStr) return "N/A";
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? "N/A" : format(date, 'MMM d, yyyy');
                    })()}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-primary">{mode === "access" ? req.userName : req.requestedBy}</p>
                    <p className="text-xs text-muted-foreground">{mode === "access" ? req.userEmail : "Archivist"}</p>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium text-[#0a1628]" title={mode === "access" ? req.materialTitle : req.materialTitle}>{mode === "access" ? req.materialTitle : req.materialTitle}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-muted-foreground" title={mode === "access" ? req.purpose : req.hierarchyPath || "Unassigned"}>
                    {mode === "access" ? req.purpose : req.hierarchyPath || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'accent' : 'default'} className="capitalize">{req.status}</Badge>
                  </TableCell>
                  {tab === 'pending' && (
                    <TableCell className="text-right space-x-2 flex justify-end">
                      <Link href={`/materials/${encodeURIComponent(req.materialId)}`}>
                         <Button size="sm" variant="outline" className="text-[#4169E1] border-[#4169E1]/30 hover:bg-[#4169E1]/10">Preview Item</Button>
                      </Link>
                      {mode === "access" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setApproveAccessDialog({ id: req.id, title: req.materialTitle })}
                            disabled={isApproving || isRejecting}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => setRejectAccessDialog({ id: req.id, title: req.materialTitle })}
                            disabled={isApproving || isRejecting}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => setApproveIngestDialog({ id: req.id, title: req.materialTitle })}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => setRejectIngestDialog({ id: req.id, title: req.materialTitle })}>Reject</Button>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Approve Access Dialog */}
      <Dialog open={!!approveAccessDialog} onOpenChange={(open) => !open && setApproveAccessDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Access Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve access to "{approveAccessDialog?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveAccessDialog(null)} disabled={isApproving}>Cancel</Button>
            <Button onClick={confirmApproveAccess} disabled={isApproving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isApproving ? "Approving..." : "Approve Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Access Dialog */}
      <Dialog open={!!rejectAccessDialog} onOpenChange={(open) => !open && setRejectAccessDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Access Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting access to "{rejectAccessDialog?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <textarea
              className="w-full min-h-[100px] rounded-xl border border-border bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/20"
              placeholder="e.g., You do not meet the criteria for this highly confidential material..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectAccessDialog(null)} disabled={isRejecting}>Cancel</Button>
            <Button onClick={confirmRejectAccess} disabled={isRejecting} className="bg-red-600 hover:bg-red-700 text-white">
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Ingest Dialog */}
      <Dialog open={!!approveIngestDialog} onOpenChange={(open) => !open && setApproveIngestDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Ingest Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve the ingestion of "{approveIngestDialog?.title}" into the archive?
              Once approved, the material will be permanently published and accessible based on its access level.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveIngestDialog(null)}>Cancel</Button>
            <Button onClick={confirmApproveIngest} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Approve Ingestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Ingest Dialog */}
      <Dialog open={!!rejectIngestDialog} onOpenChange={(open) => !open && setRejectIngestDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Ingest Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the ingestion of "{rejectIngestDialog?.title}"? 
              This will mark the material request as rejected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectIngestDialog(null)}>Cancel</Button>
            <Button onClick={confirmRejectIngest} className="bg-red-600 hover:bg-red-700 text-white">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}

