"use client";

import React, { useState, useMemo } from "react";
import QRCode from "qrcode";
import { X, Printer, Search, CheckSquare, Square, Check, MapPin, Filter, Globe, Link2, ExternalLink } from "lucide-react";
import { FixAssetItem, InventoryItem, getInventoryPemilik, PRODUCTION_DOMAIN, buildScanQrUrl, User, getDivisiCompanyImage, extractItemDivisi, getCachedDivisiImages, fetchDivisiImages } from "@/lib/api";

/**
 * Generates a full, complete ISO/IEC 18004 QR Code matrix using the standard QRCode engine.
 * Automatically adapts to any string length (Version 1 to 40) with Level M error correction
 * and standard quiet-zone margin so that scanners and camera apps can read the complete data without truncation.
 */
function generateQrMatrix(text: string): { matrix: boolean[][]; size: number } {
  try {
    const cleanText = (text || "-").trim() || "-";
    const qr = QRCode.create(cleanText, { errorCorrectionLevel: "M" });
    const rawSize = qr.modules.size;
    const margin = 1;
    const fullSize = rawSize + margin * 2;
    const rows: boolean[][] = [];
    for (let r = 0; r < fullSize; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < fullSize; c++) {
        if (r < margin || r >= rawSize + margin || c < margin || c >= rawSize + margin) {
          row.push(false);
        } else {
          row.push(Boolean(qr.modules.get(r - margin, c - margin)));
        }
      }
      rows.push(row);
    }
    return { matrix: rows, size: fullSize };
  } catch (err) {
    console.error("Failed to generate QR Code matrix:", err);
    return { matrix: [], size: 21 };
  }
}

export const QrCodeSvg: React.FC<{ value: string; className?: string }> = ({
  value,
  className = "w-28 h-28",
}) => {
  const { matrix, size } = useMemo(() => generateQrMatrix(value || "-"), [value]);

  if (!matrix.length) return null;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000000" /> : null
        )
      )}
    </svg>
  );
};

interface PrintBarcodeModalProps {
  type: "fixAsset" | "inventory";
  fixAssets: FixAssetItem[];
  inventory: InventoryItem[];
  initialSelectedIds?: number[];
  currentUser?: User | null;
  activeDivisi?: string;
  onClose: () => void;
}

export const PrintBarcodeModal: React.FC<PrintBarcodeModalProps> = ({
  type,
  fixAssets,
  inventory,
  initialSelectedIds,
  currentUser,
  activeDivisi,
  onClose,
}) => {
  const isFix = type === "fixAsset";
  const items = isFix ? fixAssets : inventory;
  const hasInitialSelection = Boolean(initialSelectedIds && initialSelectedIds.length > 0);

  // If user checked specific items in the table, use those; otherwise select all by default
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() =>
    hasInitialSelection
      ? new Set(initialSelectedIds)
      : new Set(items.map((it) => it.id))
  );

  // When opened with table selection, adjust view to show only the selected items
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(hasInitialSelection);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("SEMUA");

  const [, setDivisiImages] = useState<Record<string, string>>(() => getCachedDivisiImages());

  React.useEffect(() => {
    setDivisiImages(getCachedDivisiImages());
    fetchDivisiImages().then((imgs) => {
      if (imgs && typeof imgs === "object") {
        setDivisiImages((prev) => ({ ...prev, ...imgs }));
      }
    });

    const handleUpdate = () => {
      setDivisiImages(getCachedDivisiImages());
    };
    window.addEventListener("dpsa_divisi_images_updated", handleUpdate);
    return () => window.removeEventListener("dpsa_divisi_images_updated", handleUpdate);
  }, []);

  // Domain selection for QR Code scan link
  const currentOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "http://localhost:3000";
  const [domainMode, setDomainMode] = useState<"current" | "production" | "custom" | "codeOnly">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dpsa_barcode_domain_mode");
      if (saved === "current" || saved === "production" || saved === "custom" || saved === "codeOnly") return saved as any;
    }
    return "production";
  });
  const [customDomainInput, setCustomDomainInput] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dpsa_barcode_custom_domain") || "";
    }
    return "";
  });

  const effectiveBaseDomain =
    domainMode === "production"
      ? PRODUCTION_DOMAIN
      : domainMode === "custom" && customDomainInput.trim()
      ? customDomainInput.trim()
      : currentOrigin;

  const handleDomainModeChange = (mode: "current" | "production" | "custom" | "codeOnly") => {
    setDomainMode(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dpsa_barcode_domain_mode", mode);
      } catch {}
    }
  };

  const getQrValueForItem = (itemCode: string) => {
    if (domainMode === "codeOnly") {
      return itemCode;
    }
    return buildScanQrUrl(itemCode, effectiveBaseDomain);
  };

  const handleCustomDomainChange = (val: string) => {
    setCustomDomainInput(val);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dpsa_barcode_custom_domain", val);
      } catch {}
    }
  };

  const getItemCode = (it: FixAssetItem | InventoryItem) =>
    isFix
      ? (it as FixAssetItem).kodeAktiva
      : (it as InventoryItem).kodeBarang || (it as InventoryItem).kodeBarcode;

  const getItemName = (it: FixAssetItem | InventoryItem) =>
    isFix ? (it as FixAssetItem).namaAktivaTetap : (it as InventoryItem).namaBarang;

  const getItemLoc = (it: FixAssetItem | InventoryItem) => {
    if (isFix) return (it as FixAssetItem).lokasi || "-";
    const inv = it as InventoryItem;
    if (inv.ruangan && inv.ruangan !== "-") return inv.ruangan;
    return inv.keterangan || "-";
  };

  const locations = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      const loc = getItemLoc(it).trim();
      if (loc && loc !== "-") set.add(loc);
    });
    return ["SEMUA", ...Array.from(set)];
  }, [items, isFix]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (showOnlySelected && !selectedIds.has(it.id)) {
        return false;
      }

      const code = (getItemCode(it) || "").toLowerCase();
      const name = (getItemName(it) || "").toLowerCase();
      const loc = getItemLoc(it);

      if (selectedLocation !== "SEMUA" && loc !== selectedLocation) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          code.includes(q) ||
          name.includes(q) ||
          loc.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [items, searchTerm, selectedLocation, isFix, showOnlySelected, selectedIds]);

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((it) => next.add(it.id));
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setShowOnlySelected(false);
  };

  const selectedCount = items.filter((it) => selectedIds.has(it.id)).length;
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((it) => selectedIds.has(it.id));

  const handlePrint = () => {
    if (selectedCount === 0) return;
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print-modal-root">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 print-modal-root">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Cetak QR Code / Barcode {isFix ? "Fix Asset" : "Inventory"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {showOnlySelected ? (
                <>
                  Menampilkan <strong className="text-emerald-700">{selectedCount}</strong> barcode
                  hasil seleksi dari tabel (siap cetak)
                </>
              ) : (
                <>
                  Klik pada kartu di bawah untuk memilih QR Code yang ingin dicetak ({" "}
                  <strong className="text-slate-900">{selectedCount}</strong> dari{" "}
                  <strong className="text-slate-900">{items.length}</strong> dipilih )
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedCount === 0}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                isFix ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Terpilih ({selectedCount})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Selection Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Room / Location Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl text-xs hover:border-slate-300 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Lokasi:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="select-compact bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* QR Code Format / Domain Target Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition-all">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-500 font-medium">Format Scan:</span>
              <select
                value={domainMode}
                onChange={(e) => handleDomainModeChange(e.target.value as any)}
                className="select-compact bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                title="Pilih format isi barcode saat discan"
              >
                <option value="production">URL Web Produksi (Kamera HP langsung buka detail)</option>
                <option value="codeOnly">Hanya Kode Barang (Cocok untuk Barcode Scanner Gun)</option>
                <option value="current">URL Web Lokal ({currentOrigin.replace(/^https?:\/\//, "")})</option>
                <option value="custom">URL Kustom Domain...</option>
              </select>
            </div>

            {domainMode === "custom" && (
              <input
                type="text"
                placeholder="https://assetinventory.dharmaputrainterior.co.id"
                value={customDomainInput}
                onChange={(e) => handleCustomDomainChange(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono w-56"
              />
            )}

            {/* Toggle Show Only Selected vs Show All */}
            <button
              type="button"
              onClick={() => setShowOnlySelected((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                showOnlySelected
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {showOnlySelected
                  ? `Tampilkan Semua Barang (${items.length})`
                  : `Hanya yang Diseleksi (${selectedCount})`}
              </span>
            </button>
          </div>

          {/* Select All / Clear Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowOnlySelected(false);
                handleSelectAllFiltered();
              }}
              disabled={allFilteredSelected && !showOnlySelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Pilih Semua</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Batal Pilih Semua</span>
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div
          id="printable-barcode-area"
          className="flex-1 p-6 overflow-y-auto bg-slate-100 print:p-0 print:bg-white"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs no-print">
              Tidak ada data barcode yang ditampilkan. Klik <strong>Tampilkan Semua Barang</strong> untuk memilih barang.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4 print:gap-3">
              {items.map((it) => {
                const isSelected = selectedIds.has(it.id);
                const isVisibleInFilter = filteredItems.some((f) => f.id === it.id);
                const code = getItemCode(it);

                // Hide on screen if filtered out; hide on print if NOT selected
                if (!isVisibleInFilter && !isSelected) return null;

                // Determine owner / allocation theme to match the reference design
                const ownerLabel = isFix
                  ? "DPSA"
                  : getInventoryPemilik(it as InventoryItem).toUpperCase();
                const isBoyke = ownerLabel.includes("BOYKE") || ownerLabel.includes("YBD");
                const isDpm = ownerLabel.includes("DPM");
                const isDpsa = ownerLabel.includes("DPSA");

                const cardThemeClass = isBoyke
                  ? "bg-[#ffebd2] border-[#f5bb82]"
                  : isDpm
                  ? "bg-[#ffe4ef] border-[#f4a6c8]"
                  : isDpsa
                  ? "bg-[#dff0ff] border-[#93c5fd]"
                  : "bg-[#ede9fe] border-[#c4b5fd]";

                const displayOwnerTitle = isBoyke
                  ? "PAK BOYKE"
                  : isDpm
                  ? "DPM"
                  : ownerLabel || "DPSA";

                return (
                  <div
                    key={it.id}
                    onClick={() => toggleItem(it.id)}
                    className={`relative ${cardThemeClass} p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-between text-center cursor-pointer select-none print-label-card ${
                      !isVisibleInFilter ? "hidden print:flex" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-slate-900/15 shadow-sm print:ring-0"
                        : "opacity-45 hover:opacity-80 no-print"
                    }`}
                  >
                    {/* Top-Left Logo (Shown for DPSA / DPM cards just like reference image) */}
                    {!isBoyke && (() => {
                      const itemDiv = extractItemDivisi(it as any);
                      const userDiv =
                        currentUser?.divisi &&
                        currentUser.divisi.toUpperCase() !== "ALL" &&
                        currentUser.divisi.toUpperCase() !== "SEMUA"
                          ? currentUser.divisi
                          : activeDivisi &&
                            activeDivisi.toUpperCase() !== "ALL" &&
                            activeDivisi.toUpperCase() !== "SEMUA"
                          ? activeDivisi
                          : itemDiv;
                      const logoSrc =
                        getDivisiCompanyImage(userDiv) ||
                        getDivisiCompanyImage(itemDiv) ||
                        "/logo-dpsa.png";

                      return (
                        <div className="absolute top-3.5 left-3.5">
                          <img
                            src={logoSrc}
                            alt="Logo"
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/logo-dpsa.png";
                            }}
                          />
                        </div>
                      );
                    })()}

                    {/* Selection Indicator Badge (Hidden when printing) */}
                    <div className="absolute top-3.5 right-3.5 no-print">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? isFix
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white/80 border-slate-300 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    {/* Top Header: Owner Title & Category Subtitle */}
                    <div className="w-full pt-0.5 pb-2 px-6 flex flex-col items-center">
                      <h5 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase leading-tight">
                        {displayOwnerTitle}
                      </h5>
                      <span className="text-[10px] font-medium text-slate-600 leading-tight mt-0.5">
                        {isFix ? "Fix Asset" : "Inventory"}
                      </span>
                    </div>

                    {/* Real QR Code inside White Rounded Card */}
                    <div className="my-1.5 p-2.5 bg-white rounded-2xl shadow-xs flex items-center justify-center">
                      <QrCodeSvg value={getQrValueForItem(code)} className="w-28 h-28" />
                    </div>

                    {/* Bottom Asset Code */}
                    <div className="w-full mt-2 pt-0.5 flex flex-col items-center">
                      <span className="font-mono font-bold text-[10px] text-slate-800 tracking-tight truncate max-w-full">
                        {code}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 no-print">
          <span className="text-xs text-slate-500">
            Menampilkan <strong>{filteredItems.length}</strong> kartu di layar •{" "}
            <strong>{selectedCount}</strong> siap dicetak
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedCount === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                isFix ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
