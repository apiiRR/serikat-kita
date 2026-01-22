import { Users, Shield, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] hero-gradient flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 py-20 text-center">
        <div className="animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 leading-tight">
            Serikat Pekerja
          </h1>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-accent mb-6">
            PT BERDIKARI
          </h2>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bersatu untuk kesejahteraan bersama. Melindungi hak-hak pekerja, 
            memperjuangkan keadilan, dan membangun masa depan yang lebih baik.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-secondary hover:bg-white/90 font-semibold px-8 py-6 text-lg"
              onClick={() => scrollToSection("pengumuman")}
            >
              <Megaphone className="w-5 h-5 mr-2" />
              Lihat Pengumuman
            </Button>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 py-6 text-lg"
              onClick={() => scrollToSection("aduan")}
            >
              <Shield className="w-5 h-5 mr-2" />
              Ajukan Aduan
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-slide-up">
          {[
            { value: "150+", label: "Anggota Aktif" },
            { value: "60", label: "Tahun Berdiri" },
            { value: "100%", label: "Komitmen" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-white/70">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
