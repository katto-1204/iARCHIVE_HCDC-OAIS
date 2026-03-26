import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui-components";
import { useGetAuditLogs } from "@workspace/api-client-react";

export default function AdminAuditLogs() {
  const { data, isLoading } = useGetAuditLogs({ limit: 100 });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Audit Trail</h1>
        <p className="text-muted-foreground">Immutable record of all system activities and accesses.</p>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : data?.logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No logs found.</TableCell></TableRow>
            ) : (
              data?.logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell className="font-medium text-primary">{log.userName || 'System'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px] tracking-widest">{log.action.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground uppercase">{log.entityType}</span><br/>
                    <span className="font-mono text-xs">{log.entityId}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" title={log.details || ''}>{log.details || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
