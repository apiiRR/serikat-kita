import Gallery from "@/components/Gallery";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Announcements from "@/components/Announcements";
import Agenda from "@/components/Agenda";
import PKBSection from "@/components/PKBSection";
import Structure from "@/components/Structure";
import LKSBipartit from "@/components/LKSBipartit";
import Hotline from "@/components/Hotline";
import ComplaintForm from "@/components/ComplaintForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Announcements />
      <Gallery />
      {/* <Agenda /> */}
      <PKBSection />
      <Structure />
      <LKSBipartit />
      <Hotline />
      <ComplaintForm />
      <Footer />
    </div>
  );
};

export default Index;
