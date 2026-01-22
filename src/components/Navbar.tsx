import { useState } from "react";
import { Menu, X, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const navLinks = [
  { href: "#pengumuman", label: "Pengumuman" },
  // { href: "#agenda", label: "Agenda" },
  { href: "#pkb", label: "PKB" },
  { href: "#struktur", label: "Struktur" },
  { href: "#aduan", label: "Aduan" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-white/10">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 text-white">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm leading-none block">
                SP BERDIKARI
              </span>
              <span className="text-xs text-white/70">Serikat Pekerja</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            {/* <Link
              to="/auth"
              className="ml-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
            >
              <Lock className="w-4 h-4" />
              Admin
            </Link> */}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {/* <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Admin
              </Link> */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
