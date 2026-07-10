import { useCallback, useEffect, useState } from "react";
import { Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HotlineContact {
  id: string;
  name: string;
  phone: string;
  role: string | null;
  sort_order: number;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const AdminHotline = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<HotlineContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "",
    sort_order: "0",
  });

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from("hotline_contacts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data hotline",
        variant: "destructive",
      });
    } else {
      setContacts(data || []);
    }

    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      role: "",
      sort_order: "0",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Error",
        description: "Nama dan nomor telepon harus diisi",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      role: formData.role.trim() || null,
      sort_order: parseInt(formData.sort_order),
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("hotline_contacts")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Kontak hotline berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from("hotline_contacts")
          .insert(payload);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Kontak hotline berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchContacts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan kontak hotline",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contact: HotlineContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      role: contact.role || "",
      sort_order: contact.sort_order.toString(),
    });
    setEditingId(contact.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kontak hotline ini?")) return;

    const { error } = await supabase
      .from("hotline_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus kontak hotline",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Kontak hotline berhasil dihapus",
      });
      fetchContacts();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Hotline</h2>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kontak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Kontak Hotline" : "Tambah Kontak Hotline"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nomor Telepon</label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Contoh: 081234567890"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peran/Jabatan</label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="Contoh: Hotline Aduan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Urutan</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Simpan Perubahan" : "Tambah Kontak"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada data hotline. Klik tombol "Tambah Kontak" untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{contact.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.role || "Hotline Serikat Pekerja"}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-1">
                      <Phone className="w-3 h-3" />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(contact)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHotline;
