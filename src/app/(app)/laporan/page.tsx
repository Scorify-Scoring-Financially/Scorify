"use client";

/**
 * laporan/page.tsx
 *
 * Halaman laporan performa penjualan (sales performance dashboard).
 * Fitur utama:
 *  - Statistik key metrics (KPI): total nasabah, tingkat persetujuan, jumlah yang dihubungi.
 *  - Visualisasi data penawaran dengan grafik batang (BarChart).
 *  - Distribusi skor nasabah dalam bentuk donat (PieChart).
 *  - Filter berdasarkan kategori skor, tahun, dan status penawaran.
 *  - Ekspor data laporan ke format CSV.
 *
 * Integrasi API:
 *  - GET /api/reports/sales/summary     → ringkasan KPI dan distribusi skor
 *  - GET /api/reports/sales/monthly     → data bulanan untuk grafik batang
 */

import React, { useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import useSWR from "swr";

type MonthlyBar = {
  month: string;
  setuju: number;
  ditolak: number;
  tertunda: number;
};

type Status = "all" | "agreed" | "declined" | "pending";

const ACCENT = "#00A884";
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agus",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LaporanSalesPage() {
  const thisYear = new Date().getFullYear();
  const [kategori, setKategori] = useState<string>("all");
  const [year, setYear] = useState<number>(thisYear);
  const [status, setStatus] = useState<Status>("all");

  // Fetch data
  const { data: summaryData } = useSWR(
    `/api/reports/sales/summary?year=${year}`,
    fetcher
  );
  const { data: monthlyBars } = useSWR<MonthlyBar[]>(
    `/api/reports/sales/monthly?year=${year}&status=${status}`,
    fetcher
  );

  // Fallback
  const totalCustomers = summaryData?.totalCustomers ?? 0;
  const approvalRate = summaryData?.approvalRate ?? 0;
  const contactedCustomers = summaryData?.contactedCustomers ?? 0;
  const scoreDistributionApi =
    summaryData?.scoreDistribution ?? { high: 0, medium: 0, low: 0 };

  // Donut filter
  const scoreDistribution = useMemo(() => {
    if (kategori === "all") return scoreDistributionApi;
    if (kategori === "tinggi")
      return {
        high: scoreDistributionApi.high,
        medium: 0,
        low: 0,
      };
    if (kategori === "sedang")
      return {
        high: 0,
        medium: scoreDistributionApi.medium,
        low: 0,
      };
    return {
      high: 0,
      medium: 0,
      low: scoreDistributionApi.low,
    };
  }, [kategori, scoreDistributionApi]);

  // Donut data
  const donutData = useMemo(() => {
    const high = Math.round((scoreDistribution.high || 0) * 100);
    const med = Math.round((scoreDistribution.medium || 0) * 100);
    const low = Math.round((scoreDistribution.low || 0) * 100);

    const sum = high + med + low;
    if (sum === 100) {
      return [
        { name: "Skor Tinggi", value: high },
        { name: "Skor Sedang", value: med },
        { name: "Skor Rendah", value: low },
      ];
    }
    if (high > 0)
      return [
        { name: "Skor Tinggi", value: high },
        { name: "Lainnya", value: Math.max(0, 100 - high) },
      ];
    if (med > 0)
      return [
        { name: "Skor Sedang", value: med },
        { name: "Lainnya", value: Math.max(0, 100 - med) },
      ];
    if (low > 0)
      return [
        { name: "Skor Rendah", value: low },
        { name: "Lainnya", value: Math.max(0, 100 - low) },
      ];
    return [{ name: "Lainnya", value: 100 }];
  }, [scoreDistribution]);

  const DONUT_COLORS = useMemo(() => {
    if (donutData.length === 3)
      return ["#00A884", "#F2C94C", "#F05A47"];

    const primary = donutData[0]?.name || "Lainnya";
    const gray = "#E5E7EB";

    if (primary === "Skor Tinggi") return ["#00A884", gray];
    if (primary === "Skor Sedang") return ["#F2C94C", gray];
    if (primary === "Skor Rendah") return ["#F05A47", gray];
    return [gray, gray];
  }, [donutData]);

  const formatPercent = (n: number) => `${Math.round((n || 0) * 100)}%`;

  const handleDownloadCSV = () => {
    const rows = (
      monthlyBars ??
      MONTHS.map((m) => ({
        month: m,
        setuju: 0,
        ditolak: 0,
        tertunda: 0,
      }))
    )
      .map((m) => `${m.month},${m.setuju},${m.ditolak},${m.tertunda}`)
      .join("\n");

    const csv = `bulan,setuju,ditolak,tertunda\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-sales-${year}-${status}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4] font-sans">
      <Sidebar />

      <main className="flex-1 p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Laporan Sales
          </h1>

          <div className="flex items-center gap-3">
            {/* Dropdown kategori */}
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
            >
              <option value="all">Semua Kategori</option>
              <option value="tinggi">Skor Tinggi</option>
              <option value="sedang">Skor Sedang</option>
              <option value="rendah">Skor Rendah</option>
            </select>

            {/* Tahun */}
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
            >
              <option value={thisYear - 2}>{thisYear - 2}</option>
              <option value={thisYear - 1}>{thisYear - 1}</option>
              <option value={thisYear}>{thisYear}</option>
              <option value={thisYear + 1}>{thisYear + 1}</option>
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="agreed">Setuju</option>
              <option value="declined">Ditolak</option>
              <option value="pending">Tertunda</option>
            </select>

            {/* Unduh CSV */}
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold shadow transition hover:bg-[#009970]"
            >
              <span className="material-symbols-outlined text-sm">
                download
              </span>
              Unduh CSV
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Total Nasabah</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">
                {totalCustomers.toLocaleString()}
              </h2>
              <span className="text-sm text-green-600 self-end">
                +15.80%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">
              Tingkat Persetujuan Deposit
            </p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">
                {formatPercent(approvalRate)}
              </h2>
              <span className="text-sm text-green-600 self-end">
                +5.50%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">
              Jumlah Nasabah Dihubungi
            </p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">
                {contactedCustomers.toLocaleString()}
              </h2>
              <span className="text-sm text-red-500 self-end">
                -10.5%
              </span>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h3 className="font-semibold mb-4">Distribusi Skor Nasabah</h3>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | string, name: string) => [
                      `${value}%`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-row gap-6 justify-center">
              {donutData.map((d, i) => (
                <div
                  className="flex items-center gap-3"
                  key={`legend-${i}`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: DONUT_COLORS[i % DONUT_COLORS.length],
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h3 className="font-semibold mb-4">Status Penawaran Deposit</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart
                  data={
                    monthlyBars ??
                    MONTHS.map((m) => ({
                      month: m,
                      setuju: 0,
                      ditolak: 0,
                      tertunda: 0,
                    }))
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    interval={0}
                    tick={{ fontSize: 12, fill: "#4B5563" }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ textAlign: "center", width: "100%" }}
                  />
                  <Bar dataKey="setuju" stackId="a" name="Setuju" fill={ACCENT} />
                  <Bar dataKey="ditolak" stackId="a" name="Ditolak" fill="#F05A47" />
                  <Bar dataKey="tertunda" stackId="a" name="Tertunda" fill="#F2C94C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Data tahun <b>{year}</b>
        </div>
      </main>
    </div>
  );
}
