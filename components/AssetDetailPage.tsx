"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tag,
  Package,
  Layers,
  Sliders,
  Calendar,
  CircleDollarSign,
  MapPin,
  User as UserIcon,
  Building2,
  Info,
} from "lucide-react";
import {
  FixAssetItem,
  InventoryItem,
  formatRupiah,
  formatImageDisplayUrl,
  handleGoogleDriveImageError,
  getInventoryTotalHarga,
  getInventoryPemilik,
  extractItemDivisi,
  getDivisiCompanyImage,
  fetchDivisiImages,
} from "@/lib/api";

interface AssetDetailPageProps {
  item: FixAssetItem | InventoryItem | null;
  type: "fixAsset" | "inventory";
  scanKode?: string | null;
  isLoading?: boolean;
  onClose: () => void;
  onOpenDashboard?: () => void;
  onPrintLabel?: () => void;
}

/**
 * Format date string to short DD/MM/YY format (matching '01/07/21' in the design)
 */
function formatShortDate(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === "" || dateStr === "-") return "-";
  const clean = dateStr.trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD/MM/YY
      const yy = parts[0].slice(-2);
      const mm = parts[1].padStart(2, "0");
      const dd = parts[2].padStart(2, "0");
      return `${dd}/${mm}/${yy}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY
      const yy = parts[2].slice(-2);
      const mm = parts[1].padStart(2, "0");
      const dd = parts[0].padStart(2, "0");
      return `${dd}/${mm}/${yy}`;
    }
  }
  return clean;
}

export const AssetDetailPage: React.FC<AssetDetailPageProps> = ({
  item,
  type,
  scanKode,
  isLoading = false,
  onClose,
  onOpenDashboard,
}) => {
  const isFixAsset = type === "fixAsset";
  const fixItem = isFixAsset ? (item as FixAssetItem) : null;
  const invItem = !isFixAsset ? (item as InventoryItem) : null;

  // Determine effective division for this asset
  const itemDivisi = extractItemDivisi(item);

  // State for company picture (gambar perusahaan) per division
  const [companyImage, setCompanyImage] = useState<string>(() =>
    getDivisiCompanyImage(itemDivisi)
  );

  useEffect(() => {
    setCompanyImage(getDivisiCompanyImage(itemDivisi));
    fetchDivisiImages().then((imgs) => {
      const clean = itemDivisi.toUpperCase();
      if (imgs && imgs[clean]) {
        setCompanyImage(imgs[clean]);
      }
    });

    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.divisi === itemDivisi.toUpperCase()) {
        setCompanyImage(custom.detail.image || getDivisiCompanyImage(itemDivisi));
      }
    };
    window.addEventListener("dpsa_divisi_images_updated", handler);
    return () => window.removeEventListener("dpsa_divisi_images_updated", handler);
  }, [itemDivisi]);

  const itemCode = isFixAsset
    ? fixItem?.kodeAktiva || scanKode || "-"
    : invItem?.kodeBarang || invItem?.kodeBarcode || scanKode || "-";

  const itemName = isFixAsset
    ? fixItem?.namaAktivaTetap || "-"
    : invItem?.namaBarang || "-";

  const itemMerk = isFixAsset ? fixItem?.merk || "-" : invItem?.tipeUkuran || "-";
  const itemSpesifikasi = isFixAsset
    ? fixItem?.spesifikasi || "-"
    : invItem?.jenisBarang || "-";

  const itemDate = isFixAsset
    ? formatShortDate(fixItem?.tglPerolehan)
    : "-";

  const itemHarga = isFixAsset
    ? fixItem?.hargaPerolehan
      ? formatRupiah(fixItem.hargaPerolehan).toUpperCase()
      : "RP 0"
    : invItem
    ? formatRupiah(getInventoryTotalHarga(invItem)).toUpperCase()
    : "RP 0";

  const itemLokasi = isFixAsset
    ? fixItem?.lokasi || "-"
    : invItem?.ruangan && invItem.ruangan !== "-"
    ? invItem.ruangan
    : "-";

  const itemKeterangan = isFixAsset
    ? fixItem?.keterangan || "-"
    : invItem?.keterangan || "-";

  const itemPemilikan = isFixAsset
    ? fixItem?.pemilik || fixItem?.divisi || itemDivisi || ""
    : invItem
    ? getInventoryPemilik(invItem) || itemDivisi || ""
    : itemDivisi || "";

  const itemImage = isFixAsset ? fixItem?.foto : invItem?.dokumenGambar;

  return (
    <div className="min-h-screen bg-[#070e1e] flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-blue-500 selection:text-white print-modal-root">
      {/* Centered White Card (Design matched to screenshot) */}
      <div className="bg-white rounded-[28px] sm:rounded-[36px] md:rounded-[44px] shadow-2xl shadow-blue-950/40 w-full max-w-4xl p-6 sm:p-8 md:p-11 relative overflow-hidden border border-slate-100">
        
        {/* Top Right Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-7 sm:right-7 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer z-20 shadow-xs"
          title="Tutup &amp; Kembali ke Dashboard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Center Header Pill (Logo + Divisi / PT + System Name) */}
        <div className="flex justify-center mb-7 sm:mb-9">
          <div className="bg-[#e8f1fd] border border-[#d2e3fc] rounded-full py-2.5 px-6 sm:px-10 inline-flex items-center gap-3.5 shadow-xs">
            <img
              src={companyImage || "/logo-dpsa.png"}
              alt="Logo DPSA"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="flex flex-col text-left">
              <span className="text-[#0f3460] font-black text-lg sm:text-2xl leading-none tracking-wide">
                {itemDivisi && itemDivisi.toUpperCase() !== "DPSA"
                  ? `PT DPSA - ${itemDivisi.toUpperCase()}`
                  : "PT DPSA"}
              </span>
              <span className="text-[#1a73e8] text-[10px] sm:text-xs font-semibold tracking-wider mt-0.5">
                Asset &amp; Inventory System
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Memuat data barang ({scanKode})...</p>
          </div>
        )}

        {/* Not Found State */}
        {!isLoading && !item && (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Barang Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Kode barang <span className="font-mono font-bold text-blue-600">{scanKode || "-"}</span> tidak terdaftar di database Fix Asset maupun Inventory.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {onOpenDashboard && (
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Buka Dashboard
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* Main Content (2 Columns Grid matching screenshot) */}
        {!isLoading && item && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 lg:gap-10 items-stretch">
            
            {/* Left Column: Data Rows with Circular Badges & Dashed Sky Lines */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-2.5">
              
              {/* Row 1: Kode Aktiva / Kode Barang */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      {isFixAsset ? "Kode Aktiva" : "Kode Barang"}
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide font-mono truncate">
                      {itemCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Nama Aktiva Tetap / Nama Barang */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-amber-800" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      {isFixAsset ? "Nama Aktiva Tetap" : "Nama Barang"}
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide truncate">
                      {itemName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 3: Merk */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Merk
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {itemMerk}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 4: Spesifikasi */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Spesifikasi
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {itemSpesifikasi}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 5: Tgl Perolehan / Tgl Penyusutan */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Tgl Perolehan / Tgl Penyusutan
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {itemDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 6: Harga Perolehan */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Harga Perolehan
                    </p>
                    <p className="text-xs sm:text-sm font-black text-[#0a3622] truncate">
                      {itemHarga}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 7: Lokasi */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Lokasi
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {itemLokasi}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 8: Keterangan */}
              <div className="border-b border-dashed border-[#38bdf8] pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Keterangan
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {itemKeterangan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 9: Pemilikan / Divisi */}
              {itemPemilikan && (
                <div className="border-b border-dashed border-[#38bdf8] pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Pemilikan / Divisi
                      </p>
                      <p className="text-xs sm:text-sm font-black text-purple-900 truncate">
                        {itemPemilikan}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Asset Foto Frame + Company Building Image */}
            <div className="md:col-span-5 flex flex-col justify-between items-center sm:items-end">
              
              {/* Asset Foto Box */}
              <div className="w-full flex flex-col items-center">
                <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-2 text-center">
                  Asset Foto
                </h4>

                {/* Cyan Border Photo Container */}
                <div className="w-full max-w-[280px] sm:max-w-[310px] aspect-4/3 rounded-[24px] sm:rounded-[28px] border-[3px] border-[#38bdf8] p-3 sm:p-4 bg-white flex items-center justify-center shadow-xs relative overflow-hidden">
                  {itemImage && formatImageDisplayUrl(itemImage) ? (
                    <img
                      src={formatImageDisplayUrl(itemImage)}
                      alt={itemName}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleGoogleDriveImageError(e, itemImage)}
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  ) : (
                    /* Exact No-Photo Placeholder: Image frame + red X badge */
                    <div className="relative flex flex-col items-center justify-center">
                      <img
                        src="/no-photo-placeholder.png"
                        alt="No Image"
                        className="w-44 h-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Right: Company Logo / Gambar Perusahaan */}
              <div className="w-full flex justify-end mt-4 pt-2">
                <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-center min-w-[120px] max-w-[220px] min-h-[75px] shadow-xs">
                  <img
                    src={companyImage || "/logo-dpsa.png"}
                    alt={`Logo/Gambar Perusahaan ${itemDivisi}`}
                    className="w-28 sm:w-36 h-16 sm:h-20 object-contain transition-all"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/logo-dpsa.png";
                    }}
                  />
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
