import * as React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui-components";
import { useGetAccessRequests, useApproveRequest, useRejectRequest, useGetMe } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getIngestRequests, updateIngestRequest, getMaterialById, saveMaterial, addActivity } from "@/data/storage";
import { useToast } from "@/hooks/use-toast";

export default function AdminRequests() {
  const { data: me } = useGetMe();
  const [mode, setMode] = React.useState<"access" | "ingest">("access");
  const [tab, setTab] = React.useState<"pending" | "approved" | "rejected">("pending");
  const { data, isLoading, refetch } = useGetAccessRequests({ status: tab });
  const [ingestRequests, setIngestRequests] = React.useState(() => getIngestRequests());
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  
  const { mutate: approve } = useApproveRequest();
  const { mutate: reject } = useRejectRequest();
  const { toast } = useToast();

  const handleApprove = (id: string) => {
    approve({ id }, {
      onSuccess: () => {
        toast({ title: "Approved", description: "Request granted." });
        refetch();
      }
    });
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
    setRejectReason("");
  };

  const confirmReject = () => {
    if (rejectingId) {
      reject({ id: rejectingId, data: { reason: rejectReason } }, {
        onSuccess: () => {
          toast({ title: "Rejected", description: "Request denied." });
          setRejectingId(null);
          refetch();
        }
      });
    }
  };

  const handleApproveIngest = async (id: string) => {
    const material = getMaterialById(id);
    if (material) {
      await saveMaterial({
        ...material,
        approvalStatus: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: me?.name || "Admin",
      } as any);
      addActivity({
        user: me?.name || "Admin",
        actionType: "approve",
        description: `Approved material: ${material.title} (Hierarchy: ${material.hierarchyPath || "Unassigned"})`,
        materialId: material.uniqueId,
      });
    }
    const updated = updateIngestRequest(id, "approved");
    setIngestRequests(updated);
    toast({ title: "Approved", description: "Ingest request approved." });
  };

  const handleRejectIngest = async (id: string) => {
    const material = getMaterialById(id);
    if (material) {
      await saveMaterial({
        ...material,
        approvalStatus: "rejected",
        approvedAt: undefined,
        approvedBy: undefined,
      } as any);
      addActivity({
        user: me?.name || "Admin",
        actionType: "reject",
        description: `Rejected material: ${material.title} (Hierarchy: ${material.hierarchyPath || "Unassigned"})`,
        materialId: material.uniqueId,
      });
    }
    const updated = updateIngestRequest(id, "rejected");
    setIngestRequests(updated);
    toast({ title: "Rejected", description: "Ingest request rejected." });
  };

  React.useEffect(() => {
    const sync = () => setIngestRequests(getIngestRequests());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const filteredIngest = ingestRequests.filter((req) => req.status === tab);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Access Requests</h1>
        <p className="text-muted-foreground">Manage researcher requests for restricted material access.</p>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="border-b px-4 flex gap-6">
          {(["access", "ingest"] as const).map((m) => (
            <button
              key={m}
              className={`py-4 text-sm font-semibold capitalize border-b-2 transition-colors ${mode === m ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setMode(m)}
            >
              {m === "access" ? "Access Requests" : "Ingest Approvals"}
            </button>
          ))}
        </div>
        <div className="border-b px-4 flex gap-6">
          {(["pending", "approved", "rejected"] as const).map(t => (
            <button 
              key={t}
              className={`py-4 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTab(t)}
            >
              {t} Requests
            </button>
          ))}
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
              <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : mode === "access" && data?.requests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No {tab} requests found.</TableCell></TableRow>
            ) : mode === "ingest" && filteredIngest.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No {tab} ingest approvals found.</TableCell></TableRow>
            ) : (
              (mode === "access" ? (data?.requests || []) : filteredIngest).map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(mode === "access" ? req.createdAt : req.requestedAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <p className="font-medium text-primary">{mode === "access" ? req.userName : req.requestedBy}</p>
                    <p className="text-xs text-muted-foreground">{mode === "access" ? req.userEmail : "Archivist"}</p>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={mode === "access" ? req.materialTitle : req.materialTitle}>{mode === "access" ? req.materialTitle : req.materialTitle}</TableCell>
                  <TableCell className="max-w-[250px] truncate" title={mode === "access" ? req.purpose : req.hierarchyPath || "Unassigned"}>
                    {mode === "access" ? req.purpose : req.hierarchyPath || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'accent' : 'default'} className="capitalize">{req.status}</Badge>
                  </TableCell>
                  {tab === 'pending' && (
                    <TableCell className="text-right space-x-2 flex justify-end">
                      <Link href={"/materials/" + (mode === "access" ? req.materialId : req.materialId)}>
                         <Button size="sm" variant="outline" className="text-[#4169E1] border-[#4169E1]/30 hover:bg-[#4169E1]/10">Preview Item</Button>
                      </Link>
                      {mode === "access" ? (
                        <>
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApprove(req.id)}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleReject(req.id)}>Reject</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApproveIngest(req.id)}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleRejectIngest(req.id)}>Reject</Button>
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

      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this access request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="resize-none h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Deny Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
