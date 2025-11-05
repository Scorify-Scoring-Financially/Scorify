"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";



type Filter = "Semua" | "Tinggi" | "Sedang" | "Rendah";

interface CustomerData {
  id: string;
  nama: string;
  usia: number;
  pekerjaan: string;
  status: string; // 'yes', 'no', 'unknown'
  skor: number | null; // 0.0 - 1.0
  interaksi: string; // 'success', 'failure', 'nonexistent'
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());


/**
 * Komponen utama DashboardPage.
 * Menampilkan daftar peluang nasabah, fitur pencarian, filter, dan ekspor CSV.
 *
 * @component
 * @returns {JSX.Element} Halaman dashboard utama.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // API 1: (Sidebar) - Ambil data user yang login
  const { data: userData } = useSWR('/api/auth/me', fetcher);

  // API 2: (Info Box) - Ambil data statistik
  const { data: statsData } = useSWR('/api/dashboard/stats', fetcher);

  // API 3: (Tabel) - Ambil data nasabah (sudah ter-filter & ter-paginasi)
  // SWR akan otomatis memanggil ulang API ini setiap 'page', 'query', atau 'filter' berubah
  const {
    data: customerApiResponse,
    error: customerError,
    isLoading: isCustomerLoading
  } = useSWR(
    `/api/customers?page=${page}&limit=${pageSize}&search=${query}&filter=${filter}`,
    fetcher,
    { keepPreviousData: true } // (UX Bagus) Jaga data lama tetap tampil saat loading data baru
  );

  // 6. Ambil data dari hasil SWR
  const rows: CustomerData[] = customerApiResponse?.data || [];
  const pagination = customerApiResponse?.pagination;

  // Kita BACA dari API, bukan MENGHITUNG di frontend
  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.currentPage || 1;
  const totalItems = pagination?.totalItems || 0;

  // 7. Handler Logout (Panggil API Logout)
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Mutate SWR cache (opsional, tapi bagus)
    // mutate('/api/auth/me', null); 
    router.push('/login');
  };
  const csvUrl = `/api/export/csv?search=${query}&filter=${filter}`;


  const scoreBadge = (skor: number | null) => {
    if (skor === null) return "bg-gray-100 text-gray-700";
    const s = skor * 100; // Ubah 0.85 -> 85
    return s >= 80
      ? "bg-green-100 text-green-700"
      : s >= 60
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  }

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex  bg-gradient-to-b from-[#9EECCF] via-[#BFF5E2] to-[#F9FFFC]">
      {/* Sidebar */}
      <div className="w-64 relative">
        <aside className="w-64 h-full fixed bg-white shadow-md border-r border-gray-200 p-6 flex flex-col justify-between">
          <div>
            {/* Logo Scorify */}
            <div className="flex items-center justify-center mb-6 pt-2">
              <img
                src="/logo-scorify.png"
                alt="Scorify Logo"
                className="h-11 w-auto drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]"
              />
            </div>

            {/* Menu navigasi */}
            <nav className="flex flex-col gap-1 mt-6">
              {[
                ["space_dashboard", "Dashboard"],
                ["bar_chart", "Laporan"],
                ["admin_panel_settings", "Admin"],
              ].map(([icon, label], i) => (
                <a
                  key={label}
                  href="#"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${i === 0
                    ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold"
                    : "text-gray-700 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
                    }`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Profil pengguna */}
          <div className="mt-auto flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-3">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                style={{
                  backgroundImage:
                    "url('https://ui-avatars.com/api/?name=Sales&background=00A884&color=fff')",
                }}
              />
              <div>
                <h1 className="text-sm font-semibold">Sales</h1>
                <p className="text-xs text-gray-500">Tim Sales</p>
              </div>
            </div>

            {/* Tombol logout */}
            <button className="w-full h-10 rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#009970] transition">
              Keluar
            </button>
          </div>
        </aside>
      </div>


      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h1 className="text-3xl font-semibold whitespace-nowrap">
              Daftar Peluang Nasabah
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Analisis peluang konversi dan pantau performa tim sales Anda.
            </p>
          </div>

          {/* Kotak tanggal */}
          <div className="bg-white shadow rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200">
            {today}
          </div>
        </header>

        {/* Section utama */}
        <section className="flex-1 px-8 pb-8">
          {/* Info box */}
          {statsData && statsData.highPriorityCount > 0 && (
            <div className="bg-white shadow-md rounded-xl p-5 mb-6 flex items-center gap-3 border border-[#E2E8F0] mt-[-4px]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">lightbulb</span>
              </div>
              <div>
                <p className="font-semibold">
                  {/* Kita bisa hapus '...' karena 'statsData' sudah pasti ada */}
                  Ada {statsData.highPriorityCount} nasabah dengan skor di atas 80%!
                </p>
                <p className="text-sm text-gray-500">
                  Hubungi mereka segera untuk meningkatkan konversi.
                </p>
              </div>
            </div>
          )}


          {/* Search + Filter + Export */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* Input pencarian */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                value={query}
                onChange={(e) => {
                  setPage(1);
                  setQuery(e.target.value);
                }}
                type="text"
                placeholder="Cari nama nasabah..."
                className="pl-10 pr-3 py-2.5 w-full rounded-lg border border-gray-300 bg-white text-sm 
                focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition"
              />
            </div>

            {/* Filter + Export */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 p-1 border border-[var(--color-accent)] rounded-lg bg-white shadow-sm">
                {(["Semua", "Tinggi", "Sedang", "Rendah"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 text-sm rounded font-medium transition ${f === filter
                      ? "bg-[var(--color-accent)] text-white shadow"
                      : "text-gray-700 hover:bg-[var(--color-accent)] hover:text-white"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* Tombol ekspor CSV */}
              <a
                href={csvUrl}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-semibold shadow hover:bg-[#009970] transition"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Unduh CSV
              </a>
            </div>
          </div>

          {/* Table data nasabah */}
          <div className="bg-white rounded-xl shadow border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-[#F1F5F9] text-gray-600 uppercase text-[11px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 w-14">No</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Usia</th>
                    <th className="px-3 py-2">Pekerjaan</th>
                    <th className="px-3 py-2">Status Deposito</th>
                    <th className="px-3 py-2">Skor</th>
                    <th className="px-3 py-2">Interaksi</th>
                    <th className="px-3 py-2 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {/* Tampilkan status Loading */}
                  {isCustomerLoading && (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                        Memuat data nasabah...
                      </td>
                    </tr>
                  )}

                  {/* Tampilkan status Error */}
                  {customerError && !isCustomerLoading && (
                    <tr>
                      <td className="px-3 py-6 text-center text-red-500" colSpan={8}>
                        Gagal memuat data. Coba lagi nanti.
                      </td>
                    </tr>
                  )}

                  {/* Tampilkan Data (jika tidak loading & tidak error) */}
                  {!isCustomerLoading && !customerError && rows.map((customer, idx) => (
                    <tr
                      key={customer.id} // Gunakan ID unik dari database
                      className="hover:bg-[#ECFDF5] transition-colors"
                    >
                      {/* Nomor urut berdasarkan halaman */}
                      <td className="px-3 py-2">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap"><Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="hover:text-[var(--color-accent)] hover:underline"
                      >
                        {customer.nama}
                      </Link></td>
                      <td className="px-3 py-2">{customer.usia}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{customer.pekerjaan}</td>
                      {/* Ganti nama kolom 'Status Deposito' -> 'Status Pinjaman' (sesuai API) */}
                      <td className="px-3 py-2">{customer.status}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full ${scoreBadge(
                            customer.skor
                          )}`}
                        >
                          {customer.skor !== null ? `${Math.round(customer.skor * 100)}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{customer.interaksi}</td>
                      <td className="px-3 py-2 text-center">
                        {/* Arahkan ke halaman detail nasabah */}
                        <button
                          onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                          className="p-1 rounded-full text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">call</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Tampilkan status Kosong */}
                  {!isCustomerLoading && !customerError && rows.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                        Tidak ada data yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t bg-white text-xs">
              <p className="text-gray-600">
                Halaman <b>{currentPage}</b> dari <b>{totalPages}</b> • Total{" "}
                <b>{totalItems}</b> data
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-8 w-8 rounded-md border flex items-center justify-center ${n === currentPage
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
