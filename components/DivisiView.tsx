"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowRightCircle,
  Hash,
  Tag,
  Layers,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import {
  DivisiItem,
  User,
  FixAssetItem,
  InventoryItem,
  extractItemDivisi,
  clearAllFixAssets,
  clearAllInventory,
  addUserOption,
  updateUserOption,
  deleteUserOption,
  isAllDivisiValue,
  isDpsaDivisi,
  getCachedDivisiImages,
  fetchDivisiImages,
  saveDivisiCompanyImage,
  DEFAULT_COMPANY_BUILDING_IMAGE,
  getDivisiCode,
} from "@/lib/api";
import { DeleteDivisiModal } from "./DeleteDivisiModal";

interface DivisiViewProps {
  currentUser: User | null;
  divisiItems: DivisiItem[];
  activeDivisi: string;
  onSelectDivisi?: (divisi: string) => void;
  onRefreshOptions: () => Promise<void> | void;
  onShowToast: (msg: string) => void;
  fixAssets?: FixAssetItem[];
  inventory?: InventoryItem[];
  onDeleteDivisi?: (
    divisiName: string,
    options: { deleteFixAssets: boolean; deleteInventory: boolean }
  ) => Promise<void> | void;
}

export default function DivisiView({
  currentUser,
  divisiItems,
  activeDivisi,
  onSelectDivisi,
  onRefreshOptions,
  onShowToast,
  fixAssets = [],
  inventory = [],
  onDeleteDivisi,
}: DivisiViewProps) {
  const isSuperAdmin = currentUser?.role === "Super Admin";
  const [newDivisi, setNewDivisi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    divisiItem: DivisiItem | null;
  }>({ isOpen: false, divisiItem: null });

  // Divisi company images state & upload ref
  const [divisiImages, setDivisiImages] = useState<Record<string, string>>(() => getCachedDivisiImages());
  const [uploadingDivisi, setUploadingDivisi] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDivisiImages(getCachedDivisiImages());
    fetchDivisiImages().then((imgs) => {
      if (imgs && typeof imgs === "object") {
        setDivisiImages((prev) => ({ ...prev, ...imgs }));
      }
    });

    const handleImagesUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.divisi) {
        setDivisiImages(getCachedDivisiImages());
      }
    };
    window.addEventListener("dpsa_divisi_images_updated", handleImagesUpdate);
    return () => window.removeEventListener("dpsa_divisi_images_updated", handleImagesUpdate);
  }, []);

  const handleTriggerUpload = (divisiNama: string) => {
    setUploadingDivisi(divisiNama);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDivisi) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const updated = await saveDivisiCompanyImage(uploadingDivisi, base64);
      setDivisiImages({ ...updated });
      onShowToast(`Logo perusahaan divisi "${uploadingDivisi}" berhasil diperbarui`);
      setUploadingDivisi(null);
    };
    reader.readAsDataURL(file);
  };

  const handleResetImage = async (divisiNama: string) => {
    const updated = await saveDivisiCompanyImage(divisiNama, "");
    setDivisiImages({ ...updated });
    onShowToast(`Logo perusahaan divisi "${divisiNama}" direset ke default`);
  };

  const [editingNama, setEditingNama] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDivisi.trim().toUpperCase();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await addUserOption("divisi", trimmed);
      setNewDivisi("");
      await onRefreshOptions();
      onShowToast(`Divisi "${trimmed}" berhasil ditambahkan`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambah divisi";
      onShowToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (nama: string) => {
    setEditingNama(nama);
    setEditValue(nama);
  };

  const handleCancelEdit = () => {
    setEditingNama(null);
    setEditValue("");
  };

  const handleSaveEdit = async (oldNama: string) => {
    const trimmed = editValue.trim().toUpperCase();
    if (!trimmed || trimmed === oldNama) {
      handleCancelEdit();
      return;
    }
    setIsSubmitting(true);
    try {
      await updateUserOption("divisi", oldNama, trimmed);
      setEditingNama(null);
      setEditValue("");
      await onRefreshOptions();
      onShowToast(`Divisi "${oldNama}" diubah menjadi "${trimmed}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah divisi";
      onShowToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (item: DivisiItem) => {
    if (isDpsaDivisi(item.nama)) {
      onShowToast('Divisi utama "PT Dharma Putra Sejahtera Abadi" adalah divisi default sistem dan tidak dapat dihapus.');
      return;
    }
    setDeleteModalState({ isOpen: true, divisiItem: item });
  };

  const handleConfirmDeleteDivisi = async (options: {
    deleteFixAssets: boolean;
    deleteInventory: boolean;
  }) => {
    if (!deleteModalState.divisiItem) return;
    const item = deleteModalState.divisiItem;
    setIsSubmitting(true);
    try {
      if (onDeleteDivisi) {
        await onDeleteDivisi(item.nama, options);
      } else {
        if (options.deleteFixAssets) {
          await clearAllFixAssets(item.nama);
        }
        if (options.deleteInventory) {
          await clearAllInventory(item.nama);
        }
        await deleteUserOption("divisi", item.nama);
        if (activeDivisi.trim().toUpperCase() === item.nama.trim().toUpperCase()) {
          onSelectDivisi?.("PT Dharma Putra Sejahtera Abadi");
        }
        await onRefreshOptions();
        const extra = [
          options.deleteFixAssets ? "Data Fix Asset" : "",
          options.deleteInventory ? "Data Inventory" : "",
        ].filter(Boolean);
        const extraMsg = extra.length > 0 ? ` (beserta ${extra.join(" & ")})` : "";
        onShowToast(`Divisi "${item.nama}"${extraMsg} berhasil dihapus`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus divisi";
      onShowToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalDivisiCode = deleteModalState.divisiItem
    ? getDivisiCode(deleteModalState.divisiItem.nama)
    : "";
  const modalDivisiName = deleteModalState.divisiItem?.nama || "";

  const modalFixCount = fixAssets
    ? fixAssets.filter((it) => {
        const d = (it.divisi || extractItemDivisi(it) || "").toUpperCase();
        return (
          d === modalDivisiName.toUpperCase() ||
          d === modalDivisiCode.toUpperCase()
        );
      }).length
    : 0;

  const modalInvCount = inventory
    ? inventory.filter((it) => {
        const d = (it.divisi || extractItemDivisi(it) || "").toUpperCase();
        return (
          d === modalDivisiName.toUpperCase() ||
          d === modalDivisiCode.toUpperCase()
        );
      }).length
    : 0;

  const activeLabel = isAllDivisiValue(activeDivisi)
    ? "Semua Divisi (ALL)"
    : isDpsaDivisi(activeDivisi)
    ? "PT Dharma Putra Sejahtera Abadi"
    : activeDivisi || "PT Dharma Putra Sejahtera Abadi";

  return (
    <div className="space-y-6">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Divisi / PT Terdaftar
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {divisiItems.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Digunakan otomatis pada kode barang Fix Asset &amp; Inventory
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace Aktif Saat Ini
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 truncate">
              {activeLabel}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isSuperAdmin
                ? "Super Admin dapat berpindah workspace antar divisi"
                : "Mengikuti divisi akun yang sedang login"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Super Admin Quick-Add Bar */}
      {isSuperAdmin && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Tambah Divisi / PT Baru:</span>
          </div>
          <input
            type="text"
            value={newDivisi}
            onChange={(e) => setNewDivisi(e.target.value)}
            placeholder="Misal: DPSA, SORAJATI, KJAS..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 uppercase"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newDivisi.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Divisi</span>
          </button>
        </form>
      )}

      {/* Table of Divisions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Divisi / PT &amp; Format Kode Barang
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ID dan nama divisi ini dipanggil langsung dalam pembentukan kode
              Fix Asset dan Inventory.
            </p>
          </div>
        </div>

        {/* Hidden File Input for uploading divisi company picture */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5 w-24">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    <span>ID</span>
                  </div>
                </th>
                <th className="py-3.5 px-5">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Nama Divisi / PT</span>
                  </div>
                </th>
                <th className="py-3.5 px-5">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Logo Perusahaan</span>
                  </div>
                </th>
                <th className="py-3.5 px-5">Contoh Kode Fix Asset</th>
                <th className="py-3.5 px-5">Contoh Kode Inventory</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {divisiItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 px-6 text-center text-slate-400"
                  >
                    Belum ada divisi terdaftar.{" "}
                    {isSuperAdmin
                      ? "Tambahkan divisi baru menggunakan form di atas."
                      : "Hubungi Super Admin untuk menambahkan divisi."}
                  </td>
                </tr>
              ) : (
                divisiItems.map((item) => {
                  const cleanCode = getDivisiCode(item.nama);
                  const isActive =
                    !isAllDivisiValue(activeDivisi) &&
                    activeDivisi.trim().toUpperCase() ===
                      item.nama.trim().toUpperCase();
                  const isEditing = editingNama === item.nama;

                  return (
                    <tr
                      key={`${item.id}-${item.nama}`}
                      className={`transition-colors ${
                        isActive ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                          #{item.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-3 py-1.5 text-sm rounded-lg border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase font-semibold w-44"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.nama)}
                              disabled={isSubmitting}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-slate-900">
                                {item.nama}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono font-medium text-slate-500">
                              Kode Barang: <span className="text-blue-600 font-bold">{cleanCode}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Logo Perusahaan per Divisi */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                            <img
                              src={
                                divisiImages[item.nama.trim().toUpperCase()] ||
                                DEFAULT_COMPANY_BUILDING_IMAGE
                              }
                              alt={item.nama}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  DEFAULT_COMPANY_BUILDING_IMAGE;
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(item.nama)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 transition-colors cursor-pointer"
                              title="Upload logo perusahaan untuk divisi ini"
                            >
                              <Upload className="w-3 h-3" />
                              <span>
                                {divisiImages[item.nama.trim().toUpperCase()]
                                  ? "Ganti"
                                  : "Upload"}
                              </span>
                            </button>
                            {divisiImages[item.nama.trim().toUpperCase()] && (
                              <button
                                type="button"
                                onClick={() => handleResetImage(item.nama)}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Reset logo ke default DPSA"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Reset</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-xs text-slate-600">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100/90 border border-slate-200/70">
                          FA/PO2/2/VI/DPSA-{cleanCode}/2018/PM.1
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-xs text-slate-600">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100/90 border border-slate-200/70">
                          INVNT/DPSA-{cleanCode}/R.S.M.1.2/2024
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isSuperAdmin && onSelectDivisi && (
                            <button
                              type="button"
                              onClick={() => onSelectDivisi(item.nama)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                isActive
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              }`}
                              title="Lihat data divisi ini"
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                              <span>
                                {isActive ? "Sedang Dipilih" : "Lihat Data"}
                              </span>
                            </button>
                          )}

                          {isSuperAdmin && !isEditing && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item.nama)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Edit nama divisi"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {isDpsaDivisi(item.nama) ? (
                                <span
                                  className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed select-none opacity-40"
                                  title="Divisi default PT Dharma Putra Sejahtera Abadi tidak dapat dihapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteModal(item)}
                                  disabled={isSubmitting}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={`Hapus divisi ${item.nama}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {!isSuperAdmin && (
                            <span className="text-xs text-slate-400">
                              {isActive ? "Divisi Anda" : "Read-only"}
                            </span>
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
      </div>

      {/* Delete Divisi High-Risk Confirmation Modal */}
      <DeleteDivisiModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, divisiItem: null })}
        divisiName={modalDivisiName}
        divisiCode={modalDivisiCode}
        fixAssetCount={modalFixCount}
        inventoryCount={modalInvCount}
        onConfirm={handleConfirmDeleteDivisi}
      />
    </div>
  );
}

