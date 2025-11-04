"use client";
import React, { useMemo, useState } from "react";

type Row = [string, number, string, string, number, string];

const dummyData: Row[] = [
  ["Ahmad Yusuf", 34, "Software Engineer", "Disetuhui", 85, "Dihubungi"],
  ["Siti Aminah", 28, "Marketing Specialist", "Proses", 92, "Belum Dihubungi"],
  ["Rizky Pratama", 45, "Wiraswasta", "Tidak Disetujui", 71, "Dihubungi"],
  ["Dewi Lestari", 22, "Mahasiswa", "Disetujui", 48, "Belum Dihubungi"],
  ["Eko Nugroho", 51, "PNS", "Proses", 65, "Belum Dihubungi"],
  ["Rina Andini", 29, "Data Analyst", "Proses", 83, "Belum Dihubungi"],
  ["Teguh Rahman", 33, "Sales", "Disetujui", 82, "Dihubungi"],
  ["Farah Azizah", 26, "Analis Keuangan", "Proses", 67, "Belum Dihubungi"],
  ["Samsul Bahri", 40, "Supir", "Disetujui", 59, "Dihubungi"],
  ["Nurul Hidayah", 24, "Mahasiswa", "Proses", 45, "Belum Dihubungi"],
  ["Andri Setiawan", 38, "Karyawan Swasta", "Tidak Disetujui", 90, "Dihubungi"],
];

type Filter = "Semua" | "Tinggi" | "Sedang" | "Rendah";

/**
 * Komponen utama DashboardPage.
 * Menampilkan daftar peluang nasabah, fitur pencarian, filter, dan ekspor CSV.
 *
 * @component
 * @returns {JSX.Element} Halaman dashboard utama.
 */
export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  /**
   * Melakukan filter data berdasarkan kata kunci pencarian dan kategori skor.
   *
   * @constant
   * @type {Row[]}
   * @param {string} query - Kata kunci pencarian nama nasabah.
   * @param {Filter} filter - Filter tingkat skor ("Semua", "Tinggi", "Sedang", "Rendah").
   * @returns {Row[]} Data nasabah yang sudah difilter.
   */
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dummyData.filter(([nama, , , , skor]) => {
      const bySearch = !q || nama.toLowerCase().includes(q);
      let byFilter = true;

      if (filter === "Tinggi") byFilter = skor >= 80;
      else if (filter === "Sedang") byFilter = skor >= 60 && skor < 80;
      else if (filter === "Rendah") byFilter = skor < 60;

      return bySearch && byFilter;
    });
  }, [query, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = filteredRows.slice(start, start + pageSize);

  /**
   * Mengekspor data nasabah yang telah difilter ke file CSV dan mengunduhnya otomatis.
   *
   * @function handleExportCsv
   * @returns {void}
   */
  const handleExportCsv = () => {
    const header = ["Nama", "Usia", "Pekerjaan", "Status", "Skor", "Interaksi"];
    const data = filteredRows.map((r) => r.map((x) => `${x}`));
    const csv = [header, ...data].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scorify_nasabah.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Memberikan warna badge sesuai dengan skor nasabah.
   *
   * @function scoreBadge
   * @param {number} skor - Nilai skor nasabah (0–100).
   * @returns {string} Kelas Tailwind warna untuk badge skor.
   */
  const scoreBadge = (skor: number) =>
    skor >= 80
      ? "bg-green-100 text-green-700"
      : skor >= 60
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  // Format tanggal hari ini (contoh: "04 November 2025")
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#9EECCF] via-[#BFF5E2] to-[#F9FFFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md border-r border-gray-200 p-6 flex flex-col justify-between">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  i === 0
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
          <div className="bg-white shadow-md rounded-xl p-5 mb-6 flex items-center gap-3 border border-[#E2E8F0] mt-[-4px]">
            <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
              <span className="material-symbols-outlined text-2xl">lightbulb</span>
            </div>
            <div>
              <p className="font-semibold">Ada 10 nasabah dengan skor di atas 80%!</p>
              <p className="text-sm text-gray-500">
                Hubungi mereka segera untuk meningkatkan konversi.
              </p>
            </div>
          </div>

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
                    className={`px-3 py-1.5 text-sm rounded font-medium transition ${
                      f === filter
                        ? "bg-[var(--color-accent)] text-white shadow"
                        : "text-gray-700 hover:bg-[var(--color-accent)] hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Tombol ekspor CSV */}
              <button
                onClick={handleExportCsv}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-semibold shadow hover:bg-[#009970] transition"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Unduh CSV
              </button>
            </div>
          </div>

          {/* Table data nasabah */}
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
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
                  {rows.map(([nama, usia, kerja, status, skor, interaksi], idx) => (
                    <tr
                      key={`${nama}-${idx}`}
                      className="hover:bg-[#ECFDF5] transition-colors"
                    >
                      <td className="px-3 py-2">{start + idx + 1}</td>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">{nama}</td>
                      <td className="px-3 py-2">{usia}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{kerja}</td>
                      <td className="px-3 py-2">{status}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full ${scoreBadge(
                            skor
                          )}`}
                        >
                          {skor}%
                        </span>
                      </td>
                      <td className="px-3 py-2">{interaksi}</td>
                      <td className="px-3 py-2 text-center">
                        <button className="p-1 rounded-full text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors">
                          <span className="material-symbols-outlined text-sm">call</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
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
                <b>{filteredRows.length}</b> data
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
                    className={`h-8 w-8 rounded-md border flex items-center justify-center ${
                      n === currentPage
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
