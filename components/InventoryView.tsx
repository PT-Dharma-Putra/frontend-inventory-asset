"use client";

import React, { useState } from "react";
import { Search, Printer, Plus, ExternalLink, QrCode, Edit3, Trash2, FileSpreadsheet, Download, X, Check, Image as ImageIcon, Package, Tag, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import {
  InventoryItem,
  formatRupiah,
  formatNumber,
  formatImageDisplayUrl,
  handleGoogleDriveImageError,
  extractGoogleDriveFileId,
  getInventoryTotalHarga,
  getInventoryPemilik,
  extractJenisBarangFromNama,
  buildRoomAbbreviation,
  resolveUniqueInventoryRoomCodes,
  User,
} from "@/lib/api";
import { exportInventoryToExcel } from "@/lib/excelHelper";

export interface MasterNamaBarangEntry {
  id: number;
  ruangan: string;
  ruanganList?: string[];
  kodeBarang?: string;
  kodeBarangList?: string[];
  namaBarang: string;
  count: number;
  isCustom: boolean;
}

export interface MasterInventoryLokasiEntry {
  id: number;
  kode: string;
  nama: string;
  count: number;
  kodeBarangList?: string[];
}

interface InventoryViewProps {
  currentUser?: User | null;
  items: InventoryItem[];
  subTab?: "list" | "namaBarang" | "lokasi";
  onChangeSubTab?: (sub: "list" | "namaBarang" | "lokasi") => void;
  masterNamaBarang?: MasterNamaBarangEntry[];
  masterLokasi?: MasterInventoryLokasiEntry[];
  customRooms?: string[];
  onAddRoom?: (roomName: string) => void;
  onAddMasterNamaBarang?: (nama: string, ruangan?: string) => void;
  onEditMasterNamaBarang?: (targetId: number, newNama: string) => void;
  onDeleteMasterNamaBarang?: (nama: string, ruangan?: string) => void;
  onAddMasterLokasi?: (kode: string, nama: string) => void;
  onEditMasterLokasi?: (id: number, newKode: string, newNama: string) => void;
  onDeleteMasterLokasi?: (id: number) => void;
  onClearAllMasterLokasi?: () => void;
  onOpenDetail: (item: InventoryItem) => void;
  onOpenPrintAll: (selectedIds?: number[]) => void;
  onOpenAddNew: (defaultNamaBarang?: string, defaultRuangan?: string) => void;
  onOpenImport?: () => void;
  onClearAll?: () => void;
  onEditItem?: (item: InventoryItem) => void;
  onDeleteItem?: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  currentUser,
  items,
  subTab = "list",
  onChangeSubTab,
  masterNamaBarang = [],
  masterLokasi = [],
  customRooms = [],
  onAddRoom,
  onAddMasterNamaBarang,
  onEditMasterNamaBarang,
  onDeleteMasterNamaBarang,
  onAddMasterLokasi,
  onEditMasterLokasi,
  onDeleteMasterLokasi,
  onClearAllMasterLokasi,
  onOpenDetail,
  onOpenPrintAll,
  onOpenAddNew,
  onOpenImport,
  onClearAll,
  onEditItem,
  onDeleteItem,
}) => {
  const isDirekturUtama = currentUser?.role === "Direktur Utama";
  const isSuperAdmin = currentUser?.role === "Super Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const pageSizeOptions = [10, 25, 50, 100, 500, 1000];
  const [selectedForPrint, setSelectedForPrint] = useState<Set<number>>(new Set());

  // State for Master Nama Barang Sub-Menu
  const [searchMasterNama, setSearchMasterNama] = useState("");
  const [newMasterNamaInput, setNewMasterNamaInput] = useState("");
  const [addMasterModalOpen, setAddMasterModalOpen] = useState(false);
  const [modalMasterNamaInput, setModalMasterNamaInput] = useState("");
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [editingMasterValue, setEditingMasterValue] = useState<string>("");

  const handleQuickAddMasterNama = () => {
    const trimmed = newMasterNamaInput.trim();
    if (!trimmed) {
      setAddMasterModalOpen(true);
      return;
    }
    onAddMasterNamaBarang?.(trimmed);
    setNewMasterNamaInput("");
  };

  const handleModalAddMasterNama = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modalMasterNamaInput.trim();
    if (!trimmed) return;
    onAddMasterNamaBarang?.(trimmed);
    setModalMasterNamaInput("");
    setAddMasterModalOpen(false);
  };

  const handleAttemptSaveMasterNama = (entry: MasterNamaBarangEntry) => {
    const trimmed = editingMasterValue.trim();
    if (!trimmed || trimmed === entry.namaBarang) {
      setEditingMasterId(null);
      return;
    }

    onEditMasterNamaBarang?.(entry.id, trimmed);
    setEditingMasterId(null);
  };

  // State for Master Lokasi Inventory Sub-Menu
  const [searchMasterLokasi, setSearchMasterLokasi] = useState("");
  const [newLokasiKodeInput, setNewLokasiKodeInput] = useState("");
  const [newLokasiNamaInput, setNewLokasiNamaInput] = useState("");
  const [addMasterLokasiModalOpen, setAddMasterLokasiModalOpen] = useState(false);
  const [modalLokasiKodeInput, setModalLokasiKodeInput] = useState("");
  const [modalLokasiNamaInput, setModalLokasiNamaInput] = useState("");
  const [editingMasterLokasiId, setEditingMasterLokasiId] = useState<number | null>(null);
  const [editingMasterLokasiKode, setEditingMasterLokasiKode] = useState<string>("");
  const [editingMasterLokasiNama, setEditingMasterLokasiNama] = useState<string>("");

  const handleQuickAddMasterLokasi = () => {
    const n = newLokasiNamaInput.trim();
    if (!n) {
      setAddMasterLokasiModalOpen(true);
      return;
    }
    const k = (newLokasiKodeInput.trim() || buildRoomAbbreviation(n)).toUpperCase();
    onAddMasterLokasi?.(k, n);
    setNewLokasiKodeInput("");
    setNewLokasiNamaInput("");
  };

  const handleModalAddMasterLokasi = (e: React.FormEvent) => {
    e.preventDefault();
    const n = modalLokasiNamaInput.trim();
    if (!n) return;
    const k = (modalLokasiKodeInput.trim() || buildRoomAbbreviation(n)).toUpperCase();
    onAddMasterLokasi?.(k, n);
    setModalLokasiKodeInput("");
    setModalLokasiNamaInput("");
    setAddMasterLokasiModalOpen(false);
  };

  const handleAttemptSaveMasterLokasi = (entry: MasterInventoryLokasiEntry) => {
    const n = editingMasterLokasiNama.trim();
    if (!n) {
      setEditingMasterLokasiId(null);
      return;
    }
    const k = (editingMasterLokasiKode.trim() || buildRoomAbbreviation(n)).toUpperCase();
    if (k === entry.kode && n === entry.nama) {
      setEditingMasterLokasiId(null);
      return;
    }
    onEditMasterLokasi?.(entry.id, k, n);
    setEditingMasterLokasiId(null);
  };

  const filteredMasterLokasiEntries = React.useMemo(() => {
    const q = searchMasterLokasi.trim().toLowerCase();
    if (!q) return masterLokasi;
    return masterLokasi.filter((entry) => {
      const matchesKodeBarang =
        entry.kodeBarangList &&
        entry.kodeBarangList.some((kb) => kb.toLowerCase().includes(q));
      return (
        entry.kode.toLowerCase().includes(q) ||
        entry.nama.toLowerCase().includes(q) ||
        matchesKodeBarang
      );
    });
  }, [masterLokasi, searchMasterLokasi]);

  const formatRoomTitle = (roomName: string) => {
    const trimmed = (roomName || "").trim();
    if (!trimmed) return "Tanpa Ruangan";
    return /^ruang\b/i.test(trimmed) ? trimmed : `Ruang ${trimmed}`;
  };

  const [previewImage, setPreviewImage] = useState<{
    url: string;
    namaBarang: string;
    kodeBarang: string;
    ruangan?: string;
    pemilik?: string;
  } | null>(null);

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const pemilik = getInventoryPemilik(item).toLowerCase();
    return (
      (item.ruangan && item.ruangan.toLowerCase().includes(q)) ||
      (item.kodeBarang && item.kodeBarang.toLowerCase().includes(q)) ||
      (item.namaBarang && item.namaBarang.toLowerCase().includes(q)) ||
      (item.tipeUkuran && item.tipeUkuran.toLowerCase().includes(q)) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
      (item.kodeBarcode && item.kodeBarcode.toLowerCase().includes(q)) ||
      pemilik.includes(q)
    );
  });

  const toggleSelectForPrint = (id: number) => {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allPageSelected =
    filteredItems.length > 0 && filteredItems.every((it) => selectedForPrint.has(it.id));

  const toggleSelectAllFiltered = () => {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        filteredItems.forEach((it) => next.delete(it.id));
      } else {
        filteredItems.forEach((it) => next.add(it.id));
      }
      return next;
    });
  };

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Unified Master Nama Barang list (sequential ID: 1, 2, 3, 4, ... without Ruangan filter)
  const filteredMasterEntries = React.useMemo(() => {
    const q = searchMasterNama.trim().toLowerCase();
    if (!q) return masterNamaBarang;

    return masterNamaBarang.filter((entry) => {
      const matchesKode =
        (entry.kodeBarang && entry.kodeBarang.toLowerCase().includes(q)) ||
        (entry.kodeBarangList &&
          entry.kodeBarangList.some((k) => k.toLowerCase().includes(q)));

      return (
        entry.namaBarang.toLowerCase().includes(q) ||
        String(entry.id) === q ||
        String(entry.id).includes(q) ||
        `id ${entry.id}`.includes(q) ||
        matchesKode
      );
    });
  }, [masterNamaBarang, searchMasterNama]);

  return (
    <div className="space-y-5 max-w-full">
      {/* Sub-Menu Tabs inside Inventory */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeSubTab?.("list")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "list"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Data Inventory</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                subTab === "list" ? "bg-blue-800/60 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSubTab?.("namaBarang")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "namaBarang"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Data Jenis Barang</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                subTab === "namaBarang"
                  ? "bg-emerald-800/60 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {masterNamaBarang.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSubTab?.("lokasi")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "lokasi"
                ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Data Lokasi</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                subTab === "lokasi"
                  ? "bg-amber-800/60 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {masterLokasi.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 px-2 hidden sm:block">
          {subTab === "namaBarang"
            ? "Setiap jenis barang diberikan ID urut (1, 2, 3, ...) untuk mengelompokkan barang & Kode Barang"
            : subTab === "lokasi"
            ? "Kelola lokasi penempatan & lihat daftar Kode Barang Inventory di setiap lokasi"
            : "Menampilkan seluruh daftar barang inventaris"}
        </div>
      </div>

      {subTab === "namaBarang" ? (
        <div className="space-y-4">
          {/* Top Bar: Search Jenis Barang / ID / Kode Barang & Quick Add Jenis Barang */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ID (1, 2, 3...), kode barang, atau jenis barang..."
                  value={searchMasterNama}
                  onChange={(e) => setSearchMasterNama(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hidden xl:block">
                Format Kode: <strong className="text-slate-700">INVNT/(Pemilik)/(Singkatan Ruang).(ID Jenis Barang).(No Urut)/(Tahun Perolehan)</strong>{" "}
                <span className="text-emerald-700 font-bold">(Contoh: INVNT/DPSA/R.S.M.1.1/2024)</span>
              </div>
            </div>

            {/* Form & Button Tambah Jenis Barang (Bisa ditambahkan sebelum ada Data Inventory) */}
            {!isDirekturUtama && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                  <span>Otomatis:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono">
                    ID {masterNamaBarang.length + 1}
                  </span>
                </span>
                <input
                  type="text"
                  placeholder="Ketik jenis barang baru..."
                  value={newMasterNamaInput}
                  onChange={(e) => setNewMasterNamaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newMasterNamaInput.trim()) {
                        handleQuickAddMasterNama();
                      }
                    }
                  }}
                  className="w-52 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleQuickAddMasterNama}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Tambahkan jenis barang baru (sebelum atau sesudah ada Data Inventory)"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jenis Barang</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabel Data Jenis Barang (Tanpa Kolom Ruangan, Urut ID 1, 2, 3, 4...) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Data Jenis Barang
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {masterNamaBarang.length > 0
                        ? `${filteredMasterEntries.length} Jenis Barang (ID 1 – ${masterNamaBarang.length})`
                        : "0 Jenis Barang"}
                    </span>
                  </div>
                </div>
              </div>

              {!isDirekturUtama && (
                <button
                  type="button"
                  onClick={() => setAddMasterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Banyak / Daftar Jenis Barang</span>
                </button>
              )}
            </div>

            <div className="overflow-auto max-h-[calc(100vh-280px)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-24">
                      ID
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 w-72">
                      KODE BARANG
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70">
                      JENIS BARANG
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-48">
                      JUMLAH DI INVENTORY
                    </th>
                    {!isDirekturUtama && (
                      <th className="py-2.5 px-4 text-center w-52">
                        AKSI
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMasterEntries.length === 0 ? (
                    <tr>
                      <td colSpan={isDirekturUtama ? 4 : 5} className="py-8 px-4 text-center text-slate-400 text-xs">
                        Belum ada data jenis barang yang sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMasterEntries.map((entry) => {
                      const kodeList =
                        entry.kodeBarangList && entry.kodeBarangList.length > 0
                          ? entry.kodeBarangList
                          : entry.kodeBarang && entry.kodeBarang !== "-"
                          ? [entry.kodeBarang]
                          : [];

                      return (
                        <tr
                          key={`${entry.id}-${entry.namaBarang}`}
                          className="hover:bg-slate-50/80 transition-colors align-top"
                        >
                          <td className="py-3 px-4 text-center border-r border-slate-100 font-mono font-bold">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                              {entry.id}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono font-semibold text-blue-700">
                            {kodeList.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : kodeList.length === 1 ? (
                              <span className="whitespace-nowrap">{kodeList[0]}</span>
                            ) : (
                              <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto pr-1">
                                {kodeList.map((kode, kIdx) => (
                                  <span key={kIdx} className="whitespace-nowrap leading-snug">
                                    {kode}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100 text-sm">
                            {editingMasterId === entry.id ? (
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={editingMasterValue}
                                  onChange={(e) => setEditingMasterValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAttemptSaveMasterNama(entry);
                                    } else if (e.key === "Escape") {
                                      setEditingMasterId(null);
                                    }
                                  }}
                                  className="w-full max-w-xs px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                  autoFocus
                                />
                                {(() => {
                                  const trimmedVal = editingMasterValue.trim();
                                  const matchOther =
                                    trimmedVal &&
                                    masterNamaBarang.find(
                                      (other) =>
                                        other.id !== entry.id &&
                                        other.namaBarang.toLowerCase() === trimmedVal.toLowerCase()
                                    );
                                  if (!matchOther) return null;
                                  return (
                                    <div className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg max-w-xs">
                                      Jenis <strong>&ldquo;{matchOther.namaBarang}&rdquo;</strong> sudah terdaftar di{" "}
                                      <strong>ID {matchOther.id}</strong>. Silakan gunakan nama lain.
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              entry.namaBarang
                            )}
                          </td>
                          <td className="py-3 px-4 text-center border-r border-slate-100">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {entry.count} Barang di Inventory
                            </span>
                          </td>
                          {!isDirekturUtama && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {editingMasterId === entry.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAttemptSaveMasterNama(entry)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                                      title="Simpan perubahan nama jenis barang"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Simpan</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMasterId(null)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                                      title="Batal"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Batal</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMasterId(entry.id);
                                        setEditingMasterValue(entry.namaBarang);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                                      title={`Edit jenis barang ${entry.namaBarang}`}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit Jenis Barang</span>
                                    </button>

                                    {isSuperAdmin && entry.isCustom && entry.count === 0 && onDeleteMasterNamaBarang && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onDeleteMasterNamaBarang(entry.namaBarang)
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-colors cursor-pointer"
                                        title="Hapus dari daftar jenis barang"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Tambah Jenis Barang (Bisa tambah 1 atau banyak sekaligus sebelum ada Data Inventory) */}
          {addMasterModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setAddMasterModalOpen(false)}
            >
              <form
                onSubmit={handleModalAddMasterNama}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-slate-200 bg-emerald-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Tambah Data Jenis Barang
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Dapat ditambahkan sebelum ada Data Inventory agar otomatis dikelompokkan sesuai ID
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddMasterModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs text-slate-700">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800">
                        Jenis Barang <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Mulai dari ID {masterNamaBarang.length + 1}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder={
                        "Ketik jenis barang (bisa lebih dari 1 dengan baris baru / Enter), contoh:\nKomputer\nMeja\nKursi\nCredensa\nLukisan"
                      }
                      value={modalMasterNamaInput}
                      onChange={(e) => setModalMasterNamaInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      autoFocus
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Saat Anda menambahkan atau mengimpor Data Inventory dengan kata kunci jenis barang ini (misal &ldquo;Meja Kerja&rdquo;, &ldquo;Meja Rapat&rdquo;), sistem otomatis mengelompokkannya ke ID ini.
                    </p>
                  </div>

                  {(() => {
                    const previewLines = modalMasterNamaInput
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    if (previewLines.length === 0) return null;
                    let nextId = masterNamaBarang.length + 1;
                    return (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 max-h-36 overflow-y-auto">
                        <div className="text-[11px] font-bold text-slate-600">
                          Pratinjau ID Jenis Barang:
                        </div>
                        {previewLines.map((line, idx) => {
                          const existing = masterNamaBarang.find(
                            (e) => e.namaBarang.toLowerCase() === line.toLowerCase()
                          );
                          const assignedId = existing ? existing.id : nextId++;
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200/80"
                            >
                              <span className="font-semibold text-slate-800 truncate">
                                {line}
                              </span>
                              {existing ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                  Sudah ada (ID {existing.id})
                                </span>
                              ) : (
                                <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                  ID {assignedId}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddMasterModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!modalMasterNamaInput.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simpan Jenis Barang</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : subTab === "lokasi" ? (
        <div className="space-y-4">
          {/* Top Bar: Search Lokasi & Quick Add Lokasi */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Kode Lokasi (R.MG1, R.PTK, R.G...), nama lokasi, atau kode barang..."
                  value={searchMasterLokasi}
                  onChange={(e) => setSearchMasterLokasi(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hidden xl:block">
                Format Kode: <strong className="text-slate-700">INVNT/(Pemilik)/(Kode Lokasi).(ID Jenis).(No Urut)/(Tahun)</strong>{" "}
                <span className="text-amber-700 font-bold">(Contoh: INVNT/DPSA/R.GBJ.1.1/2024)</span>
              </div>
            </div>

            {/* Quick Add Form: Kode Lokasi (opsional) & Nama Lokasi */}
            {!isDirekturUtama && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Kode (otomatis)"
                  value={newLokasiKodeInput}
                  onChange={(e) => setNewLokasiKodeInput(e.target.value.toUpperCase())}
                  className="w-32 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Nama Lokasi (Studio, Gudang...)"
                  value={newLokasiNamaInput}
                  onChange={(e) => setNewLokasiNamaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newLokasiNamaInput.trim()) {
                        handleQuickAddMasterLokasi();
                      }
                    }
                  }}
                  className="w-52 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleQuickAddMasterLokasi}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Tambahkan data lokasi Inventory baru"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Lokasi</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabel Data Lokasi Inventory */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Data Lokasi (Inventory)
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {masterLokasi.length} Lokasi Terdaftar
                    </span>
                  </div>
                </div>
              </div>

              {!isDirekturUtama && (
                <div className="flex items-center gap-2">
                  {isSuperAdmin && onClearAllMasterLokasi && masterLokasi.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearAllMasterLokasi}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold shadow-xs transition-all cursor-pointer"
                      title="Hapus semua data lokasi Inventory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Semua ({masterLokasi.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setAddMasterLokasiModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Lokasi Baru</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-auto max-h-[calc(100vh-280px)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-28">
                      KODE LOKASI
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 w-72">
                      KODE BARANG
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70">
                      NAMA LOKASI
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-48">
                      JUMLAH DI INVENTORY
                    </th>
                    {!isDirekturUtama && (
                      <th className="py-2.5 px-4 text-center w-36">
                        AKSI
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMasterLokasiEntries.length === 0 ? (
                    <tr>
                      <td colSpan={isDirekturUtama ? 4 : 5} className="py-8 px-4 text-center text-slate-400 text-xs">
                        Belum ada data lokasi Inventory yang sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMasterLokasiEntries.map((entry) => {
                      const kodeList =
                        entry.kodeBarangList && entry.kodeBarangList.length > 0
                          ? entry.kodeBarangList
                          : [];

                      return (
                        <tr
                          key={`${entry.id}-${entry.kode}`}
                          className="hover:bg-slate-50/80 transition-colors align-top"
                        >
                          <td className="py-3 px-4 text-center border-r border-slate-100 font-mono font-bold">
                            {editingMasterLokasiId === entry.id ? (
                              <input
                                type="text"
                                value={editingMasterLokasiKode}
                                onChange={(e) => setEditingMasterLokasiKode(e.target.value.toUpperCase())}
                                className="w-24 px-2 py-1 text-xs border border-amber-300 rounded font-mono font-bold uppercase text-center focus:ring-1 focus:ring-amber-500"
                              />
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                                {entry.kode}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono font-semibold text-blue-700">
                            {kodeList.length === 0 ? (
                              <span className="text-slate-400 font-mono text-[11px]">
                                INVNT/.../{entry.kode}.x.1/...
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                                {kodeList.map((kode, kIdx) => {
                                  const matchedItem = items.find(
                                    (it) => it.kodeBarang === kode
                                  );
                                  return matchedItem ? (
                                    <button
                                      key={kIdx}
                                      type="button"
                                      onClick={() => onOpenDetail(matchedItem)}
                                      title={`Lihat detail ${matchedItem.namaBarang}`}
                                      className="inline-block text-left px-2 py-0.5 rounded bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/70 text-[11px] w-fit whitespace-nowrap transition-colors cursor-pointer"
                                    >
                                      {kode}
                                    </button>
                                  ) : (
                                    <span
                                      key={kIdx}
                                      className="inline-block px-2 py-0.5 rounded bg-blue-50/80 text-blue-700 border border-blue-200/70 text-[11px] w-fit whitespace-nowrap"
                                    >
                                      {kode}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900">
                            {editingMasterLokasiId === entry.id ? (
                              <input
                                type="text"
                                value={editingMasterLokasiNama}
                                onChange={(e) => setEditingMasterLokasiNama(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAttemptSaveMasterLokasi(entry);
                                  } else if (e.key === "Escape") {
                                    setEditingMasterLokasiId(null);
                                  }
                                }}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                              />
                            ) : (
                              <span>{entry.nama}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                entry.count > 0
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <span>{entry.count}</span>
                              <span className="font-normal text-[11px]">Barang</span>
                            </span>
                          </td>
                          {!isDirekturUtama && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {editingMasterLokasiId === entry.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAttemptSaveMasterLokasi(entry)}
                                      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                                      title="Simpan perubahan lokasi"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMasterLokasiId(null)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                      title="Batal edit"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMasterLokasiId(entry.id);
                                        setEditingMasterLokasiKode(entry.kode);
                                        setEditingMasterLokasiNama(entry.nama);
                                      }}
                                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                                      title="Edit nama atau kode lokasi"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {isSuperAdmin && onDeleteMasterLokasi && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteMasterLokasi(entry.id)}
                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                                        title="Hapus lokasi"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Tambah Lokasi Inventory */}
          {addMasterLokasiModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setAddMasterLokasiModalOpen(false)}
            >
              <div
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Tambah Data Lokasi Inventory</h3>
                      <p className="text-[11px] text-slate-400">
                        Lokasi baru otomatis tersedia di dropdown tambah/edit barang Inventory
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddMasterLokasiModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleModalAddMasterLokasi} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Nama Lokasi Lengkap
                    </label>
                    <input
                      type="text"
                      value={modalLokasiNamaInput}
                      onChange={(e) => setModalLokasiNamaInput(e.target.value)}
                      placeholder="Contoh: Studio, Marketing, Gudang Bahan"
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Kode Lokasi (Opsional / Otomatis)
                    </label>
                    {(() => {
                      const rawNama = modalLokasiNamaInput.trim();
                      const autoKode = rawNama
                        ? resolveUniqueInventoryRoomCodes([
                            ...masterLokasi.map((l) => ({ id: l.id, kode: l.kode, nama: l.nama })),
                            { id: -1, kode: buildRoomAbbreviation(rawNama), nama: rawNama },
                          ]).find((l) => l.id === -1)?.kode || buildRoomAbbreviation(rawNama)
                        : "R.X";
                      return (
                        <>
                          <input
                            type="text"
                            value={modalLokasiKodeInput}
                            onChange={(e) => setModalLokasiKodeInput(e.target.value.toUpperCase())}
                            placeholder={
                              rawNama
                                ? `Otomatis: ${autoKode}`
                                : "Contoh: R.MG1, R.PTK, R.GBJ, R.G"
                            }
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-bold"
                          />
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Jika dikosongkan, sistem membuat otomatis:{" "}
                            <strong className="font-mono text-amber-700">{autoKode}</strong>
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddMasterLokasiModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Simpan Lokasi</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search input & Page Size Selector */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama, letak..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-2xs text-xs font-medium text-slate-700 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <span className="text-slate-400 font-normal">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="select-compact bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} baris
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && onClearAll && items.length > 0 && (
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua ({items.length})</span>
            </button>
          )}

          {!isDirekturUtama && onOpenImport && (
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}

          {!isDirekturUtama && (
            <button
              onClick={() => {
                const dataToExport =
                  selectedForPrint.size > 0
                    ? items.filter((it) => selectedForPrint.has(it.id))
                    : filteredItems;
                exportInventoryToExcel(dataToExport);
              }}
              disabled={filteredItems.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {selectedForPrint.size > 0
                  ? `Export Excel (${selectedForPrint.size})`
                  : "Export Excel"}
              </span>
            </button>
          )}

          {!isDirekturUtama && (
            <button
              onClick={() => onOpenAddNew()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>
          )}

          <button
            onClick={() =>
              onOpenPrintAll(
                selectedForPrint.size > 0 ? Array.from(selectedForPrint) : undefined
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {selectedForPrint.size > 0
                ? `Cetak Barcode Inventory (${selectedForPrint.size} Dipilih)`
                : "Cetak Barcode Inventory"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto max-w-full max-h-[calc(100vh-250px)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  NO
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  KODE BARANG
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  LOKASI
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  NAMA BARANG
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  JENIS BARANG
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap min-w-[200px] bg-slate-50">
                  TIPE/UKURAN
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  SATUAN/<br />KEMASAN<br />TERKECIL
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  JUMLAH
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  TAHUN<br />PEROLEHAN
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 text-center whitespace-nowrap min-w-[100px] bg-slate-50">
                  KONDISI
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 text-right whitespace-nowrap bg-slate-50">
                  HARGA<br />SATUAN
                </th>
                <th className="py-3 px-4 text-right bg-[#eff6ff] border-r border-slate-200 whitespace-nowrap">
                  TOTAL HARGA<br />PEROLEHAN
                </th>
                <th className="py-3 px-4 text-center border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  PEMILIKAN
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  DOKUMEN<br />GAMBAR
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap w-[180px] min-w-[160px] max-w-[200px] bg-slate-50">
                  KETERANGAN<br />(LETAK)
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap bg-slate-50">
                  <div className="inline-flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      title="Pilih semua untuk cetak barcode"
                    />
                    <span>AKSI &amp; BARCODE</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400">
                    Tidak ada barang inventory yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const totalHarga = getInventoryTotalHarga(item);
                  const pemilik = getInventoryPemilik(item);
                  const pemilikUpper = pemilik.toUpperCase();
                  const customBadgePalette = [
                    "bg-purple-100 text-purple-800 border-purple-300",
                    "bg-pink-100 text-pink-800 border-pink-300",
                    "bg-cyan-100 text-cyan-800 border-cyan-300",
                    "bg-indigo-100 text-indigo-800 border-indigo-300",
                    "bg-teal-100 text-teal-800 border-teal-300",
                  ];
                  const customHash = Array.from(pemilikUpper).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
                  const pemilikBadgeClass = pemilikUpper.includes("DPM")
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : pemilikUpper.includes("BOYKE") || pemilikUpper.includes("YBD")
                    ? "bg-orange-100 text-orange-800 border-orange-300"
                    : pemilikUpper.includes("DPSA")
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : customBadgePalette[customHash % customBadgePalette.length];

                  const isCheckedForPrint = selectedForPrint.has(item.id);

                  return (
                  <tr
                    key={item.id}
                    className={`transition-colors group align-top ${
                      isCheckedForPrint ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* NO */}
                    <td className="py-3 px-3 text-center text-slate-500 font-medium border-r border-slate-100">
                      {startIndex + idx + 1}
                    </td>

                    {/* KODE BARANG */}
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700 border-r border-slate-100 whitespace-nowrap">
                      {item.kodeBarang || item.kodeBarcode}
                    </td>

                    {/* LOKASI */}
                    <td className="py-3 px-4 font-medium text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      {item.ruangan && item.ruangan !== "-" ? item.ruangan : "-"}
                    </td>

                    {/* NAMA BARANG */}
                    <td className="py-3 px-4 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                      {item.namaBarang}
                    </td>

                    {/* JENIS BARANG */}
                    <td className="py-3 px-4 font-medium text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      {item.jenisBarang && item.jenisBarang !== "-"
                        ? item.jenisBarang
                        : extractJenisBarangFromNama(item.namaBarang) || "-"}
                    </td>

                    {/* TIPE/UKURAN (Multiline support) */}
                    <td className="py-3 px-4 text-slate-700 border-r border-slate-100 whitespace-pre-line leading-relaxed font-normal min-w-[200px]">
                      {item.tipeUkuran || "-"}
                    </td>

                    {/* SATUAN */}
                    <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {item.satuan}
                    </td>

                    {/* JUMLAH */}
                    <td className="py-3 px-3 text-center font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      {item.jumlah}
                    </td>

                    {/* TAHUN PEROLEHAN (Multiline support) */}
                    <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-100 whitespace-pre-line leading-relaxed">
                      {item.tahunPerolehan || "-"}
                    </td>

                    {/* KONDISI (Multiline stacked support to align with Tipe/Ukuran & Tahun) */}
                    <td className="py-3 px-4 text-center border-r border-slate-100 whitespace-pre-line leading-relaxed min-w-[100px]">
                      <div className="flex flex-col items-center gap-0.5">
                        {(item.kondisi || "-").split("\n").map((k, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              k.trim().toLowerCase().includes("rusak")
                                ? "bg-rose-100 text-rose-700"
                                : k.trim() === "-"
                                ? "text-slate-400"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* HARGA SATUAN (Supports multiline component prices or single value) */}
                    <td className="py-3 px-4 text-right text-slate-700 border-r border-slate-100 leading-relaxed font-medium">
                      {item.hargaSatuanText && item.hargaSatuanText !== "-" ? (
                        <div className="flex flex-col items-end gap-0.5">
                          {item.hargaSatuanText
                            .split(/\r?\n/)
                            .flatMap((line) => {
                              const trimmed = line.trim();
                              const mergedMatch = trimmed.match(/^(?:Rp\s*)?(\d{1,3}\.\d{3}\.000)\.(\d{1,3}\.000)$/i);
                              if (mergedMatch) {
                                return [`Rp ${mergedMatch[1]}`, `Rp ${mergedMatch[2]}`];
                              }
                              if (!trimmed) return [];
                              return [/^rp/i.test(trimmed) || trimmed === "-" ? trimmed : `Rp ${trimmed}`];
                            })
                            .map((hLine, i) => (
                              <span key={i} className="whitespace-nowrap">
                                {hLine}
                              </span>
                            ))}
                        </div>
                      ) : item.hargaSatuan > 0 ? (
                        <span className="whitespace-nowrap">{formatRupiah(item.hargaSatuan)}</span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* TOTAL HARGA PEROLEHAN (Single Unified Column) */}
                    <td className="py-3 px-4 text-right bg-blue-50/20 border-r border-slate-100 font-bold text-slate-900 whitespace-nowrap">
                      {totalHarga > 0 ? formatRupiah(totalHarga) : "-"}
                    </td>

                    {/* PEMILIKAN */}
                    <td className="py-3 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold border ${pemilikBadgeClass}`}
                      >
                        {pemilik}
                      </span>
                    </td>

                    {/* DOKUMEN GAMBAR */}
                    <td className="py-3 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                      {item.dokumenGambar && formatImageDisplayUrl(item.dokumenGambar) ? (
                        <img
                          src={formatImageDisplayUrl(item.dokumenGambar)}
                          alt={item.namaBarang}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleGoogleDriveImageError(e, item.dokumenGambar)}
                          className="w-9 h-9 rounded-md object-cover inline-block border border-slate-200 shadow-2xs cursor-pointer hover:scale-110 transition-transform bg-slate-50"
                          onClick={() =>
                            setPreviewImage({
                              url: item.dokumenGambar!,
                              namaBarang: item.namaBarang || "-",
                              kodeBarang: item.kodeBarang || item.kodeBarcode || "-",
                              ruangan: item.ruangan && item.ruangan !== "-" ? item.ruangan : undefined,
                              pemilik,
                            })
                          }
                          title="Klik untuk melihat dokumen gambar"
                        />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* KETERANGAN (LETAK) */}
                    <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-100 w-[180px] min-w-[160px] max-w-[200px] whitespace-pre-wrap break-words leading-relaxed">
                      {item.keterangan || "-"}
                    </td>

                    {/* AKSI & BARCODE */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Checkbox to select for printing barcode */}
                        <label
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isCheckedForPrint
                              ? "bg-emerald-50 border-emerald-400"
                              : "bg-white hover:bg-slate-100 border-slate-200"
                          }`}
                          title="Centang untuk cetak barcode barang ini"
                        >
                          <input
                            type="checkbox"
                            checked={isCheckedForPrint}
                            onChange={() => toggleSelectForPrint(item.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </label>

                        {/* QR Code Icon Button */}
                        <div
                          onClick={() => onOpenPrintAll([item.id])}
                          className="cursor-pointer p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 transition-colors text-slate-700"
                          title="Buka & Cetak Barcode"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </div>

                        {/* Detail Button */}
                        <button
                          onClick={() => onOpenDetail(item)}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Detail Data"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {/* Edit Button */}
                        {!isDirekturUtama && onEditItem && (
                          <button
                            onClick={() => onEditItem(item)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold text-xs px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-colors cursor-pointer"
                            title="Edit Barang"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Edit</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        {isSuperAdmin && onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-xs p-1.5 rounded-lg hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Menampilkan{" "}
              <strong className="text-slate-900">
                {totalItems === 0 ? 0 : startIndex + 1}
              </strong>
              {" – "}
              <strong className="text-slate-900">{endIndex}</strong> dari{" "}
              <strong className="text-slate-900">{totalItems}</strong> data inventory
            </span>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <span className="text-slate-400">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="select-compact bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-semibold">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(Number(p))}
                    className={`min-w-[30px] h-[30px] px-2 rounded-lg font-bold transition-all cursor-pointer ${
                      safeCurrentPage === p
                        ? "bg-emerald-600 text-white shadow-xs border border-emerald-600"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Berikutnya"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Professional Lightbox Modal: Dokumen Gambar + Nama Barang & Kode Barang */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      Dokumen Gambar Inventory
                    </span>
                    {previewImage.ruangan && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-200">
                        <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                        {previewImage.ruangan}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                    {previewImage.namaBarang}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Bar: Nama Barang & Kode Barang */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nama Barang
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {previewImage.namaBarang}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <Tag className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kode Barang
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-700 truncate">
                    {previewImage.kodeBarang}
                  </div>
                </div>
              </div>
            </div>

            {/* Image Canvas */}
            <div className="p-5 bg-slate-100/80 flex items-center justify-center min-h-[280px] max-h-[65vh] overflow-hidden">
              <img
                src={formatImageDisplayUrl(previewImage.url)}
                alt={previewImage.namaBarang}
                referrerPolicy="no-referrer"
                onError={(e) => handleGoogleDriveImageError(e, previewImage.url)}
                className="max-w-full max-h-[58vh] w-auto h-auto object-contain rounded-2xl shadow-md bg-white border border-slate-200/80 p-1.5"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                {previewImage.pemilik && (
                  <span>
                    Pemilikan: <strong className="text-slate-800">{previewImage.pemilik}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {!previewImage.url.startsWith("data:image/") && (
                  <a
                    href={
                      extractGoogleDriveFileId(previewImage.url)
                        ? `https://drive.google.com/file/d/${extractGoogleDriveFileId(previewImage.url)}/view`
                        : previewImage.url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Gambar Asli</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
