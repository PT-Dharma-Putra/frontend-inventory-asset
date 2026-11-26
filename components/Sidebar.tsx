import React, { useState } from "react";
import { LayoutDashboard, Building2, Package, LogOut, CheckCircle2, Database, Users, ShieldCheck, Tag, ChevronDown, List, Layers, MapPin, X } from "lucide-react";
import { User, getDivisiCompanyImage, fetchDivisiImages, isDpsaDivisi } from "@/lib/api";

interface SidebarProps {
  activeTab: "overview" | "divisi" | "fixAsset" | "inventory" | "users";
  setActiveTab: (tab: "overview" | "divisi" | "fixAsset" | "inventory" | "users") => void;
  divisiCount?: number;
  fixAssetSubTab?: "list" | "jenisBarang" | "typeBarang" | "lokasi";
  setFixAssetSubTab?: (sub: "list" | "jenisBarang" | "typeBarang" | "lokasi") => void;
  fixAssetJenisCount?: number;
  fixAssetTypeCount?: number;
  fixAssetLokasiCount?: number;
  inventorySubTab?: "list" | "namaBarang" | "lokasi";
  setInventorySubTab?: (sub: "list" | "namaBarang" | "lokasi") => void;
  namaBarangCount?: number;
  inventoryLokasiCount?: number;
  isOpen: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  fixAssetCount: number;
  inventoryCount: number;
  currentUser?: User | null;
  activeDivisi?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  divisiCount = 0,
  fixAssetSubTab = "list",
  setFixAssetSubTab,
  fixAssetJenisCount = 0,
  fixAssetTypeCount = 0,
  fixAssetLokasiCount = 0,
  inventorySubTab = "list",
  setInventorySubTab,
  namaBarangCount = 0,
  inventoryLokasiCount = 0,
  isOpen,
  onClose,
  isMobile = false,
  fixAssetCount,
  inventoryCount,
  currentUser,
  activeDivisi = "DPSA",
  onLogout,
}) => {
  const [mounted, setMounted] = useState(false);
  const [fixMenuExpanded, setFixMenuExpanded] = useState(true);
  const [invMenuExpanded, setInvMenuExpanded] = useState(true);

  const handleNavClick = (tab: "overview" | "divisi" | "fixAsset" | "inventory" | "users") => {
    setActiveTab(tab);
    if (isMobile || (typeof window !== "undefined" && window.innerWidth < 768)) {
      onClose?.();
    }
  };

  const handleSubNavClick = (callback?: () => void) => {
    callback?.();
    if (isMobile || (typeof window !== "undefined" && window.innerWidth < 768)) {
      onClose?.();
    }
  };

  const isSuperAdminOrDirektur =
    currentUser?.role === "Super Admin" || currentUser?.role === "Direktur Utama";

  const effectiveDivisi = isSuperAdminOrDirektur
    ? activeDivisi || "ALL"
    : currentUser?.divisi || activeDivisi || "DPSA";

  const [, setImagesTick] = useState(0);

  React.useEffect(() => {
    setMounted(true);
    fetchDivisiImages().then(() => {
      setImagesTick((v) => v + 1);
    });

    const handleUpdate = () => {
      setImagesTick((v) => v + 1);
    };
    window.addEventListener("dpsa_divisi_images_updated", handleUpdate);
    return () => window.removeEventListener("dpsa_divisi_images_updated", handleUpdate);
  }, []);

  const logoUrl = mounted ? getDivisiCompanyImage(effectiveDivisi) : "/logo-dpsa.png";

  const workspaceLabel =
    !activeDivisi || activeDivisi.toUpperCase() === "ALL" || activeDivisi.toUpperCase() === "SEMUA"
      ? "SEMUA DIVISI"
      : isDpsaDivisi(activeDivisi)
      ? "PT DPSA"
      : activeDivisi;
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className={`${
            isMobile ? "block" : "md:hidden block"
          } fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity`}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between transition-all duration-300 bg-[#070e1f] text-slate-300 ${
          isMobile
            ? `${isOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"}`
            : `${isOpen ? "translate-x-0 md:w-64" : "translate-x-0 md:w-20"} max-md:${
                isOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"
              }`
        } border-r border-slate-800/60 shadow-2xl`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between gap-3 px-5 py-6 border-b border-slate-800/40">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Logo Icon */}
              <div className="relative flex items-center justify-center w-11 h-11 shrink-0 bg-white/5 rounded-xl p-0.5 overflow-hidden">
                <img
                  suppressHydrationWarning
                  src={mounted ? (logoUrl || "/logo-dpsa.png") : "/logo-dpsa.png"}
                  alt="Logo Perusahaan"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/logo-dpsa.png";
                  }}
                />
              </div>

              {isOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-white text-base tracking-wide leading-tight truncate">
                    {workspaceLabel}
                  </span>
                  <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
                    ASSET &amp; INVENTORY
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            {isOpen && onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`${
                  isMobile ? "flex" : "md:hidden flex"
                } items-center justify-center p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer shrink-0`}
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sheets Indicator */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {isOpen && (
                <span className="text-xs font-semibold text-emerald-400 tracking-tight">
                  Sheets Terhubung
                </span>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-2">
            {isOpen && (
              <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                NAVIGASI UTAMA
              </div>
            )}

            <nav className="space-y-1.5">
              {/* Overview Button */}
              <button
                onClick={() => handleNavClick("overview")}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#2563eb] text-white shadow-lg shadow-blue-600/30 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title="Overview"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  {isOpen && <span>Overview</span>}
                </div>
              </button>

              {/* Divisi Button */}
              <button
                onClick={() => handleNavClick("divisi")}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === "divisi"
                    ? "bg-[#2563eb] text-white shadow-lg shadow-blue-600/30 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title="Divisi"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 shrink-0" />
                  {isOpen && <span>Divisi</span>}
                </div>
                {isOpen && mounted && divisiCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTab === "divisi"
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {divisiCount}
                  </span>
                )}
              </button>

              {/* Fix Asset Button + Sub Menu */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    if (activeTab === "fixAsset") {
                      setFixMenuExpanded((prev) => !prev);
                    } else {
                      setActiveTab("fixAsset");
                      setFixMenuExpanded(true);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === "fixAsset"
                      ? "bg-[#2563eb] text-white shadow-lg shadow-blue-600/30 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                  title="Fix Asset"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 shrink-0" />
                    {isOpen && <span>Fix Asset</span>}
                  </div>
                  {isOpen && (
                    <div className="flex items-center gap-1.5">
                      {mounted && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            activeTab === "fixAsset"
                              ? "bg-blue-800/70 text-blue-100"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {fixAssetCount}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          fixMenuExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  )}
                </button>

                {/* Sub-menu items under Fix Asset */}
                {isOpen && fixMenuExpanded && (
                  <div className="pl-4 ml-3 border-l border-slate-800 space-y-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleSubNavClick(() => {
                          setActiveTab("fixAsset");
                          setFixAssetSubTab?.("list");
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeTab === "fixAsset" && fixAssetSubTab === "list"
                          ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <List className="w-3.5 h-3.5 shrink-0" />
                        <span>Data Fix Asset</span>
                      </div>
                      {mounted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                          {fixAssetCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSubNavClick(() => {
                          setActiveTab("fixAsset");
                          setFixAssetSubTab?.("jenisBarang");
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeTab === "fixAsset" && fixAssetSubTab === "jenisBarang"
                          ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span>Data Jenis Barang</span>
                      </div>
                      {mounted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-emerald-300 font-semibold">
                          {fixAssetJenisCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSubNavClick(() => {
                          setActiveTab("fixAsset");
                          setFixAssetSubTab?.("typeBarang");
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeTab === "fixAsset" && fixAssetSubTab === "typeBarang"
                          ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span>Data Type Barang</span>
                      </div>
                      {mounted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-purple-300 font-semibold">
                          {fixAssetTypeCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSubNavClick(() => {
                          setActiveTab("fixAsset");
                          setFixAssetSubTab?.("lokasi");
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeTab === "fixAsset" && fixAssetSubTab === "lokasi"
                          ? "bg-amber-600/20 text-amber-300 border border-amber-500/30 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Data Lokasi</span>
                      </div>
                      {mounted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold">
                          {fixAssetLokasiCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Inventory Button + Sub Menu */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    if (activeTab === "inventory") {
                      setInvMenuExpanded((prev) => !prev);
                    } else {
                      setActiveTab("inventory");
                      setInvMenuExpanded(true);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === "inventory"
                      ? "bg-[#2563eb] text-white shadow-lg shadow-blue-600/30 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                  title="Inventory"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 shrink-0" />
                    {isOpen && <span>Inventory</span>}
                  </div>
                  {isOpen && (
                    <div className="flex items-center gap-1.5">
                      {mounted && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            activeTab === "inventory"
                              ? "bg-blue-800/70 text-blue-100"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {inventoryCount}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          invMenuExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  )}
                </button>

                {/* Sub-menu items under Inventory */}
                {isOpen && invMenuExpanded && (
                  <div className="pl-4 ml-3 border-l border-slate-800 space-y-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleSubNavClick(() => {
                          setActiveTab("inventory");
                          setInventorySubTab?.("list");
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeTab === "inventory" && inventorySubTab === "list"
                          ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <List className="w-3.5 h-3.5 shrink-0" />
                        <span>Data Inventory</span>
                      </div>
                      {mounted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                          {inventoryCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSubNavClick(() => {
                          setActiveTab("inventory");
                          setInventorySubTab?.("namaBarang");
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeTab === "inventory" && inventorySubTab === "namaBarang"
                          ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span>Data Jenis Barang</span>
                      </div>
                      {mounted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-emerald-300 font-semibold">
                          {namaBarangCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSubNavClick(() => {
                          setActiveTab("inventory");
                          setInventorySubTab?.("lokasi");
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        activeTab === "inventory" && inventorySubTab === "lokasi"
                          ? "bg-amber-600/20 text-amber-300 border border-amber-500/30 font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Data Lokasi</span>
                      </div>
                      {mounted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold">
                          {inventoryLokasiCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* User Management Button (Super Admin Only) */}
              {currentUser?.role === "Super Admin" && (
                <button
                  onClick={() => handleNavClick("users")}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === "users"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold"
                      : "text-purple-300/80 hover:text-white hover:bg-purple-950/40"
                  }`}
                  title="User Management"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 shrink-0 text-purple-400" />
                    {isOpen && <span>User Management</span>}
                  </div>
                  {isOpen && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      Super
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Bottom Profile Section */}
        <div className="p-3 border-t border-slate-800/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
                {currentUser?.avatar || (currentUser?.nama ? currentUser.nama.slice(0, 2).toUpperCase() : "AD")}
              </div>
              {isOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white leading-tight truncate">
                    {currentUser?.nama || "Admin"}
                  </span>
                  <span className="text-xs text-slate-400 truncate">
                    {currentUser?.role || "Admin HRGA"}
                  </span>
                </div>
              )}
            </div>
            {isOpen && onLogout && (
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer shrink-0"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
