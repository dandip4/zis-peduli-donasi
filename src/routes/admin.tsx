import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Forum ZIS Peduli" },
      { name: "description", content: "Halaman pengelolaan donatur Forum ZIS Peduli." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Donor = {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  donated_at: string;
};

function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(null);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80">
        <div className="container-page flex items-center justify-between py-4">
          <Link to="/" className="text-sm font-semibold text-primary">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-sm font-semibold text-foreground/80">
            Admin Panel
          </h1>
        </div>
      </header>

      <main className="container-page py-10">
        {checking ? (
          <p className="text-center text-muted-foreground">Memuat…</p>
        ) : !user ? (
          <LoginForm />
        ) : isAdmin === null ? (
          <p className="text-center text-muted-foreground">Memeriksa akses…</p>
        ) : !isAdmin ? (
          <NotAdmin email={user.email ?? ""} />
        ) : (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-foreground">Masuk Admin</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Silakan masuk untuk mengelola daftar donatur.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}

function NotAdmin({ email }: { email: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
      <h2 className="text-lg font-bold text-foreground">Akses ditolak</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Akun <strong>{email}</strong> belum memiliki hak akses admin. Hubungi
        pengelola untuk mendapatkan akses.
      </p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-4 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Keluar
      </button>
    </div>
  );
}

function AdminDashboard() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [target, setTarget] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Donor | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const [donorsRes, campRes] = await Promise.all([
      supabase
        .from("donors")
        .select("id, name, amount, message, donated_at")
        .order("donated_at", { ascending: false }),
      supabase.from("campaign_settings").select("target_amount").eq("id", 1).maybeSingle(),
    ]);
    setDonors((donorsRes.data ?? []) as Donor[]);
    setTarget(Number(campRes.data?.target_amount ?? 0));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Hapus donatur ini?")) return;
    const { error } = await supabase.from("donors").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const onSaveTarget = async (val: number) => {
    const { error } = await supabase
      .from("campaign_settings")
      .update({ target_amount: val })
      .eq("id", 1);
    if (error) alert(error.message);
    else load();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kelola Donatur</h2>
          <p className="text-sm text-muted-foreground">
            Tambah, ubah, atau hapus data donatur.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            + Tambah Donatur
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
          >
            Keluar
          </button>
        </div>
      </div>

      <TargetCard target={target} onSave={onSaveTarget} />

      {showForm && (
        <DonorForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-soft/60 text-left text-xs uppercase tracking-wider text-primary-dark">
                <th className="px-5 py-3">Nama</th>
                <th className="px-5 py-3">Nominal</th>
                <th className="px-5 py-3">Pesan</th>
                <th className="px-5 py-3 whitespace-nowrap">Tanggal</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Memuat…
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Belum ada donatur.
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-primary-soft/30">
                    <td className="px-5 py-3 font-medium">{d.name}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-primary-dark font-semibold">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(Number(d.amount))}
                    </td>
                    <td className="px-5 py-3 text-foreground/70">
                      {d.message ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(d.donated_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(d);
                            setShowForm(true);
                          }}
                          className="rounded-md border border-input bg-background px-3 py-1 text-xs hover:bg-muted"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => onDelete(d.id)}
                          className="rounded-md border border-destructive/30 bg-background px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TargetCard({ target, onSave }: { target: number; onSave: (v: number) => void }) {
  const [val, setVal] = useState<string>(String(target));
  useEffect(() => setVal(String(target)), [target]);
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex-1 min-w-[220px]">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">
          Target Donasi (Rp)
        </label>
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={() => onSave(Number(val) || 0)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
      >
        Simpan Target
      </button>
    </div>
  );
}

function DonorForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Donor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : "");
  const [message, setMessage] = useState(initial?.message ?? "");
  const [donatedAt, setDonatedAt] = useState(
    initial
      ? new Date(initial.donated_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      amount: Number(amount) || 0,
      message: message.trim() || null,
      donated_at: new Date(donatedAt).toISOString(),
    };
    const q = initial
      ? supabase.from("donors").update(payload).eq("id", initial.id)
      : supabase.from("donors").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) setError(error.message);
    else onSaved();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          {initial ? "Ubah Donatur" : "Tambah Donatur"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Tutup
        </button>
      </div>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="text-sm font-medium">Nama</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-sm font-medium">Nominal (Rp)</label>
          <input
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Pesan (opsional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Tanggal Donasi</label>
          <input
            type="datetime-local"
            value={donatedAt}
            onChange={(e) => setDonatedAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        {error && (
          <p className="sm:col-span-2 text-sm text-destructive">{error}</p>
        )}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
