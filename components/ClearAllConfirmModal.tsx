"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X, Tag, MapPin, CheckSquare, Square } from "lucide-react";

interface ClearAllConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { deleteJenisBarang: boolean; deleteLokasi: boolean }) => Promise<void> | void;
  assetType: "fixAsset" | "inventory";
  itemCount: number;
  jenisCount: number;
  lokasiCount: number;
  activeDivisi: string;
}

export const ClearAllConfirmModal: React.FC<ClearAllConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  assetType,
  itemCount,
  jenisCount,
  lokasiCount,
  activeDivisi,
}) => {
  const [deleteJenisBarang, setDeleteJenisBarang] = useState(false);
  const [deleteLokasi, setDeleteLokasi] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset checkboxes when opened
  useEffect(() => {
    if (isOpen) {
      setDeleteJenisBarang(false);
      setDeleteLokasi(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFixAsset = assetType === "fixAsset";
  const titleName = isFixAsset ? "Fix Asset" : "Inventory";
  const jenisLabel = isFixAsset ? "Data Jenis Barang" : "Data Jenis Barang (Master Nama)";

  const handleExecute = async () => {
    setIsDeleting(true);
    try {
      await onConfirm({ deleteJenisBarang, deleteLokasi });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Hapus Semua Data {titleName}
              </h3>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                Konfirmasi penghapusan data masal (Super Admin)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Main Warning Box */}
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-800 text-sm">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Apakah Anda yakin ingin menghapus SEMUA data {titleName}?</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Tindakan ini akan mengosongkan{" "}
              <strong className="text-rose-700 font-bold">{itemCount} data barang</strong> {titleName} pada divisi{" "}
              <strong className="text-slate-900 font-bold">"{activeDivisi}"</strong> dari database MySQL.
            </p>
          </div>

          {/* Optional Checkboxes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Opsi Tambahan Hapus Master Data
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Bisa dicentang atau di-uncheck</span>
            </div>

            {/* Checkbox 1: Data Jenis Barang */}
            <div
              onClick={() => !isDeleting && setDeleteJenisBarang((prev) => !prev)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                deleteJenisBarang
                  ? "bg-red-50/70 border-red-300 ring-2 ring-red-500/20"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200"
              }`}
            >
              <div className="pt-0.5 text-red-600">
                {deleteJenisBarang ? (
                  <CheckSquare className="w-5 h-5 fill-red-100 text-red-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Ikut hapus {jenisLabel}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">
                    {jenisCount} jenis
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {deleteJenisBarang ? (
                    <span className="text-red-700 font-semibold">
                      ✓ Dicentang: Seluruh daftar master jenis barang divisi ini akan ikut dikosongkan.
                    </span>
                  ) : (
                    <span>Uncheck: Master jenis barang tetap disimpan dan tidak terhapus.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Checkbox 2: Data Lokasi */}
            <div
              onClick={() => !isDeleting && setDeleteLokasi((prev) => !prev)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                deleteLokasi
                  ? "bg-red-50/70 border-red-300 ring-2 ring-red-500/20"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200"
              }`}
            >
              <div className="pt-0.5 text-red-600">
                {deleteLokasi ? (
                  <CheckSquare className="w-5 h-5 fill-red-100 text-red-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Ikut hapus Data Lokasi
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">
                    {lokasiCount} lokasi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {deleteLokasi ? (
                    <span className="text-red-700 font-semibold">
                      ✓ Dicentang: Seluruh daftar master lokasi / ruangan divisi ini akan ikut dikosongkan.
                    </span>
                  ) : (
                    <span>Uncheck: Master lokasi tetap disimpan dan tidak terhapus.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-red-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "Menghapus Data..." : "Ya, Hapus Semua"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
