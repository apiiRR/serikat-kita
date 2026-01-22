import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Announcements from "@/components/Announcements";
import Agenda from "@/components/Agenda";
import PKBSection from "@/components/PKBSection";
import Structure from "@/components/Structure";
import ComplaintForm from "@/components/ComplaintForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Announcements />
      {/* <Agenda /> */}
      <PKBSection />
      <Structure />
      <ComplaintForm />
      <Footer />
    </div>
  );
};

export default Index;
