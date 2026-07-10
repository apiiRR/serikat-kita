import { useEffect, useState } from "react";
import { MessageCircle, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface HotlineContact {
  id: string;
  name: string;
  role: string | null;
  phone: string;
  sort_order: number;
}

const formatPhoneDisplay = (phone: string) => {
  return phone || "Nomor belum tersedia";
};

const getPhoneLink = (phone: string) => {
  const normalized = phone.replace(/[^\d+]/g, "");

  return normalized ? `tel:${normalized}` : "";
};

const Hotline = () => {
  const [contacts, setContacts] = useState<HotlineContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from("hotline_contacts")
        .select("id,name,phone,role,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (!error && data) {
        setContacts(data);
      }

      setIsLoading(false);
    };

    fetchContacts();
  }, []);

  if (isLoading) {
    return (
      <section id="hotline" className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            <div className="h-40 bg-muted rounded animate-pulse" />
            <div className="h-40 bg-muted rounded animate-pulse" />
            <div className="h-40 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="hotline" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Phone className="w-4 h-4" />
            Hotline
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Kontak Hotline Serikat Pekerja
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hubungi perwakilan hotline untuk menyampaikan aduan, aspirasi, atau
            kebutuhan tindak lanjut secara langsung.
          </p>
        </div>

        {contacts.length === 0 ? (
          <Card className="max-w-2xl mx-auto border-dashed border-primary/30 bg-primary/5">
            <CardContent className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Data hotline akan segera ditampilkan
              </h3>
              <p className="text-sm text-muted-foreground">
                Data nama dan nomor HP perwakilan hotline sedang disiapkan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {contacts.map((contact) => {
              const phoneLink = getPhoneLink(contact.phone);

              return (
                <Card
                  key={contact.id}
                  className="card-gradient shadow-card border-border/50 hover:shadow-elevated transition-all duration-300"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10 border border-secondary/20">
                        <UserRound className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground truncate">
                          {contact.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {contact.role || "Hotline Serikat Pekerja"}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
                          <Phone className="w-4 h-4" />
                          <span>{formatPhoneDisplay(contact.phone)}</span>
                        </div>
                      </div>
                    </div>

                    {phoneLink && (
                      <Button asChild className="w-full mt-5">
                        <a href={phoneLink}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Hubungi
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hotline;
