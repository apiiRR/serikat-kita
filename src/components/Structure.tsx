import { User, Users, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const structureData = {
  chairman: {
    name: "Ahmad Sutrisno",
    position: "Ketua Umum",
    department: "Kepemimpinan",
  },
  viceChairmen: [
    {
      name: "Budi Santoso",
      position: "Wakil Ketua I",
      department: "Advokasi & Hukum",
    },
    {
      name: "Sri Wahyuni",
      position: "Wakil Ketua II",
      department: "Kesejahteraan",
    },
  ],
  divisions: [
    {
      name: "Rini Handayani",
      position: "Sekretaris Umum",
      department: "Kesekretariatan",
    },
    {
      name: "Dedi Prasetyo",
      position: "Bendahara",
      department: "Keuangan",
    },
    {
      name: "Eko Widodo",
      position: "Koordinator",
      department: "Hubungan Industrial",
    },
    {
      name: "Maya Kusuma",
      position: "Koordinator",
      department: "Pendidikan & Pelatihan",
    },
    {
      name: "Hendra Wijaya",
      position: "Koordinator",
      department: "Komunikasi & Media",
    },
    {
      name: "Lina Marlina",
      position: "Koordinator",
      department: "Sosial & Kesejahteraan",
    },
  ],
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const Structure = () => {
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
            Pengurus Serikat Pekerja PT Berdikari periode 2023-2026
          </p>
        </div>

        {/* Chairman */}
        <div className="flex justify-center mb-8">
          <Card className="card-gradient shadow-elevated border-2 border-primary/20 max-w-sm w-full">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {getInitials(structureData.chairman.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 bg-accent p-2 rounded-full">
                  <Crown className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {structureData.chairman.name}
              </h3>
              <p className="text-primary font-semibold">
                {structureData.chairman.position}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {structureData.chairman.department}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connecting Line */}
        <div className="flex justify-center mb-8">
          <div className="w-0.5 h-8 bg-border" />
        </div>

        {/* Vice Chairmen */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          {structureData.viceChairmen.map((person, index) => (
            <Card
              key={index}
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

        {/* Connecting Line */}
        <div className="flex justify-center mb-8">
          <div className="w-0.5 h-8 bg-border" />
        </div>

        {/* Divisions Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {structureData.divisions.map((person, index) => (
            <Card
              key={index}
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
      </div>
    </section>
  );
};

export default Structure;
