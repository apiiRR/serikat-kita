import { useState, useEffect } from "react";
import { User, Users, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  name: string;
  position: string;
  department: string;
  level: number;
  avatar_url: string | null;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const Structure = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("organization_structure")
        .select("*")
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setMembers(data);
      }
      setIsLoading(false);
    };

    fetchMembers();
  }, []);

  if (isLoading) {
    return (
      <section id="struktur" className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return (
      <section id="struktur" className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Tim Pengurus
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Struktur Organisasi
            </h2>
            <p className="text-muted-foreground">
              Struktur organisasi akan segera ditampilkan.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const chairman = members.find((m) => m.level === 1);
  const viceChairmen = members.filter((m) => m.level === 2);
  const divisions = members.filter((m) => m.level === 3);

  return (
    <section id="struktur" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Tim Pengurus
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Struktur Organisasi
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pengurus Serikat Pekerja PT Berdikari
          </p>
        </div>

        {/* Chairman */}
        {chairman && (
          <div className="flex justify-center mb-8">
            <Card className="card-gradient shadow-elevated border-2 border-primary/20 max-w-sm w-full">
              <CardContent className="pt-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {getInitials(chairman.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 bg-accent p-2 rounded-full">
                    <Crown className="w-4 h-4 text-accent-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {chairman.name}
                </h3>
                <p className="text-primary font-semibold">{chairman.position}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {chairman.department}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connecting Line */}
        {viceChairmen.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="w-0.5 h-8 bg-border" />
          </div>
        )}

        {/* Vice Chairmen */}
        {viceChairmen.length > 0 && (
          <div className="flex justify-center gap-6 mb-8 flex-wrap">
            {viceChairmen.map((person) => (
              <Card
                key={person.id}
                className="card-gradient shadow-card border-border/50 w-full max-w-xs hover:shadow-elevated transition-all duration-300"
              >
                <CardContent className="pt-6 text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-secondary/20">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-lg font-bold">
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-bold text-foreground">
                    {person.name}
                  </h3>
                  <p className="text-secondary font-semibold text-sm">
                    {person.position}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {person.department}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Connecting Line */}
        {divisions.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="w-0.5 h-8 bg-border" />
          </div>
        )}

        {/* Divisions Grid */}
        {divisions.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {divisions.map((person) => (
              <Card
                key={person.id}
                className="card-gradient shadow-card border-border/50 hover:shadow-elevated transition-all duration-300 group"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-muted">
                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {person.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {person.position}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {person.department}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Structure;
