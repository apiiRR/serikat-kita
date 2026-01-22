import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const agendaItems = [
  {
    id: 1,
    title: "Rapat Koordinasi Bulanan",
    date: "25 Januari 2024",
    time: "09:00 - 12:00 WIB",
    location: "Aula Gedung A Lt. 2",
    type: "Rapat",
  },
  {
    id: 2,
    title: "Sosialisasi UU Cipta Kerja",
    date: "2 Februari 2024",
    time: "13:00 - 16:00 WIB",
    location: "Ruang Meeting B",
    type: "Seminar",
  },
  {
    id: 3,
    title: "Bakti Sosial Bersama",
    date: "10 Februari 2024",
    time: "08:00 - 14:00 WIB",
    location: "Panti Asuhan Harapan",
    type: "Sosial",
  },
  {
    id: 4,
    title: "Peringatan Hari Buruh",
    date: "1 Mei 2024",
    time: "07:00 - 15:00 WIB",
    location: "Lapangan Utama",
    type: "Event",
  },
];

const typeColors: Record<string, string> = {
  Rapat: "bg-secondary",
  Seminar: "bg-primary",
  Sosial: "bg-accent",
  Event: "bg-muted",
};

const Agenda = () => {
  return (
    <section id="agenda" className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CalendarDays className="w-4 h-4" />
            Jadwal Kegiatan
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Agenda Mendatang
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Catat tanggal-tanggal penting kegiatan Serikat Pekerja PT Berdikari
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {agendaItems.map((item, index) => (
            <Card
              key={item.id}
              className="group bg-card shadow-card hover:shadow-elevated transition-all duration-300 border-border/50 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Date Highlight */}
                  <div
                    className={`${typeColors[item.type]} w-2 flex-shrink-0`}
                  />
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Date Box */}
                      <div className="flex-shrink-0 bg-muted rounded-lg p-4 text-center min-w-[100px]">
                        <div className="text-2xl font-bold text-foreground">
                          {item.date.split(" ")[0]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.date.split(" ").slice(1).join(" ")}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.location}
                          </div>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[item.type]} text-white`}
                      >
                        {item.type}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Agenda;
