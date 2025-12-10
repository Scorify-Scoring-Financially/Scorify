"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import Sidebar from "@/components/_layout/Sidebar";

type Filter = "Semua" | "Tinggi" | "Sedang" | "Rendah";

interface CustomerData {
  id: string;
  nama: string;
  usia: number;
  pekerjaan: string;
  status: string;
  skor: number | null;
  interaksi: string;
  salesId?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardAdminPage() {

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const [salesFilter, setSalesFilter] = useState<string>("Semua");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const salesParam = salesFilter === "Semua" ? "" : salesFilter;

  // --- Ambil data statistik admin
  const { data: adminStats, isLoading: statsLoading } = useSWR(
    "/api/admin/stats",
    fetcher
  );

  // --- Ambil daftar sales untuk filter dropdown
  const { data: salesList } = useSWR("/api/reports/admin/sales", fetcher);

  // --- Ambil data customer sesuai filter
  const {
    data: customerApiResponse,
    error: customerError,
    isLoading: isCustomerLoading,
  } = useSWR(
    `/api/customers?page=${page}&limit=${pageSize}&search=${encodeURIComponent(
      query
    )}&filter=${filter}${salesParam ? `&sales=${encodeURIComponent(salesParam)}` : ""
    }`,
    fetcher,
    { keepPreviousData: true }
  );

  const rows: CustomerData[] = customerApiResponse?.data || [];
  const pagination = customerApiResponse?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.currentPage || 1;
  const totalItems = pagination.totalItems || 0;

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const scoreBadge = (skor: number | null) => {
    if (skor === null) return "bg-gray-100 text-gray-700";
    const s = skor * 100;
    return s >= 80
      ? "bg-green-100 text-green-700"
      : s >= 60
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  };

  // --- Reset halaman saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [filter, query, salesFilter]);


  // --- URL Export CSV
  const csvUrl = `/api/export/csv?search=${encodeURIComponent(
    query
  )}&filter=${filter}${salesParam ? `&sales=${encodeURIComponent(salesParam)}` : ""
    }`;

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        {/* HEADER */}
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

        {/* INFO CARDS */}
        <section className="px-8 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total Nasabah */}
            <div className="bg-white shadow-md rounded-xl p-5 flex items-center gap-3 border border-[#E2E8F0]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">people</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Nasabah</p>
                <p className="font-semibold text-lg">
                  {statsLoading ? "..." : adminStats?.totalCustomers ?? "—"}
                </p>
              </div>
            </div>

            {/* Total Sales */}
            <div className="bg-white shadow-md rounded-xl p-5 flex items-center gap-3 border border-[#E2E8F0]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="font-semibold text-lg">
                  {statsLoading ? "..." : adminStats?.totalSales ?? "—"}
                </p>
              </div>
            </div>

            {/* Skor Tinggi */}
            <div className="bg-white shadow-md rounded-xl p-5 flex items-center gap-3 border border-[#E2E8F0]">
              <div className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] p-3 rounded-lg">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Skor Tinggi (≥ 80%)</p>
                <p className="font-semibold text-lg">
                  {statsLoading ? "..." : adminStats?.totalHighScore ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Cari nama nasabah..."
                className="pl-10 pr-3 py-2.5 w-full rounded-lg border border-gray-300 bg-white text-sm 
                focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Skor */}
              <div className="flex items-center gap-2 p-1 border border-[var(--color-accent)] rounded-lg bg-white shadow-sm">
                {(["Semua", "Tinggi", "Sedang", "Rendah"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-sm rounded font-medium transition ${f === filter
                      ? "bg-[var(--color-accent)] text-white shadow"
                      : "text-gray-700 hover:bg-[var(--color-accent)] hover:text-white"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Filter Sales */}
              <div className="flex items-center gap-2 p-1 border border-gray-300 rounded-lg bg-white shadow-sm">
                <select
                  value={salesFilter}
                  onChange={(e) => setSalesFilter(e.target.value)}
                  className="text-sm px-3 py-2 outline-none bg-transparent"
                >
                  <option value="Semua">Semua Sales</option>
                  {Array.isArray(salesList?.sales) &&
                    salesList.sales.map((s: { id: string; name: string }) => (
                      <option key={s.id} value={s.id}>
                        {s.name || "-"}
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

          {/* TABLE */}
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
                    <th className="px-3 py-2">Panggilan</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {isCustomerLoading ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">
                        Memuat data nasabah...
                      </td>
                    </tr>
                  ) : customerError ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-red-500">
                        Gagal memuat data.
                      </td>
                    </tr>
                  ) : rows.length > 0 ? (
                    rows.map((customer, idx) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-[#ECFDF5] transition-colors"
                      >
                        <td className="px-3 py-2">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-3 py-2 font-semibold">
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
                        <td className="px-3 py-2">{customer.interaksi}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">
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
                          {end < totalPages - 1 && <span className="px-2">...</span>}
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
    </div>
  );
}
