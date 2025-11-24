"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Sidebar from "@/components/layout/Sidebar";

type Filter = "Semua" | "Tinggi" | "Sedang" | "Rendah";

interface CustomerData {
  id: string;
  nama: string;
  usia: number;
  pekerjaan: string;
  status: string; // 'yes', 'no', 'unknown'
  skor: number | null; // 0.0 - 1.0
  interaksi: string; // 'success', 'failure', 'nonexistent'
  salesId?: string; // id sales (S001, S002, ...)
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Komponen utama DashboardPage untuk ROLE = ADMIN.
 * Perubahan dari versi sales:
 * - Ganti info box jadi 3 card: Total Nasabah, Total Sales, Skor Tinggi
 * - Tambah dropdown filter Sales (Semua / S001 / S002 / ...)
 * - Tabel: No | Nama | Usia | Pekerjaan | Skor | Sales | Interaksi 
 * - Tidak ada kolom aksi (read-only detail nasabah)
 *
 * Sisanya sama persis dengan versi sales.
 */
export default function DashboardAdminPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // API 1: (Sidebar) - Ambil data user yang login
  const { data: userData } = useSWR('/api/auth/me', fetcher);

  // API Stats Admin: (Total nasabah, total sales, total high score)
  const { data: adminStats } = useSWR('/api/admin/stats', fetcher);

  // API Sales List untuk dropdown
  const { data: salesList } = useSWR('/api/sales', fetcher);

  const [salesFilter, setSalesFilter] = useState<string>("Semua");
  const salesParam = salesFilter === "Semua" ? "" : salesFilter;

  const {
    data: customerApiResponse,
    error: customerError,
    isLoading: isCustomerLoading
  } = useSWR(
    `/api/customers?page=${page}&limit=${pageSize}&search=${encodeURIComponent(
      query
    )}&filter=${filter}${
      salesParam ? `&sales=${encodeURIComponent(salesParam)}` : ""
    }`,
    fetcher,
    { keepPreviousData: true }
  );

  const rows: CustomerData[] = customerApiResponse?.data || [];
  const pagination = customerApiResponse?.pagination;

  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.currentPage || 1;
  const totalItems = pagination?.totalItems || 0;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const csvUrl = `/api/export/csv?search=${encodeURIComponent(
    query
  )}&filter=${filter}${
    salesParam ? `&sales=${encodeURIComponent(salesParam)}` : ""
  }`;

  const scoreBadge = (skor: number | null) => {
    if (skor === null) return "bg-gray-100 text-gray-700";
    const s = skor * 100;
    return s >= 80
      ? "bg-green-100 text-green-700"
      : s >= 60
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";
  };

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h1 className="text-3xl font-semibold whitespace-nowrap">
              Dashboard Admin
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Monitoring seluruh nasabah dan performa tim sales Anda.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200">
            {today}
          </div>
        </header>

        <section className="flex-1 px-8 pb-8">
          {/* Info cards (Admin) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow-md rounded-xl p-5 flex items-center gap-3 border border-[#E2E8F0]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">people</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Nasabah</p>
                <p className="font-semibold text-lg">
                  {adminStats?.totalCustomers ?? "—"}
                </p>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-5 flex items-center gap-3 border border-[#E2E8F0]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="font-semibold text-lg">
                  {adminStats?.totalSales ?? "—"}
                </p>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-5 flex items-center gap-3 border border-[#E2E8F0]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Skor Tinggi (&ge; 80%)</p>
                <p className="font-semibold text-lg">
                  {adminStats?.totalHighScore ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Search + Filter + Export */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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

              {/* Sales dropdown */}
              <div className="flex items-center gap-2 p-1 border border-gray-300 rounded-lg bg-white shadow-sm">
                <select
                  value={salesFilter}
                  onChange={(e) => {
                    setSalesFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-sm px-3 py-2 outline-none bg-transparent"
                >
                  <option value="Semua">Semua Sales</option>
                  {Array.isArray(salesList) &&
                    (salesList as any).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.id} {s.nama ? `- ${s.nama}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              {/* Export CSV */}
              <a
                href={csvUrl}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-semibold shadow hover:bg-[#009970] transition"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Unduh CSV
              </a>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-[#F1F5F9] text-gray-600 uppercase text-[11px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 w-14">No</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Usia</th>
                    <th className="px-3 py-2">Pekerjaan</th>
                    <th className="px-3 py-2">Skor</th>
                    <th className="px-3 py-2">Sales</th>
                    <th className="px-3 py-2">Interaksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {isCustomerLoading && (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-gray-500"
                        colSpan={8}
                      >
                        Memuat data nasabah...
                      </td>
                    </tr>
                  )}

                  {customerError && !isCustomerLoading && (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-red-500"
                        colSpan={8}
                      >
                        Gagal memuat data. Coba lagi nanti.
                      </td>
                    </tr>
                  )}

                  {!isCustomerLoading &&
                    !customerError &&
                    rows.map((customer, idx) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-[#ECFDF5] transition-colors"
                      >
                        <td className="px-3 py-2">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        {/* klik nama → admin/dashboard/customers/{id} */}
                        <td className="px-3 py-2 font-semibold whitespace-nowrap">
                          <Link
                            href={`/admin/dashboard/customers/${customer.id}`}
                            className="hover:text-[var(--color-accent)] hover:underline"
                          >
                            {customer.nama}
                          </Link>
                        </td>

                        <td className="px-3 py-2">{customer.usia}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {customer.pekerjaan}
                        </td>

                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full ${scoreBadge(
                              customer.skor
                            )}`}
                          >
                            {customer.skor !== null
                              ? `${Math.round(customer.skor * 100)}%`
                              : "N/A"}
                          </span>
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap">
                          {customer.salesId ?? "-"}
                        </td>

                        {/* interaksi sama seperti dashboard sales */}
                        <td className="px-3 py-2">{customer.interaksi}</td>
                      </tr>
                    ))}

                  {!isCustomerLoading &&
                    !customerError &&
                    rows.length === 0 && (
                      <tr>
                        <td
                          className="px-3 py-6 text-center text-gray-500"
                          colSpan={8}
                        >
                          Tidak ada data yang cocok.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

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
