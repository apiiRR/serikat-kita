import { Bell, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const announcements = [
  {
    id: 1,
    title: "Rapat Anggota Tahunan 2024",
    date: "20 Januari 2024",
    category: "Rapat",
    description:
      "Undangan untuk seluruh anggota menghadiri Rapat Anggota Tahunan yang akan membahas program kerja tahun 2024.",
    isNew: true,
  },
  {
    id: 2,
    title: "Penyesuaian Tunjangan Kesehatan",
    date: "15 Januari 2024",
    category: "Kebijakan",
    description:
      "Informasi terkait penyesuaian tunjangan kesehatan yang berlaku mulai Februari 2024 untuk seluruh anggota.",
    isNew: true,
  },
  {
    id: 3,
    title: "Pelatihan Hak Pekerja",
    date: "10 Januari 2024",
    category: "Pelatihan",
    description:
      "Pendaftaran pelatihan mengenai hak-hak pekerja dan mekanisme advokasi telah dibuka.",
    isNew: false,
  },
  {
    id: 4,
    title: "Hasil Negosiasi UMK 2024",
    date: "5 Januari 2024",
    category: "Advokasi",
    description:
      "Laporan hasil negosiasi dengan manajemen terkait penyesuaian upah minimum kabupaten tahun 2024.",
    isNew: false,
  },
];

const categoryColors: Record<string, string> = {
  Rapat: "bg-secondary text-secondary-foreground",
  Kebijakan: "bg-primary text-primary-foreground",
  Pelatihan: "bg-accent text-accent-foreground",
  Advokasi: "bg-muted text-foreground",
};

const Announcements = () => {
  return (
    <section id="pengumuman" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Bell className="w-4 h-4" />
            Informasi Terbaru
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pengumuman
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dapatkan informasi terkini mengenai kegiatan dan kebijakan Serikat
            Pekerja PT Berdikari
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {announcements.map((item, index) => (
            <Card
              key={item.id}
              className="group card-gradient shadow-card hover:shadow-elevated transition-all duration-300 border-border/50 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className={categoryColors[item.category]}>
                      {item.category}
                    </Badge>
                    {item.isNew && (
                      <Badge className="bg-primary text-primary-foreground animate-pulse">
                        Baru
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    {item.date}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {item.description}
                </p>
                <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  Baca selengkapnya
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Announcements;
