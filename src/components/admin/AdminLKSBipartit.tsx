import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

interface Member {
  id: string;
  name: string;
  position: string;
  department: string;
  level: number;
  sort_order: number;
}

const LKS_DEPARTMENT = "LKS Bipartit";

const isLksBipartitMember = (department: string) => {
  const dept = department.toLowerCase();

  return (
    dept.includes("lks") ||
    dept.includes("bipartit") ||
    dept.includes("bipartied")
  );
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const AdminLKSBipartit = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    sort_order: "0",
  });

  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("organization_structure")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat anggota LKS Bipartit",
        variant: "destructive",
      });
    } else {
      setMembers(
        (data || []).filter((member) => isLksBipartitMember(member.department))
      );
    }

    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      sort_order: "0",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Nama anggota harus diisi",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name,
      position: formData.position || "Anggota LKS Bipartit",
      department: LKS_DEPARTMENT,
      level: 4,
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
          description: "Anggota LKS Bipartit berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from("organization_structure")
          .insert(payload);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Anggota LKS Bipartit berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan anggota LKS Bipartit",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (member: Member) => {
    setFormData({
      name: member.name,
      position: member.position === LKS_DEPARTMENT ? "" : member.position,
      sort_order: member.sort_order.toString(),
    });
    setEditingId(member.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus anggota LKS Bipartit ini?")) return;

    const { error } = await supabase
      .from("organization_structure")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus anggota LKS Bipartit",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Anggota LKS Bipartit berhasil dihapus",
      });
      fetchMembers();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">LKS Bipartit</h2>
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
              Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId
                  ? "Edit Anggota LKS Bipartit"
                  : "Tambah Anggota LKS Bipartit"}
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
                <label className="text-sm font-medium">Posisi/Perwakilan</label>
                <Input
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="Contoh: Perwakilan pekerja"
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
                {editingId ? "Simpan Perubahan" : "Tambah Anggota"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada data anggota LKS Bipartit. Klik tombol "Tambah Anggota" untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
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
                    <p className="text-xs text-muted-foreground truncate">
                      {member.position || "Anggota LKS Bipartit"}
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
      )}
    </div>
  );
};

export default AdminLKSBipartit;
