"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/_layout/Sidebar";
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

type MonthlyBar = { month: string; setuju: number; ditolak: number; tertunda: number };
type SalesUser = { id: string; name: string | null; email: string };

type SummaryResponse = {
  totalCustomers: number;
  approvalRate: number;
  contactedCustomers: number;
  scoreDistribution: { high: number; medium: number; low: number };
  months: string[];
  growth?: {
    customers: number;
    approvalRate: number;
    contacted: number;
  };
};

type MonthlyResponse = { data: MonthlyBar[] };

const ACCENT = "#00A884";

export default function LaporanAdminPage() {
  // --- State untuk filter ---
  const [kategori, setKategori] = useState<string>("all");
  const [applied, setApplied] = useState(false);

  // --- Filter Sales dan Tahun ---
  const [salesList, setSalesList] = useState<SalesUser[]>([]);
  const [selectedSales, setSelectedSales] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // --- Data utama ---
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [approvalRate, setApprovalRate] = useState<number>(0);
  const [contactedCustomers, setContactedCustomers] = useState<number>(0);
  const [scoreDistribution, setScoreDistribution] = useState({ high: 0, medium: 0, low: 0 });
  const [monthlyBars, setMonthlyBars] = useState<MonthlyBar[]>([]);
  const [growth, setGrowth] = useState({ customers: 0, approvalRate: 0, contacted: 0 });

  // --- Load Sales ---
  useEffect(() => {
    const loadSales = async () => {
      try {
        const res = await fetch("/api/reports/admin/sales", { cache: "no-store" });
        const data = await res.json();
        setSalesList(data.sales || []);
      } catch (e) {
        console.error("Load sales error:", e);
      }
    };
    loadSales();
  }, []);

  // --- Load summary dan monthly dari API ---
  const fetchSummaryAndMonthly = async () => {
    const params = new URLSearchParams();
    if (selectedSales !== "all") params.set("salesId", selectedSales);
    if (selectedYear) params.set("year", String(selectedYear));

    const [summaryRes, monthlyRes] = await Promise.all([
      fetch(`/api/reports/admin/summary?${params.toString()}`, { cache: "no-store" }),
      fetch(`/api/reports/admin/monthly?${params.toString()}`, { cache: "no-store" }),
    ]);

    const summary: SummaryResponse = await summaryRes.json();
    const monthly: MonthlyResponse = await monthlyRes.json();

    const { high, medium, low } = summary.scoreDistribution;

    setTotalCustomers(summary.totalCustomers);
    setApprovalRate(summary.approvalRate);
    setContactedCustomers(summary.contactedCustomers);
    setScoreDistribution({ high, medium, low });
    setGrowth(summary.growth || { customers: 0, approvalRate: 0, contacted: 0 });
    setMonthlyBars(monthly.data || []);
  };

  useEffect(() => {
    fetchSummaryAndMonthly().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSales, selectedYear]);

  const handleApplyFilter = () => {
    setApplied(true);
    fetchSummaryAndMonthly().catch(console.error);
  };

  // --- Donut Data ---
  const donutData = useMemo(() => {
    let { high, medium, low } = scoreDistribution;

    // Pastikan total > 0 agar tetap tampil
    const total = high + medium + low;
    if (total === 0) {
      high = 0.33;
      medium = 0.33;
      low = 0.34;
    }

    return [
      { name: "Skor Tinggi", value: Math.round(high * 100) },
      { name: "Skor Sedang", value: Math.round(medium * 100) },
      { name: "Skor Rendah", value: Math.round(low * 100) },
    ];
  }, [scoreDistribution]);

  const DONUT_COLORS = ["#00A884", "#F2C94C", "#F05A47"];
  const formatPercent = (n: number) => `${Math.round(n * 100)}%`;

  // --- Download CSV ---
  const handleDownloadCSV = () => {
    const rows = monthlyBars.map((m) => `${m.month},${m.setuju},${m.ditolak},${m.tertunda}`).join("\n");
    const csv = `bulan,setuju,ditolak,tertunda\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-admin.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Utility untuk warna growth ---
  const GrowthText = ({ value }: { value: number }) => (
    <span className={`text-sm ${value >= 0 ? "text-green-600" : "text-red-500"} self-end`}>
      {value >= 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4] font-sans">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Laporan Admin</h1>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-gray-300 outline-none text-xs"
            >
              <option value="all">Semua Kategori</option>
              <option value="tinggi">Skor Tinggi</option>
              <option value="sedang">Skor Sedang</option>
              <option value="rendah">Skor Rendah</option>
            </select>

            <select
              value={selectedSales}
              onChange={(e) => setSelectedSales(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-gray-300 outline-none text-xs"
            >
              <option value="all">Semua Sales</option>
              {salesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.email}
                </option>
              ))}
            </select>

            <button
              onClick={handleApplyFilter}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 border border-[var(--color-accent,#00A884)]
                         text-[var(--color-accent,#00A884)] font-semibold text-xs bg-white 
                         transition hover:bg-[var(--color-accent,#00A884)] hover:text-white"
            >
              Terapkan Filter
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 bg-[var(--color-accent)] text-white text-xs font-semibold shadow transition hover:bg-[#009970]"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Unduh CSV
            </button>
          </div>
        </div>

        {/* Statistik Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Total Nasabah</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">{totalCustomers.toLocaleString()}</h2>
              <GrowthText value={growth.customers} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Tingkat Persetujuan Deposit</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">{formatPercent(approvalRate)}</h2>
              <GrowthText value={growth.approvalRate} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Jumlah Nasabah Dihubungi</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">{contactedCustomers.toLocaleString()}</h2>
              <GrowthText value={growth.contacted} />
            </div>
          </div>
        </div>

        {/* Grafik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
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
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-row gap-6 justify-center">
              {donutData.map((d, i) => (
                <div className="flex items-center gap-3" key={`legend-${i}`}>
                  <div className="w-3 h-3 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h3 className="font-semibold mb-4">Status Penawaran Deposit</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" interval={0} tick={{ fontSize: 12, fill: "#4B5563" }} />
                  <YAxis />
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ textAlign: "center", width: "100%" }} />
                  <Bar dataKey="setuju" stackId="a" name="Setuju" fill={ACCENT} />
                  <Bar dataKey="ditolak" stackId="a" name="Ditolak" fill="#F05A47" />
                  <Bar dataKey="tertunda" stackId="a" name="Tertunda" fill="#F2C94C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500">{applied ? "Filter diterapkan" : "Tidak ada filter aktif"}</div>
      </main>
    </div>
  );
}
