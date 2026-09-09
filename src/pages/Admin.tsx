import AdminOrganizationLogo from "@/components/admin/AdminOrganizationLogo";
import OrganizationLogo from "@/components/OrganizationLogo";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Images,
  Users,
  Bell,
  CalendarDays,
  FileText,
  MessageSquare,
  LogOut,
  Home,
  UserCheck,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import AdminAgenda from "@/components/admin/AdminAgenda";
import AdminStructure from "@/components/admin/AdminStructure";
import AdminLKSBipartit from "@/components/admin/AdminLKSBipartit";
import AdminHotline from "@/components/admin/AdminHotline";
import AdminComplaints from "@/components/admin/AdminComplaints";
import AdminDocuments from "@/components/admin/AdminDocuments";

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("announcements");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-4">
            Anda tidak memiliki akses admin. Hubungi administrator untuk
            mendapatkan akses.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-secondary text-white sticky top-0 z-50">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <OrganizationLogo className="w-10 h-10" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Panel Admin</h1>
                <p className="text-sm text-white/70">SP PT Berdikari</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => navigate("/")}
              >
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full justify-start overflow-x-auto h-auto mb-8 [&>button]:shrink-0 [&>button]:min-h-10 [&>button]:flex-1">
            <TabsTrigger
              value="announcements"
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Pengumuman</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Struktur</span>
            </TabsTrigger>
            <TabsTrigger
              value="lks-bipartit"
              className="flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>LKS</span>
            </TabsTrigger>
            <TabsTrigger value="hotline" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Hotline</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Dokumen</span>
            </TabsTrigger>
            <TabsTrigger value="complaints" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Aduan</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Images className="w-4 h-4" />
              <span>Galeri</span>
            </TabsTrigger>
            <TabsTrigger
              value="organization-logo"
              className="flex items-center gap-2"
            >
              <Images className="w-4 h-4" />
              <span>Logo Organisasi</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization-logo">
            <AdminOrganizationLogo />
          </TabsContent>
          <TabsContent value="gallery">
            <AdminGallery />
          </TabsContent>
          <TabsContent value="announcements">
            <AdminAnnouncements />
          </TabsContent>
          <TabsContent value="agenda">
            <AdminAgenda />
          </TabsContent>
          <TabsContent value="structure">
            <AdminStructure />
          </TabsContent>
          <TabsContent value="lks-bipartit">
            <AdminLKSBipartit />
          </TabsContent>
          <TabsContent value="hotline">
            <AdminHotline />
          </TabsContent>
          <TabsContent value="documents">
            <AdminDocuments />
          </TabsContent>
          <TabsContent value="complaints">
            <AdminComplaints />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
