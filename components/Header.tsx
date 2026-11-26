"use client";

import React, { useState } from "react";
import { PanelLeft, Menu, LogOut, User as UserIcon, ChevronDown, Database, Building2, Smartphone, Monitor } from "lucide-react";
import { User, isAllDivisiValue, isDpsaDivisi } from "@/lib/api";

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentUser?: User | null;
  activeDivisi?: string;
  divisiOptions?: string[];
  onChangeDivisi?: (divisi: string) => void;
  onToggleSidebar: () => void;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  viewMode?: "desktop" | "mobile";
  onToggleViewMode?: () => void;
  isMobile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = "PT DPSA Asset & Inventory Management",
  currentUser,
  activeDivisi = "DPSA",
  divisiOptions = [],
  onChangeDivisi,
  onToggleSidebar,
  onLogout,
  onOpenLogin,
  viewMode = "desktop",
  onToggleViewMode,
  isMobile = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = currentUser?.avatar || (currentUser?.nama ? currentUser.nama.slice(0, 2).toUpperCase() : "AD");
  const isSuperAdmin = currentUser?.role === "Super Admin" || currentUser?.role === "Direktur Utama";
  const effectiveDivisi = activeDivisi || (isSuperAdmin ? "ALL" : currentUser?.divisi || "PT Dharma Putra Sejahtera Abadi");
  const effectiveLabel = isAllDivisiValue(effectiveDivisi)
    ? "Semua Divisi / PT"
    : isDpsaDivisi(effectiveDivisi)
    ? "PT Dharma Putra Sejahtera Abadi"
    : effectiveDivisi;
  const userDivisiLabel =
    isSuperAdmin || isAllDivisiValue(currentUser?.divisi)
      ? "Semua Divisi"
      : isDpsaDivisi(currentUser?.divisi)
      ? "PT Dharma Putra Sejahtera Abadi"
      : currentUser?.divisi || "PT Dharma Putra Sejahtera Abadi";

  const rawList = [
    ...(!isAllDivisiValue(effectiveDivisi) ? [effectiveDivisi] : []),
    ...divisiOptions.filter((d) => d && !isAllDivisiValue(d)),
  ];
  const allDivisiList = Array.from(
    new Set(
      rawList.map((d) => (isDpsaDivisi(d) ? "PT DHARMA PUTRA SEJAHTERA ABADI" : d.trim().toUpperCase()))
    )
  );
  if (!allDivisiList.some((d) => isDpsaDivisi(d))) {
    allDivisiList.unshift("PT DHARMA PUTRA SEJAHTERA ABADI");
  }

  return (
    <header className="sticky top-0 z-30 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200 shadow-2xs cursor-pointer shrink-0"
          title="Menu Navigasi"
        >
          {isMobile ? <Menu className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none mb-1 truncate">
            {title}
          </h1>
          <p className="text-xs font-medium text-slate-500 tracking-normal flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="truncate max-w-[180px] sm:max-w-none">{subtitle}</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 shrink-0">
              <Building2 className="w-3 h-3 text-indigo-600" />
              <span>{effectiveLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shrink-0">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>MySQL Live</span>
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 relative ml-auto sm:ml-0">
        {/* Mode Desktop / Mobile Switcher Button */}
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
              viewMode === "mobile"
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
            title={viewMode === "mobile" ? "Beralih ke Mode Desktop" : "Beralih ke Mode Mobile"}
          >
            {viewMode === "mobile" ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mode Desktop</span>
                <span className="sm:hidden text-[11px]">Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Mode Mobile</span>
                <span className="sm:hidden text-[11px]">Mobile</span>
              </>
            )}
          </button>
        )}

        {isSuperAdmin && onChangeDivisi && (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs shadow-2xs max-w-[170px] sm:max-w-none">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600 hidden md:inline">Lihat Divisi:</span>
            <select
              value={isAllDivisiValue(effectiveDivisi) ? "ALL" : effectiveDivisi}
              onChange={(e) => onChangeDivisi(e.target.value)}
              className="select-compact bg-transparent font-bold text-indigo-700 focus:outline-none cursor-pointer truncate max-w-[110px] sm:max-w-none"
              title="Pilih data Divisi / PT yang ingin dilihat"
            >
              <option value="ALL">Semua Divisi / PT</option>
              {allDivisiList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold text-xs tracking-tighter shadow-2xs">
                {initials}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {currentUser.nama}
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  {currentUser.role} • {userDivisiLabel}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block ml-0.5" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{currentUser.nama}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    @{currentUser.username} • {currentUser.role}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-semibold truncate mt-0.5">
                    Akses: {userDivisiLabel}
                    {currentUser.email ? ` • ${currentUser.email}` : ""}
                  </p>
                </div>

                <div className="p-1">
                  {onLogout && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Keluar (Logout)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
        )}
      </div>
    </header>
  );
};
