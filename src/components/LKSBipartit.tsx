import { useEffect, useState } from "react";
import { Handshake, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  name: string;
  position: string;
  department: string;
  sort_order: number;
}

const isLksBipartitMember = (department: string) => {
  const dept = department.toLowerCase();

  return (
    dept.includes("lks") ||
    dept.includes("bipartit") ||
    dept.includes("bipartied")
  );
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const LKSBipartit = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("organization_structure")
        .select("id,name,position,department,sort_order")
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setMembers(
          data.filter((member) => isLksBipartitMember(member.department))
        );
      }

      setIsLoading(false);
    };

    fetchMembers();
  }, []);

  if (isLoading) {
    return (
      <section id="lks-bipartit" className="py-20 bg-secondary/5">
        <div className="container px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            <div className="h-24 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <section id="lks-bipartit" className="py-20 bg-secondary/5">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Handshake className="w-4 h-4" />
            LKS Bipartit
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Anggota LKS Bipartit
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Perwakilan anggota dalam forum komunikasi dan konsultasi bipartit.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {members.map((member) => (
            <Card
              key={member.id}
              className="card-gradient shadow-card border-border/50 hover:shadow-elevated transition-all duration-300 group"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.position || "Anggota LKS Bipartit"}
                    </p>
                  </div>
                  <UserCheck className="w-5 h-5 text-primary shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LKSBipartit;
