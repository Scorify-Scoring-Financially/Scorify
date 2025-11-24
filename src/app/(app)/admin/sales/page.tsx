"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

interface SalesItem {
  id: string; // format S001
  name: string;
  email: string;
  password: string;
}

type ModalAction = "add" | "update" | "delete" | null;

export default function SalesPage() {
  const [items, setItems] = useState<SalesItem[]>([
    { id: "S001", name: "Sales A", email: "salesA@example.com", password: "123456" },
    { id: "S002", name: "Sales B", email: "salesB@example.com", password: "abcdef" },
  ]);

  const [form, setForm] = useState<SalesItem>({ id: "", name: "", email: "", password: "" });
  const [editing, setEditing] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // pesan error input
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);

  // modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [modalPayload, setModalPayload] = useState<string | null>(null);

  const idPattern = /^S\d{3}$/;

  // Auto-generate ID
  const generateNewId = () => {
    const lastId = items[items.length - 1]?.id ?? "S000";
    const next = String(parseInt(lastId.substring(1)) + 1).padStart(3, "0");
    return "S" + next;
  };

  useEffect(() => {
    if (!editing) {
    setForm((f) => ({
      ...f,
      id: generateNewId(),
    }));
    }
  }, [items, editing]);

  // validasi form
  const isDuplicateId = (id: string) => items.some((it) => it.id === id);

  const validateForm = (isNew: boolean) => {
    let ok = true;
    setErrorId(null);
    setErrorEmail(null);

    if (!idPattern.test(form.id)) {
      setErrorId("Format ID harus S001 (huruf S diikuti 3 digit)");
      ok = false;
    } else if (isNew && isDuplicateId(form.id)) {
      setErrorId("ID sudah ada — gunakan ID lain");
      ok = false;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      setErrorEmail("Email tidak valid");
      ok = false;
    }

    return ok;
  };

  // modal
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

  // eksekusi aksi modal
  const confirmModal = async () => {
    if (modalAction === "delete") {
      const idToDelete: string = modalPayload ?? "";
      setItems((prev) => prev.filter((it) => it.id !== idToDelete));
      closeModal();
      return;
    }

    if (modalAction === "add") {
      setItems((prev) => [...prev, form]);
      setForm({ id: generateNewId(), name: "", email: "", password: "" });
      setEditing(false);
      setShowPassword(false);
      closeModal();
      return;
    }

    if (modalAction === "update") {
      setItems((prev) => prev.map((it) => (it.id === form.id ? form : it)));
      setForm({ id: generateNewId(), name: "", email: "", password: "" });
      setEditing(false);
      setShowPassword(false);
      closeModal();
      return;
    }
  };

  // tombol submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isNew = !editing;

    if (!validateForm(isNew)) return;

    openModal(isNew ? "add" : "update", null);
  };

  // mulai edit
  const handleEdit = (item: SalesItem) => {
    setForm(item);
    setEditing(true);
    setShowPassword(false);
    setErrorId(null);
    setErrorEmail(null);
  };

  // hapus
  const handleDelete = (id: string) => {
    openModal("delete", id);
  };

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const isFormIncomplete =
    !form.name.trim() || !form.email.trim() || !form.password.trim();

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#F7FFF9] to-[#F0FFF4]">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h1 className="text-3xl font-semibold">Kelola Data Sales</h1>
            <p className="text-sm text-gray-600 mt-1">Manajemen data sales oleh admin.</p>
          </div>

          <div className="bg-white shadow rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200">
            {today}
          </div>
        </header>

        <section className="px-8 pb-8 space-y-6">

          {/* FORM */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Sales" : "Tambah Sales Baru"}
            </h2>

            <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleSubmit}>

              {/* Input ID */}
              <div>
                <input
                  placeholder="ID Sales"
                  value={form.id}
                  disabled
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm 
                  focus:ring-1 focus:ring-[#00A884] focus:border-[#00A884] w-full bg-gray-100"
                />
              </div>

              {/* Input Nama */}
              <div>
                <input
                  placeholder="Nama Sales"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm 
                  focus:ring-1 focus:ring-[#00A884] focus:border-[#00A884] outline-none w-full"
                />
              </div>

              {/* Input Email */}
              <div>
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm 
                  focus:ring-1 focus:ring-[#00A884] focus:border-[#00A884] outline-none w-full"
                />
                {errorEmail && <p className="mt-1 text-xs text-red-600">{errorEmail}</p>}
              </div>

              {/* Input Password */}
              <div className="relative">
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
                  focus:ring-1 focus:ring-[#00A884] focus:border-[#00A884] outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-2 text-gray-600"
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              {/* Tombol */}
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
                    <th className="px-4 py-2">Password</th>
                    <th className="px-4 py-2">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#ECFDF5] transition">
                      <td className="px-4 py-2 font-semibold">{item.id}</td>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.email}</td>

                      <td className="px-4 py-2">******</td>

                      <td className="px-4 py-2 flex gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 border rounded-lg text-[#00A884] border-[#00A884] 
                          hover:bg-[#00A884] hover:text-white transition"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 border rounded-lg text-[#F05A47] border-[#F05A47] 
                          hover:bg-[#F05A47] hover:text-white transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </section>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={closeModal} />

          <div className="bg-white rounded-lg shadow-lg p-6 z-50 w-11/12 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi</h3>
            <p className="text-sm text-gray-600 mb-4">
              {modalAction === "delete" && <>Yakin ingin menghapus Sales <strong>{modalPayload}</strong>?</>}
              {modalAction === "add" && <>Yakin ingin menambah Sales baru dengan ID <strong>{form.id}</strong>?</>}
              {modalAction === "update" && <>Yakin ingin memperbarui data Sales <strong>{form.id}</strong>?</>}
            </p>

            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border">Batal</button>
              <button onClick={confirmModal} className="px-4 py-2 rounded-lg bg-[#00A884] text-white">
                Ya, Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
