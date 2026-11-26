"use client";

import React, { useState } from "react";
import { Search, Printer, Plus, ExternalLink, QrCode, Edit3, Trash2, FileSpreadsheet, Download, X, Check, Image as ImageIcon, Building2, Tag, Layers, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar } from "lucide-react";
import {
  FixAssetItem,
  formatRupiah,
  formatNumber,
  formatImageDisplayUrl,
  handleGoogleDriveImageError,
  extractGoogleDriveFileId,
  MasterFixAssetTypeEntry,
  MasterFixAssetLokasiEntry,
  getFixAssetPemilik,
  calculateFixAssetAutoValues,
  parseBulanPerolehan,
  User,
} from "@/lib/api";
import { exportFixAssetsToExcel } from "@/lib/excelHelper";
import { MasterNamaBarangEntry } from "@/components/InventoryView";

interface FixAssetViewProps {
  currentUser?: User | null;
  items: FixAssetItem[];
  subTab?: "list" | "jenisBarang" | "typeBarang" | "lokasi";
  onChangeSubTab?: (sub: "list" | "jenisBarang" | "typeBarang" | "lokasi") => void;
  masterJenisBarang?: MasterNamaBarangEntry[];
  onAddMasterJenisBarang?: (nama: string) => void;
  onEditMasterJenisBarang?: (targetId: number, newNama: string) => void;
  onDeleteMasterJenisBarang?: (nama: string) => void;
  onClearAllMasterJenisBarang?: () => void;
  masterTypeBarang?: MasterFixAssetTypeEntry[];
  onAddMasterTypeBarang?: (nama: string) => void;
  onEditMasterTypeBarang?: (id: number, newNama: string) => void;
  onDeleteMasterTypeBarang?: (id: number) => void;
  masterLokasi?: MasterFixAssetLokasiEntry[];
  onAddMasterLokasi?: (kode: string, nama: string) => void;
  onEditMasterLokasi?: (id: number, newKode: string, newNama: string) => void;
  onDeleteMasterLokasi?: (id: number) => void;
  onClearAllMasterLokasi?: () => void;
  onOpenDetail: (item: FixAssetItem) => void;
  onOpenPrintAll: (selectedIds?: number[]) => void;
  onOpenAddNew: () => void;
  onOpenImport?: () => void;
  onClearAll?: () => void;
  onEditItem?: (item: FixAssetItem) => void;
  onDeleteItem?: (item: FixAssetItem) => void;
}

export const FixAssetView: React.FC<FixAssetViewProps> = ({
  currentUser,
  items,
  subTab = "list",
  onChangeSubTab,
  masterJenisBarang = [],
  onAddMasterJenisBarang,
  onEditMasterJenisBarang,
  onDeleteMasterJenisBarang,
  onClearAllMasterJenisBarang,
  masterTypeBarang = [],
  onAddMasterTypeBarang,
  onEditMasterTypeBarang,
  onDeleteMasterTypeBarang,
  masterLokasi = [],
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
  const [selectedMonth, setSelectedMonth] = useState("SEMUA");
  const [selectedYear, setSelectedYear] = useState("SEMUA");
  const [customYearMode, setCustomYearMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const pageSizeOptions = [10, 25, 50, 100, 500, 1000];
  const [selectedForPrint, setSelectedForPrint] = useState<Set<number>>(new Set());

  // State for Master Jenis Barang Fix Asset Sub-Menu
  const [searchMasterJenis, setSearchMasterJenis] = useState("");
  const [newMasterJenisInput, setNewMasterJenisInput] = useState("");
  const [addMasterModalOpen, setAddMasterModalOpen] = useState(false);
  const [modalMasterJenisInput, setModalMasterJenisInput] = useState("");
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [editingMasterValue, setEditingMasterValue] = useState<string>("");

  const handleQuickAddMasterJenis = () => {
    const trimmed = newMasterJenisInput.trim();
    if (!trimmed) {
      setAddMasterModalOpen(true);
      return;
    }
    onAddMasterJenisBarang?.(trimmed);
    setNewMasterJenisInput("");
  };

  const handleModalAddMasterJenis = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modalMasterJenisInput.trim();
    if (!trimmed) return;
    onAddMasterJenisBarang?.(trimmed);
    setModalMasterJenisInput("");
    setAddMasterModalOpen(false);
  };

  const handleAttemptSaveMasterJenis = (entry: MasterNamaBarangEntry) => {
    const trimmed = editingMasterValue.trim();
    if (!trimmed || trimmed === entry.namaBarang) {
      setEditingMasterId(null);
      return;
    }

    onEditMasterJenisBarang?.(entry.id, trimmed);
    setEditingMasterId(null);
  };

  const filteredMasterEntries = React.useMemo(() => {
    const q = searchMasterJenis.trim().toLowerCase();
    if (!q) return masterJenisBarang;

    return masterJenisBarang.filter((entry) => {
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
  }, [masterJenisBarang, searchMasterJenis]);

  // State & Handlers for Master Type Barang Fix Asset Sub-Menu (PO1, PO2, PO3, PO4, ...)
  const [searchMasterType, setSearchMasterType] = useState("");
  const [newMasterTypeInput, setNewMasterTypeInput] = useState("");
  const [addMasterTypeModalOpen, setAddMasterTypeModalOpen] = useState(false);
  const [modalMasterTypeInput, setModalMasterTypeInput] = useState("");
  const [editingMasterTypeId, setEditingMasterTypeId] = useState<number | null>(null);
  const [editingMasterTypeValue, setEditingMasterTypeValue] = useState<string>("");

  const handleQuickAddMasterType = () => {
    const trimmed = newMasterTypeInput.trim();
    if (!trimmed) {
      setAddMasterTypeModalOpen(true);
      return;
    }
    onAddMasterTypeBarang?.(trimmed);
    setNewMasterTypeInput("");
  };

  const handleModalAddMasterType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modalMasterTypeInput.trim();
    if (!trimmed) return;
    onAddMasterTypeBarang?.(trimmed);
    setModalMasterTypeInput("");
    setAddMasterTypeModalOpen(false);
  };

  const handleAttemptSaveMasterType = (entry: MasterFixAssetTypeEntry) => {
    const trimmed = editingMasterTypeValue.trim();
    if (!trimmed || trimmed.toLowerCase() === entry.nama.toLowerCase()) {
      setEditingMasterTypeId(null);
      return;
    }
    onEditMasterTypeBarang?.(entry.id, trimmed);
    setEditingMasterTypeId(null);
  };

  const filteredMasterTypeEntries = React.useMemo(() => {
    const q = searchMasterType.trim().toLowerCase();
    if (!q) return masterTypeBarang;

    return masterTypeBarang.filter((entry) => {
      const matchesKode =
        entry.kode.toLowerCase().includes(q) ||
        (entry.kodeBarangList &&
          entry.kodeBarangList.some((k) => k.toLowerCase().includes(q)));

      return (
        entry.nama.toLowerCase().includes(q) ||
        String(entry.id) === q ||
        `id ${entry.id}`.includes(q) ||
        entry.kode.toLowerCase() === q ||
        matchesKode
      );
    });
  }, [masterTypeBarang, searchMasterType]);

  // State for Master Lokasi Fix Asset Sub-Menu
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
    const k = newLokasiKodeInput.trim().toUpperCase();
    const n = newLokasiNamaInput.trim();
    if (!k || !n) {
      setAddMasterLokasiModalOpen(true);
      return;
    }
    onAddMasterLokasi?.(k, n);
    setNewLokasiKodeInput("");
    setNewLokasiNamaInput("");
  };

  const handleModalAddMasterLokasi = (e: React.FormEvent) => {
    e.preventDefault();
    const k = modalLokasiKodeInput.trim().toUpperCase();
    const n = modalLokasiNamaInput.trim();
    if (!k || !n) return;
    onAddMasterLokasi?.(k, n);
    setModalLokasiKodeInput("");
    setModalLokasiNamaInput("");
    setAddMasterLokasiModalOpen(false);
  };

  const handleAttemptSaveMasterLokasi = (entry: MasterFixAssetLokasiEntry) => {
    const k = editingMasterLokasiKode.trim().toUpperCase();
    const n = editingMasterLokasiNama.trim();
    if (!k || !n) {
      setEditingMasterLokasiId(null);
      return;
    }
    if (k === entry.kode && n.toLowerCase() === entry.nama.toLowerCase()) {
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
      const matchesKode =
        entry.kode.toLowerCase().includes(q) ||
        (entry.kodeBarangList &&
          entry.kodeBarangList.some((k) => k.toLowerCase().includes(q)));

      return (
        entry.nama.toLowerCase().includes(q) ||
        String(entry.id) === q ||
        `id ${entry.id}`.includes(q) ||
        entry.kode.toLowerCase() === q ||
        matchesKode
      );
    });
  }, [masterLokasi, searchMasterLokasi]);

  const [previewImage, setPreviewImage] = useState<{
    url: string;
    namaBarang: string;
    kodeBarang: string;
    lokasi?: string;
  } | null>(null);

  const months = [
    "SEMUA",
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
  ];

  const years = [
    "SEMUA",
    ...Array.from({ length: 2050 - 2018 + 1 }, (_, i) => String(2050 - i)),
  ];

  // Periode Acuan (Cutoff / Reference Date) untuk menghitung penyusutan:
  // Dapat melihat histori masa lalu (misal: Januari 2024) atau proyeksi masa depan (misal: 2028 - 2040).
  const activeRefPeriod = React.useMemo(() => {
    const now = new Date();
    const currentActualYear = now.getFullYear();
    const currentActualMonth = now.getMonth() + 1;

    let targetYear = currentActualYear;
    let targetMonth = currentActualMonth;
    let isFiltered = false;

    if (selectedYear && selectedYear !== "SEMUA") {
      const y = parseInt(selectedYear, 10);
      if (!isNaN(y) && y > 1900) {
        targetYear = y;
        isFiltered = true;
      }
    }

    if (selectedMonth && selectedMonth !== "SEMUA") {
      const m = parseBulanPerolehan(selectedMonth);
      if (m >= 1 && m <= 12) {
        targetMonth = m;
        isFiltered = true;
      }
    } else if (selectedYear && selectedYear !== "SEMUA") {
      // Jika tahun dipilih tapi bulan SEMUA, default ke akhir tahun (Desember)
      targetMonth = 12;
    }

    return {
      year: targetYear,
      month: targetMonth,
      isFiltered,
      isFuture:
        targetYear > currentActualYear ||
        (targetYear === currentActualYear && targetMonth > currentActualMonth),
      isPast:
        targetYear < currentActualYear ||
        (targetYear === currentActualYear && targetMonth < currentActualMonth),
      isCurrent:
        targetYear === currentActualYear && targetMonth === currentActualMonth,
    };
  }, [selectedMonth, selectedYear]);

  // Recalculate auto depreciation & age values strictly according to the active reference period
  const itemsWithPeriod = React.useMemo(() => {
    return items.map((it) => {
      const auto = calculateFixAssetAutoValues(it, {
        year: activeRefPeriod.year,
        month: activeRefPeriod.month,
      });
      return {
        ...it,
        ...auto,
      };
    });
  }, [items, activeRefPeriod]);

  const filteredItems = itemsWithPeriod.filter((item) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        (item.kodeAktiva && item.kodeAktiva.toLowerCase().includes(q)) ||
        (item.namaAktivaTetap && item.namaAktivaTetap.toLowerCase().includes(q)) ||
        (item.merk && item.merk.toLowerCase().includes(q)) ||
        (item.lokasi && item.lokasi.toLowerCase().includes(q)) ||
        (getFixAssetPemilik(item).toLowerCase().includes(q)) ||
        (item.spesifikasi && item.spesifikasi.toLowerCase().includes(q)) ||
        (item.typeAktiva && item.typeAktiva.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

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

  return (
    <div className="space-y-5 max-w-full">
      {/* Sub-Menu Tabs inside Fix Asset */}
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
            <Building2 className="w-4 h-4" />
            <span>Data Fix Asset</span>
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
            onClick={() => onChangeSubTab?.("jenisBarang")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "jenisBarang"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Data Jenis Barang</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                subTab === "jenisBarang"
                  ? "bg-emerald-800/60 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {masterJenisBarang.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSubTab?.("typeBarang")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "typeBarang"
                ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Data Type Barang</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                subTab === "typeBarang"
                  ? "bg-purple-800/60 text-white"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {masterTypeBarang.length}
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
          {subTab === "jenisBarang"
            ? "Setiap jenis barang diberikan ID urut (1, 2, 3, ...) untuk dipanggil pada Kode Barang Fix Asset"
            : subTab === "typeBarang"
            ? "Setiap type barang diberikan Kode urut (PO1, PO2, PO3, PO4, ...) untuk dipanggil pada Kode Barang Fix Asset"
            : subTab === "lokasi"
            ? "Setiap lokasi memiliki Kode Lokasi (PM, P, S, KTR, ...) yang digunakan pada segmen Lokasi di Kode Barang Fix Asset"
            : "Menampilkan seluruh daftar barang Fix Asset"}
        </div>
      </div>

      {subTab === "jenisBarang" ? (
        <div className="space-y-4">
          {/* Top Bar: Search Jenis Barang / ID / Kode Barang & Quick Add Jenis Barang */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ID (1, 2, 3...), kode barang, atau jenis barang..."
                  value={searchMasterJenis}
                  onChange={(e) => setSearchMasterJenis(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hidden xl:block">
                Format Kode: <strong className="text-slate-700">FA/Tipe Barang/(ID Jenis Barang)/Bln Perolehan/DPSA/Th Perolehan/Lokasi</strong>{" "}
                <span className="text-emerald-700 font-bold">(Contoh: FA/P02/1/XI/DPSA/2026/PM.1)</span>
              </div>
            </div>

            {/* Form & Button Tambah Jenis Barang Fix Asset */}
            {!isDirekturUtama && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                  <span>Otomatis:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono">
                    ID {masterJenisBarang.length + 1}
                  </span>
                </span>
                <input
                  type="text"
                  placeholder="Ketik jenis barang baru..."
                  value={newMasterJenisInput}
                  onChange={(e) => setNewMasterJenisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newMasterJenisInput.trim()) {
                        handleQuickAddMasterJenis();
                      }
                    }
                  }}
                  className="w-52 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleQuickAddMasterJenis}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Tambahkan jenis barang Fix Asset baru"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jenis Barang</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabel Data Jenis Barang Fix Asset */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Data Jenis Barang (Fix Asset)
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {masterJenisBarang.length > 0
                        ? `${filteredMasterEntries.length} Jenis Barang (ID 1 – ${masterJenisBarang.length})`
                        : "0 Jenis Barang"}
                    </span>
                  </div>
                </div>
              </div>

              {!isDirekturUtama && (
                <div className="flex items-center gap-2">
                  {isSuperAdmin && onClearAllMasterJenisBarang && masterJenisBarang.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearAllMasterJenisBarang}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold shadow-xs transition-all cursor-pointer"
                      title="Hapus semua data jenis barang Fix Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Semua ({masterJenisBarang.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setAddMasterModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Banyak / Daftar Jenis Barang</span>
                  </button>
                </div>
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
                      JUMLAH DI FIX ASSET
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
                      <td colSpan={isDirekturUtama ? 4 : 5} className="py-12 px-4 text-center text-slate-500">
                        <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-sm text-slate-700">
                          {masterJenisBarang.length === 0
                            ? "Belum ada data Jenis Barang Fix Asset"
                            : "Tidak ada jenis barang yang sesuai pencarian"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {masterJenisBarang.length === 0
                            ? "Klik tombol \"Tambah Banyak / Daftar Jenis Barang\" di atas untuk menambahkan jenis barang baru mulai dari ID #1."
                            : "Coba gunakan kata kunci pencarian yang lain."}
                        </p>
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
                            ) : (
                              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                                {kodeList.map((kode, kIdx) => (
                                  <span
                                    key={kIdx}
                                    className="inline-block px-2 py-0.5 rounded bg-blue-50/80 text-blue-700 border border-blue-200/70 text-[11px] w-fit whitespace-nowrap"
                                  >
                                    {kode}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900">
                            {editingMasterId === entry.id ? (
                              <div className="flex flex-col gap-1.5">
                                <input
                                  type="text"
                                  value={editingMasterValue}
                                  onChange={(e) => setEditingMasterValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAttemptSaveMasterJenis(entry);
                                    } else if (e.key === "Escape") {
                                      setEditingMasterId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="w-full max-w-xs px-2.5 py-1.5 text-xs bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold text-slate-900"
                                />
                                {(() => {
                                  const trimmedVal = editingMasterValue.trim();
                                  const matchOther =
                                    trimmedVal &&
                                    masterJenisBarang.find(
                                      (other) =>
                                        other.id !== entry.id &&
                                        other.namaBarang.toLowerCase() === trimmedVal.toLowerCase()
                                    );
                                  if (!matchOther) return null;
                                  return (
                                    <div className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg max-w-xs">
                                      Jenis <strong>&quot;{matchOther.namaBarang}&quot;</strong> sudah terdaftar di <strong>ID #{matchOther.id}</strong>. Silakan gunakan nama lain.
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{entry.namaBarang}</span>
                                {entry.isCustom && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Manual
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center">
                            {entry.count > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {entry.count} Data Barang
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Belum ada barang
                              </span>
                            )}
                          </td>
                          {!isDirekturUtama && (
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                {editingMasterId === entry.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAttemptSaveMasterJenis(entry)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                      title="Simpan Perubahan Jenis Barang"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Simpan</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMasterId(null)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                      title="Batal Edit"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Batal</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMasterId(entry.id);
                                      setEditingMasterValue(entry.namaBarang);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold transition-colors cursor-pointer"
                                    title="Edit Jenis Barang"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit Jenis Barang</span>
                                  </button>
                                )}

                                {isSuperAdmin && onDeleteMasterJenisBarang && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Hapus jenis barang "${entry.namaBarang}"?`
                                        )
                                      ) {
                                        onDeleteMasterJenisBarang(entry.namaBarang);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                                    title={`Hapus jenis barang ${entry.namaBarang}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

          {/* Modal Tambah Jenis Barang Fix Asset */}
          {addMasterModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setAddMasterModalOpen(false)}
            >
              <div
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Tambah Data Jenis Barang (Fix Asset)</h3>
                      <p className="text-[11px] text-slate-300">
                        Dapat ditambahkan sebelum ada Data Fix Asset untuk pengelompokan ID
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddMasterModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleModalAddMasterJenis} className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="font-semibold text-emerald-900">
                      Mulai dari Urutan ID Berikutnya:
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold">
                      ID #{masterJenisBarang.length + 1}
                    </span>
                  </div>

                  {masterJenisBarang.length < 7 && (
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-blue-800 leading-relaxed">
                      💡 <strong>Petunjuk:</strong> Saat ini terdaftar {masterJenisBarang.length} jenis barang (ID #1 s/d #{masterJenisBarang.length}). Untuk membuat data hingga <strong>ID #7</strong>, Anda dapat memasukkan <strong>{7 - masterJenisBarang.length} jenis barang</strong> sekaligus (pisahkan per baris baru).
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Jenis Barang (Bisa 1 atau Banyak Sekaligus)
                    </label>
                    <textarea
                      rows={5}
                      value={modalMasterJenisInput}
                      onChange={(e) => setModalMasterJenisInput(e.target.value)}
                      placeholder={"Contoh (pisahkan dengan baris baru jika lebih dari satu):\nMesin Felder\nMesin CNC\nMesin Cool Press\nRuko"}
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddMasterModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Simpan Jenis Barang</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : subTab === "typeBarang" ? (
        <div className="space-y-4">
          {/* Top Bar: Search Type Barang / Kode (PO1, PO2...) & Quick Add Type Barang */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Kode (PO1, PO2...), type barang, atau kode barang..."
                  value={searchMasterType}
                  onChange={(e) => setSearchMasterType(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hidden xl:block">
                Format Kode: <strong className="text-slate-700">FA/(Kode Type Barang)/ID Jenis Barang/Bln Perolehan/DPSA/Th Perolehan/Lokasi</strong>{" "}
                <span className="text-purple-700 font-bold">(Contoh: FA/PO1/1/VII/DPSA/2021/P.1)</span>
              </div>
            </div>

            {/* Form & Button Tambah Type Barang Fix Asset */}
            {!isDirekturUtama && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] font-bold text-purple-800">
                  <span>Otomatis:</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-mono">
                    PO{masterTypeBarang.length + 1}
                  </span>
                </span>
                <input
                  type="text"
                  placeholder="Ketik type barang baru..."
                  value={newMasterTypeInput}
                  onChange={(e) => setNewMasterTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newMasterTypeInput.trim()) {
                        handleQuickAddMasterType();
                      }
                    }
                  }}
                  className="w-52 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleQuickAddMasterType}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Tambahkan type barang Fix Asset baru"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Type Barang</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabel Data Type Barang Fix Asset */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Data Type Barang (Fix Asset)
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      {masterTypeBarang.length > 0
                        ? `${filteredMasterTypeEntries.length} Type Barang (PO1 – PO${masterTypeBarang.length})`
                        : "0 Type Barang"}
                    </span>
                  </div>
                </div>
              </div>

              {!isDirekturUtama && (
                <button
                  type="button"
                  onClick={() => setAddMasterTypeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Banyak / Daftar Type Barang</span>
                </button>
              )}
            </div>

            {/* Info Aturan Otomatis Umur Type Barang */}
            <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Aturan Otomatis Umur Ekonomis:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 font-semibold text-[11px]">
                <strong>PO1</strong>: 20 Thn (240 Bln)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 font-semibold text-[11px]">
                <strong>PO2</strong>: 8 Thn (96 Bln)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 font-semibold text-[11px]">
                <strong>PO3</strong>: 4 Thn (48 Bln)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 font-semibold text-[11px]">
                <strong>PO4</strong>: 8 Thn (96 Bln)
              </span>
            </div>

            <div className="overflow-auto max-h-[calc(100vh-280px)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-28">
                      KODE / ID
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 w-72">
                      KODE BARANG
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70">
                      TYPE BARANG
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-32">
                      UMUR TAHUN
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-32">
                      UMUR BULAN
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-36">
                      STATUS
                    </th>
                    <th className="py-2.5 px-4 border-r border-slate-200/70 text-center w-48">
                      JUMLAH DI FIX ASSET
                    </th>
                    {!isDirekturUtama && (
                      <th className="py-2.5 px-4 text-center w-48">
                        AKSI
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMasterTypeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={isDirekturUtama ? 7 : 8} className="py-8 px-4 text-center text-slate-400 text-xs">
                        Belum ada data type barang Fix Asset yang sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMasterTypeEntries.map((entry) => {
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
                            <span className="inline-block px-3 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs">
                              {entry.kode}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-mono font-semibold text-blue-700">
                            {kodeList.length === 0 ? (
                              <span className="text-slate-400 font-mono text-[11px]">FA/{entry.kode}/...</span>
                            ) : (
                              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                                {kodeList.map((kode, kIdx) => (
                                  <span
                                    key={kIdx}
                                    className="inline-block px-2 py-0.5 rounded bg-blue-50/80 text-blue-700 border border-blue-200/70 text-[11px] w-fit whitespace-nowrap"
                                  >
                                    {kode}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900">
                            {editingMasterTypeId === entry.id ? (
                              <div className="flex flex-col gap-1.5">
                                <input
                                  type="text"
                                  value={editingMasterTypeValue}
                                  onChange={(e) => setEditingMasterTypeValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAttemptSaveMasterType(entry);
                                    } else if (e.key === "Escape") {
                                      setEditingMasterTypeId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="w-full max-w-xs px-2.5 py-1.5 text-xs bg-white border border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-semibold text-slate-900"
                                />
                                {(() => {
                                  const trimmedVal = editingMasterTypeValue.trim();
                                  const matchOther =
                                    trimmedVal &&
                                    masterTypeBarang.find(
                                      (other) =>
                                        other.id !== entry.id &&
                                        other.nama.toLowerCase() === trimmedVal.toLowerCase()
                                    );
                                  if (!matchOther) return null;
                                  return (
                                    <div className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg max-w-xs">
                                      Type <strong>&quot;{matchOther.nama}&quot;</strong> sudah terdaftar di <strong>{matchOther.kode}</strong>. Silakan gunakan nama lain.
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{entry.nama}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                              {entry.umurThn ?? 8} Tahun
                            </span>
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
                              {entry.umurBln ?? (entry.umurThn ? entry.umurThn * 12 : 96)} Bulan
                            </span>
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center">
                            {entry.isFixed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Tetap (Default)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Manual
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-center">
                            {entry.count > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {entry.count} Data Barang
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Belum ada barang
                              </span>
                            )}
                          </td>
                          {!isDirekturUtama && (
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                {editingMasterTypeId === entry.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAttemptSaveMasterType(entry)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                      title="Simpan Perubahan Type Barang"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Simpan</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMasterTypeId(null)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                      title="Batal Edit"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Batal</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMasterTypeId(entry.id);
                                      setEditingMasterTypeValue(entry.nama);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-colors cursor-pointer"
                                    title="Edit Type Barang"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit Type Barang</span>
                                  </button>
                                )}

                                {isSuperAdmin && !entry.isFixed && entry.count === 0 && onDeleteMasterTypeBarang && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteMasterTypeBarang(entry.id)}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                                    title="Hapus dari daftar master"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

          {/* Modal Tambah Banyak / Daftar Type Barang Fix Asset */}
          {addMasterTypeModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setAddMasterTypeModalOpen(false)}
            >
              <div
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Tambah Data Type Barang (Fix Asset)</h3>
                      <p className="text-[11px] text-slate-300">
                        Kode akan otomatis dibuat berurutan (PO1 - seterusnya)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddMasterTypeModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleModalAddMasterType} className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                    <span className="font-semibold text-purple-900">
                      Mulai dari Kode Berikutnya:
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-mono font-bold">
                      PO{masterTypeBarang.length + 1}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Nama Type Barang (Bisa 1 atau Banyak Sekaligus)
                    </label>
                    <textarea
                      rows={5}
                      value={modalMasterTypeInput}
                      onChange={(e) => setModalMasterTypeInput(e.target.value)}
                      placeholder={"Contoh (pisahkan dengan baris baru jika lebih dari satu):\nPeralatan Kantor\nElektronik\nInventaris Pabrik"}
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 font-medium leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddMasterTypeModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Simpan Type Barang</span>
                    </button>
                  </div>
                </form>
              </div>
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
                  placeholder="Cari Kode Lokasi (PM, P...), nama lokasi, atau kode barang..."
                  value={searchMasterLokasi}
                  onChange={(e) => setSearchMasterLokasi(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hidden xl:block">
                Format Kode: <strong className="text-slate-700">FA/Type/ID/Bln/DPSA/Thn/(Kode Lokasi)</strong>{" "}
                <span className="text-amber-700 font-bold">(Contoh: FA/PO2/2/VI/DPSA/2018/PM.1 atau FA/PO1/1/VII/DPSA/2021/P)</span>
              </div>
            </div>

            {/* Quick Add Form: Kode Lokasi & Nama Lokasi */}
            {!isDirekturUtama && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Kode (PM, P, S...)"
                  value={newLokasiKodeInput}
                  onChange={(e) => setNewLokasiKodeInput(e.target.value.toUpperCase())}
                  className="w-28 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Nama Lokasi (Produksi Mesin...)"
                  value={newLokasiNamaInput}
                  onChange={(e) => setNewLokasiNamaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newLokasiKodeInput.trim() && newLokasiNamaInput.trim()) {
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
                  title="Tambahkan data lokasi Fix Asset baru"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Lokasi</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabel Data Lokasi Fix Asset */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Data Lokasi (Fix Asset)
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
                      title="Hapus semua data lokasi Fix Asset"
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
                      JUMLAH DI FIX ASSET
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
                        Belum ada data lokasi Fix Asset yang sesuai filter pencarian.
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
                                className="w-20 px-2 py-1 text-xs border border-amber-300 rounded font-mono font-bold uppercase text-center focus:ring-1 focus:ring-amber-500"
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
                                FA/.../{entry.kode}.1
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                                {kodeList.map((kode, kIdx) => (
                                  <span
                                    key={kIdx}
                                    className="inline-block px-2 py-0.5 rounded bg-blue-50/80 text-blue-700 border border-blue-200/70 text-[11px] w-fit whitespace-nowrap"
                                  >
                                    {kode}
                                  </span>
                                ))}
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
                              <span className="font-normal text-[11px]">Aset</span>
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

          {/* Modal Tambah Lokasi Fix Asset */}
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
                      <h3 className="text-sm font-bold">Tambah Data Lokasi Fix Asset</h3>
                      <p className="text-[11px] text-slate-400">
                        Kode lokasi akan otomatis digunakan pada Kode Barang Fix Asset
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
                      Kode Lokasi (Singkatan)
                    </label>
                    <input
                      type="text"
                      value={modalLokasiKodeInput}
                      onChange={(e) => setModalLokasiKodeInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: PM, P, S, KTR, GDG, WHS"
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-bold"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Kode ini yang masuk ke segmen terakhir Kode Barang (misal: FA/.../<strong>PM.1</strong>).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Nama Lokasi Lengkap
                    </label>
                    <input
                      type="text"
                      value={modalLokasiNamaInput}
                      onChange={(e) => setModalLokasiNamaInput(e.target.value)}
                      placeholder="Contoh: Produksi Mesin, Purwokerto, Kantor, Gudang"
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium"
                    />
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
      {/* Filter and Action Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left Side: Search & Period */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama, merk, lokasi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Period Filter Dropdowns */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-2xs text-xs font-medium text-slate-700 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <span className="text-slate-400 font-normal">Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="select-compact bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <span className="text-slate-300">|</span>

            {customYearMode ? (
              <div className="flex items-center gap-1 bg-white pl-1.5 pr-0.5 py-0.5 rounded-lg border border-blue-400 shadow-2xs">
                <input
                  type="number"
                  min="1990"
                  max="2100"
                  placeholder="YYYY"
                  value={selectedYear === "SEMUA" ? "" : selectedYear}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setSelectedYear(val || "SEMUA");
                    setCurrentPage(1);
                  }}
                  autoFocus
                  className="w-16 text-xs font-bold text-blue-700 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  title="Kembali ke pilihan dropdown"
                  onClick={() => setCustomYearMode(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                value={years.includes(selectedYear) ? selectedYear : "KUSTOM"}
                onChange={(e) => {
                  if (e.target.value === "KUSTOM") {
                    setCustomYearMode(true);
                  } else {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="select-compact bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
                <option value="KUSTOM">
                  ✏️ {selectedYear !== "SEMUA" && !years.includes(selectedYear) ? `Tahun ${selectedYear}` : "Input Tahun Sendiri..."}
                </option>
              </select>
            )}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-2xs text-xs font-medium text-slate-700 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
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

        {/* Right Side: Actions */}
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
                exportFixAssetsToExcel(dataToExport);
              }}
              disabled={filteredItems.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
              onClick={onOpenAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang</span>
            </button>
          )}

          <button
            onClick={() =>
              onOpenPrintAll(
                selectedForPrint.size > 0 ? Array.from(selectedForPrint) : undefined
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {selectedForPrint.size > 0
                ? `Cetak Barcode Fix Asset (${selectedForPrint.size} Dipilih)`
                : "Cetak Barcode Fix Asset"}
            </span>
          </button>
        </div>
      </div>

      {/* Simulation / Reference Period Banner */}
      {activeRefPeriod.isFiltered && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-semibold ${
            activeRefPeriod.isPast
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : activeRefPeriod.isFuture
              ? "bg-indigo-50 border-indigo-200 text-indigo-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">
              {activeRefPeriod.isPast ? "⏪" : activeRefPeriod.isFuture ? "🔮" : "📅"}
            </span>
            <div>
              <span className="font-bold">
                {activeRefPeriod.isPast
                  ? "Simulasi Histori Masa Lalu"
                  : activeRefPeriod.isFuture
                  ? "Proyeksi Nilai Masa Depan"
                  : "Periode Saat Ini"}
                :
              </span>{" "}
              <span className="underline decoration-dotted font-bold">
                {selectedMonth !== "SEMUA" ? selectedMonth : "AKHIR TAHUN (DES)"}{" "}
                {activeRefPeriod.year}
              </span>
              <span className="ml-2 font-normal opacity-90">
                (Kolom Bulan Ke, Tahun Ke, Akumulasi Depresiasi, dan Nilai Buku dihitung otomatis per periode ini)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth("SEMUA");
              setSelectedYear("SEMUA");
              setCustomYearMode(false);
            }}
            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs font-bold text-[11px] cursor-pointer transition-all active:scale-95"
          >
            Reset ke Real-Time
          </button>
        </div>
      )}

      {/* Wide Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto max-w-full max-h-[calc(100vh-250px)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-3 text-center border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  NO
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  KODE BARANG
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  LOKASI
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  PEMILIKAN
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  TYPE BARANG
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  JENIS BARANG
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  NAMA BARANG
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 whitespace-nowrap bg-slate-50">
                  MERK
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 whitespace-nowrap min-w-[200px] bg-slate-50">
                  SPESIFIKASI
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  SATUAN
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  TGL PEROLEHAN<br />/ TGL
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  BULAN
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  TAHUN
                </th>
                <th className="py-3 px-2 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  QTY
                </th>
                <th className="py-3 px-4 border-r border-slate-200/70 text-right whitespace-nowrap bg-slate-50">
                  HARGA PEROLEHAN (RP)
                </th>
                {/* Yellow Highlighted Column for TOTAL PEROLEHAN (RP) */}
                <th className="py-3 px-4 border-r border-amber-200 bg-[#fef9c3] text-amber-950 font-extrabold text-right whitespace-nowrap">
                  TOTAL PEROLEHAN (RP)
                </th>
                <th
                  className="py-3 px-2 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50"
                  title="Umur Ekonomis (Tahun) mengikuti aturan PO1 (20th), PO2 (8th), PO3 (4th), PO4 (8th)"
                >
                  UMUR (THN)
                </th>
                <th
                  className="py-3 px-2 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50"
                  title="Umur Ekonomis (Bulan) mengikuti aturan PO1 (240 bln), PO2 (96 bln), PO3 (48 bln), PO4 (96 bln)"
                >
                  UMUR (BLN)
                </th>
                <th
                  className="py-3 px-3 border-r border-slate-200/70 text-right whitespace-nowrap bg-slate-50"
                  title="Depresiasi per bulan = Harga Perolehan / Umur Bulan"
                >
                  DEPRESIASI (RP)
                </th>
                <th
                  className="py-3 px-3 border-r border-slate-200/70 text-right whitespace-nowrap bg-slate-50"
                  title="Akumulasi Depresiasi = Umur Bulan Berjalan × Depresiasi"
                >
                  AKUMULASI DEPRESIASI (RP)
                </th>
                {/* Green Highlighted Column for NILAI BUKU (RP) */}
                <th
                  className="py-3 px-4 border-r border-slate-200/70 bg-[#ecfdf5] text-emerald-800 font-extrabold text-right whitespace-nowrap"
                  title="Nilai Buku = Total Perolehan - Akumulasi Depresiasi"
                >
                  NILAI BUKU (RP)
                </th>
                <th
                  className="py-3 px-2 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50"
                  title="Tahun Ke = Tahun Sekarang - Tahun Perolehan"
                >
                  TAHUN KE
                </th>
                <th
                  className="py-3 px-2 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50"
                  title="Bulan Ke = Bulan Sekarang - Bulan Perolehan"
                >
                  BULAN KE
                </th>
                <th
                  className="py-3 px-2 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50"
                  title="Hasil (Bln) = Umur Bulan Berjalan (Tahun Ke × 12 + Bulan Ke)"
                >
                  HASIL (BLN)
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-right whitespace-nowrap bg-slate-50">
                  PENYUSUTAN / BLN
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-right whitespace-nowrap bg-slate-50">
                  FIX AKUMULASI
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 whitespace-nowrap w-[180px] min-w-[160px] max-w-[200px] bg-slate-50">
                  KETERANGAN
                </th>
                <th className="py-3 px-3 border-r border-slate-200/70 text-center whitespace-nowrap bg-slate-50">
                  FOTO
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap bg-slate-50">
                  <div className="inline-flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
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
                  <td colSpan={30} className="py-12 text-center text-slate-400">
                    Tidak ada data barang yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isCheckedForPrint = selectedForPrint.has(item.id);
                  return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isCheckedForPrint ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-500 font-medium border-r border-slate-100">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700 border-r border-slate-100 whitespace-nowrap">
                      {item.kodeAktiva}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-100 whitespace-nowrap">
                      {item.lokasi && item.lokasi !== "-" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{item.lokasi}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-100 whitespace-nowrap">
                      {(() => {
                        const pem = getFixAssetPemilik(item);
                        const pUpper = pem.toUpperCase();
                        const badgeClass = pUpper.includes("DPM")
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : pUpper.includes("BOYKE") || pUpper.includes("YBD")
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200";
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badgeClass}`}>
                            {pem}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-100 whitespace-nowrap">
                      {item.typeAktiva}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.jenisBarang && item.jenisBarang !== "-" ? item.jenisBarang : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                      {item.namaAktivaTetap}
                    </td>
                    <td className="py-3 px-3 text-slate-600 border-r border-slate-100 whitespace-pre-line">
                      {item.merk || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 border-r border-slate-100 whitespace-pre-line leading-relaxed min-w-[200px]">
                      {item.spesifikasi || "-"}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-100">
                      {item.satuan}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {item.tglPerolehan}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {item.bulan}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-100">
                      {item.tahun || 0}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-800 border-r border-slate-100">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {formatRupiah(item.hargaPerolehan)}
                    </td>

                    {/* Total Perolehan (RP) with yellow background highlight */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 bg-[#fef9c3]/50 border-r border-slate-100 whitespace-nowrap">
                      {formatRupiah(item.totalPerolehan)}
                    </td>

                    <td className="py-3 px-2 text-center text-slate-700 border-r border-slate-100">
                      {item.umurThn}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-700 border-r border-slate-100">
                      {item.umurBln}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {formatRupiah(item.depresiasi)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {formatRupiah(item.akumulasiDepresiasi)}
                    </td>

                    {/* NILAI BUKU (RP) in BOLD GREEN */}
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600 bg-emerald-50/40 border-r border-slate-100 whitespace-nowrap">
                      {formatRupiah(item.nilaiBuku)}
                    </td>

                    <td className="py-3 px-2 text-center text-slate-700 border-r border-slate-100">
                      {item.tahunKe}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-700 border-r border-slate-100">
                      {item.bulanKe}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-700 border-r border-slate-100">
                      {item.hasilBln}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {formatRupiah(item.penyusutanBln)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {formatRupiah(item.fixAkumulasi)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 border-r border-slate-100 w-[180px] min-w-[160px] max-w-[200px] whitespace-pre-wrap break-words leading-relaxed">
                      {item.keterangan || "-"}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                      {item.foto && formatImageDisplayUrl(item.foto) ? (
                        <img
                          src={formatImageDisplayUrl(item.foto)}
                          alt={item.namaAktivaTetap}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleGoogleDriveImageError(e, item.foto)}
                          onClick={() =>
                            setPreviewImage({
                              url: item.foto!,
                              namaBarang: item.namaAktivaTetap || "-",
                              kodeBarang: item.kodeAktiva || "-",
                              lokasi: item.lokasi && item.lokasi !== "-" ? item.lokasi : undefined,
                            })
                          }
                          className="w-9 h-9 rounded-md object-cover inline-block border border-slate-200 shadow-2xs cursor-pointer hover:scale-110 transition-transform bg-slate-50"
                          title="Klik untuk melihat foto aktiva"
                        />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Actions & Barcode */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <label
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isCheckedForPrint
                              ? "bg-blue-50 border-blue-400"
                              : "bg-white hover:bg-slate-100 border-slate-200"
                          }`}
                          title="Centang untuk cetak barcode aktiva ini"
                        >
                          <input
                            type="checkbox"
                            checked={isCheckedForPrint}
                            onChange={() => toggleSelectForPrint(item.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </label>

                        <div
                          onClick={() => onOpenPrintAll([item.id])}
                          className="cursor-pointer p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors text-slate-700"
                          title="Buka & Cetak Barcode"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </div>

                        <button
                          onClick={() => onOpenDetail(item)}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Detail Data"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {!isDirekturUtama && onEditItem && (
                          <button
                            onClick={() => onEditItem(item)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold text-xs px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-colors cursor-pointer"
                            title="Edit Data Aktiva"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Edit</span>
                          </button>
                        )}

                        {isSuperAdmin && onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-xs p-1.5 rounded-lg hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                            title="Hapus Data Aktiva"
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
              <strong className="text-slate-900">{totalItems}</strong> data aktiva tetap
            </span>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
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
                        ? "bg-blue-600 text-white shadow-xs border border-blue-600"
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
        </>
      )}

      {/* Professional Lightbox Modal: Foto Aktiva + Nama & Kode Barang */}
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
                <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                      Dokumen Foto Fix Asset
                    </span>
                    {previewImage.lokasi && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-200">
                        <MapPin className="w-2.5 h-2.5 text-blue-400" />
                        {previewImage.lokasi}
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
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
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
            <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5">
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
      )}
    </div>
  );
};
