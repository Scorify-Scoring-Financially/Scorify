// Admin Customer Detail Page (Read-Only)
// NOTE: Semua tombol & aksi dibuat non-aktif untuk admin

"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Phone, FileText, ArrowLeft, Plus } from "lucide-react";
import Sidebar from "@/components/_layout/Sidebar";

type CustomerDetails = {
  id: string;
  name: string;
  deposit: string;
  age: number;
  job: string;
  phone: string;
  address: string;
  skorPeluang: number | null;
  statusKontak: "success" | "failure" | "nonexist";
};

type HistoryItem = {
  id: string;
  type: string;
  date: string;
  note: string;
};

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal ambil data");
        setCustomer(data.details);
        setHistory(data.history);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-[var(--color-accent,#00A884)] border-gray-200 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Memuat data nasabah...</p>
        </div>
      </div>
    );

  if (!customer)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Data nasabah tidak ditemukan.</p>
      </div>
    );

  const skorPercent =
    customer.skorPeluang !== null
      ? `${Math.round(customer.skorPeluang * 100)}%`
      : "-";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700";
      case "failure":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getIconForType = (type: string) => {
    if (type.toLowerCase().includes("panggilan"))
      return <Phone size={16} className="text-green-600" />;
    if (type.toLowerCase().includes("catatan"))
      return <FileText size={16} className="text-green-600" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4] font-sans">
      <Sidebar />

      <main className="flex-1 p-8 space-y-10 relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ArrowLeft
              size={26}
              className="text-gray-800 cursor-pointer hover:text-[#00A884] transition"
              onClick={() => router.push("/admin/dashboard")}
            />
            <h1 className="text-2xl font-bold text-gray-800">Informasi Nasabah</h1>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-semibold border shadow-sm bg-white ${customer.deposit === "yes"
              ? "border-green-500"
              : "border-red-500"
              }`}
          >
            <span>Status Penawaran:</span>
            <select
              value={customer.deposit}
              disabled
              className={`ml-1 px-1 py-0.5 rounded-lg font-semibold outline-none text-sm bg-gray-100 cursor-not-allowed ${customer.deposit === "yes" ? "text-green-700" : "text-red-600"
                }`}
            >
              <option value="yes">Disetujui</option>
              <option value="no">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">{customer.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="border-t border-gray-100 py-3">
                  <p className="text-gray-500 text-sm">Usia</p>
                  <p className="font-medium">{customer.age} Tahun</p>
                </div>
                <div className="border-t border-gray-100 py-3">
                  <p className="text-gray-500 text-sm">Pekerjaan</p>
                  <p className="font-medium">{customer.job}</p>
                </div>
                <div className="border-t border-gray-100 py-3">
                  <p className="text-gray-500 text-sm">Nomor Kontak</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div className="border-t border-gray-100 py-3">
                  <p className="text-gray-500 text-sm">Alamat</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 flex flex-col justify-center items-center text-center">
                <p className="text-gray-500 text-sm mb-2 font-semibold">Skor Peluang</p>
                <p className="text-5xl font-extrabold text-[var(--color-accent,#00A884)] mb-3">
                  {skorPercent}
                </p>
                <div className="w-48 bg-gray-200 rounded-full h-3 mx-auto">
                  <div
                    className="bg-[var(--color-accent,#00A884)] h-3 rounded-full transition-all"
                    style={{
                      width: `${customer.skorPeluang ? customer.skorPeluang * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col text-center justify-center">
                <p className="text-sm text-gray-500 mb-2 font-semibold">Status Kontak</p>
                <span
                  className={`${getStatusColor(
                    customer.statusKontak
                  )} px-3 py-1.5 rounded-full text-sm font-semibold self-center mb-3`}
                >
                  {customer.statusKontak}
                </span>
                <button
                  disabled
                  className="flex items-center justify-center gap-2 bg-gray-300 text-white font-semibold px-4 py-2.5 rounded-lg shadow text-sm cursor-not-allowed"
                >
                  <Phone size={18} /> Hubungi Sekarang
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-4">Riwayat & Catatan Interaksi</h3>

              <div className="flex-1 space-y-5 overflow-y-auto pr-2">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 border-l-2 border-gray-200 pl-4"
                    >
                      <div className="mt-1">{getIconForType(item.type)}</div>
                      <div>
                        <p className="font-semibold">{item.type}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(item.date).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{item.note}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Belum ada riwayat interaksi.</p>
                )}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4 opacity-50 cursor-not-allowed">
                <label className="text-sm font-medium text-gray-600">
                  Tambah Catatan Internal (Non-aktif untuk Admin)
                </label>
                <div className="mt-2 relative">
                  <textarea
                    disabled
                    className="w-full rounded-md border border-gray-300 bg-gray-100 shadow-sm text-sm outline-none p-2.5 cursor-not-allowed"
                    placeholder="Admin tidak bisa menambah catatan"
                    rows={3}
                  ></textarea>
                  <button
                    disabled
                    className="absolute bottom-2 right-2 bg-gray-300 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-not-allowed"
                  >
                    <Plus size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}