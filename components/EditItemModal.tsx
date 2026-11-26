"use client";

import React, { useState, useRef } from "react";
import { X, Check, Save, Edit3, Building2, Package, Upload, Link as LinkIcon, Trash2, Image as ImageIcon } from "lucide-react";
import {
  FixAssetItem,
  InventoryItem,
  formatRupiah,
  formatImageDisplayUrl,
  handleGoogleDriveImageError,
  convertImageFileToDataUrl,
  extractGoogleDriveFileId,
  MasterFixAssetTypeEntry,
  DEFAULT_FIX_ASSET_TYPES,
  getTypeBarangDefaultUmur,
  calculateFixAssetAutoValues,
  normalizeItemTypo,
  canonicalizeFixAssetJenisBarang,
  buildRoomAbbreviation,
  buildFixAssetLokasiAbbr,
  generateLocationAbbreviation,
  getInventoryPemilik,
  getFixAssetPemilik,
  getInventoryTotalHarga,
} from "@/lib/api";

interface EditItemModalProps {
  item: FixAssetItem | InventoryItem | null;
  type: "fixAsset" | "inventory";
  isOpen: boolean;
  masterTypeBarang?: MasterFixAssetTypeEntry[];
  masterLokasi?: { id: number; kode: string; nama: string }[];
  masterInventoryLokasi?: { id: number; kode: string; nama: string }[];
  existingFixAssetJenisNames?: { id: number; namaBarang: string }[];
  existingRooms?: string[];
  existingOwners?: string[];
  onAddMasterFixAssetType?: (nama: string) => void;
  onAddMasterFixAssetJenis?: (nama: string) => void;
  onAddMasterFixAssetLokasi?: (kode: string, nama: string) => void;
  onClose: () => void;
  onSaveFixAsset: (id: number, data: Partial<FixAssetItem>) => Promise<void>;
  onSaveInventory: (id: number, data: Partial<InventoryItem>) => Promise<void>;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  type,
  isOpen,
  masterTypeBarang = [],
  masterLokasi = [],
  masterInventoryLokasi = [],
  existingFixAssetJenisNames = [],
  existingRooms = [],
  existingOwners = [],
  onAddMasterFixAssetType,
  onAddMasterFixAssetJenis,
  onAddMasterFixAssetLokasi,
  onClose,
  onSaveFixAsset,
  onSaveInventory,
}) => {
  if (!isOpen || !item) return null;

  const isFix = type === "fixAsset";
  const [submitting, setSubmitting] = useState(false);

  // Fix Asset State
  const fix = isFix ? (item as FixAssetItem) : null;
  const fixTypeOptions =
    masterTypeBarang && masterTypeBarang.length > 0
      ? masterTypeBarang
      : DEFAULT_FIX_ASSET_TYPES;
  const initialFixType = fix?.typeAktiva || fixTypeOptions[0]?.nama || "PERALATAN MESIN";
  const isInitialTypeKnown = fixTypeOptions.some(
    (t) => t.nama.toLowerCase() === initialFixType.toLowerCase()
  );
  const [kodeAktiva, setKodeAktiva] = useState(fix?.kodeAktiva || "");
  const [typeAktiva, setTypeAktiva] = useState(
    isInitialTypeKnown
      ? fixTypeOptions.find((t) => t.nama.toLowerCase() === initialFixType.toLowerCase())?.nama || initialFixType
      : fixTypeOptions[0]?.nama || "PERALATAN MESIN"
  );
  const [isCustomTypeFix, setIsCustomTypeFix] = useState(!isInitialTypeKnown);
  const [customTypeFix, setCustomTypeFix] = useState(!isInitialTypeKnown ? initialFixType : "");

  const initialFixJenis = fix?.jenisBarang || "";
  const isInitialJenisKnown =
    !initialFixJenis ||
    existingFixAssetJenisNames.some(
      (j) => j.namaBarang.toLowerCase() === initialFixJenis.toLowerCase()
    );
  const [jenisBarangFix, setJenisBarangFix] = useState(
    isInitialJenisKnown
      ? existingFixAssetJenisNames.find(
          (j) => j.namaBarang.toLowerCase() === initialFixJenis.toLowerCase()
        )?.namaBarang || ""
      : ""
  );
  const [isCustomJenisFix, setIsCustomJenisFix] = useState(
    Boolean(initialFixJenis && !isInitialJenisKnown)
  );
  const [customJenisFix, setCustomJenisFix] = useState(
    initialFixJenis && !isInitialJenisKnown ? initialFixJenis : ""
  );

  const [namaAktiva, setNamaAktiva] = useState(fix?.namaAktivaTetap || "");
  const [merk, setMerk] = useState(fix?.merk || "");
  const [spesifikasi, setSpesifikasi] = useState(fix?.spesifikasi || "");
  const [satuanFix, setSatuanFix] = useState(fix?.satuan || "Unit");
  const [tglPerolehan, setTglPerolehan] = useState(fix?.tglPerolehan || "");
  const [bulan, setBulan] = useState(fix?.bulan || "NOVEMBER");
  const [tahunFix, setTahunFix] = useState(String(fix?.tahun || 2026));
  const [qtyFix, setQtyFix] = useState(String(fix?.qty || 1));
  const [hargaPerolehan, setHargaPerolehan] = useState(String(fix?.hargaPerolehan || 0));
  const [umurThn, setUmurThn] = useState(String(fix?.umurThn || 8));
  const [umurBln, setUmurBln] = useState(
    String(fix?.umurBln || (fix?.umurThn ? fix.umurThn * 12 : 96))
  );

  const initialFixLokasi = fix?.lokasi && fix.lokasi !== "-" ? fix.lokasi.trim() : "";
  const isInitialLokasiKnown =
    !initialFixLokasi ||
    masterLokasi.some((l) => l.nama.toLowerCase() === initialFixLokasi.toLowerCase());
  const [lokasiFix, setLokasiFix] = useState(
    isInitialLokasiKnown && initialFixLokasi
      ? masterLokasi.find((l) => l.nama.toLowerCase() === initialFixLokasi.toLowerCase())?.nama || initialFixLokasi
      : masterLokasi[0]?.nama || ""
  );
  const [isCustomLokasiFix, setIsCustomLokasiFix] = useState(
    Boolean(initialFixLokasi && !isInitialLokasiKnown) || (!initialFixLokasi && masterLokasi.length === 0)
  );
  const [customLokasiFix, setCustomLokasiFix] = useState(
    initialFixLokasi && !isInitialLokasiKnown ? initialFixLokasi : ""
  );
  const [keteranganFix, setKeteranganFix] = useState(fix?.keterangan || "");
  const [fotoFix, setFotoFix] = useState(fix?.foto || "");

  const initialFixPemilik = fix ? (fix.pemilik || getFixAssetPemilik(fix) || "DPSA") : "DPSA";
  const allFixOwnerOptions = Array.from(
    new Set([
      "DPSA",
      "DPM",
      "Pak Boyke",
      ...existingOwners.map((o) => o.trim()).filter(Boolean),
      initialFixPemilik,
    ].filter(Boolean))
  );
  const isInitialFixOwnerKnown = allFixOwnerOptions.includes(initialFixPemilik);
  const [pemilikFix, setPemilikFix] = useState(initialFixPemilik);
  const [isCustomFixOwner, setIsCustomFixOwner] = useState(!isInitialFixOwnerKnown);
  const [customFixOwnerInput, setCustomFixOwnerInput] = useState(
    !isInitialFixOwnerKnown ? initialFixPemilik : ""
  );
  const effectiveFixPemilik = isCustomFixOwner
    ? customFixOwnerInput.trim() || "DPSA"
    : pemilikFix || "DPSA";

  const handleFixOwnerSelect = (val: string) => {
    if (val === "CUSTOM") {
      setIsCustomFixOwner(true);
      return;
    }
    setIsCustomFixOwner(false);
    setPemilikFix(val);

    if (kodeAktiva && !kodeAktiva.startsWith("-")) {
      const upper = val.toUpperCase();
      const targetTag = upper.includes("DPM")
        ? "DPM"
        : upper.includes("BOYKE") || upper.includes("YBD")
        ? "YBD"
        : upper.includes("DPSA")
        ? "DPSA"
        : val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "DPSA";
      const parts = kodeAktiva.split("/").filter(Boolean);
      if (parts.length >= 5) {
        const curSeg = parts[4].trim();
        const divSuffix = curSeg.includes("-")
          ? curSeg.split("-").slice(1).join("-")
          : fix?.divisi || "DPSA";
        parts[4] = `${targetTag}-${divSuffix}`;
        setKodeAktiva(parts.join("/"));
      }
    }
  };

  const handleUmurThnChange = (val: string) => {
    setUmurThn(val);
    const n = Number(val);
    if (!isNaN(n) && n >= 0) {
      setUmurBln(String(n * 12));
    }
  };

  const handleUmurBlnChange = (val: string) => {
    setUmurBln(val);
    const n = Number(val);
    if (!isNaN(n) && n >= 0) {
      setUmurThn(String(Math.floor(n / 12)));
    }
  };

  const handleTglPerolehanChange = (val: string) => {
    setTglPerolehan(val);
    if (!val) return;
    if (val.includes("-")) {
      const parts = val.split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        if (y) setTahunFix(y);
        const BULAN_NAMES = [
          "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
          "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
        ];
        if (m >= 1 && m <= 12) setBulan(BULAN_NAMES[m - 1]);
      }
    } else if (val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        let y = parts[2];
        if (y.length === 2) y = `20${y}`;
        if (y) setTahunFix(y);
        const BULAN_NAMES = [
          "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
          "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
        ];
        if (m >= 1 && m <= 12) setBulan(BULAN_NAMES[m - 1]);
      }
    }
  };

  // Inventory State
  const inv = !isFix ? (item as InventoryItem) : null;
  const initialPemilik = inv ? (inv.pemilik || getInventoryPemilik(inv) || "DPSA") : "DPSA";
  const initialTotal = inv ? getInventoryTotalHarga(inv) : 0;

  const allRoomOptions = Array.from(
    new Set(
      [
        ...existingRooms,
        ...(masterInventoryLokasi || []).map((l) => l.nama),
      ]
        .map((r) => String(r || "").trim())
        .filter((r) => Boolean(r) && r !== "-")
    )
  );
  const initialRuanganInv = inv?.ruangan && inv.ruangan !== "-" ? inv.ruangan.trim() : "";
  const isInitialRoomKnown =
    !initialRuanganInv ||
    allRoomOptions.some((r) => r.toLowerCase() === initialRuanganInv.toLowerCase());

  const [kodeBarang, setKodeBarang] = useState(inv?.kodeBarang || "");
  const [ruanganInv, setRuanganInv] = useState(
    isInitialRoomKnown && initialRuanganInv
      ? allRoomOptions.find((r) => r.toLowerCase() === initialRuanganInv.toLowerCase()) || initialRuanganInv
      : allRoomOptions[0] || ""
  );
  const [isCustomRoomInv, setIsCustomRoomInv] = useState(
    Boolean(initialRuanganInv && !isInitialRoomKnown) || (!initialRuanganInv && allRoomOptions.length === 0)
  );
  const [customRoomInv, setCustomRoomInv] = useState(
    initialRuanganInv && !isInitialRoomKnown ? initialRuanganInv : ""
  );

  const [namaBarang, setNamaBarang] = useState(inv?.namaBarang || "");
  const [tipeUkuran, setTipeUkuran] = useState(inv?.tipeUkuran || "");
  const [satuanInv, setSatuanInv] = useState(inv?.satuan || "Unit");
  const [jumlahInv, setJumlahInv] = useState(String(inv?.jumlah || 1));
  const [tahunInv, setTahunInv] = useState(inv?.tahunPerolehan || "2026");

  const standardKondisiOptions = ["Baik", "Rusak Ringan", "Rusak Berat"];
  const initialKondisiInv = inv?.kondisi || "Baik";
  const isInitialKondisiKnown = standardKondisiOptions.includes(initialKondisiInv);
  const [kondisi, setKondisi] = useState(
    isInitialKondisiKnown ? initialKondisiInv : "Baik"
  );
  const [isCustomKondisiInv, setIsCustomKondisiInv] = useState(!isInitialKondisiKnown);
  const [customKondisiInv, setCustomKondisiInv] = useState(
    !isInitialKondisiKnown ? initialKondisiInv : ""
  );
  const [hargaSatuan, setHargaSatuan] = useState(String(inv?.hargaSatuan || 0));

  // Dynamic Kepemilikan & Alokasi State
  const isInitialStandard = ["DPSA", "DPM", "Pak Boyke"].includes(initialPemilik);
  const [pemilikInv, setPemilikInv] = useState(initialPemilik);
  const [isCustomOwner, setIsCustomOwner] = useState(!isInitialStandard);
  const [customOwnerInput, setCustomOwnerInput] = useState(!isInitialStandard ? initialPemilik : "");
  const [singleAmount, setSingleAmount] = useState(String(initialTotal || 0));

  const [keteranganInv, setKeteranganInv] = useState(inv?.keterangan || "");
  const [fotoInv, setFotoInv] = useState(inv?.dokumenGambar || "");

  const effectivePemilik = isCustomOwner
    ? customOwnerInput.trim() || "DPSA"
    : pemilikInv || "DPSA";

  const allOwnerOptions = Array.from(
    new Set([
      "DPSA",
      "DPM",
      "Pak Boyke",
      ...existingOwners.map((o) => o.trim()).filter(Boolean),
      initialPemilik,
    ].filter(Boolean))
  );

  const handleOwnerSelect = (val: string) => {
    if (val === "CUSTOM") {
      setIsCustomOwner(true);
      return;
    }
    setIsCustomOwner(false);
    setPemilikInv(val);

    // Auto-update prefix in kodeBarang (e.g. INVNT/DPSA/... -> INVNT/DPM/... or INVNT/YBD/...)
    if (kodeBarang && !kodeBarang.startsWith("-")) {
      const targetTag =
        val === "DPSA"
          ? "DPSA"
          : val === "DPM"
          ? "DPM"
          : val === "Pak Boyke"
          ? "YBD"
          : val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (targetTag) {
        const updated = kodeBarang.replace(/\/(DPSA|DPM|YBD|[A-Za-z0-9_-]+)\//, `/${targetTag}/`);
        if (updated !== kodeBarang) {
          setKodeBarang(updated);
        }
      }
    }
  };

  // Image Input Mode (Link GDrive/URL vs Upload Foto)
  const initialImg = isFix ? fix?.foto || "" : inv?.dokumenGambar || "";
  const [imageMode, setImageMode] = useState<"link" | "upload">(
    initialImg.startsWith("data:image/") ? "upload" : "link"
  );
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentRawImage = isFix ? fotoFix : fotoInv;
  const setCurrentRawImage = (val: string) => {
    if (isFix) setFotoFix(val);
    else setFotoInv(val);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await convertImageFileToDataUrl(file);
      setCurrentRawImage(dataUrl);
      setUploadedFileName(file.name);
    } catch (err: any) {
      alert(err.message || "Gagal memuat file gambar");
    }
  };

  const handleClearImage = () => {
    setCurrentRawImage("");
    setUploadedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resolvedImageToSave = currentRawImage.trim()
    ? currentRawImage.trim().startsWith("data:image/")
      ? currentRawImage.trim()
      : formatImageDisplayUrl(currentRawImage.trim())
    : "";

  const handleFixLokasiValueChange = (newLok: string) => {
    if (kodeAktiva && newLok.trim()) {
      const abbr = buildFixAssetLokasiAbbr(newLok.trim(), kodeAktiva, namaAktiva, masterLokasi);
      if (abbr && abbr !== "-") {
        const seqMatch = kodeAktiva.match(/\.(\d+)$/);
        const seqSuffix = seqMatch ? `.${seqMatch[1]}` : ".1";
        const updated = kodeAktiva.replace(/\/[^/]+$/, `/${abbr}${seqSuffix}`);
        if (updated !== kodeAktiva) {
          setKodeAktiva(updated);
        }
      }
    }
  };

  const handleInvRoomValueChange = (newRuang: string) => {
    if (kodeBarang && newRuang.trim()) {
      const masterMatch = (masterInventoryLokasi || []).find(
        (l) => l.nama.toLowerCase() === newRuang.trim().toLowerCase()
      );
      const abbr = masterMatch?.kode || buildRoomAbbreviation(newRuang.trim(), kodeBarang);
      if (abbr && abbr !== "-") {
        const parts = kodeBarang.split("/");
        if (parts.length >= 4) {
          const seg2 = parts[2];
          const idSeqMatch = seg2.match(/\.(\d+(?:\.\d+)*)$/);
          const idSeq = idSeqMatch ? idSeqMatch[0] : "";
          parts[2] = `${abbr}${idSeq}`;
          const updated = parts.join("/");
          if (updated !== kodeBarang) {
            setKodeBarang(updated);
          }
        } else {
          const updated = kodeBarang.replace(/\/(?:R\.-|-)\./, `/${abbr}.`);
          if (updated !== kodeBarang) {
            setKodeBarang(updated);
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isFix && fix) {
        const finalTypeFix =
          (isCustomTypeFix ? customTypeFix.trim() : typeAktiva) ||
          fixTypeOptions[0]?.nama ||
          "PERALATAN MESIN";
        if (isCustomTypeFix && customTypeFix.trim()) {
          onAddMasterFixAssetType?.(customTypeFix.trim());
        }
        const rawJenisFix = isCustomJenisFix ? customJenisFix.trim() : jenisBarangFix.trim();
        const finalJenisFix = canonicalizeFixAssetJenisBarang(rawJenisFix);
        if (finalJenisFix) {
          onAddMasterFixAssetJenis?.(finalJenisFix);
        }
        const finalLokasiFix = isCustomLokasiFix ? customLokasiFix.trim() : lokasiFix.trim();
        if (
          finalLokasiFix &&
          finalLokasiFix !== "-" &&
          !masterLokasi.some((l) => l.nama.toLowerCase() === finalLokasiFix.toLowerCase())
        ) {
          onAddMasterFixAssetLokasi?.(generateLocationAbbreviation(finalLokasiFix), finalLokasiFix);
        }

        const harga = Number(hargaPerolehan) || 0;
        const qty = Number(qtyFix) || 1;
        const total = harga * qty;
        const thn = Number(umurThn) || 0;
        const bln = Number(umurBln) || (thn > 0 ? thn * 12 : 96);
        const finalTgl = tglPerolehan.trim() || "-";
        const thnFixNum = Number(tahunFix) || 2026;

        const auto = calculateFixAssetAutoValues({
          typeAktiva: finalTypeFix,
          kodeAktiva,
          hargaPerolehan: harga,
          qty,
          totalPerolehan: total,
          umurThn: thn,
          umurBln: bln,
          tahun: thnFixNum,
          bulan,
          tglPerolehan: finalTgl,
        });

        await onSaveFixAsset(fix.id, {
          kodeAktiva,
          typeAktiva: finalTypeFix,
          jenisBarang: finalJenisFix || undefined,
          namaAktivaTetap: normalizeItemTypo(namaAktiva.trim()),
          merk,
          spesifikasi,
          satuan: satuanFix,
          tglPerolehan: finalTgl,
          bulan,
          tahun: thnFixNum,
          qty,
          hargaPerolehan: harga,
          totalPerolehan: auto.totalPerolehan,
          umurThn: auto.umurThn,
          umurBln: auto.umurBln,
          depresiasi: auto.depresiasi,
          akumulasiDepresiasi: auto.akumulasiDepresiasi,
          nilaiBuku: auto.nilaiBuku,
          tahunKe: auto.tahunKe,
          bulanKe: auto.bulanKe,
          hasilBln: auto.hasilBln,
          penyusutanBln: auto.penyusutanBln,
          fixAkumulasi: auto.fixAkumulasi,
          lokasi: finalLokasiFix || "-",
          pemilik: effectiveFixPemilik,
          keterangan: keteranganFix,
          foto: resolvedImageToSave,
        });
      } else if (!isFix && inv) {
        const finalRuanganInv = (isCustomRoomInv ? customRoomInv.trim() : ruanganInv.trim()) || "-";
        const finalKondisiInv = (isCustomKondisiInv ? customKondisiInv.trim() : kondisi) || "Baik";
        const finalTotal = Number(singleAmount) || 0;
        const upperPemilik = effectivePemilik.toUpperCase();
        const isDpm = upperPemilik.includes("DPM");
        const isBoyke = upperPemilik.includes("BOYKE") || upperPemilik.includes("YBD");

        let finalDpsa = 0;
        let finalDpm = 0;
        let finalBoyke = 0;

        if (isDpm) {
          finalDpm = finalTotal;
        } else if (isBoyke) {
          finalBoyke = finalTotal;
        } else if (upperPemilik.includes("DPSA")) {
          finalDpsa = finalTotal;
        } else {
          finalDpsa = 0;
        }

        const qtyNum = Number(jumlahInv) || 1;
        const hargaSat =
          Number(hargaSatuan) > 0
            ? Number(hargaSatuan)
            : qtyNum > 0
            ? Math.round(finalTotal / qtyNum)
            : finalTotal;

        await onSaveInventory(inv.id, {
          kodeBarang,
          ruangan: finalRuanganInv,
          namaBarang: normalizeItemTypo(namaBarang.trim()),
          tipeUkuran,
          satuan: satuanInv,
          jumlah: qtyNum,
          tahunPerolehan: tahunInv,
          kondisi: finalKondisiInv,
          hargaSatuan: hargaSat,
          totalHargaPerolehan: finalTotal,
          pemilik: effectivePemilik,
          dpsa: finalDpsa,
          dpm: finalDpm,
          pakBoyke: finalBoyke,
          keterangan: keteranganInv,
          dokumenGambar: resolvedImageToSave,
        });
      }
      onClose();
    } catch (err: any) {
      alert("Gagal menyimpan perubahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${isFix ? "bg-blue-600" : "bg-emerald-600"}`}>
              {isFix ? <Building2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <span>Edit {isFix ? "Fix Asset" : "Barang Inventory"}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono">
                  #{item.id}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {isFix ? fix?.kodeAktiva : inv?.kodeBarang}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {isFix ? (
            <>
              {/* Row 1: Kode & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={kodeAktiva}
                    onChange={(e) => setKodeAktiva(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type Barang
                  </label>
                  <select
                    value={isCustomTypeFix ? "CUSTOM" : typeAktiva}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomTypeFix(true);
                      } else {
                        setIsCustomTypeFix(false);
                        const sel = e.target.value;
                        setTypeAktiva(sel);
                        const rule = getTypeBarangDefaultUmur(sel);
                        setUmurThn(String(rule.umurThn));
                        setUmurBln(String(rule.umurBln));
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    {fixTypeOptions.map((t) => (
                      <option key={t.kode} value={t.nama}>
                        {t.kode}: {t.nama}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Tambah Type Barang Baru...</option>
                  </select>
                  {isCustomTypeFix && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik nama type barang baru..."
                        value={customTypeFix}
                        onChange={(e) => setCustomTypeFix(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Jenis, Nama & Merk */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Barang
                  </label>
                  <select
                    value={isCustomJenisFix ? "CUSTOM" : jenisBarangFix}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomJenisFix(true);
                      } else {
                        setIsCustomJenisFix(false);
                        setJenisBarangFix(e.target.value);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="">-- Belum Dipilih --</option>
                    {existingFixAssetJenisNames.map((entry) => (
                      <option key={`${entry.id}-${entry.namaBarang}`} value={entry.namaBarang}>
                        {entry.namaBarang}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Tambah Jenis Barang Baru...</option>
                  </select>
                  {isCustomJenisFix && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik jenis barang baru (contoh: Laptop)..."
                        value={customJenisFix}
                        onChange={(e) => setCustomJenisFix(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={namaAktiva}
                    onChange={(e) => setNamaAktiva(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Spesifikasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spesifikasi Teknis
                </label>
                <textarea
                  rows={2}
                  value={spesifikasi}
                  onChange={(e) => setSpesifikasi(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Row 3: Qty, Satuan, Harga Perolehan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qtyFix}
                    onChange={(e) => setQtyFix(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={satuanFix}
                    onChange={(e) => setSatuanFix(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Perolehan (Rp)
                  </label>
                  <input
                    type="number"
                    value={hargaPerolehan}
                    onChange={(e) => setHargaPerolehan(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 3b: Kepemilikan Aset */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pemilikan (Pemilik)
                </label>
                <select
                  value={isCustomFixOwner ? "CUSTOM" : pemilikFix}
                  onChange={(e) => handleFixOwnerSelect(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
                >
                  {allFixOwnerOptions.map((o) => (
                    <option key={o} value={o}>
                      {o === "DPSA"
                        ? "DPSA (PT DPSA)"
                        : o === "DPM"
                        ? "DPM (PT DPM)"
                        : o === "Pak Boyke"
                        ? "Pak Boyke (Pribadi)"
                        : o}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Pemilik Lainnya / Kustom...</option>
                </select>
                {isCustomFixOwner && (
                  <input
                    type="text"
                    value={customFixOwnerInput}
                    onChange={(e) => setCustomFixOwnerInput(e.target.value)}
                    placeholder="Ketik nama pemilik baru..."
                    className="mt-2 w-full px-3.5 py-2 text-xs bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                )}
              </div>

              {/* Row 4: Lokasi & Tanggal Perolehan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Penempatan
                  </label>
                  <select
                    value={isCustomLokasiFix ? "CUSTOM" : lokasiFix}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "CUSTOM") {
                        setIsCustomLokasiFix(true);
                      } else {
                        setIsCustomLokasiFix(false);
                        setLokasiFix(val);
                        handleFixLokasiValueChange(val);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    {masterLokasi.map((loc) => (
                      <option key={`${loc.id}-${loc.kode}`} value={loc.nama}>
                        {loc.kode}: {loc.nama}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Tambah Lokasi Baru...</option>
                  </select>
                  {isCustomLokasiFix && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik nama lokasi baru (contoh: Workshop)..."
                        value={customLokasiFix}
                        onChange={(e) => {
                          setCustomLokasiFix(e.target.value);
                          handleFixLokasiValueChange(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Perolehan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 01/11/2026 atau 2026-11-01"
                    value={tglPerolehan}
                    onChange={(e) => handleTglPerolehanChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 5: Bulan & Tahun, Umur Thn, Umur Bln */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bulan & Tahun
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Bulan"
                      value={bulan}
                      onChange={(e) => setBulan(e.target.value)}
                      className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    <input
                      type="number"
                      placeholder="Tahun"
                      value={tahunFix}
                      onChange={(e) => setTahunFix(e.target.value)}
                      className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Umur Ekonomis (Tahun)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={umurThn}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed select-none font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    = {Number(umurThn) * 12 || 0} bulan
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Umur Ekonomis (Bulan)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={umurBln}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed select-none font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Penyusutan: {Number(umurBln) > 0 && Number(hargaPerolehan) > 0 ? formatRupiah(Math.round((Number(hargaPerolehan) * (Number(qtyFix) || 1)) / Number(umurBln))) : "Rp 0"} / bln
                  </p>
                </div>
              </div>

              {/* Keterangan Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={keteranganFix}
                  onChange={(e) => setKeteranganFix(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </>
          ) : (
            <>
              {/* Row 1: Kode Barang, Lokasi & Nama Barang */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={kodeBarang}
                    onChange={(e) => setKodeBarang(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi
                  </label>
                  <select
                    value={isCustomRoomInv ? "CUSTOM" : ruanganInv}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "CUSTOM") {
                        setIsCustomRoomInv(true);
                      } else {
                        setIsCustomRoomInv(false);
                        setRuanganInv(val);
                        handleInvRoomValueChange(val);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    {allRoomOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Tambah Lokasi Baru...</option>
                  </select>
                  {isCustomRoomInv && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik nama lokasi baru (contoh: Studio)..."
                        value={customRoomInv}
                        onChange={(e) => {
                          setCustomRoomInv(e.target.value);
                          handleInvRoomValueChange(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={namaBarang}
                    onChange={(e) => setNamaBarang(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Tipe / Ukuran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe / Ukuran / Spesifikasi Item
                </label>
                <textarea
                  rows={2}
                  value={tipeUkuran}
                  onChange={(e) => setTipeUkuran(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Row 2: Satuan, Jumlah, Kondisi, Tahun */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={satuanInv}
                    onChange={(e) => setSatuanInv(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={jumlahInv}
                    onChange={(e) => setJumlahInv(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kondisi
                  </label>
                  <select
                    value={isCustomKondisiInv ? "CUSTOM" : kondisi}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomKondisiInv(true);
                      } else {
                        setIsCustomKondisiInv(false);
                        setKondisi(e.target.value);
                      }
                    }}
                    className="w-full pl-3 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="CUSTOM">+ Kondisi Lainnya / Baru...</option>
                  </select>
                  {isCustomKondisiInv && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik kondisi baru..."
                        value={customKondisiInv}
                        onChange={(e) => setCustomKondisiInv(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun
                  </label>
                  <input
                    type="text"
                    value={tahunInv}
                    onChange={(e) => setTahunInv(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Dynamic Kepemilikan & Alokasi Biaya Perolehan */}
              <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Kepemilikan & Alokasi Biaya
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Alokasi biaya otomatis menyesuaikan entitas kepemilikan aset
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selector Kepemilikan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kepemilikan Aset
                    </label>
                    <select
                      value={isCustomOwner ? "CUSTOM" : pemilikInv}
                      onChange={(e) => handleOwnerSelect(e.target.value)}
                      className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all cursor-pointer"
                    >
                      {allOwnerOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "DPSA"
                            ? "DPSA (PT DPSA)"
                            : opt === "DPM"
                            ? "DPM (PT DPM)"
                            : opt === "Pak Boyke"
                            ? "Pak Boyke (Pribadi)"
                            : opt}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Pemilik Lainnya / Kustom...</option>
                    </select>

                    {isCustomOwner && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Ketik nama pemilik baru..."
                          value={customOwnerInput}
                          onChange={(e) => setCustomOwnerInput(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* Single Allocation Mode (Matching Kepemilikan) */}
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 mb-1 flex items-center justify-between">
                      <span>Alokasi Biaya ({effectivePemilik})</span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {formatRupiah(Number(singleAmount) || 0)}
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={singleAmount}
                        onChange={(e) => setSingleAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Letak / Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan (Letak / Pemegang)
                </label>
                <input
                  type="text"
                  value={keteranganInv}
                  onChange={(e) => setKeteranganInv(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </>
          )}

          {/* Shared Dokumen Gambar / Foto Input (Link GDrive/URL or Upload Foto) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Dokumen Gambar / Foto</span>
              </label>
              <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setImageMode("link")}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    imageMode === "link"
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Link GDrive / URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    imageMode === "upload"
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Foto</span>
                </button>
              </div>
            </div>

            {/* Hidden file input always mounted outside conditional branches to avoid React reconciliation warning */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {imageMode === "link" ? (
              <div key="image-mode-link" className="space-y-1">
                <input
                  key="input-image-link"
                  type="text"
                  placeholder="Tempel link Google Drive (https://drive.google.com/...) atau URL gambar"
                  value={currentRawImage && !currentRawImage.startsWith("data:image/") ? currentRawImage : ""}
                  onChange={(e) => {
                    setUploadedFileName("");
                    setCurrentRawImage(e.target.value || "");
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
                />
                <p className="text-[10px] text-slate-500">
                  Mendukung link Google Drive (pastikan akses link diset ke <strong>Siapa saja yang memiliki link</strong>) maupun link gambar langsung.
                </p>
              </div>
            ) : (
              <div key="image-mode-upload" className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File Foto dari Perangkat</span>
                </button>
                {(uploadedFileName || currentRawImage.startsWith("data:image/")) && (
                  <span className="text-xs text-slate-600 truncate max-w-[220px]">
                    {uploadedFileName || "Foto tersimpan (Data Image)"}
                  </span>
                )}
              </div>
            )}

            {/* Live Image Preview */}
            {resolvedImageToSave && (
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={resolvedImageToSave}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleGoogleDriveImageError(e, currentRawImage)}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-700">
                      Pratinjau Gambar Aktif
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[300px]">
                      {currentRawImage.startsWith("data:image/")
                        ? uploadedFileName || "Foto tersimpan di database"
                        : extractGoogleDriveFileId(currentRawImage)
                        ? `Google Drive ID: ${extractGoogleDriveFileId(currentRawImage)}`
                        : currentRawImage}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Gambar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isFix
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? "Menyimpan ke MySQL..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
