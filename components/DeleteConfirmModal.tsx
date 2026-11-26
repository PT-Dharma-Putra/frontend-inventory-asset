"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { FixAssetItem, InventoryItem } from "@/lib/api";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: FixAssetItem | InventoryItem | null;
  type: "fixAsset" | "inventory";
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  type,
  onClose,
  onConfirm,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !item) return null;

  const isFix = type === "fixAsset";
  const itemName = isFix
    ? (item as FixAssetItem).namaAktivaTetap
    : (item as InventoryItem).namaBarang;
  const itemCode = isFix
    ? (item as FixAssetItem).kodeAktiva
    : (item as InventoryItem).kodeBarang;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(item.id);
      onClose();
    } catch (err: any) {
      alert("Gagal menghapus data: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-base font-bold text-slate-900">
            Hapus {isFix ? "Fix Asset" : "Barang Inventory"}?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tindakan ini akan menghapus data berikut secara permanen dari database MySQL:
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-3 space-y-1">
            <p className="text-xs font-bold text-slate-900">{itemName}</p>
            <p className="text-[11px] font-mono text-slate-500">{itemCode}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? "Menghapus..." : "Ya, Hapus Data"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
