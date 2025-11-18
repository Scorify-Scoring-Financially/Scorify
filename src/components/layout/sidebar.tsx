"use client";
import React, { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  PanelLeftOpen,
  PanelLeftClose,
  Sun,
  Moon,
  Globe,
  LogOut,
} from "lucide-react";

/* Tambahan untuk mendeteksi halaman aktif */
import { usePathname } from "next/navigation";

export default function Sidebar() {
  /* State: buka/tutup sidebar */
  const [isOpen, setIsOpen] = useState(true);

  /* State: mode tampilan (light/dark) */
  const [theme, setTheme] = useState("light");

  /* State: dropdown bahasa */
  const [langOpen, setLangOpen] = useState(false);

  /* Ambil URL saat ini */
  const pathname = usePathname();

  /* Cek menu aktif sampai halaman turunan */
  const isActive = (path: string) => pathname.startsWith(path);

  /* Data menu utama — hanya ditambah 'path' */
  const menuUtama = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/dashboard" },
    { icon: <BarChart3 size={20} />, label: "Laporan", path: "/laporan" },
  ];

  return (
    <div className={`${isOpen ? "w-64" : "w-20"} relative transition-all duration-300`}>
      <aside
        className={`fixed h-full bg-white shadow-sm p-5 flex flex-col justify-between transition-all duration-300 ${
          isOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Bagian Atas: Logo dan Tombol Toggle Sidebar */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <img
              src="/logo-scorify.png"
              alt="Logo"
              className={`h-10 transition-all ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}
            />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-gray-100 shadow-sm hover:bg-gray-200 transition"
            >
              {isOpen ? (
                <PanelLeftClose size={20} className="text-gray-400" />
              ) : (
                <PanelLeftOpen size={20} className="text-gray-400" />
              )}
            </button>
          </div>

          {/* Menu Utama */}
          <p
            className={`text-xs font-semibold text-gray-400 mb-2 transition-all ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            MENU UTAMA
          </p>

          <nav className="flex flex-col gap-1">
            {menuUtama.map((item) => {
              const isActive = pathname.startsWith(item.path);

              return (
                <a
                  key={item.label}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold"
                      : "text-gray-700"
                  } ${!isOpen ? "justify-center" : "justify-start"}`}
                >
                  {item.icon}
                  {isOpen && <span>{item.label}</span>}
                </a>
              );
            })}
          </nav>

          {/* Preferensi: Mode Tampilan & Bahasa */}
          <p
            className={`text-xs font-semibold text-gray-400 mt-6 mb-2 transition-all ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            PREFERENSI
          </p>

          <div className="flex flex-col gap-3">
            {/* Mode Tampilan */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 ${
                !isOpen ? "justify-center" : "justify-start"
              }`}
            >
              {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
              {isOpen && <span>Mode Tampilan</span>}
            </button>

            {/* Bahasa */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 w-full ${
                  !isOpen ? "justify-center" : "justify-start"
                }`}
              >
                <Globe size={20} />
                {isOpen && <span>Bahasa</span>}
              </button>

              {langOpen && (
                <div
                  className={`absolute z-40 bg-white border rounded-md shadow-md left-12 top-10 ${
                    isOpen ? "" : "left-14"
                  }`}
                >
                  <button
                    onClick={() => setLangOpen(false)}
                    className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                  >
                    Indonesia
                  </button>

                  <button
                    onClick={() => setLangOpen(false)}
                    className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                  >
                    English
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bagian Bawah: Profil, Logout, dan Footer */}
        <div className="px-0 pb-4 pt-30">
          {/* Profil */}
          <div
            className={`flex items-center transition-all mb-4 ${
              isOpen ? "justify-start px-3" : "justify-start px-1"
            }`}
          >
            <div
              className={`rounded-full bg-[#00A884] text-white font-bold flex items-center justify-center transition-all ${
                isOpen ? "w-10 h-10 text-base" : "w-8 h-8 text-sm"
              }`}
            >
              SA
            </div>

            {isOpen && (
              <div className="ml-3">
                <p className="text-sm font-semibold">Sales</p>
                <p className="text-xs text-gray-500">Tim Sales</p>
              </div>
            )}
          </div>

          {/* Tombol Logout */}
          <div className={`flex items-center ${isOpen ? "px-3" : "px-1"}`}>
            <button
              className={`rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#009970] transition flex items-center justify-center gap-2 ${
                isOpen ? "w-full h-10" : "w-8 h-8"
              }`}
            >
              <LogOut size={isOpen ? 18 : 14} />
              {isOpen && <span>Keluar</span>}
            </button>
          </div>

          {/* Garis Pemisah */}
          <div className="border-t border-gray-200 mt-4 mb-3" />

          {/* Footer */}
          {isOpen ? (
            <p className="text-xs text-gray-400 text-center">
              © 2025 Scorify. All Rights Reserved.
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 text-center">© 2025</p>
          )}
        </div>
      </aside>
    </div>
  );
}
