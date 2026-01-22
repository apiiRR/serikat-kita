import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface Agenda {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  type: string;
}

const types = ["Rapat", "Seminar", "Sosial", "Event"];

const AdminAgenda = () => {
  const { toast } = useToast();
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    event_date: "",
    event_time: "",
    location: "",
    type: "Rapat",
  });

  const fetchAgenda = async () => {
    const { data, error } = await supabase
      .from("agenda")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat agenda",
        variant: "destructive",
      });
    } else {
      setAgenda(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      event_date: "",
      event_time: "",
      location: "",
      type: "Rapat",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.event_date || !formData.event_time || !formData.location) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("agenda")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Agenda berhasil diperbarui",
        });
      } else {
        const { error } = await supabase.from("agenda").insert(formData);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Agenda berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAgenda();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan agenda",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: Agenda) => {
    setFormData({
      title: item.title,
      event_date: item.event_date,
      event_time: item.event_time,
      location: item.location,
      type: item.type,
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus agenda ini?")) return;

    const { error } = await supabase.from("agenda").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus agenda",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Agenda berhasil dihapus",
      });
      fetchAgenda();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Agenda</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Agenda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Agenda" : "Tambah Agenda"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Judul Kegiatan</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Judul kegiatan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal</label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Waktu</label>
                  <Input
                    value={formData.event_time}
                    onChange={(e) =>
                      setFormData({ ...formData, event_time: e.target.value })
                    }
                    placeholder="09:00 - 12:00 WIB"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lokasi</label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Aula Gedung A Lt. 2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Simpan Perubahan" : "Tambah Agenda"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {agenda.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada agenda. Klik tombol "Tambah Agenda" untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agenda.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <span className="text-sm text-primary font-medium">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
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
                    📅{" "}
                    {new Date(item.event_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p>🕐 {item.event_time}</p>
                  <p>📍 {item.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAgenda;
