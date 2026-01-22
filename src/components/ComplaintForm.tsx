import { useState } from "react";
import { Send, Shield, CheckCircle } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!formData.name || !formData.email || !formData.category || !formData.subject || !formData.message) {
      toast({
        title: "Formulir tidak lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Create mailto link
    const mailtoSubject = encodeURIComponent(`[${formData.category}] ${formData.subject}`);
    const mailtoBody = encodeURIComponent(
      `Nama: ${formData.name}\nEmail: ${formData.email}\nDepartemen: ${formData.department || "-"}\nKategori: ${formData.category}\n\nIsi Aduan:\n${formData.message}`
    );
    const mailtoLink = `mailto:sp.berdikari@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

    // Open email client
    window.location.href = mailtoLink;

    // Show success toast
    setTimeout(() => {
      toast({
        title: "Membuka aplikasi email",
        description: "Silakan kirim email melalui aplikasi email Anda.",
      });
      setIsSubmitting(false);
    }, 1000);
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
                    "Memproses..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Aduan via Email
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
