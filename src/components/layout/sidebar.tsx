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
  Users,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation"; 

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [theme, setTheme] = useState("light");
  const [langOpen, setLangOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  /* DETECT ROLE dari URL
     TODO: nanti ini diganti dengan role dari backend setelah login*/
  const role = pathname.startsWith("/admin") ? "admin" : "user";

  /* Menu untuk User */
  const menuUser = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/dashboard" },
    { icon: <BarChart3 size={20} />, label: "Laporan", path: "/laporan" },
  ];

  /* Menu untuk Admin — tambah menu Sales */
  const menuAdmin = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin/dashboard" },
    { icon: <BarChart3 size={20} />, label: "Laporan", path: "/admin/laporan" },
    { icon: <Users size={20} />, label: "Sales", path: "/admin/sales" },
  ];

  /* Pilih menu berdasarkan role */
  const menuUtama = role === "admin" ? menuAdmin : menuUser;

  /* Cek active termasuk turunan path */
  const isActive = (p: string) => pathname.startsWith(p);

  const handleLogout = () => {
    // TODO: nanti remove token & role dari auth backend
    router.push("/login");
  };

  return (
    <div className={`${isOpen ? "w-64" : "w-20"} relative transition-all duration-300`}>
      <aside
        className={`fixed h-full bg-white shadow-sm p-5 flex flex-col justify-between transition-all duration-300 ${
          isOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Bagian Atas */}
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
          <p className={`text-xs font-semibold text-gray-400 mb-2 ${isOpen ? "" : "opacity-0"}`}>
            MENU UTAMA
          </p>

          <nav className="flex flex-col gap-1">
            {menuUtama.map((item) => (
              <a
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive(item.path)
                    ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold"
                    : "text-gray-700"
                } ${!isOpen ? "justify-center" : "justify-start"}`}
              >
                {item.icon}
                {isOpen && <span>{item.label}</span>}
              </a>
            ))}
          </nav>

          {/* Preferensi */}
          <p
            className={`text-xs font-semibold text-gray-400 mt-6 mb-2 transition-all ${
              isOpen ? "" : "opacity-0"
            }`}
          >
            PREFERENSI
          </p>

          <div className="flex flex-col gap-3">
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
                <div className="absolute z-40 bg-white border rounded-md shadow-md left-12 top-10">
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

        {/* Profil & Logout */}
        <div className="px-0 pb-4 pt-30">
          <div className={`flex items-center mb-4 ${isOpen ? "px-3" : "px-1"}`}>
            <div
              className={`rounded-full bg-[#00A884] text-white font-bold flex items-center justify-center ${
                isOpen ? "w-10 h-10" : "w-8 h-8 text-sm"
              }`}
            >
              {/* TODO: backend set initials sesuai user */}
              {role === "admin" ? "AD" : "SA"}
            </div>
            {isOpen && (
              <div className="ml-3">
                <p className="text-sm font-semibold">
                  {role === "admin" ? "Admin" : "Sales"}
                </p>
                <p className="text-xs text-gray-500">
                  {role === "admin" ? "Administrator" : "Tim Sales"}
                </p>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className={`flex items-center ${isOpen ? "px-3" : "px-1"}`}>
            <button
              onClick={handleLogout}
              className={`rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#009970] transition flex items-center justify-center gap-2 ${
                isOpen ? "w-full h-10" : "w-8 h-8"
              }`}
            >
              <LogOut size={isOpen ? 18 : 14} />
              {isOpen && <span>Keluar</span>}
            </button>
          </div>

          <div className="border-t border-gray-200 mt-4 mb-3" />

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
