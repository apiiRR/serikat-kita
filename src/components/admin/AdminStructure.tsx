import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface Member {
  id: string;
  name: string;
  position: string;
  department: string;
  level: number;
  sort_order: number;
}

const AdminStructure = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    department: "",
    level: "3",
    sort_order: "0",
  });

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("organization_structure")
      .select("*")
      .order("level", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat struktur organisasi",
        variant: "destructive",
      });
    } else {
      setMembers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      department: "",
      level: "3",
      sort_order: "0",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.position || !formData.department) {
      toast({
        title: "Error",
        description: "Nama, jabatan, dan departemen harus diisi",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name,
      position: formData.position,
      department: formData.department,
      level: parseInt(formData.level),
      sort_order: parseInt(formData.sort_order),
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("organization_structure")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Anggota berhasil diperbarui",
        });
      } else {
        const { error } = await supabase.from("organization_structure").insert(payload);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Anggota berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan anggota",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (member: Member) => {
    setFormData({
      name: member.name,
      position: member.position,
      department: member.department,
      level: member.level.toString(),
      sort_order: member.sort_order.toString(),
    });
    setEditingId(member.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus anggota ini?")) return;

    const { error } = await supabase
      .from("organization_structure")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus anggota",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Anggota berhasil dihapus",
      });
      fetchMembers();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Ketua Umum";
      case 2:
        return "Wakil Ketua";
      case 3:
        return "Pengurus";
      default:
        return "Anggota";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Struktur Organisasi</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Anggota" : "Tambah Anggota"}
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
                <label className="text-sm font-medium">Jabatan</label>
                <Input
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="Contoh: Ketua Umum, Sekretaris"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Departemen/Bidang</label>
                <Input
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="Contoh: Kepemimpinan, Advokasi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Level Hierarki</label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Ketua Umum</SelectItem>
                      <SelectItem value="2">2 - Wakil Ketua</SelectItem>
                      <SelectItem value="3">3 - Pengurus</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Simpan Perubahan" : "Tambah Anggota"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada data struktur organisasi. Klik tombol "Tambah Anggota" untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[1, 2, 3].map((level) => {
            const levelMembers = members.filter((m) => m.level === level);
            if (levelMembers.length === 0) return null;

            return (
              <div key={level}>
                <h3 className="text-lg font-semibold mb-3">{getLevelLabel(level)}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levelMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{member.name}</h4>
                            <p className="text-sm text-primary">{member.position}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.department}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(member)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(member.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminStructure;
