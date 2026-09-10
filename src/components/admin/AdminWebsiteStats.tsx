import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const count = z.number().int().nonnegative();
const statsSchema = z.object({
  total: count, today: count, last7: count, last30: count,
  first_view_at: z.string().nullable(), updated_at: z.string(),
});
const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
});

export default function AdminWebsiteStats() {
  const query = useQuery({
    queryKey: ["website-view-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_website_view_stats");
      if (error) throw error;
      return statsSchema.parse(data);
    },
    retry: false,
  });
  const stats = query.data;
  return (
    <section className="space-y-6" aria-labelledby="website-stats-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="website-stats-title" className="text-2xl font-bold">Statistik Website</h2>
          <p className="text-muted-foreground">Jumlah tayangan beranda, termasuk kunjungan ulang dan refresh halaman.</p>
        </div>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />Perbarui
        </Button>
      </div>
      {query.isPending && <p role="status">Memuat statistik...</p>}
      {query.isError && <div role="alert" className="space-y-3">
        <p>Gagal memuat statistik. Pastikan migrasi statistik website sudah diterapkan dan akun Anda memiliki akses admin.</p>
        <Button disabled={query.isFetching} onClick={() => void query.refetch()}>Coba lagi</Button>
      </div>}
      {stats && <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Total Tayangan", stats.total], ["Hari Ini", stats.today],
            ["7 Hari Terakhir", stats.last7], ["30 Hari Terakhir", stats.last30],
          ] as const).map(([label, value]) => <Card key={label}>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold tabular-nums">{value.toLocaleString("id-ID")}</p></CardContent>
          </Card>)}
        </div>
        {stats.total === 0 && <p>Belum ada tayangan beranda yang tercatat.</p>}
        <p className="text-sm text-muted-foreground">
          Diperbarui {dateFormat.format(new Date(stats.updated_at))} WIB.
          {stats.first_view_at && ` Tayangan pertama tercatat ${dateFormat.format(new Date(stats.first_view_at))} WIB.`}
        </p>
      </>}
      <p className="text-sm text-muted-foreground">
        Periode mengikuti kalender WIB dan mencakup hari ini. Angka ini bukan jumlah pengunjung unik.
        Halaman admin dan login tidak dihitung. Data mulai tercatat setelah fitur diaktifkan;
        kunjungan sebelum itu tidak tersedia. Tidak menyimpan nama, email, atau alamat IP pengunjung.
      </p>
    </section>
  );
}
