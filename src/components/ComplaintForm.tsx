import { useState } from "react";
import { Send, Shield, CheckCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const complaintSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(100, "Nama terlalu panjang"),
  email: z.string().email("Email tidak valid").max(255, "Email terlalu panjang"),
  department: z.string().max(100, "Departemen terlalu panjang").optional(),
  category: z.string().min(1, "Kategori harus dipilih"),
  subject: z.string().min(1, "Subjek harus diisi").max(200, "Subjek terlalu panjang"),
  message: z.string().min(1, "Isi aduan harus diisi").max(2000, "Isi aduan terlalu panjang"),
});

const ComplaintForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    category: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = complaintSchema.parse(formData);

      const { error } = await supabase.from("complaints").insert({
        name: validated.name,
        email: validated.email,
        department: validated.department || null,
        category: validated.category,
        subject: validated.subject,
        message: validated.message,
        status: "Baru",
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Aduan Terkirim",
        description: "Terima kasih. Aduan Anda akan segera kami proses.",
      });

      setFormData({
        name: "",
        email: "",
        department: "",
        category: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Formulir tidak lengkap",
          description: "Mohon perbaiki kesalahan pada formulir.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Gagal mengirim",
          description: "Terjadi kesalahan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="aduan" className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Layanan Aduan
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sampaikan Aduan Anda
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Kami siap mendengar dan menindaklanjuti setiap aduan dari anggota.
            Kerahasiaan identitas Anda dijamin.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-elevated border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Formulir Aduan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Nama Lengkap <span className="text-primary">*</span>
                    </label>
                    <Input
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="bg-background"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email <span className="text-primary">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="bg-background"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Departemen
                    </label>
                    <Input
                      placeholder="Nama departemen (opsional)"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Kategori Aduan <span className="text-primary">*</span>
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gaji & Tunjangan">
                          Gaji & Tunjangan
                        </SelectItem>
                        <SelectItem value="Kondisi Kerja">
                          Kondisi Kerja
                        </SelectItem>
                        <SelectItem value="Keselamatan Kerja">
                          Keselamatan Kerja
                        </SelectItem>
                        <SelectItem value="Hubungan Industrial">
                          Hubungan Industrial
                        </SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Subjek Aduan <span className="text-primary">*</span>
                  </label>
                  <Input
                    placeholder="Ringkasan singkat aduan Anda"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="bg-background"
                  />
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Isi Aduan <span className="text-primary">*</span>
                  </label>
                  <Textarea
                    placeholder="Jelaskan aduan Anda secara detail..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="bg-background resize-none"
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message}</p>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    Identitas Anda akan dijaga kerahasiaannya sesuai dengan
                    kebijakan privasi Serikat Pekerja PT Berdikari.
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Mengirim..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Aduan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ComplaintForm;
