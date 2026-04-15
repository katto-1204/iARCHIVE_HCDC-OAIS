import * as React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui-components";
import { useGetAccessRequests, useApproveRequest, useRejectRequest, useGetMe } from "@workspace/api-client-react";
import { getIngestRequests, updateIngestRequest, getMaterialById, saveMaterial, addActivity } from "@/data/storage";
import { useToast } from "@/hooks/use-toast";

export default function AdminRequests() {
  const { data: me } = useGetMe();
  const [mode, setMode] = React.useState<"access" | "ingest">("access");
  const [tab, setTab] = React.useState<"pending" | "approved" | "rejected">("pending");
  const { data, isLoading, refetch } = useGetAccessRequests({ status: tab });
  const [ingestRequests, setIngestRequests] = React.useState(() => getIngestRequests());
  
  const { mutate: approve, isPending: isApproving } = useApproveRequest();
  const { mutate: reject, isPending: isRejecting } = useRejectRequest();
  const [actionId, setActionId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleApprove = (id: string) => {
    setActionId(id);
    approve({ id }, {
      onSuccess: () => {
        toast({ title: "Approved", description: "Request granted." });
        refetch();
        setActionId(null);
      },
      onError: () => {
        toast({ title: "Approval Failed", description: "Could not approve this request.", variant: "destructive" });
        setActionId(null);
      }
    });
  };

  const handleReject = (id: string) => {
    setActionId(id);
    // Use setTimeout to avoid blocking the main thread (prompt is synchronous)
    setTimeout(() => {
      const reason = prompt("Enter rejection reason:");
      if (reason !== null) {
        reject({ id, data: { reason } }, {
          onSuccess: () => {
            toast({ title: "Rejected", description: "Request denied." });
            refetch();
            setActionId(null);
          },
          onError: () => {
            toast({ title: "Rejection Failed", description: "Could not reject this request.", variant: "destructive" });
            setActionId(null);
          }
        });
      } else {
        setActionId(null);
      }
    }, 50);
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
  const accessRequests = data?.requests ?? [];
  const requestRows = mode === "access" ? accessRequests : filteredIngest;

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
                  <TableCell className="whitespace-nowrap">{format(new Date(mode === "access" ? req.createdAt : req.requestedAt), 'MMM d, yyyy')}</TableCell>
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
                      <Link href={"/collections/" + (mode === "access" ? req.materialId : req.materialId)}>
                         <Button size="sm" variant="outline" className="text-[#4169E1] border-[#4169E1]/30 hover:bg-[#4169E1]/10">Preview Item</Button>
                      </Link>
                      {mode === "access" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleApprove(req.id)}
                            disabled={isApproving || isRejecting || actionId === req.id}
                          >
                            {actionId === req.id && isApproving ? "Approving..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => handleReject(req.id)}
                            disabled={isApproving || isRejecting || actionId === req.id}
                          >
                            {actionId === req.id && isRejecting ? "Rejecting..." : "Reject"}
                          </Button>
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
    </AdminLayout>
  );
}
