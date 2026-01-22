import { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface AgendaItem {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  type: string;
}

const typeColors: Record<string, string> = {
  Rapat: "bg-secondary",
  Seminar: "bg-primary",
  Sosial: "bg-accent",
  Event: "bg-muted",
};

const Agenda = () => {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgenda = async () => {
      const { data, error } = await supabase
        .from("agenda")
        .select("*")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(4);

      if (!error && data) {
        setAgendaItems(data);
      }
      setIsLoading(false);
    };

    fetchAgenda();
  }, []);

  if (isLoading) {
    return (
      <section id="agenda" className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (agendaItems.length === 0) {
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
            <p className="text-muted-foreground">
              Tidak ada agenda mendatang saat ini.
            </p>
          </div>
        </div>
      </section>
    );
  }

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
          {agendaItems.map((item, index) => {
            const eventDate = new Date(item.event_date);
            const day = eventDate.getDate().toString();
            const monthYear = eventDate.toLocaleDateString("id-ID", {
              month: "short",
              year: "numeric",
            });

            return (
              <Card
                key={item.id}
                className="group bg-card shadow-card hover:shadow-elevated transition-all duration-300 border-border/50 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Date Highlight */}
                    <div
                      className={`${typeColors[item.type] || "bg-muted"} w-2 flex-shrink-0`}
                    />
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Date Box */}
                        <div className="flex-shrink-0 bg-muted rounded-lg p-4 text-center min-w-[100px]">
                          <div className="text-2xl font-bold text-foreground">
                            {day}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {monthYear}
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
                              {item.event_time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.location}
                            </div>
                          </div>
                        </div>

                        {/* Type Badge */}
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${typeColors[item.type] || "bg-muted"} text-white`}
                        >
                          {item.type}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Agenda;
