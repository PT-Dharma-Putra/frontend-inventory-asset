"use client";

import React from "react";
import { X, Printer, QrCode, Building2, Package, Tag, MapPin, Calendar, DollarSign, Edit3, Trash2, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";
import { FixAssetItem, InventoryItem, formatRupiah, formatImageDisplayUrl, handleGoogleDriveImageError, extractGoogleDriveFileId, getInventoryTotalHarga, getInventoryPemilik, buildScanQrUrl, User, getDivisiCompanyImage, extractItemDivisi } from "@/lib/api";
import { QrCodeSvg } from "./PrintBarcodeModal";

interface DetailModalProps {
  item: FixAssetItem | InventoryItem | null;
  type: "fixAsset" | "inventory";
  isScanView?: boolean;
  currentUser?: User | null;
  activeDivisi?: string;
  onClose: () => void;
  onEdit?: (item: FixAssetItem | InventoryItem, type: "fixAsset" | "inventory") => void;
  onDelete?: (item: FixAssetItem | InventoryItem, type: "fixAsset" | "inventory") => void;
  onOpenDashboard?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, type, isScanView = false, currentUser, activeDivisi, onClose, onEdit, onDelete, onOpenDashboard }) => {
  if (!item) return null;

  const isFixAsset = type === "fixAsset";
  const fixItem = item as FixAssetItem;
  const invItem = item as InventoryItem;

  const itemName = isFixAsset ? fixItem.namaAktivaTetap : invItem.namaBarang;
  const itemCode = isFixAsset ? fixItem.kodeAktiva : (invItem.kodeBarang || invItem.kodeBarcode);
  const itemType = isFixAsset ? fixItem.typeAktiva : invItem.tipeUkuran;
  const itemLocation = isFixAsset ? fixItem.lokasi : (invItem.ruangan && invItem.ruangan !== "-" ? invItem.ruangan : invItem.keterangan);
  const itemImage = isFixAsset ? fixItem.foto : invItem.dokumenGambar;

  const itemDivisi = extractItemDivisi(item);
  const targetDivisi =
    currentUser?.divisi &&
    currentUser.divisi.toUpperCase() !== "ALL" &&
    currentUser.divisi.toUpperCase() !== "SEMUA"
      ? currentUser.divisi
      : activeDivisi &&
        activeDivisi.toUpperCase() !== "ALL" &&
        activeDivisi.toUpperCase() !== "SEMUA"
      ? activeDivisi
      : itemDivisi;

  const stickerLogo =
    getDivisiCompanyImage(targetDivisi) ||
    getDivisiCompanyImage(itemDivisi) ||
    "/logo-dpsa.png";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print-modal-root">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 print-modal-root">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 no-print">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl text-white ${isFixAsset ? "bg-blue-600" : "bg-emerald-600"}`}>
              {isFixAsset ? <Building2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Detail {isFixAsset ? "Fix Asset" : "Inventory"}
                </h3>
                {isScanView && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Hasil Scan QR</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">{itemCode}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner for Scan Mode */}
        {isScanView && (
          <div className="bg-emerald-50/80 border-b border-emerald-200/80 px-6 py-2.5 flex items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Aset Terdaftar &amp; Terverifikasi Resmi di Database</span>
            </div>
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print-modal-root">
          {/* Top Barcode / QR Label Preview Card */}
          <div
            id="printable-barcode-area"
            className="p-5 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 flex flex-col sm:flex-row items-center gap-6 justify-between print-label-card"
          >
            <div className="flex items-center gap-4">
              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
                <QrCodeSvg value={buildScanQrUrl(itemCode)} className="w-24 h-24" />
                <span className="text-[10px] font-mono font-bold text-slate-500 mt-1.5">
                  {itemCode}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <img
                    src={stickerLogo}
                    alt="Logo"
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/logo-dpsa.png";
                    }}
                  />
                  <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
                    PT {targetDivisi || "DPSA"} ASSET LABEL
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {itemName}
                </h4>
                <div className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                  <span className="whitespace-pre-line"><strong>Tipe:</strong> {itemType || "-"}</span>
                  <span className="whitespace-pre-line"><strong>Letak:</strong> {itemLocation || "-"}</span>
                </div>
              </div>
            </div>

            <div className="no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label</span>
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Nama Barang</div>
              <div className="text-sm font-bold text-slate-900">{itemName}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Kode Barang</div>
              <div className="text-sm font-mono font-bold text-blue-700">{itemCode}</div>
            </div>

            {isFixAsset ? (
              <>
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Jenis Barang</div>
                  <div className="text-sm font-bold text-emerald-800">{fixItem.jenisBarang || "-"}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Merk &amp; Spesifikasi</div>
                  <div className="text-xs text-slate-700 font-medium">{fixItem.merk} - {fixItem.spesifikasi || "-"}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Harga Perolehan</div>
                  <div className="text-sm font-bold text-slate-900">{formatRupiah(fixItem.hargaPerolehan)}</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-600 uppercase">Nilai Buku</div>
                  <div className="text-sm font-extrabold text-emerald-700">{formatRupiah(fixItem.nilaiBuku)}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Lokasi &amp; Keterangan</div>
                  <div className="text-xs text-slate-700 font-medium">{fixItem.lokasi || "-"} ({fixItem.keterangan || "-"})</div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Lokasi</div>
                  <div className="text-sm font-bold text-slate-900">{invItem.ruangan && invItem.ruangan !== "-" ? invItem.ruangan : "-"}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Jumlah &amp; Satuan</div>
                  <div className="text-sm font-bold text-slate-900">{invItem.jumlah} {invItem.satuan}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Kondisi</div>
                  <div className="text-xs font-semibold text-emerald-700 whitespace-pre-line">{invItem.kondisi || "-"}</div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                  <div className="text-[11px] font-semibold text-blue-600 uppercase">Total Harga Perolehan</div>
                  <div className="text-sm font-bold text-blue-800">{formatRupiah(getInventoryTotalHarga(invItem))}</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1 sm:col-span-2">
                  <div className="text-[11px] font-semibold text-amber-600 uppercase">Pemilikan</div>
                  <div className="text-sm font-bold text-amber-900">{getInventoryPemilik(invItem)}</div>
                </div>
              </>
            )}
          </div>

          {/* Photo Preview if available */}
          {itemImage && formatImageDisplayUrl(itemImage) && (
            <div className="space-y-2 no-print">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dokumen Foto / Gambar
                </div>
                {!itemImage.startsWith("data:image/") && (
                  <a
                    href={
                      extractGoogleDriveFileId(itemImage)
                        ? `https://drive.google.com/file/d/${extractGoogleDriveFileId(itemImage)}/view`
                        : itemImage
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Buka Link Gambar</span>
                  </a>
                )}
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100 flex items-center justify-center p-2">
                <img
                  src={formatImageDisplayUrl(itemImage)}
                  alt={itemName}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleGoogleDriveImageError(e, itemImage)}
                  className="max-h-60 w-auto object-contain rounded-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(item, type);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(item, type);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isScanView && onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Label</span>
            </button>
            <button
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
