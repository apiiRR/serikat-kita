import { useState, useEffect } from "react";
import { FileText, ExternalLink, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  created_at: string;
}

const PKBSection = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDocuments(data);
        // Set dokumen pertama (paling baru) untuk terbuka secara default
        if (data.length > 0) {
          setExpandedId(data[0].id);
        }
      }
      setIsLoading(false);
    };

    fetchDocuments();
  }, []);

  if (isLoading) {
    return (
      <section id="pkb" className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 w-64 bg-muted rounded mx-auto mb-4" />
              <div className="h-4 w-96 bg-muted rounded mx-auto" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <section id="pkb" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            Dokumen Resmi
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Perjanjian Kerja Bersama
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dokumen Perjanjian Kerja Bersama (PKB) antara Serikat Pekerja dan
            Manajemen PT Berdikari
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === doc.id ? null : doc.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground">
                        {doc.name}
                      </h3>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Diupload:{" "}
                        {new Date(doc.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === doc.id ? null : doc.id);
                        }}
                      >
                        {expandedId === doc.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded PDF Viewer */}
                {expandedId === doc.id && (
                  <div className="border-t">
                    <div className="bg-muted/50 p-4">
                      <iframe
                        src={`${doc.file_url}#toolbar=1`}
                        className="w-full h-[600px] rounded-lg border bg-white"
                        title={doc.name}
                      />
                      <div className="flex justify-center mt-4 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Buka di Tab Baru
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.file_url;
                            link.download = `${doc.name}.pdf`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PKBSection;
