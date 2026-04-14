import { Mail, Phone, MapPin, Users } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "#pengumuman", label: "Pengumuman" },
  // { href: "#agenda", label: "Agenda" },
  { href: "#pkb", label: "PKB" },
  { href: "#struktur", label: "Struktur" },
  { href: "#aduan", label: "Aduan" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const targetId = href.replace("#", "");
      const element = document.getElementById(targetId);
      
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setIsOpen(false);
    };

  return (
    <footer className="hero-gradient text-white">
      <div className="container px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Serikat Pekerja</h3>
                <p className="text-white/80 text-sm">PT Berdikari</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Bersatu untuk kesejahteraan bersama. Memperjuangkan hak-hak pekerja
              dan membangun solidaritas yang kuat.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {navLinks.map((link) => (
              <li>
                <a
                    href={link.href}
                    onClick={(e) => handleHashClick(e, link.href)}
                  className="hover:text-accent transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}

            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Hubungi Kami</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                <a
                  href="mailto:sp.berdikari@gmail.com"
                  className="hover:text-accent transition-colors"
                >
                  serikat.pekerja@ptberdikari.co.id
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                <span>-</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent mt-0.5" />
                <span>
                  Graha Gabah, PT Berdikari
                  <br />
                  Jl. Pertani Gg. I No.22, Duren Tiga, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12760
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
          <p>
            © {currentYear} Serikat Pekerja PT Berdikari. Made by ❤️ Rafi Ramadhana.
          </p>
        </div>
      </div>
    </footer>
  );
};



export default Footer;
