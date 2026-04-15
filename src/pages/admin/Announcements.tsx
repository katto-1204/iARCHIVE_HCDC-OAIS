import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui-components";
import { Plus, Megaphone, Trash2, X, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { useGetAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminAnnouncements() {
  const { data: announcements, isLoading, refetch } = useGetAnnouncements();
  const { mutate: create, isPending: isCreating } = useCreateAnnouncement();
  const { mutate: remove, isPending: isDeleting } = useDeleteAnnouncement();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  // Deletion State
  const [deleteDialog, setDeleteDialog] = React.useState<{id: string, title: string} | null>(null);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    create(
      { data: { title: title.trim(), content: content.trim(), isActive } },
      {
        onSuccess: () => {
          toast({ title: "Announcement Posted", description: `"${title}" is now live.` });
          setTitle(""); setContent(""); setIsActive(true);
          setIsAdding(false);
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to post announcement.", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: string, announcementTitle: string) => {
    setDeleteDialog({ id, title: announcementTitle });
  };

  const confirmDelete = () => {
    if (deleteDialog) {
      remove(
        { id: deleteDialog.id },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: "Announcement removed." });
            setDeleteDialog(null);
            refetch();
          },
          onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0a1628]">Announcements</h1>
          <p className="text-muted-foreground">Post system notices, updates, and news for iArchive users.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="shrink-0 shadow-lg gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-6 border-primary/30 shadow-md">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              New Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title <span className="text-destructive">*</span></label>
              <Input
                placeholder="Announcement title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message <span className="text-destructive">*</span></label>
              <textarea
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-0 outline-none resize-none min-h-[120px]"
                placeholder="Write your announcement message here..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'} relative`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                {isActive ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                {isActive ? "Published" : "Draft"}
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleCreate} 
                disabled={!title.trim() || !content.trim() || isCreating} 
                className="gap-2"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Post Announcement
              </Button>
              <Button variant="ghost" onClick={() => { setIsAdding(false); setTitle(""); setContent(""); }} disabled={isCreating}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
          </div>
        ) : (announcements?.length ?? 0) === 0 ? (
          <Card className="border-dashed border-2 border-border/60">
            <CardContent className="py-16 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-1">No Announcements Yet</h3>
              <p className="text-muted-foreground text-sm">Create your first announcement to notify iArchive users.</p>
              <Button className="mt-4 gap-2" onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4" /> Post First Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          announcements?.map(ann => (
            <Card key={ann.id} className={`border shadow-sm ${!ann.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {ann.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <Eye className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                          <EyeOff className="w-3 h-3" /> Draft
                        </span>
                      )}
                      <h3 className="font-bold text-lg text-foreground">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{ann.content}</p>
                    <p className="text-xs text-muted-foreground/70">
                      Posted {format(new Date(ann.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                    onClick={() => handleDelete(ann.id, ann.title)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the announcement "{deleteDialog?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)} disabled={isDeleting}>Cancel</Button>
            <Button 
              className="bg-red-600 text-white hover:bg-red-700 gap-2" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
