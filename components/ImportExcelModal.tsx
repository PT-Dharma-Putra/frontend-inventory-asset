"use client";

import React, { useState, useRef } from "react";
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
  FileText,
  Loader2,
} from "lucide-react";
import {
  FixAssetItem,
  InventoryItem,
  importFixAssets,
  importInventory,
  formatRupiah,
  formatImageDisplayUrl,
  handleGoogleDriveImageError,
  getInventoryTotalHarga,
  getInventoryPemilik,
} from "@/lib/api";
import {
  parseFixAssetExcel,
  parseInventoryExcel,
  downloadFixAssetTemplate,
  downloadInventoryTemplate,
} from "@/lib/excelHelper";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "fixAsset" | "inventory";
  existingItemNames?: { id: number; namaBarang: string }[];
  activeDivisi?: string;
  onSuccess: (count: number, importedItems?: (Partial<FixAssetItem> | Partial<InventoryItem>)[]) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  type,
  existingItemNames = [],
  activeDivisi,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fixAssetData, setFixAssetData] = useState<Partial<FixAssetItem>[]>([]);
  const [inventoryData, setInventoryData] = useState<Partial<InventoryItem>[]>([]);
  const [summary, setSummary] = useState<{ totalRows: number; totalValue: number; withImagesCount?: number } | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isFixAsset = type === "fixAsset";

  const resetState = () => {
    setFile(null);
    setFixAssetData([]);
    setInventoryData([]);
    setSummary(null);
    setError(null);
    setSheetNames([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleProcessFile = async (uploadedFile: File) => {
    setError(null);
    setParsing(true);
    setFile(uploadedFile);

    try {
      if (isFixAsset) {
        const result = await parseFixAssetExcel(uploadedFile, existingItemNames, activeDivisi);
        setFixAssetData(result.items);
        setSummary(result.summary);
        setSheetNames(result.sheetNames);
      } else {
        const result = await parseInventoryExcel(uploadedFile, existingItemNames, activeDivisi);
        setInventoryData(result.items);
        setSummary(result.summary);
        setSheetNames(result.sheetNames);
      }
    } catch (err: any) {
      console.error("Error parsing spreadsheet:", err);
      setError(err.message || "Gagal membaca berkas Excel. Pastikan format kolom sesuai template.");
      setSummary(null);
      setFixAssetData([]);
      setInventoryData([]);
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleProcessFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleProcessFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    setError(null);

    try {
      if (isFixAsset) {
        if (fixAssetData.length === 0) {
          throw new Error("Tidak ada data Fix Asset untuk disimpan.");
        }
        const res = await importFixAssets(fixAssetData, activeDivisi);
        onSuccess(res.count, fixAssetData);
        handleClose();
      } else {
        if (inventoryData.length === 0) {
          throw new Error("Tidak ada data Inventory untuk disimpan.");
        }
        const res = await importInventory(inventoryData, activeDivisi);
        onSuccess(res.count, inventoryData);
        handleClose();
      }
    } catch (err: any) {
      console.error("Error saving import to database:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan data ke database MySQL.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isFixAsset ? "bg-blue-600/10 text-blue-600" : "bg-emerald-600/10 text-emerald-600"}`}>
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Import Spreadsheet / Excel {isFixAsset ? "Fix Asset" : "Inventory"}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${isFixAsset ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                  Auto MySQL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim data massal melalui spreadsheet (.xlsx, .xls, .csv), data akan otomatis terpetakan dan tersimpan di database.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Template Download Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 border border-indigo-100 rounded-2xl">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Belum punya format tabel yang sesuai?
                </h4>
                <p className="text-[11px] text-slate-500">
                  Unduh template Excel resmi PT DPSA yang telah terisi contoh kolom dan perhitungan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={isFixAsset ? downloadFixAssetTemplate : downloadInventoryTemplate}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-indigo-50/80 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50/40 scale-[1.01]"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h4 className="text-sm font-bold text-slate-800 mb-1">
                Pilih atau Tarik File Excel / Spreadsheet ke Sini
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Mendukung format <strong className="text-slate-700">.xlsx</strong>,{" "}
                <strong className="text-slate-700">.xls</strong>, atau{" "}
                <strong className="text-slate-700">.csv</strong>. Sistem akan membaca seluruh baris dan menghitung nilai perolehan secara otomatis.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pilih Berkas dari Komputer</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{file.name}</h5>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • Sheet:{" "}
                      <span className="font-semibold text-slate-700">
                        {sheetNames[0] || "Sheet1"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetState}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-all disabled:opacity-50"
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {/* Parsing State */}
              {parsing && (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs font-medium">Menganalisis baris data spreadsheet...</p>
                </div>
              )}

              {/* Summary Stats Cards */}
              {!parsing && summary && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                      Baris Data Valid
                    </span>
                    <p className="text-xl font-extrabold text-blue-950 mt-0.5">
                      {summary.totalRows} <span className="text-xs font-normal text-blue-600">Item</span>
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                      Estimasi Total Nilai
                    </span>
                    <p className="text-lg font-extrabold text-emerald-950 mt-0.5 truncate">
                      {formatRupiah(summary.totalValue)}
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                      Gambar / Foto Excel
                    </span>
                    <p className="text-xl font-extrabold text-amber-950 mt-0.5">
                      {summary.withImagesCount || 0}{" "}
                      <span className="text-xs font-normal text-amber-700">Gambar</span>
                    </p>
                  </div>

                  <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                      Target Database
                    </span>
                    <p className="text-xs font-bold text-purple-950 mt-1 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">{isFixAsset ? "fix_assets" : "inventory_assets"}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {!parsing && (isFixAsset ? fixAssetData.length > 0 : inventoryData.length > 0) && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-500" />
                      <span>
                        Pratinjau Data Terdeteksi (Menampilkan {Math.min(10, isFixAsset ? fixAssetData.length : inventoryData.length)} dari{" "}
                        {isFixAsset ? fixAssetData.length : inventoryData.length} baris valid)
                      </span>
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid &amp; Siap Simpan</span>
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-64">
                    {isFixAsset ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                            <th className="py-2 px-3">No</th>
                            <th className="py-2 px-3">Kode Barang</th>
                            <th className="py-2 px-3">Lokasi</th>
                            <th className="py-2 px-3">Nama Barang</th>
                            <th className="py-2 px-3">Jenis Barang</th>
                            <th className="py-2 px-3">Merk</th>
                            <th className="py-2 px-3">Spesifikasi</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3 text-right">Harga Perolehan</th>
                            <th className="py-2 px-3 text-right">Total Perolehan</th>
                            <th className="py-2 px-3 text-center">Foto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {fixAssetData.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 align-top">
                              <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                                {row.kodeAktiva || "-"}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {row.lokasi && row.lokasi !== "-" ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    {row.lokasi}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {row.jenisBarang && row.jenisBarang !== "-" ? row.jenisBarang : "-"}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {row.namaAktivaTetap || "-"}
                              </td>
                              <td className="py-2 px-3 whitespace-pre-line">{row.merk || "-"}</td>
                              <td className="py-2 px-3 whitespace-pre-line min-w-[160px]">{row.spesifikasi || "-"}</td>
                              <td className="py-2 px-3 text-center font-bold">{row.qty || 1}</td>
                              <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                {row.hargaPerolehan ? formatRupiah(row.hargaPerolehan) : "-"}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                {row.totalPerolehan ? formatRupiah(row.totalPerolehan) : "-"}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {row.foto && formatImageDisplayUrl(row.foto) ? (
                                  <img
                                    src={formatImageDisplayUrl(row.foto)}
                                    alt={row.namaAktivaTetap || "Foto"}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => handleGoogleDriveImageError(e, row.foto)}
                                    className="w-8 h-8 rounded-md object-cover inline-block border border-slate-200 bg-slate-50"
                                  />
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                            <th className="py-2 px-3">No</th>
                            <th className="py-2 px-3">Kode Barang</th>
                            <th className="py-2 px-3">Lokasi</th>
                            <th className="py-2 px-3">Nama Barang</th>
                            <th className="py-2 px-3">Jenis Barang</th>
                            <th className="py-2 px-3 min-w-[180px]">Tipe / Ukuran</th>
                            <th className="py-2 px-3 text-center">Satuan</th>
                            <th className="py-2 px-3 text-center">Jumlah</th>
                            <th className="py-2 px-3 text-center">Tahun</th>
                            <th className="py-2 px-3 text-center">Kondisi</th>
                            <th className="py-2 px-3 text-right">Harga Satuan</th>
                            <th className="py-2 px-3 text-right bg-blue-50/60 text-blue-900">Total Harga Perolehan</th>
                            <th className="py-2 px-3 text-center">Pemilikan</th>
                            <th className="py-2 px-3 text-center">Gambar</th>
                            <th className="py-2 px-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {inventoryData.slice(0, 10).map((row, idx) => {
                            const totalHarga = getInventoryTotalHarga(row);
                            const pemilik = getInventoryPemilik(row);
                            const pemilikUpper = pemilik.toUpperCase();
                            const customBadgePalette = [
                              "bg-purple-100 text-purple-800 border-purple-300",
                              "bg-pink-100 text-pink-800 border-pink-300",
                              "bg-cyan-100 text-cyan-800 border-cyan-300",
                              "bg-indigo-100 text-indigo-800 border-indigo-300",
                              "bg-teal-100 text-teal-800 border-teal-300",
                            ];
                            const customHash = Array.from(pemilikUpper).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
                            const badgeClass = pemilikUpper.includes("DPM")
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : pemilikUpper.includes("BOYKE") || pemilikUpper.includes("YBD")
                              ? "bg-orange-100 text-orange-800 border-orange-300"
                              : pemilikUpper.includes("DPSA")
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : customBadgePalette[customHash % customBadgePalette.length];

                            return (
                            <tr key={idx} className="hover:bg-slate-50/60 align-top">
                              <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-600 whitespace-nowrap">
                                {row.kodeBarang || "-"}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                                {row.ruangan || "-"}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                {row.namaBarang || "-"}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                                {row.jenisBarang || "-"}
                              </td>
                              <td className="py-2 px-3 whitespace-pre-line leading-relaxed min-w-[180px]">
                                {row.tipeUkuran || "-"}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {row.satuan || "Unit"}
                              </td>
                              <td className="py-2 px-3 text-center font-bold">{row.jumlah || 1}</td>
                              <td className="py-2 px-3 text-center whitespace-pre-line leading-relaxed">
                                {row.tahunPerolehan || "-"}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-pre-line leading-relaxed">
                                {(row.kondisi || "-").split("\n").map((k, i) => (
                                  <div
                                    key={i}
                                    className={`px-2 py-0.5 my-0.5 rounded-full text-[10px] font-bold ${
                                      k.trim().toLowerCase().includes("rusak")
                                        ? "bg-rose-100 text-rose-700"
                                        : k.trim() === "-"
                                        ? "text-slate-400"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {k}
                                  </div>
                                ))}
                              </td>
                              <td className="py-2 px-3 text-right font-mono leading-relaxed">
                                {row.hargaSatuanText && row.hargaSatuanText !== "-" ? (
                                  <div className="flex flex-col items-end gap-0.5">
                                    {row.hargaSatuanText
                                      .split(/\r?\n/)
                                      .filter(Boolean)
                                      .map((hLine, i) => (
                                        <span key={i} className="whitespace-nowrap">
                                          {/^rp/i.test(hLine.trim()) ? hLine.trim() : `Rp ${hLine.trim()}`}
                                        </span>
                                      ))}
                                  </div>
                                ) : row.hargaSatuan && row.hargaSatuan > 0 ? (
                                  <span className="whitespace-nowrap">{formatRupiah(row.hargaSatuan)}</span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-blue-50/20 whitespace-nowrap">
                                {totalHarga > 0 ? formatRupiah(totalHarga) : "-"}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                                  {pemilik}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {row.dokumenGambar && formatImageDisplayUrl(row.dokumenGambar) ? (
                                  <img
                                    src={formatImageDisplayUrl(row.dokumenGambar)}
                                    alt={row.namaBarang || "Gambar"}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => handleGoogleDriveImageError(e, row.dokumenGambar)}
                                    className="w-8 h-8 rounded-md object-cover inline-block border border-slate-200 bg-slate-50"
                                  />
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 whitespace-pre-line">{row.keterangan || "-"}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Memproses Spreadsheet</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition-all disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={
              saving ||
              parsing ||
              !file ||
              (isFixAsset ? fixAssetData.length === 0 : inventoryData.length === 0)
            }
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isFixAsset
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke MySQL...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>
                  Simpan Otomatis ke Database (
                  {isFixAsset ? fixAssetData.length : inventoryData.length} Item)
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
