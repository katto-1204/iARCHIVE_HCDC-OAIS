import * as React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui-components";
import { useGetAccessRequests, useApproveRequest, useRejectRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminRequests() {
  const [tab, setTab] = React.useState<"pending" | "approved" | "rejected">("pending");
  const { data, isLoading, refetch } = useGetAccessRequests({ status: tab });
  
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
    const reason = prompt("Enter rejection reason:");
    if (reason !== null) {
      reject({ id, data: { reason } }, {
        onSuccess: () => {
          toast({ title: "Rejected", description: "Request denied." });
          refetch();
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Access Requests</h1>
        <p className="text-muted-foreground">Manage researcher requests for restricted material access.</p>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
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
              <TableHead>Purpose</TableHead>
              <TableHead>Status</TableHead>
              {tab === 'pending' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : data?.requests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No {tab} requests found.</TableCell></TableRow>
            ) : (
              data?.requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(req.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <p className="font-medium text-primary">{req.userName}</p>
                    <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={req.materialTitle}>{req.materialTitle}</TableCell>
                  <TableCell className="max-w-[250px] truncate" title={req.purpose}>{req.purpose}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'accent' : 'default'} className="capitalize">{req.status}</Badge>
                  </TableCell>
                  {tab === 'pending' && (
                    <TableCell className="text-right space-x-2 flex justify-end">
                      <Link href={"/collections/" + req.materialId}>
                         <Button size="sm" variant="outline" className="text-[#4169E1] border-[#4169E1]/30 hover:bg-[#4169E1]/10">Preview Item</Button>
                      </Link>
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApprove(req.id)}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleReject(req.id)}>Reject</Button>
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
