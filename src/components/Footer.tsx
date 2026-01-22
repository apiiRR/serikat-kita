import { Mail, Phone, MapPin, Users } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
              <li>
                <a
                  href="#pengumuman"
                  className="hover:text-accent transition-colors"
                >
                  Pengumuman
                </a>
              </li>
              <li>
                <a
                  href="#agenda"
                  className="hover:text-accent transition-colors"
                >
                  Agenda
                </a>
              </li>
              <li>
                <a
                  href="#struktur"
                  className="hover:text-accent transition-colors"
                >
                  Struktur Organisasi
                </a>
              </li>
              <li>
                <a
                  href="#aduan"
                  className="hover:text-accent transition-colors"
                >
                  Layanan Aduan
                </a>
              </li>
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
            © {currentYear} Serikat Pekerja PT Berdikari. Made by Rafi Ramadhana.
          </p>
        </div>
      </div>
    </footer>
  );
};



export default Footer;
