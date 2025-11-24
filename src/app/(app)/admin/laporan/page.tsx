"use client";

import React, { useEffect, useMemo, useState } from "react";
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

/** Tipe data untuk grafik bar bulanan */
type MonthlyBar = { month: string; setuju: number; ditolak: number; tertunda: number };

/** Tipe nasabah */
type Nasabah = {
  id: number;
  skor: number; // 0 - 100
  status: "setuju" | "tertunda" | "ditolak";
  bulan: string; // "Jan" .. "Des"
};

/** Semua bulan lengkap */
const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agus","Sep","Okt","Nov","Des"];
const LOCAL_KEY = "laporan_sales_fullData";

export default function LaporanSalesPage() {
  // --- State untuk filter ---
  const [startDate, setStartDate] = useState<string>("2023-01-01");
  const [endDate, setEndDate] = useState<string>("2023-06-30");
  const [kategori, setKategori] = useState<string>("all");
  const [applied, setApplied] = useState(false);

  // --- State untuk data dan statistik ---
  const [fullData, setFullData] = useState<Nasabah[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [approvalRate, setApprovalRate] = useState<number>(0);
  const [contactedCustomers, setContactedCustomers] = useState<number>(0);
  const [scoreDistribution, setScoreDistribution] = useState({
    high: 0.45,
    medium: 0.35,
    low: 0.2,
  });
  const [monthlyBars, setMonthlyBars] = useState<MonthlyBar[]>([]);

  const ACCENT = "#00A884";

  /** Fungsi helper untuk generate angka random */
  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  /** LOAD / GENERATE DATA NASABAH PERSISTED DI LOCALSTORAGE */
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY) : null;
    if (raw) {
      try {
        const parsed: Nasabah[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFullData(parsed);
          setTimeout(() => applyFilterFromData("all", parsed), 0);
          return;
        }
      } catch {}
    }

    // Generate data random
    const list: Nasabah[] = [];

    // Pastikan setiap bulan muncul minimal 1 data
    for (let i = 0; i < MONTHS.length; i++) {
      const skor = randInt(0, 100);
      const r = Math.random();
      let status: Nasabah["status"] = r < 0.6 ? "setuju" : r < 0.85 ? "tertunda" : "ditolak";
      list.push({ id: i + 1, skor, status, bulan: MONTHS[i] });
    }

    // Tambah data random sampai total 50
    for (let i = 12; i < 50; i++) {
      const skor = randInt(0, 100);
      const r = Math.random();
      let status: Nasabah["status"] = r < 0.6 ? "setuju" : r < 0.85 ? "tertunda" : "ditolak";
      const bulan = MONTHS[randInt(0, MONTHS.length - 1)];
      list.push({ id: i + 1, skor, status, bulan });
    }

    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch {}

    setFullData(list);
    setTimeout(() => applyFilterFromData("all", list), 0);
  }, []);

  /** APPLY FILTER DAN HITUNG STATISTIK */
  const applyFilterFromData = (kategoriParam: string, full = fullData) => {
    const totalAll = full.length || 1;

    const getCat = (sk: number) => (sk >= 80 ? "high" : sk >= 60 ? "medium" : "low");

    const countsAll = { high: 0, medium: 0, low: 0 };
    full.forEach((n) => countsAll[getCat(n.skor) as keyof typeof countsAll]++);

    const filtered =
      kategoriParam === "all"
        ? full
        : full.filter((n) => {
            const c = getCat(n.skor);
            if (kategoriParam === "tinggi") return c === "high";
            if (kategoriParam === "sedang") return c === "medium";
            return c === "low";
          });

    const totalFiltered = filtered.length;
    setTotalCustomers(totalFiltered);

    const approveCount = filtered.filter((n) => n.status === "setuju").length;
    setApprovalRate(totalFiltered > 0 ? approveCount / totalFiltered : 0);

    const contactedCount = filtered.filter((n) => n.status !== "tertunda").length;
    setContactedCustomers(contactedCount);

    const bars = MONTHS.map((m) => {
      const byMonth = filtered.filter((n) => n.bulan === m);
      return {
        month: m,
        setuju: byMonth.filter((x) => x.status === "setuju").length,
        ditolak: byMonth.filter((x) => x.status === "ditolak").length,
        tertunda: byMonth.filter((x) => x.status === "tertunda").length,
      };
    });
    setMonthlyBars(bars);

    // Set distribusi skor
    if (kategoriParam === "all") {
      setScoreDistribution({
        high: countsAll.high / totalAll,
        medium: countsAll.medium / totalAll,
        low: countsAll.low / totalAll,
      });
    } else {
      const mapKey = kategoriParam === "tinggi" ? "high" : kategoriParam === "sedang" ? "medium" : "low";
      setScoreDistribution({
        high: mapKey === "high" ? countsAll.high / totalAll : 0,
        medium: mapKey === "medium" ? countsAll.medium / totalAll : 0,
        low: mapKey === "low" ? countsAll.low / totalAll : 0,
      });
    }

    setApplied(true);
  };

  /** Trigger filter dari UI */
  const handleApplyFilter = () => applyFilterFromData(kategori);

  /** Data untuk grafik donat */
  const donutData = useMemo(() => {
    const high = scoreDistribution.high;
    const med = scoreDistribution.medium;
    const low = scoreDistribution.low;

    const pctHigh = Math.round(high * 100);
    const pctMed = Math.round(med * 100);
    const pctLow = Math.round(low * 100);

    const isAll = pctHigh + pctMed + pctLow === 100;

    if (isAll)
      return [
        { name: "Skor Tinggi", value: pctHigh },
        { name: "Skor Sedang", value: pctMed },
        { name: "Skor Rendah", value: pctLow },
      ];

    if (pctHigh > 0) return [{ name: "Skor Tinggi", value: pctHigh }, { name: "Lainnya", value: Math.max(0, 100 - pctHigh) }];
    if (pctMed > 0) return [{ name: "Skor Sedang", value: pctMed }, { name: "Lainnya", value: Math.max(0, 100 - pctMed) }];
    if (pctLow > 0) return [{ name: "Skor Rendah", value: pctLow }, { name: "Lainnya", value: Math.max(0, 100 - pctLow) }];

    return [{ name: "Lainnya", value: 100 }];
  }, [scoreDistribution]);

  /** Warna donat */
  const DONUT_COLORS = useMemo(() => {
    if (donutData.length === 3) return ["#00A884", "#F2C94C", "#F05A47"];
    const primary = donutData[0]?.name || "Lainnya";
    const gray = "#E5E7EB";
    if (primary === "Skor Tinggi") return ["#00A884", gray];
    if (primary === "Skor Sedang") return ["#F2C94C", gray];
    if (primary === "Skor Rendah") return ["#F05A47", gray];
    return [gray, gray];
  }, [donutData]);

  const formatPercent = (n: number) => `${Math.round(n * 100)}%`;

  /** Download CSV */
  const handleDownloadCSV = () => {
    const rows = monthlyBars.map((m) => `${m.month},${m.setuju},${m.ditolak},${m.tertunda}`).join("\n");
    const csv = `bulan,setuju,ditolak,tertunda\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-sales.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4] font-sans">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6">
        {/* Judul dan filter */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Laporan Admin</h1>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-gray-300 outline-none text-xs"
            />

            <span className="text-gray-400 text-xs">—</span>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-gray-300 outline-none text-xs"
            />

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
              disabled
              className="px-2.5 py-1.5 rounded-md border border-gray-300 outline-none text-xs bg-gray-100 text-gray-500"
            >
              <option>Semua Sales</option>
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

        {/* Statistik utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Total Nasabah</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">{totalCustomers.toLocaleString()}</h2>
              <span className="text-sm text-green-600 self-end">+15.80%</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Tingkat Persetujuan Deposit</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">{formatPercent(approvalRate)}</h2>
              <span className="text-sm text-green-600 self-end">+5.50%</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Jumlah Nasabah Dihubungi</p>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold">{contactedCustomers.toLocaleString()}</h2>
              <span className="text-sm text-red-500 self-end">-10.5%</span>
            </div>
          </div>
        </div>

        {/* Grafik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribusi skor */}
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

          {/* Status penawaran deposit */}
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

        {/* Status filter */}
        <div className="text-sm text-gray-500">{applied ? "Filter diterapkan" : "Tidak ada filter aktif"}</div>
      </main>
    </div>
  );
}
