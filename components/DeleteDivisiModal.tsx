"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X, Building2, Package, CheckSquare, Square, ShieldAlert } from "lucide-react";

interface DeleteDivisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    deleteFixAssets: boolean;
    deleteInventory: boolean;
  }) => Promise<void> | void;
  divisiName: string;
  divisiCode?: string;
  fixAssetCount?: number;
  inventoryCount?: number;
}

export const DeleteDivisiModal: React.FC<DeleteDivisiModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  divisiName,
  divisiCode,
  fixAssetCount = 0,
  inventoryCount = 0,
}) => {
  const [deleteFixAssets, setDeleteFixAssets] = useState(true);
  const [deleteInventory, setDeleteInventory] = useState(true);
  const [confirmedRisk, setConfirmedRisk] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setDeleteFixAssets(true);
      setDeleteInventory(true);
      setConfirmedRisk(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!confirmedRisk) return;
    setIsDeleting(true);
    try {
      await onConfirm({
        deleteFixAssets,
        deleteInventory,
      });
      onClose();
    } catch {
      // Handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Danger Accent */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 relative flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner shrink-0">
              <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-red-100 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <span>Super Administrator</span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight">
                Peringatan Berisiko Tinggi: Hapus Divisi / PT
              </h3>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                Konfirmasi penghapusan divisi dan data terkait
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Batal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Main Warning Box */}
          <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 text-xs text-rose-950 space-y-2">
            <div className="font-bold flex items-center gap-2 text-rose-800 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Apakah Anda yakin ingin menghapus divisi ini?</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Menghapus divisi{" "}
              <strong className="text-rose-700 font-bold underline decoration-rose-300">
                "{divisiName}" {divisiCode ? `(${divisiCode})` : ""}
              </strong>{" "}
              berpengaruh <strong>sangat berisiko</strong> karena seluruh data yang bernaung di bawah divisi ini dapat ikut terhapus dari sistem MySQL.
            </p>
            <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-rose-200/60 leading-normal">
              ℹ️ <strong>Catatan Pengguna:</strong> Akun pengguna yang sebelumnya bertugas pada divisi ini akan otomatis dialihkan ke divisi default (<em>PT Dharma Putra Sejahtera Abadi</em>).
            </p>
          </div>

          {/* Interactive Checkboxes for Related Data Deletion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Opsi Penghapusan Data Terkait
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Bisa dicentang / uncheck</span>
            </div>

            {/* Checkbox 1: Fix Asset */}
            <div
              onClick={() => !isDeleting && setDeleteFixAssets((prev) => !prev)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                deleteFixAssets
                  ? "bg-red-50/70 border-red-300 ring-2 ring-red-500/20"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200"
              }`}
            >
              <div className="pt-0.5 text-red-600 shrink-0">
                {deleteFixAssets ? (
                  <CheckSquare className="w-5 h-5 fill-red-100 text-red-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Ikut hapus semua Data Fix Asset divisi ini
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {fixAssetCount} aset
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {deleteFixAssets ? (
                    <span className="text-red-700 font-semibold">
                      ✓ Dicentang: Seluruh aktiva tetap milik divisi ini akan dibersihkan permanen dari database.
                    </span>
                  ) : (
                    <span>Uncheck: Data aktiva tetap tidak dihapus (hanya master nama divisi yang dihapus).</span>
                  )}
                </p>
              </div>
            </div>

            {/* Checkbox 2: Inventory */}
            <div
              onClick={() => !isDeleting && setDeleteInventory((prev) => !prev)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                deleteInventory
                  ? "bg-red-50/70 border-red-300 ring-2 ring-red-500/20"
                  : "bg-slate-50/80 hover:bg-slate-100/70 border-slate-200"
              }`}
            >
              <div className="pt-0.5 text-red-600 shrink-0">
                {deleteInventory ? (
                  <CheckSquare className="w-5 h-5 fill-red-100 text-red-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Ikut hapus semua Data Inventory divisi ini
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {inventoryCount} barang
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {deleteInventory ? (
                    <span className="text-red-700 font-semibold">
                      ✓ Dicentang: Seluruh barang logistik/inventaris milik divisi ini akan dibersihkan permanen.
                    </span>
                  ) : (
                    <span>Uncheck: Data inventaris tidak dihapus.</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Safety Confirmation Checkbox */}
          <div
            onClick={() => !isDeleting && setConfirmedRisk((prev) => !prev)}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 select-none ${
              confirmedRisk
                ? "bg-amber-50/80 border-amber-300 text-amber-950 font-bold"
                : "bg-slate-100/70 border-slate-200 text-slate-600"
            }`}
          >
            <div className="text-amber-600 shrink-0">
              {confirmedRisk ? (
                <CheckSquare className="w-4 h-4 fill-amber-100 text-amber-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <span className="text-xs">
              Saya memahami risiko ini dan menyetujui penghapusan divisi beserta data terkait.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!confirmedRisk || isDeleting}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
              confirmedRisk && !isDeleting
                ? "bg-red-600 hover:bg-red-700 shadow-red-500/25 cursor-pointer"
                : "bg-slate-400 cursor-not-allowed opacity-60"
            }`}
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus Divisi...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Divisi Ini</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
