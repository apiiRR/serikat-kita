import { useState, useEffect } from "react";
import { User, Users, Crown, Shield } from "lucide-react";
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
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="h-64 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
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

  // Kategori berdasarkan struktur yang diminta
  const chairman = members.find((m) => m.level === 1); // Ketua Umum
  
  const coreManagement = members.filter((m) => 
    m.level === 2 && (
      m.position.toLowerCase().includes("sekretaris") ||
      m.position.toLowerCase().includes("bendahara")
    )
  );
  
  const departments = members.filter((m) => m.level === 3);

  // Mapping posisi ke nama bidang untuk kategorisasi
  const getDepartmentCategory = (position: string, department: string) => {
    const pos = position.toLowerCase();
    const dept = department.toLowerCase();
    
    if (pos.includes("hubungan kerja") || pos.includes("pkb")) return "Bidang Hubungan Kerja & PKB";
    if (pos.includes("pelatihan") || pos.includes("pengembangan")) return "Bidang Pelatihan & Pengembangan Anggota";
    if (pos.includes("advokasi") || pos.includes("kebijakan") || pos.includes("hukum")) return "Bidang Advokasi Pekerja & Kebijakan Hukum";
    if (pos.includes("komunikasi") || pos.includes("informasi")) return "Bidang Komunikasi & Informasi";
    if (pos.includes("kesejahteraan") || pos.includes("strategis")) return "Bidang Kesejahteraan Pegawai & Isu Strategis";
    
    return department || "Bidang";
  };

  // Kelompokkan departments berdasarkan kategori
  const departmentsByCategory = departments.reduce((acc, person) => {
    const category = getDepartmentCategory(person.position, person.department);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(person);
    return acc;
  }, {} as Record<string, Member[]>);

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

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Kolom 1: PENGURUS INTI */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Pengurus Inti</h3>
            </div>
            
            {/* Ketua Umum */}
            {chairman && (
              <Card className="card-gradient shadow-elevated border-2 border-primary/30">
                <CardContent className="pt-6 text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-24 h-24 border-4 border-primary/30">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {getInitials(chairman.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 bg-accent p-2 rounded-full shadow-lg">
                      <Crown className="w-4 h-4 text-accent-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {chairman.name}
                  </h3>
                  <p className="text-primary font-semibold text-lg">
                    {chairman.position}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {chairman.department}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sekretaris & Bendahara */}
            <div className="grid gap-4">
              {coreManagement.map((person) => (
                <Card
                  key={person.id}
                  className="card-gradient shadow-card border-border/50 hover:shadow-elevated transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border-2 border-secondary/30">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-lg font-bold">
                          {getInitials(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">
                          {person.name}
                        </h3>
                        <p className="text-secondary font-semibold">
                          {person.position}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {person.department}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Kolom 2: BIDANG-BIDANG */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Bidang-Bidang</h3>
            </div>

            {Object.entries(departmentsByCategory).map(([category, people]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </h4>
                <div className="grid gap-3">
                  {people.map((person) => (
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
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {person.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {person.position}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Structure;

