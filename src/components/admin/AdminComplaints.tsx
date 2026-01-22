import { useState, useEffect } from "react";
import { Eye, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Complaint {
  id: string;
  name: string;
  email: string;
  department: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const statusOptions = ["Baru", "Diproses", "Selesai"];

const statusColors: Record<string, string> = {
  Baru: "bg-primary text-primary-foreground",
  Diproses: "bg-accent text-accent-foreground",
  Selesai: "bg-secondary text-secondary-foreground",
};

const statusIcons: Record<string, React.ReactNode> = {
  Baru: <AlertCircle className="w-4 h-4" />,
  Diproses: <Clock className="w-4 h-4" />,
  Selesai: <CheckCircle className="w-4 h-4" />,
};

const AdminComplaints = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat aduan",
        variant: "destructive",
      });
    } else {
      setComplaints(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Status berhasil diperbarui",
      });
      fetchComplaints();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus aduan ini?")) return;

    const { error } = await supabase.from("complaints").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus aduan",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Aduan berhasil dihapus",
      });
      setIsDetailOpen(false);
      fetchComplaints();
    }
  };

  const openDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Aduan Masuk</h2>
        <div className="text-sm text-muted-foreground">
          Total: {complaints.length} aduan
        </div>
      </div>

      {complaints.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada aduan masuk.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {complaints.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={statusColors[item.status]}>
                        {statusIcons[item.status]}
                        <span className="ml-1">{item.status}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{item.subject}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDetail(item)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Dari:</strong> {item.name} ({item.email})
                  </p>
                  {item.department && (
                    <p>
                      <strong>Departemen:</strong> {item.department}
                    </p>
                  )}
                  <p className="line-clamp-2">{item.message}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Select
                    value={item.status}
                    onValueChange={(value) => handleStatusChange(item.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Aduan</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedComplaint.status]}>
                  {statusIcons[selectedComplaint.status]}
                  <span className="ml-1">{selectedComplaint.status}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedComplaint.category}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{selectedComplaint.subject}</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{selectedComplaint.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedComplaint.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departemen</p>
                  <p className="font-medium">
                    {selectedComplaint.department || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {new Date(selectedComplaint.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Isi Aduan</p>
                <p className="p-4 bg-background border rounded-lg whitespace-pre-wrap">
                  {selectedComplaint.message}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Select
                  value={selectedComplaint.status}
                  onValueChange={(value) => {
                    handleStatusChange(selectedComplaint.id, value);
                    setSelectedComplaint({ ...selectedComplaint, status: value });
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedComplaint.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Aduan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComplaints;
