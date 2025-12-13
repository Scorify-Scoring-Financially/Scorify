"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

interface SalesItem {
  id: string;
  name: string;
  email: string;
  password: string;
}

type ModalAction = "add" | "update" | "delete" | null;

export default function SalesPage() {
  const [items, setItems] = useState<SalesItem[]>([]);
  const [form, setForm] = useState<SalesItem>({
    id: "",
    name: "",
    email: "",
    password: "",
  });
  const [editing, setEditing] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // --- Error state ---
  const [errorName, setErrorName] = useState<string | null>(null);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  // --- Modal state ---
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [modalPayload, setModalPayload] = useState<string | null>(null);

  // =========================================================
  // 🔹 Fetch Data Sales dari API
  // =========================================================
  const fetchSales = async () => {
    try {
      const res = await fetch("/api/admin/sales", { cache: "no-store" });
      const data = await res.json();
      if (data.sales) setItems(data.sales);
    } catch (err) {
      console.error("Fetch Sales Error:", err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // =========================================================
  // 🔹 Generate ID Baru Otomatis (sales_1, sales_2, dst)
  // =========================================================
  const generateNewId = () => {
    if (!items || items.length === 0) return "sales_1";

    const numericIds = items
      .map((it) => parseInt(it.id.replace("sales_", "")))
      .filter((n) => !isNaN(n));

    const maxId = Math.max(...numericIds);
    const next = maxId === -Infinity ? 1 : maxId + 1;

    return `sales_${next}`;
  };

  // setiap kali data berubah, form ID update otomatis (kalau bukan editing)
  useEffect(() => {
    if (!editing) {
      setForm({ id: generateNewId(), name: "", email: "", password: "" });
    }
  }, [items, editing]);

  // =========================================================
  // 🔹 Modal Handler
  // =========================================================
  const openModal = (action: ModalAction, payload: string | null = null) => {
    setModalAction(action);
    setModalPayload(payload);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAction(null);
    setModalPayload(null);
  };

  // =========================================================
  // 🔹 Validasi Form
  // =========================================================
  const validateForm = (): boolean => {
    let valid = true;
    setErrorName(null);
    setErrorEmail(null);
    setErrorPassword(null);

    if (!form.name.trim()) {
      setErrorName("Nama wajib diisi");
      valid = false;
    }

    if (!form.email.trim()) {
      setErrorEmail("Email wajib diisi");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setErrorEmail("Format email tidak valid");
      valid = false;
    }

    if (!editing) {
      if (!form.password.trim()) {
        setErrorPassword("Password wajib diisi");
        valid = false;
      } else if (form.password.length < 6) {
        setErrorPassword("Password minimal 6 karakter");
        valid = false;
      }
    }

    return valid;
  };

  // =========================================================
  // 🔹 Konfirmasi Modal (Add / Update / Delete)
  // =========================================================
  const confirmModal = async () => {
    try {
      if (modalAction === "delete" && modalPayload) {
        await fetch(`/api/admin/sales?id=${modalPayload}`, { method: "DELETE" });
      } else if (modalAction === "add") {
        await fetch("/api/admin/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form), // ✅ kirim ID + data form
        });
      } else if (modalAction === "update") {
        await fetch("/api/admin/sales", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      await fetchSales();
      setEditing(false);
      setForm({ id: generateNewId(), name: "", email: "", password: "" });
      closeModal();
    } catch (error) {
      console.error("Modal action error:", error);
    }
  };

  // =========================================================
  // 🔹 Submit Form
  // =========================================================
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    openModal(editing ? "update" : "add");
  };

  // =========================================================
  // 🔹 Edit & Delete Handler
  // =========================================================
  const handleEdit = (item: SalesItem) => {
    setForm({ ...item, password: "" });
    setEditing(true);
    setErrorName(null);
    setErrorEmail(null);
    setErrorPassword(null);
    setShowPassword(false);
  };

  const handleDelete = (id: string) => {
    openModal("delete", id);
  };

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const isFormIncomplete =
    !form.name.trim() || !form.email.trim() || (!form.password.trim() && !editing);

  // =========================================================
  // 🔹 Render
  // =========================================================
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4]">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h1 className="text-3xl font-semibold">Kelola Data Sales</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manajemen data sales oleh admin.
            </p>
          </div>
          <div className="bg-white shadow rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200">
            {today}
          </div>
        </header>

        {/* FORM + TABLE */}
        <section className="px-8 pb-8 space-y-6">
          {/* FORM */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Sales" : "Tambah Sales Baru"}
            </h2>

            <form
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
              onSubmit={handleSubmit}
              autoComplete="off"
            >
              {/* ID */}
              <div>
                <input
                  placeholder="ID Sales"
                  value={form.id}
                  disabled
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 w-full"
                />
              </div>

              {/* Nama */}
              <div>
                <input
                  placeholder="Nama Sales"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full"
                />
                {errorName && (
                  <p className="text-xs text-red-600 mt-1">{errorName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full"
                />
                {errorEmail && (
                  <p className="text-xs text-red-600 mt-1">{errorEmail}</p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-2 text-gray-600"
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                {errorPassword && (
                  <p className="text-xs text-red-600 mt-1">{errorPassword}</p>
                )}
              </div>

              {/* Tombol Submit */}
              <div className="col-span-1 md:col-span-4">
                <button
                  type="submit"
                  disabled={isFormIncomplete}
                  className={`w-full text-white font-medium py-2 rounded-lg transition
                    ${isFormIncomplete
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#00A884] hover:bg-[#009970]"}`}
                >
                  {editing ? "Update Sales" : "Tambah Sales"}
                </button>
              </div>
            </form>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Daftar Sales</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        Belum ada data sales.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#ECFDF5] transition">
                        <td className="px-4 py-2 font-semibold">{item.id}</td>
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{item.email}</td>
                        <td className="px-4 py-2 flex gap-3">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 border rounded-lg text-[#00A884] border-[#00A884] hover:bg-[#00A884] hover:text-white transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 border rounded-lg text-[#F05A47] border-[#F05A47] hover:bg-[#F05A47] hover:text-white transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={closeModal} />
          <div className="bg-white rounded-lg shadow-lg p-6 z-50 w-11/12 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi</h3>
            <p className="text-sm text-gray-600 mb-4">
              {modalAction === "delete" && (
                <>
                  Yakin ingin menghapus Sales <strong>{modalPayload}</strong>?
                </>
              )}
              {modalAction === "add" && <>Yakin ingin menambah Sales baru?</>}
              {modalAction === "update" && (
                <>
                  Yakin ingin memperbarui data Sales <strong>{form.id}</strong>?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border">
                Batal
              </button>
              <button
                onClick={confirmModal}
                className="px-4 py-2 rounded-lg bg-[#00A884] text-white"
              >
                Ya, Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
