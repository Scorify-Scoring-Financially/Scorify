"use client";
import React from "react";

export default function Sidebar() {
  return (
    <div className="w-64 relative">
      <aside className="w-64 h-full fixed bg-white shadow-md border-r border-gray-200 p-6 flex flex-col justify-between">
        <div>
          {/* Logo Scorify */}
          <div className="flex items-center justify-center mb-6 pt-2">
            <img
              src="/logo-scorify.png"
              alt="Scorify Logo"
              className="h-11 w-auto drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]"
            />
          </div>

          {/* Menu navigasi */}
          <nav className="flex flex-col gap-1 mt-6">
            {[
              ["space_dashboard", "Dashboard"],
              ["bar_chart", "Laporan"],
              ["admin_panel_settings", "Admin"],
            ].map(([icon, label], i) => (
              <a
                key={label}
                href="#"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  i === 0
                    ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold"
                    : "text-gray-700 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
                }`}
              >
                <span className="material-symbols-outlined">{icon}</span>
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Profil pengguna */}
        <div className="mt-auto flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  "url('https://ui-avatars.com/api/?name=Sales&background=00A884&color=fff')",
              }}
            />
            <div>
              <h1 className="text-sm font-semibold">Sales</h1>
              <p className="text-xs text-gray-500">Tim Sales</p>
            </div>
          </div>

          {/* Tombol logout */}
          <button className="w-full h-10 rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[#009970] transition">
            Keluar
          </button>
        </div>
      </aside>
    </div>
  );
}
