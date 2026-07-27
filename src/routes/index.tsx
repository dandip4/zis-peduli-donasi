import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import kebakaranImage from "@/assets/kebakaran.webp";
import logozisImage from "@/assets/logozis.png";

type Donor = {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  donated_at: string;
};

const donorsQO = queryOptions({
  queryKey: ["donors"],
  queryFn: async (): Promise<Donor[]> => {
    const { data, error } = await supabase
      .from("donors")
      .select("id, name, amount, message, donated_at")
      .order("donated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Donor[];
  },
});

const campaignQO = queryOptions({
  queryKey: ["campaign_settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("campaign_settings")
      .select("target_amount")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return { target_amount: Number(data?.target_amount ?? 50000000) };
  },
});

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export function LandingPage() {
  const { data: donors } = useSuspenseQuery(donorsQO);
  const { data: campaign } = useSuspenseQuery(campaignQO);

  const collected = donors.reduce((s, d) => s + Number(d.amount), 0);
  const target = campaign.target_amount;
  const pct = Math.min(100, target > 0 ? (collected / target) * 100 : 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="container-page flex items-center justify-between py-4">
          <Logo />
          <a
            href="/admin"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Login
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="container-page pt-14 pb-10 text-center">
        <div className="mx-auto mt-6 inline-flex items-center justify-center rounded-2xl ">
          <img
            src={logozisImage}
            alt="Forum ZIS Peduli"
            className="h-10 w-auto object-contain"
          />
        </div>
        <h1 className="mt-6 font-extrabold text-primary leading-[0.95] text-5xl sm:text-6xl md:text-7xl">
          Open Donasi
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-foreground/80 leading-relaxed">
          Mari kita ringankan beban saudara-saudara kita di Kampung Adat Kasepuhan
          Ciptamulya, Desa Sirnaresmi, Kecamatan Cisolok, Kabupaten Sukabumi.
        </p>
        <blockquote className="mx-auto mt-6 max-w-2xl text-sm sm:text-base italic text-foreground/70 border-l-2 border-primary pl-4 text-left sm:text-center sm:border-l-0 sm:pl-0">
          &ldquo;Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia
          lainnya.&rdquo;
        </blockquote>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#donasi"
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors shadow-sm"
          >
            Donasi Sekarang
          </a>
          <a
            href="#donatur"
            className="inline-flex items-center rounded-lg border border-primary/40 bg-background px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-soft transition-colors"
          >
            Lihat Donatur
          </a>
        </div>

        {/* Photo */}
        <figure className="mt-12 mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <img
            src={kebakaranImage}
            alt="Kondisi Kampung Adat Kasepuhan Ciptamulya setelah kebakaran"
            className="w-full aspect-[16/9] object-cover"
            style={{ objectPosition: "50% 82%" }}
          />
        </figure>
        <figcaption className="mt-3 text-xs text-muted-foreground">
          Dokumentasi kebakaran di Kampung Adat Kasepuhan Ciptamulya, Sukabumi.
        </figcaption>
      </section>

      {/* Progress */}
      <section className="container-page py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Dana Terkumpul
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold text-primary">
                {rupiah(collected)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Target
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground/80">
                {rupiah(target)}
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-primary-soft">
            <div
              className="h-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-primary">
              {pct.toFixed(1)}% tercapai
            </span>
            <span className="text-muted-foreground">
              {donors.length} donatur telah berkontribusi
            </span>
          </div>
        </div>
      </section>

      {/* Info Donasi */}
      <section id="donasi" className="container-page py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Cara Berdonasi
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Salurkan donasi Anda melalui informasi berikut.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="info-box">
            <p className="text-xs uppercase tracking-wider opacity-90">
              Informasi &amp; Konfirmasi
            </p>
            <p className="mt-2 text-2xl font-bold tracking-wide">
              0812 1006 0215
            </p>
            <p className="mt-1 text-xs opacity-90">( RUNDI DMC )</p>
          </div>
          <div className="info-box">
            <p className="text-xs uppercase tracking-wider opacity-90">
              Rekening Donasi — Bank BSI
            </p>
            <p className="mt-2 text-2xl font-bold tracking-wide">
              7188524065
            </p>
            <p className="mt-1 text-xs opacity-90">a.n. Endang Sukarman</p>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
          Setelah melakukan transfer, mohon konfirmasi melalui WhatsApp agar donasi
          Anda dapat kami catat pada daftar donatur.
        </p>
      </section>

      {/* Donor list */}
      <section id="donatur" className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Daftar Donatur
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Terima kasih kepada seluruh donatur yang telah berpartisipasi.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            Total: <strong className="text-foreground">{donors.length}</strong>{" "}
            donatur
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-soft/60 text-left text-xs uppercase tracking-wider text-primary-dark">
                  <th className="px-5 py-3 font-semibold">Nama</th>
                  <th className="px-5 py-3 font-semibold">Nominal</th>
                  <th className="px-5 py-3 font-semibold">Pesan</th>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody>
                {donors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      Belum ada donatur. Jadilah yang pertama berdonasi.
                    </td>
                  </tr>
                ) : (
                  donors.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-border transition-colors hover:bg-primary-soft/30"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {d.name}
                      </td>
                      <td className="px-5 py-3 text-primary-dark font-semibold whitespace-nowrap">
                        {rupiah(Number(d.amount))}
                      </td>
                      <td className="px-5 py-3 text-foreground/70">
                        {d.message ? (
                          <span className="italic">&ldquo;{d.message}&rdquo;</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(d.donated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-background/70">
        <div className="container-page py-8 text-center">
          <Logo small />
          <p className="mt-3 text-sm text-foreground/70">
            Jazakumullahu khairan katsiran atas kepedulian Anda.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Forum ZIS Peduli. Semua bantuan
            disalurkan amanah kepada penerima manfaat.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={"inline-flex items-center " + (small ? "text-base" : "text-lg")}>
      <img
        src={logozisImage}
        alt="Forum ZIS Peduli"
        className={small ? "h-8 w-auto object-contain" : "h-10 w-auto object-contain"}
      />
    </div>
  );
}
