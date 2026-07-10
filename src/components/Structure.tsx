import { useState, useEffect } from "react";
import {
  BriefcaseBusiness,
  ClipboardList,
  Crown,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  name: string;
  department: string;
  jobdesk: string | null;
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

const isLksBipartitMember = (department: string) => {
  const dept = department.toLowerCase();

  return (
    dept.includes("lks") ||
    dept.includes("bipartit") ||
    dept.includes("bipartied")
  );
};

const departmentMeta: Record<
  string,
  {
    icon: LucideIcon;
    iconClassName: string;
    badgeClassName: string;
  }
> = {
  "Bidang Hubungan Kerja & PKB": {
    icon: BriefcaseBusiness,
    iconClassName: "text-secondary",
    badgeClassName: "bg-secondary/10 border-secondary/20",
  },
  "Bidang Pelatihan & Pengembangan Anggota": {
    icon: GraduationCap,
    iconClassName: "text-emerald-600",
    badgeClassName: "bg-emerald-50 border-emerald-200",
  },
  "Bidang Advokasi Pekerja & Kebijakan Hukum": {
    icon: Scale,
    iconClassName: "text-primary",
    badgeClassName: "bg-primary/10 border-primary/20",
  },
  "Bidang Komunikasi & Informasi": {
    icon: Megaphone,
    iconClassName: "text-sky-600",
    badgeClassName: "bg-sky-50 border-sky-200",
  },
  "Bidang Kesejahteraan Pegawai & Isu Strategis": {
    icon: HeartHandshake,
    iconClassName: "text-accent-foreground",
    badgeClassName: "bg-accent/30 border-accent/40",
  },
};

const getDepartmentMeta = (category: string) => {
  return (
    departmentMeta[category] || {
      icon: Users,
      iconClassName: "text-muted-foreground",
      badgeClassName: "bg-muted border-border",
    }
  );
};

const getDivisionJobdesk = (people: Member[]) => {
  return people.find((person) => person.jobdesk?.trim())?.jobdesk || null;
};

const getJobdeskItems = (jobdesk: string) => {
  return jobdesk
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
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

  const organizationMembers = members.filter(
    (m) => !isLksBipartitMember(m.department)
  );

  const chairman = organizationMembers.find((m) => m.level === 1);
  
  const coreManagement = organizationMembers.filter((m) => 
    m.level === 2
  );
  
  const departments = organizationMembers.filter((m) => m.level === 3);

  const getDepartmentCategory = (department: string) => {
    const dept = department.toLowerCase();
    
    if (dept.includes("hubungan kerja") || dept.includes("pkb")) {
      return "Bidang Hubungan Kerja & PKB";
    }
    if (dept.includes("pelatihan") || dept.includes("pengembangan")) {
      return "Bidang Pelatihan & Pengembangan Anggota";
    }
    if (
      dept.includes("advokasi") ||
      dept.includes("kebijakan") ||
      dept.includes("hukum")
    ) {
      return "Bidang Advokasi Pekerja & Kebijakan Hukum";
    }
    if (dept.includes("komunikasi") || dept.includes("informasi")) {
      return "Bidang Komunikasi & Informasi";
    }
    if (dept.includes("kesejahteraan") || dept.includes("strategis")) {
      return "Bidang Kesejahteraan Pegawai & Isu Strategis";
    }
    
    return department || "Bidang";
  };

  const departmentsByCategory = departments.reduce((acc, person) => {
    const category = getDepartmentCategory(person.department);
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
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Pengurus Utama</h3>
            </div>
            
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
                  <p className="text-sm text-muted-foreground mt-1">
                    {chairman.department}
                  </p>
                </CardContent>
              </Card>
            )}

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

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Bidang-Bidang</h3>
            </div>

            {Object.entries(departmentsByCategory).map(([category, people]) => {
              const meta = getDepartmentMeta(category);
              const DepartmentIcon = meta.icon;
              const divisionJobdesk = getDivisionJobdesk(people);
              const jobdeskItems = divisionJobdesk
                ? getJobdeskItems(divisionJobdesk)
                : [];

              return (
                <div key={category} className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border ${meta.badgeClassName}`}
                      >
                        <DepartmentIcon className={`w-5 h-5 ${meta.iconClassName}`} />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        {category}
                      </h4>
                    </div>
                    {jobdeskItems.length > 0 && (
                      <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                          <ClipboardList className="w-4 h-4" />
                          Jobdesk Divisi
                        </div>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground leading-relaxed">
                          {jobdeskItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Structure;
