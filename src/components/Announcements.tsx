import { useState, useEffect } from "react";
import { Bell, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  category: string;
  is_new: boolean;
  created_at: string;
}

// Helper function to strip HTML tags and convert to plain text
const stripHtml = (html: string | null): string => {
  if (!html) return "";
  // Replace <br> and <br /> with spaces
  let text = html.replace(/<br\s*\/?>/gi, " ");
  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode HTML entities
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/</gi, "<");
  text = text.replace(/>/gi, ">");
  text = text.replace(/"/gi, '"');
  // Clean up multiple spaces
  text = text.replace(/\s+/g, " ").trim();
  return text;
};

const categoryColors: Record<string, string> = {
  Rapat: "bg-secondary text-secondary-foreground",
  Kebijakan: "bg-primary text-primary-foreground",
  Pelatihan: "bg-accent text-accent-foreground",
  Advokasi: "bg-muted text-foreground",
  Umum: "bg-muted text-foreground",
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      if (!error && data) {
        setAnnouncements(data);
      }
      setIsLoading(false);
    };

    fetchAnnouncements();
  }, []);

  if (isLoading) {
    return (
      <section id="pengumuman" className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (announcements.length === 0) {
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
            <p className="text-muted-foreground">
              Belum ada pengumuman terbaru.
            </p>
          </div>
        </div>
      </section>
    );
  }

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
              onClick={() => setSelectedAnnouncement(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className={categoryColors[item.category] || categoryColors.Umum}>
                      {item.category}
                    </Badge>
                    {item.is_new && (
                      <Badge className="bg-primary text-primary-foreground animate-pulse">
                        Baru
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                  {stripHtml(item.content) || "Klik untuk melihat detail pengumuman."}
                </p>
                <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  Baca selengkapnya
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
          <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[85vh] overflow-y-auto mx-4 my-auto" onEscapeKeyDown={() => setSelectedAnnouncement(null)} onPointerDownOutside={(e) => {
            // Close when clicking outside the dialog
            const target = e.target as HTMLElement;
            if (target.closest('[role="dialog"]')) {
              setSelectedAnnouncement(null);
            }
          }}>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={selectedAnnouncement ? categoryColors[selectedAnnouncement.category] || categoryColors.Umum : categoryColors.Umum}>
                  {selectedAnnouncement?.category}
                </Badge>
                {selectedAnnouncement?.is_new && (
                  <Badge className="bg-primary text-primary-foreground">Baru</Badge>
                )}
              </div>
              <DialogTitle className="text-xl">{selectedAnnouncement?.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {selectedAnnouncement && new Date(selectedAnnouncement.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {selectedAnnouncement?.content ? (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }} 
                />
              ) : (
                "Tidak ada konten tersedia."
              )}
            </div>
            <DialogClose className="absolute right-4 top-4" />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default Announcements;
