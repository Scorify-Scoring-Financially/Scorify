"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Sidebar from "@/components/layout/Sidebar";
import { Phone } from "lucide-react";

type Filter = "Semua" | "Tinggi" | "Sedang" | "Rendah";

interface CustomerData {
  id: string;
  nama: string;
  usia: number;
  pekerjaan: string;
  status: string;
  skor: number | null;
  interaksi: string;
  phone?: string;
}

type CallResult = "success" | "failure" | "no_answer" | "unknown";
type StatusPenawaran = "agreed" | "declined" | "pending";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const [page, setPage] = useState(1);
  const [isCalling, setIsCalling] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callResult, setCallResult] = useState<CallResult>("unknown");
  const [callNote, setCallNote] = useState("");
  const [statusPenawaranCall, setStatusPenawaranCall] =
    useState<StatusPenawaran>("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  );
  const pageSize = 10;

  const { data: statsData } = useSWR("/api/dashboard/stats", fetcher);

  const {
    data: customerApiResponse,
    error: customerError,
    isLoading: isCustomerLoading,
    mutate,
  } = useSWR(
    `/api/customers?page=${page}&limit=${pageSize}&search=${query}&filter=${filter}`,
    fetcher,
    { keepPreviousData: true }
  );

  const rows: CustomerData[] = customerApiResponse?.data || [];
  const pagination = customerApiResponse?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.currentPage || 1;
  const totalItems = pagination?.totalItems || 0;

  // --- Handle panggilan ke nasabah
  const handleCallClick = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    if (!customer.phone) return;
    setIsCalling(true);
    window.location.href = `tel:${customer.phone}`;

    setTimeout(() => {
      setIsCalling(false);
      setShowCallModal(true);
    }, 3000);
  };

  // --- Simpan hasil panggilan
  const handleCallSubmit = async () => {
    if (!callNote.trim() || !selectedCustomer) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: callNote,
          callResult,
          statusPenawaran: statusPenawaranCall,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan panggilan");
      await mutate(); // Refresh tabel

      setShowCallModal(false);
      setCallNote("");
      setCallResult("unknown");
      setStatusPenawaranCall("pending");
    } catch (err) {
      console.error("Call log error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* HEADER */}
        <header className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h1 className="text-3xl font-semibold whitespace-nowrap">
              Daftar Peluang Nasabah
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Kelola peluang nasabah dan optimalkan proses penawaran Anda.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200">
            {today}
          </div>
        </header>

        {/* STATISTIK */}
        <section className="flex-1 px-8 pb-8">
          {statsData && statsData.highPriorityCount > 0 && (
            <div className="bg-white shadow-md rounded-xl p-5 mb-6 flex items-center gap-3 border border-[#E2E8F0] mt-[-4px]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">
                  lightbulb
                </span>
              </div>
              <div>
                <p className="font-semibold">
                  Ada {statsData.highPriorityCount} nasabah dengan skor di atas
                  80%!
                </p>
                <p className="text-sm text-gray-500">
                  Hubungi mereka segera untuk meningkatkan konversi.
                </p>
              </div>
            </div>
          )}

          {/* FILTER & SEARCH */}
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
              {/* Filter skor */}
              <div className="flex items-center gap-2 p-1 border border-[var(--color-accent)] rounded-lg bg-white shadow-sm">
                {(["Semua", "Tinggi", "Sedang", "Rendah"] as Filter[]).map(
                  (f) => (
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
                  )
                )}
              </div>

              {/* Export CSV */}
              <a
                href={`/api/export/csv?search=${query}&filter=${filter}`}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-semibold shadow hover:bg-[#009970] transition"
              >
                <span className="material-symbols-outlined text-sm">
                  download
                </span>
                Unduh CSV
              </a>
            </div>
          </div>

          {/* TABEL NASABAH */}
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
                  {isCustomerLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-gray-500"
                      >
                        Memuat data nasabah...
                      </td>
                    </tr>
                  )}

                  {customerError && !isCustomerLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-red-500"
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
                        <td className="px-3 py-2 font-semibold whitespace-nowrap">
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="hover:text-[var(--color-accent)] hover:underline"
                          >
                            {customer.nama}
                          </Link>
                        </td>
                        <td className="px-3 py-2">{customer.usia}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {customer.pekerjaan}
                        </td>
                        <td className="px-3 py-2">{customer.status}</td>
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
                        <td className="px-3 py-2">{customer.interaksi}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleCallClick(customer)}
                            className="p-1 rounded-full text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
                          >
                            <Phone size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {!isCustomerLoading &&
                    !customerError &&
                    rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-6 text-center text-gray-500"
                        >
                          Tidak ada data yang cocok.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
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

                {(() => {
                  const maxVisible = 5;
                  const pages: number[] = [];
                  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  const end = Math.min(totalPages, start + maxVisible - 1);
                  if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1);
                  }

                  for (let i = start; i <= end; i++) pages.push(i);

                  return (
                    <>
                      {start > 1 && (
                        <>
                          <button
                            onClick={() => setPage(1)}
                            className="h-8 w-8 rounded-md border flex items-center justify-center text-gray-700 hover:bg-gray-50"
                          >
                            1
                          </button>
                          {start > 2 && <span className="px-2">...</span>}
                        </>
                      )}

                      {pages.map((n) => (
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

                      {end < totalPages && (
                        <>
                          {end < totalPages - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <button
                            onClick={() => setPage(totalPages)}
                            className="h-8 w-8 rounded-md border flex items-center justify-center text-gray-700 hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}

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

      {/* === Simulasi panggilan === */}
      {isCalling && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[300px] text-center">
            <Phone
              size={36}
              className="mx-auto text-[var(--color-accent,#00A884)] mb-3 animate-pulse"
            />
            <p className="font-semibold text-gray-700">
              Menghubungi nasabah...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCustomer?.phone || "-"}
            </p>
          </div>
        </div>
      )}

      {/* === Modal hasil panggilan === */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              Catat Hasil Panggilan
            </h2>

            <label className="text-sm font-medium text-gray-700 block mb-1">
              Hasil Panggilan
            </label>
            <select
              value={callResult}
              onChange={(e) => setCallResult(e.target.value as CallResult)}
              className="w-full mb-3 border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent,#00A884)]"
            >
              <option value="success">Berhasil</option>
              <option value="failure">Gagal</option>
              <option value="no_answer">Tidak Dijawab</option>
              <option value="unknown">Tidak Diketahui</option>
            </select>

            <label className="text-sm font-medium text-gray-700 block mb-1">
              Status Penawaran
            </label>
            <select
              value={statusPenawaranCall}
              onChange={(e) =>
                setStatusPenawaranCall(e.target.value as StatusPenawaran)
              }
              className="w-full mb-3 border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent,#00A884)]"
            >
              <option value="agreed">Disetujui</option>
              <option value="declined">Ditolak</option>
              <option value="pending">Tertunda</option>
            </select>

            <label className="text-sm font-medium text-gray-700 block mb-1">
              Catatan
            </label>
            <textarea
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-accent,#00A884)]"
              rows={3}
              placeholder="Masukkan detail hasil panggilan..."
            ></textarea>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCallModal(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleCallSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm rounded-md bg-[var(--color-accent,#00A884)] text-white hover:bg-[#009970]"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
