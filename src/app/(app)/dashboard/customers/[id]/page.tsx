"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Phone, FileText, ArrowLeft, Plus } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

type CustomerDetails = {
  id: string;
  name: string;
  age: number;
  job: string;
  phone: string;
  address: string;
  skorPeluang: number | null;
  statusKontak: "success" | "failure" | "no_answer" | "unknown";
  statusPenawaran: "agreed" | "declined" | "pending";
};

type HistoryItem = {
  id: string;
  type: string;
  date: string;
  note: string;
  result?: string;
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Semua hooks dideklarasikan di atas, tidak di bawah kondisi apapun
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [showCallModal, setShowCallModal] = useState(false);
  const [callResult, setCallResult] = useState<"success" | "failure" | "no_answer" | "unknown">("unknown");
  const [callNote, setCallNote] = useState("");
  const [statusPenawaranCall, setStatusPenawaranCall] = useState<"agreed" | "declined" | "pending">("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

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

  // Fungsi menambahkan catatan internal
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      type: "Catatan Internal",
      date: new Date().toISOString(),
      note: newNote,
    };

    setHistory((prev) => [newItem, ...prev]);
    setNewNote("");

    try {
      await fetch(`/api/customers/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
    } catch (err) {
      console.error("Add note error:", err);
    }
  };

  // Fungsi simulasi panggilan
  // Simulasi panggilan
  const handleCallClick = async () => {
    if (!customer?.phone) return;

    setIsCalling(true);
    window.location.href = `tel:${customer.phone}`;

    setTimeout(() => {
      setIsCalling(false);
      setShowCallModal(true);
    }, 3000);
  };

  // Simpan hasil panggilan
  const handleCallSubmit = async () => {
    if (!callNote.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/customers/${id}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: callNote,
          callResult,
          statusPenawaran: statusPenawaranCall,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan panggilan");

      const newLog: HistoryItem = {
        id: Date.now().toString(),
        type: "Panggilan Telepon",
        date: new Date().toISOString(),
        note: callNote,
        result: `Hasil: ${callResult}. `
      };

      setHistory((prev) => [newLog, ...prev]);
      setCustomer((prev) =>
        prev ? { ...prev, statusPenawaran: statusPenawaranCall } : prev
      );

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


  // 🧠 Semua hooks sudah di atas, baru boleh ada return kondisi di bawah sini
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

  const skorPercent = customer.skorPeluang !== null ? `${Math.round(customer.skorPeluang * 100)}%` : "-";

  const getIconForType = (type: string) => {
    if (type.toLowerCase().includes("panggilan"))
      return <Phone size={16} className="text-green-600" />;
    if (type.toLowerCase().includes("catatan"))
      return <FileText size={16} className="text-green-600" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  const scoreBadge = (skor: number | null) => {
    if (skor === null) return "text-gray-700";
    console.log(typeof skor);
    const s = skor;
    return s >= 80
      ? " text-green-500"
      : s >= 60
        ? "text-yellow-500"
        : " text-red-500";
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4] font-sans">
      <Sidebar />

      <main className="flex-1 p-8 space-y-10 relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ArrowLeft
              size={26}
              className="text-gray-800 cursor-pointer hover:text-[#00A884] transition"
              onClick={() => router.push("/dashboard")}
            />
            <h1 className="text-2xl font-bold text-gray-800">Informasi Nasabah</h1>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-semibold border shadow-sm bg-white ${customer.statusPenawaran === "agreed"
              ? "border-green-500"
              : customer.statusPenawaran === "declined"
                ? "border-red-500"
                : "border-yellow-500"
              }`}
          >
            <span>Status Penawaran:</span>
            <select
              value={customer.statusPenawaran}
              onChange={async (e) => {
                const newStatus = e.target.value as "agreed" | "declined" | "pending";
                setCustomer((prev) => (prev ? { ...prev, statusPenawaran: newStatus } : prev));

                try {
                  await fetch(`/api/customers/${id}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ statusPenawaran: newStatus }),
                  });
                } catch (err) {
                  console.error("Gagal update status penawaran:", err);
                }
              }}
              className={`ml-1 px-1 py-0.5 rounded-lg font-semibold outline-none text-sm ${customer.statusPenawaran === "agreed"
                ? "text-green-700"
                : customer.statusPenawaran === "declined"
                  ? "text-red-600"
                  : "text-yellow-600"
                }`}
            >
              <option value="agreed">Disetujui</option>
              <option value="declined">Ditolak</option>
              <option value="pending">Tertunda</option>
            </select>
          </div>
        </div>

        {/* BAGIAN INFORMASI NASABAH */}
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
                <p className={`text-5xl font-extrabold ${scoreBadge(parseInt(skorPercent))} mb-3`}>{skorPercent}</p>
                <div className="w-48 bg-gray-200 rounded-full h-3 mx-auto">
                  <div
                    className="bg-[var(--color-accent,#00A884)] h-3 rounded-full transition-all"
                    style={{ width: `${customer.skorPeluang ? customer.skorPeluang * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col text-center justify-center">
                <p className="text-sm text-gray-500 mb-2 font-semibold">Status Kontak</p>
                <span
                  className={`${getStatusColor(customer.statusKontak)} px-3 py-1.5 rounded-full text-sm font-semibold self-center mb-3`}
                >
                  {customer.statusKontak}
                </span>
                <button
                  onClick={handleCallClick}
                  className="flex items-center justify-center gap-2 bg-[var(--color-accent,#00A884)] hover:bg-[#009970] text-white font-semibold px-4 py-2.5 rounded-lg shadow transition text-sm"
                >
                  <Phone size={18} /> Hubungi Sekarang
                </button>
              </div>
            </div>
          </div>

          {/* BAGIAN RIWAYAT */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col h-[450px]">
              <h3 className="text-lg font-semibold mb-4">Riwayat & Catatan Interaksi</h3>

              <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 border-l-2 border-gray-200 pl-4">
                      <div className="mt-1">{getIconForType(item.type)}</div>
                      <div>
                        <p className="font-semibold">{item.type}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(item.date).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 whitespace-pre-line">{item.note}</p>
                        <p className="text-xs text-gray-500 whitespace-pre-line">{item.result}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Belum ada riwayat interaksi.</p>
                )}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-600">Tambah Catatan Internal</label>
                <div className="mt-2 relative">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-[var(--color-accent,#00A884)] focus:ring-[var(--color-accent,#00A884)] text-sm outline-none p-2.5"
                    placeholder="Tulis catatan di sini..."
                    rows={3}
                  ></textarea>
                  <button
                    onClick={handleAddNote}
                    className="absolute bottom-2 right-2 bg-[var(--color-accent,#00A884)] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#009970] transition"
                  >
                    <Plus size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simulasi panggilan */}
      {isCalling && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[300px] text-center">
            <Phone size={36} className="mx-auto text-[var(--color-accent,#00A884)] mb-3 animate-pulse" />
            <p className="font-semibold text-gray-700">Menghubungi nasabah...</p>
            <p className="text-sm text-gray-500 mt-1">{customer.phone}</p>
          </div>
        </div>
      )}

      {/* Modal hasil panggilan */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Catat Hasil Panggilan</h2>

            <label className="text-sm font-medium text-gray-700 block mb-1">
              Hasil Panggilan
            </label>
            <select
              value={callResult}
              onChange={(e) =>
                setCallResult(e.target.value as "success" | "failure" | "no_answer" | "unknown")
              }
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
                setStatusPenawaranCall(e.target.value as "agreed" | "declined" | "pending")
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
