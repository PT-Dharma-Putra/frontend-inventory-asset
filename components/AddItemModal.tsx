"use client";

import React, { useState, useRef } from "react";
import { X, Check, Upload, Link as LinkIcon, Trash2, Image as ImageIcon, Plus } from "lucide-react";
import {
  FixAssetItem,
  InventoryItem,
  formatRupiah,
  formatImageDisplayUrl,
  handleGoogleDriveImageError,
  convertImageFileToDataUrl,
  extractGoogleDriveFileId,
  matchesJenisBarang,
  extractJenisBarangFromNama,
  extractFixAssetJenisFromNama,
  matchesFixAssetJenisBarang,
  findBestMatchingFixAssetJenis,
  normalizeItemTypo,
  canonicalizeFixAssetJenisBarang,
  formatFixAssetKodeBarang,
  generateLocationAbbreviation,
  buildRoomAbbreviation,
  resolveUniqueInventoryRoomCodes,
  isAllDivisiValue,
  MasterFixAssetTypeEntry,
  DEFAULT_FIX_ASSET_TYPES,
  getTypeBarangDefaultUmur,
  calculateFixAssetAutoValues,
} from "@/lib/api";

interface AddItemModalProps {
  type: "fixAsset" | "inventory";
  activeDivisi?: string;
  fixAssetItems?: FixAssetItem[];
  inventoryItems?: InventoryItem[];
  existingRooms?: string[];
  existingOwners?: string[];
  existingItemNames?: { id: number; ruangan: string; namaBarang: string }[];
  existingFixAssetJenisNames?: { id: number; namaBarang: string }[];
  masterTypeBarang?: MasterFixAssetTypeEntry[];
  masterLokasi?: { id: number; kode: string; nama: string }[];
  masterInventoryLokasi?: { id: number; kode: string; nama: string }[];
  defaultNamaBarang?: string;
  defaultRuangan?: string;
  onAddMasterNamaBarang?: (nama: string, ruangan?: string) => void;
  onAddMasterFixAssetType?: (nama: string) => void;
  onAddMasterFixAssetJenis?: (nama: string) => void;
  onAddMasterFixAssetLokasi?: (kode: string, nama: string) => void;
  onAddMasterInventoryLokasi?: (kode: string, nama: string) => void;
  onClose: () => void;
  onAddFixAsset: (item: Partial<FixAssetItem>) => void;
  onAddInventory: (item: Partial<InventoryItem>) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  type,
  activeDivisi,
  fixAssetItems = [],
  inventoryItems = [],
  existingRooms = [],
  existingOwners = [],
  existingItemNames = [],
  existingFixAssetJenisNames = [],
  masterTypeBarang = [],
  masterLokasi = [],
  masterInventoryLokasi = [],
  defaultNamaBarang = "",
  defaultRuangan = "",
  onAddMasterNamaBarang,
  onAddMasterFixAssetType,
  onAddMasterFixAssetJenis,
  onAddMasterFixAssetLokasi,
  onAddMasterInventoryLokasi,
  onClose,
  onAddFixAsset,
  onAddInventory,
}) => {
  const isFix = type === "fixAsset";

  // Unique list of previously inputted rooms (from Import Excel or Tambah Barang Inventory or Master Lokasi)
  const roomOptions = Array.from(
    new Set([
      ...existingRooms,
      ...(masterInventoryLokasi || []).map((l) => l.nama),
    ]
      .map((r) => String(r || "").trim())
      .filter((r) => Boolean(r) && r !== "-")
    )
  );

  // Unique list of previously inputted owners / pemilik (from Import Excel or Tambah Barang Inventory)
  const ownerOptions = Array.from(
    new Set(
      [
        "DPSA",
        "DPM",
        "Pak Boyke",
        ...existingOwners.map((p) => String(p || "").trim()),
      ].filter((p) => Boolean(p) && p !== "-")
    )
  );

  // Fix Asset State
  const typeOptions =
    masterTypeBarang && masterTypeBarang.length > 0
      ? masterTypeBarang
      : DEFAULT_FIX_ASSET_TYPES;
  const [customKodeAktiva, setCustomKodeAktiva] = useState("");
  const initialType = typeOptions[0]?.nama || "Peralatan Mesin";
  const initialUmur = getTypeBarangDefaultUmur(initialType);
  const [typeAktiva, setTypeAktiva] = useState(() => initialType);
  const [isCustomTypeAktiva, setIsCustomTypeAktiva] = useState(false);
  const [customTypeAktiva, setCustomTypeAktiva] = useState("");
  const [fixJenisBarang, setFixJenisBarang] = useState("");
  const [isCustomFixJenis, setIsCustomFixJenis] = useState(false);
  const [customFixJenis, setCustomFixJenis] = useState("");
  const [namaAktiva, setNamaAktiva] = useState("");
  const [merk, setMerk] = useState("");
  const [spesifikasi, setSpesifikasi] = useState("");
  const [hargaPerolehan, setHargaPerolehan] = useState("");
  const [bulanAktiva, setBulanAktiva] = useState("NOVEMBER");
  const [tahunAktiva, setTahunAktiva] = useState("2026");
  const [tglPerolehan, setTglPerolehan] = useState("2026-11-01");
  const [umurThn, setUmurThn] = useState(() => String(initialUmur.umurThn));
  const [umurBln, setUmurBln] = useState(() => String(initialUmur.umurBln));
  const hasInitialFixLokasi =
    masterLokasi.length > 0 ||
    fixAssetItems.some((i) => i.lokasi && i.lokasi.trim() !== "");
  const [lokasi, setLokasi] = useState(() =>
    masterLokasi[0]?.nama || (hasInitialFixLokasi ? "Produksi Mesin" : "")
  );
  const [isCustomFixLokasi, setIsCustomFixLokasi] = useState(
    () => !hasInitialFixLokasi
  );
  const [customFixLokasi, setCustomFixLokasi] = useState("");

  const effectiveTypeAktiva = isCustomTypeAktiva
    ? customTypeAktiva.trim() || typeOptions[0]?.nama || "Peralatan Mesin"
    : typeAktiva;
  const effectiveFixJenisBarang = isCustomFixJenis
    ? customFixJenis.trim()
    : fixJenisBarang.trim();
  const effectiveFixLokasi = isCustomFixLokasi
    ? customFixLokasi.trim()
    : lokasi.trim();

  // Daftar Lokasi Fix Asset terbaru (dari Master Lokasi + Lokasi dari item Fix Asset yang sudah ada)
  const fixLokasiOptions = React.useMemo(() => {
    const map = new Map<string, { id: number; kode: string; nama: string }>();
    masterLokasi.forEach((loc) => {
      const name = String(loc.nama || "").trim();
      if (name && name !== "-") {
        map.set(name.toLowerCase(), {
          id: loc.id,
          kode: (loc.kode || generateLocationAbbreviation(name)).toUpperCase(),
          nama: name,
        });
      }
    });
    fixAssetItems.forEach((it) => {
      const name = String(it.lokasi || "").trim();
      if (name && name !== "-" && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          id: map.size + 1,
          kode: generateLocationAbbreviation(name),
          nama: name,
        });
      }
    });
    return Array.from(map.values());
  }, [masterLokasi, fixAssetItems]);

  const handleTglPerolehanChange = (val: string) => {
    setTglPerolehan(val);
    if (!val) return;
    if (val.includes("-")) {
      const parts = val.split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        if (y) setTahunAktiva(y);
        const BULAN_NAMES = [
          "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
          "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
        ];
        if (m >= 1 && m <= 12) setBulanAktiva(BULAN_NAMES[m - 1]);
      }
    } else if (val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        let y = parts[2];
        if (y.length === 2) y = `20${y}`;
        if (y) setTahunAktiva(y);
        const BULAN_NAMES = [
          "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
          "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
        ];
        if (m >= 1 && m <= 12) setBulanAktiva(BULAN_NAMES[m - 1]);
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

  // Shared State: Pemilik / Kepemilikan Aset (Fix Asset & Inventory)
  const [pemilik, setPemilik] = useState(() => (ownerOptions.length > 0 ? ownerOptions[0] : "DPSA"));
  const [isCustomOwner, setIsCustomOwner] = useState(() => ownerOptions.length === 0);
  const [customPemilik, setCustomPemilik] = useState("");

  // Compute automatic Fix Asset Kode Barang:
  // FA/Tipe Barang/Kode Barang/Bln Perolehan/PEMILIK-DIVISI/Th Perolehan/Lokasi
  const targetDivisiCode =
    !activeDivisi || isAllDivisiValue(activeDivisi)
      ? "DPSA"
      : activeDivisi.trim().toUpperCase().replace(/\s+/g, "") || "DPSA";

  const computedFixAssetKodeInfo = React.useMemo(() => {
    const trimmedJenis = effectiveFixJenisBarang;
    const trimmedNama = namaAktiva.trim();
    const lookupTarget = trimmedJenis || trimmedNama;

    // Use intelligent scoring: best matching master wins (e.g. "Mesin Felder" matches "Mesin Felder" over "Mesin")
    const best = lookupTarget
      ? findBestMatchingFixAssetJenis(lookupTarget, existingFixAssetJenisNames)
      : undefined;
    const matchedMaster = best ? best.item : undefined;
    const jenisId = matchedMaster
      ? matchedMaster.id
      : existingFixAssetJenisNames.length + 1;

    const targetJenis = matchedMaster
      ? matchedMaster.namaBarang
      : trimmedJenis || extractFixAssetJenisFromNama(trimmedNama) || trimmedNama;

    const cleanLokasi = effectiveFixLokasi || "-";
    const existingSameCount = targetJenis
      ? fixAssetItems.filter(
          (it) =>
            (it.jenisBarang
              ? it.jenisBarang.toLowerCase() === targetJenis.toLowerCase()
              : matchesFixAssetJenisBarang(it.namaAktivaTetap || "", targetJenis)) &&
            (it.lokasi || "").trim().toLowerCase() === cleanLokasi.toLowerCase()
        ).length
      : 0;
    const nextUrutan = existingSameCount + 1;

    const finalFixPemilik = (isCustomOwner ? customPemilik : pemilik).trim() || "DPSA";
    const fullCode = formatFixAssetKodeBarang(
      {
        typeAktiva: effectiveTypeAktiva,
        namaAktivaTetap: trimmedNama || targetJenis,
        bulan: bulanAktiva,
        tahun: Number(tahunAktiva) || new Date().getFullYear(),
        lokasi: cleanLokasi,
        pemilik: finalFixPemilik,
        divisi: targetDivisiCode,
      },
      jenisId,
      nextUrutan,
      nextUrutan,
      masterTypeBarang,
      masterLokasi,
      targetDivisiCode
    );

    return {
      jenisId,
      targetJenis,
      nextUrutan,
      fullCode,
    };
  }, [
    effectiveFixJenisBarang,
    namaAktiva,
    effectiveTypeAktiva,
    bulanAktiva,
    tahunAktiva,
    effectiveFixLokasi,
    existingFixAssetJenisNames,
    fixAssetItems,
    masterTypeBarang,
    masterLokasi,
    targetDivisiCode,
    isCustomOwner,
    customPemilik,
    pemilik,
  ]);

  // Inventory State: Ruangan (starts as textfield if no previous data, becomes dropdown when data exists)
  const [ruangan, setRuangan] = useState(() =>
    defaultRuangan && roomOptions.includes(defaultRuangan)
      ? defaultRuangan
      : roomOptions.length > 0
      ? roomOptions[0]
      : ""
  );
  const [isCustomRoom, setIsCustomRoom] = useState(() =>
    defaultRuangan && !roomOptions.includes(defaultRuangan) ? true : roomOptions.length === 0
  );
  const [customRuangan, setCustomRuangan] = useState(() =>
    defaultRuangan && !roomOptions.includes(defaultRuangan) ? defaultRuangan : ""
  );

  const initialInvJenis = defaultNamaBarang
    ? extractJenisBarangFromNama(defaultNamaBarang) || defaultNamaBarang
    : "";
  const matchedInitialInvJenis = initialInvJenis
    ? existingItemNames.find(
        (e) => e.namaBarang.toLowerCase() === initialInvJenis.toLowerCase()
      )
    : undefined;
  const [jenisBarang, setJenisBarang] = useState(
    () => matchedInitialInvJenis?.namaBarang || ""
  );
  const [isCustomInvJenis, setIsCustomInvJenis] = useState(
    () => Boolean(initialInvJenis && !matchedInitialInvJenis)
  );
  const [customInvJenis, setCustomInvJenis] = useState(
    () => (initialInvJenis && !matchedInitialInvJenis ? initialInvJenis : "")
  );
  const effectiveInvJenisBarang = isCustomInvJenis
    ? customInvJenis.trim()
    : jenisBarang.trim();

  const [namaBarang, setNamaBarang] = useState(defaultNamaBarang);
  const [tipeUkuran, setTipeUkuran] = useState("");
  const [satuan, setSatuan] = useState("Unit");
  const [jumlah, setJumlah] = useState("1");
  const [tahun, setTahun] = useState("2026");
  const [kondisi, setKondisi] = useState("Baik");
  const [isCustomKondisi, setIsCustomKondisi] = useState(false);
  const [customKondisi, setCustomKondisi] = useState("");
  const [hargaSatuan, setHargaSatuan] = useState("");
  const [hargaSatuanList, setHargaSatuanList] = useState<string[]>([""]);
  const [totalHargaPerolehan, setTotalHargaPerolehan] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [customKodeBarang, setCustomKodeBarang] = useState("");

  // Helper to build room abbreviation: R.MG1, R.PTK, R.GBJ, R.G (or R.G1, R.G2, R.G3 if duplicated)
  const getRoomAbbreviation = (roomName: string): string => {
    const trimmed = (roomName || "").trim();
    if (!trimmed || trimmed === "-") return "R.S";

    const masterMatch = masterInventoryLokasi.find(
      (loc) => loc.nama.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (masterMatch?.kode) {
      return masterMatch.kode.toUpperCase();
    }

    const baseAbbr = buildRoomAbbreviation(trimmed);
    const base = baseAbbr && baseAbbr !== "-" ? baseAbbr : "R.S";
    if (masterInventoryLokasi.length > 0) {
      const simulated = resolveUniqueInventoryRoomCodes([
        ...masterInventoryLokasi,
        { id: -1, kode: base, nama: trimmed },
      ]);
      const added = simulated.find((l) => l.id === -1);
      if (added?.kode) return added.kode;
    }
    return base;
  };

  // Compute automatic Kode Barang: INVNT/(pemilik)/(R.S.id.urutan)/(tahun)
  const computedKodeBarangInfo = React.useMemo(() => {
    const finalRuangan = (isCustomRoom ? customRuangan : ruangan).trim() || "Studio";
    const finalPemilik = (isCustomOwner ? customPemilik : pemilik).trim() || "DPSA";
    const trimmedJenis = effectiveInvJenisBarang;
    const trimmedNama = namaBarang.trim();
    const lookupTarget = trimmedJenis || trimmedNama;

    const upperPemilik = finalPemilik.toUpperCase();
    const isDpm = upperPemilik.includes("DPM");
    const isBoyke = upperPemilik.includes("BOYKE") || upperPemilik.includes("YBD");
    const codePrefix = isDpm
      ? "DPM"
      : isBoyke
      ? "YBD"
      : upperPemilik.includes("DPSA")
      ? "DPSA"
      : finalPemilik.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "DPSA";

    const roomAbbr = getRoomAbbreviation(finalRuangan);

    // Find sequential ID of Jenis Barang in Data Jenis Barang (1, 2, 3, 4, ...)
    const sortedMasters = [...existingItemNames].sort(
      (a, b) => b.namaBarang.length - a.namaBarang.length
    );
    const matchedMaster = lookupTarget
      ? sortedMasters.find(
          (e) =>
            e.namaBarang.toLowerCase() === lookupTarget.toLowerCase() ||
            matchesJenisBarang(lookupTarget, e.namaBarang)
        )
      : undefined;
    const itemId = matchedMaster ? matchedMaster.id : existingItemNames.length + 1;

    // Extract first year from tahun perolehan
    const yearMatch = String(tahun || "").match(/\d{4}/);
    const cleanYear = yearMatch ? yearMatch[0] : String(new Date().getFullYear());

    // Count existing items with this Jenis Barang in this Ruangan for sequence number
    const targetJenis = matchedMaster
      ? matchedMaster.namaBarang
      : trimmedJenis || extractJenisBarangFromNama(trimmedNama) || trimmedNama;
    const existingSameItemCount = targetJenis
      ? inventoryItems.filter(
          (it) =>
            (it.jenisBarang
              ? it.jenisBarang.toLowerCase() === targetJenis.toLowerCase()
              : matchesJenisBarang(it.namaBarang || "", targetJenis)) &&
            (it.ruangan || "").trim().toLowerCase() === finalRuangan.toLowerCase()
        ).length
      : 0;
    const nextUrutan = existingSameItemCount + 1;

    const roomAndIdSegment = `${roomAbbr}.${itemId}.${nextUrutan}`;
    const fullCode = `INVNT/${codePrefix}-${targetDivisiCode}/${roomAndIdSegment}/${cleanYear}`;

    return {
      codePrefix: `${codePrefix}-${targetDivisiCode}`,
      roomAbbr,
      itemId,
      targetJenis,
      roomAndIdSegment,
      cleanYear,
      nextUrutan,
      fullCode,
      isExistingMaster: !!matchedMaster,
    };
  }, [
    isCustomRoom,
    customRuangan,
    ruangan,
    isCustomOwner,
    customPemilik,
    pemilik,
    effectiveInvJenisBarang,
    namaBarang,
    tahun,
    existingItemNames,
    inventoryItems,
    targetDivisiCode,
  ]);

  const parsePriceInput = (val: string): number => {
    const digits = String(val || "").replace(/[^0-9]/g, "");
    return digits ? Number(digits) : 0;
  };

  const recalculateFromPrices = (prices: string[], qtyStr: string) => {
    const numericPrices = prices.map(parsePriceInput).filter((n) => n > 0);
    const sumHarga = numericPrices.reduce((acc, n) => acc + n, 0);
    setHargaSatuan(sumHarga > 0 ? String(sumHarga) : "");
    const qty = Number(qtyStr) || 1;
    const total = sumHarga * qty;
    setTotalHargaPerolehan(total > 0 ? String(total) : "");
  };

  // Shared Image Input State (supports File Upload OR Google Drive / Image URL)
  const [imageMode, setImageMode] = useState<"link" | "upload">("link");
  const [imageValue, setImageValue] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await convertImageFileToDataUrl(file);
      setImageValue(dataUrl);
      setUploadedFileName(file.name);
    } catch (err: any) {
      alert(err.message || "Gagal memuat file gambar");
    }
  };

  const handleClearImage = () => {
    setImageValue("");
    setUploadedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resolvedImageToSave = imageValue.trim()
    ? imageValue.trim().startsWith("data:image/")
      ? imageValue.trim()
      : formatImageDisplayUrl(imageValue.trim())
    : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isFix) {
      const trimmedNama = normalizeItemTypo(namaAktiva.trim() || effectiveFixJenisBarang);
      if (!trimmedNama) return alert("Mohon isi Nama Barang atau pilih Jenis Barang");
      if (isCustomTypeAktiva && customTypeAktiva.trim()) {
        onAddMasterFixAssetType?.(customTypeAktiva.trim());
      }
      const finalJenis =
        canonicalizeFixAssetJenisBarang(effectiveFixJenisBarang) ||
        extractFixAssetJenisFromNama(trimmedNama) ||
        trimmedNama;
      onAddMasterFixAssetJenis?.(finalJenis);
      const cleanLokasi = effectiveFixLokasi;
      if (
        cleanLokasi &&
        cleanLokasi !== "-" &&
        !masterLokasi.some((l) => l.nama.toLowerCase() === cleanLokasi.toLowerCase())
      ) {
        onAddMasterFixAssetLokasi?.(generateLocationAbbreviation(cleanLokasi), cleanLokasi);
      }
      const harga = Number(hargaPerolehan) || 0;
      const thnNum = Number(tahunAktiva) || 2026;
      const genFixCode = customKodeAktiva.trim() || computedFixAssetKodeInfo.fullCode;

      let finalTgl = tglPerolehan.trim();
      if (!finalTgl || finalTgl === "-") {
        finalTgl = `01/01/${String(thnNum).slice(-2)}`;
      } else if (finalTgl.includes("-")) {
        const p = finalTgl.split("-");
        if (p.length === 3) {
          finalTgl = `${p[2].padStart(2, "0")}/${p[1].padStart(2, "0")}/${p[0]}`;
        }
      }

      const auto = calculateFixAssetAutoValues({
        typeAktiva: effectiveTypeAktiva,
        kodeAktiva: genFixCode,
        hargaPerolehan: harga,
        qty: 1,
        totalPerolehan: harga,
        umurThn: Number(umurThn) || 0,
        umurBln: Number(umurBln) || 0,
        tahun: thnNum,
        bulan: bulanAktiva || "JANUARI",
        tglPerolehan: finalTgl,
      });

      onAddFixAsset({
        jenisBarang: finalJenis,
        kodeAktiva: genFixCode,
        typeAktiva: effectiveTypeAktiva,
        namaAktivaTetap: trimmedNama,
        merk: merk || "-",
        spesifikasi: spesifikasi || "-",
        satuan: "Unit",
        tglPerolehan: finalTgl,
        bulan: bulanAktiva || "JANUARI",
        tahun: thnNum,
        qty: 1,
        hargaPerolehan: harga,
        totalPerolehan: auto.totalPerolehan,
        nilaiSisa: 0,
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
        lokasi: cleanLokasi || "-",
        pemilik: (isCustomOwner ? customPemilik : pemilik).trim() || "DPSA",
        keterangan: "Input Manual",
        foto: resolvedImageToSave,
      });
    } else {
      const trimmedNama = normalizeItemTypo(namaBarang.trim() || effectiveInvJenisBarang);
      if (!trimmedNama) return alert("Mohon isi Nama Barang atau pilih Jenis Barang");
      const finalJenis =
        effectiveInvJenisBarang ||
        extractJenisBarangFromNama(trimmedNama) ||
        trimmedNama;
      const finalRuangan = (isCustomRoom ? customRuangan : ruangan).trim() || "-";
      onAddMasterNamaBarang?.(finalJenis, finalRuangan !== "-" ? finalRuangan : "Studio");
      if (
        finalRuangan !== "-" &&
        !masterInventoryLokasi.some((l) => l.nama.toLowerCase() === finalRuangan.toLowerCase())
      ) {
        onAddMasterInventoryLokasi?.(getRoomAbbreviation(finalRuangan), finalRuangan);
      }
      const finalPemilik = (isCustomOwner ? customPemilik : pemilik).trim() || "DPSA";
      const finalKondisi = (isCustomKondisi ? customKondisi.trim() : kondisi) || "Baik";
      const validPrices = hargaSatuanList.map(parsePriceInput).filter((n) => n > 0);
      const sumHarga = validPrices.reduce((acc, n) => acc + n, 0);
      const harga = sumHarga > 0 ? sumHarga : Number(hargaSatuan) || 0;
      const hargaSatuanText =
        validPrices.length > 0
          ? validPrices.map((p) => formatRupiah(p)).join("\n")
          : harga > 0
          ? formatRupiah(harga)
          : "";
      const qty = Number(jumlah) || 1;
      const total = Number(totalHargaPerolehan) > 0 ? Number(totalHargaPerolehan) : harga * qty;

      const upperPemilik = finalPemilik.toUpperCase();
      const isDpm = upperPemilik.includes("DPM");
      const isBoyke = upperPemilik.includes("BOYKE") || upperPemilik.includes("YBD");

      const genCode = customKodeBarang.trim() || computedKodeBarangInfo.fullCode;
      onAddInventory({
        ruangan: finalRuangan,
        jenisBarang: finalJenis,
        kodeBarang: genCode,
        namaBarang: trimmedNama,
        tipeUkuran: tipeUkuran || "-",
        satuan,
        jumlah: qty,
        tahunPerolehan: tahun,
        kondisi: finalKondisi,
        hargaSatuan: harga,
        hargaSatuanText,
        totalHargaPerolehan: total,
        pemilik: finalPemilik,
        dpsa: !isDpm && !isBoyke && upperPemilik.includes("DPSA") ? total : 0,
        dpm: isDpm ? total : 0,
        pakBoyke: isBoyke ? total : 0,
        dokumenGambar: resolvedImageToSave,
        keterangan: keterangan || "-",
        kodeBarcode: genCode,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-900 text-base">
            Tambah {isFix ? "Fix Asset" : "Barang Inventory"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {isFix ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Type Barang
                  </label>
                  <select
                    value={isCustomTypeAktiva ? "__NEW_TYPE__" : typeAktiva}
                    onChange={(e) => {
                      if (e.target.value === "__NEW_TYPE__") {
                        setIsCustomTypeAktiva(true);
                      } else {
                        setIsCustomTypeAktiva(false);
                        const sel = e.target.value;
                        setTypeAktiva(sel);
                        const rule = getTypeBarangDefaultUmur(sel);
                        setUmurThn(String(rule.umurThn));
                        setUmurBln(String(rule.umurBln));
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    {typeOptions.map((t) => (
                      <option key={t.kode} value={t.nama}>
                        {t.kode}: {t.nama}
                      </option>
                    ))}
                    <option value="__NEW_TYPE__">+ Tambah Type Barang Baru...</option>
                  </select>
                  {isCustomTypeAktiva && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik nama type barang baru..."
                        value={customTypeAktiva}
                        onChange={(e) => setCustomTypeAktiva(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Jenis Barang Fix Asset (Memanggil ID untuk Kode Barang) */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Jenis Barang
                  </label>
                  <select
                    value={isCustomFixJenis ? "__NEW_FIX_JENIS__" : fixJenisBarang}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__NEW_FIX_JENIS__") {
                        setIsCustomFixJenis(true);
                      } else {
                        setIsCustomFixJenis(false);
                        setFixJenisBarang(val);
                        if (val && !namaAktiva.trim()) {
                          setNamaAktiva(val);
                        }
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="">-- Otomatis dari Nama Barang --</option>
                    {existingFixAssetJenisNames.map((entry) => (
                      <option key={`${entry.id}-${entry.namaBarang}`} value={entry.namaBarang}>
                        {entry.namaBarang}
                      </option>
                    ))}
                    <option value="__NEW_FIX_JENIS__">+ Tambah Jenis Barang Baru...</option>
                  </select>
                  {isCustomFixJenis && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik jenis barang baru (contoh: Mesin Bor)..."
                        value={customFixJenis}
                        onChange={(e) => setCustomFixJenis(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mesin Felder, Mesin Pemotong Laser..."
                  value={namaAktiva}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNamaAktiva(val);
                    if (!isCustomFixJenis && !fixJenisBarang.trim() && val.trim()) {
                      // Match against existing master categories using intelligent similarity
                      const bestMatch = findBestMatchingFixAssetJenis(val, existingFixAssetJenisNames);
                      if (bestMatch && bestMatch.score >= 50) {
                        setFixJenisBarang(bestMatch.item.namaBarang);
                      } else {
                        const autoJenis = extractFixAssetJenisFromNama(val);
                        if (autoJenis) {
                          const matchedByAuto = findBestMatchingFixAssetJenis(autoJenis, existingFixAssetJenisNames);
                          if (matchedByAuto && matchedByAuto.score >= 50) {
                            setFixJenisBarang(matchedByAuto.item.namaBarang);
                          }
                        }
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  required
                />
              </div>

              {/* Preview Kode Barang Fix Asset Otomatis (Terselip ID Jenis Barang) */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                    Kode Barang Otomatis (ID Jenis Barang #{computedFixAssetKodeInfo.jenisId})
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                    ID #{computedFixAssetKodeInfo.jenisId}
                  </span>
                </div>
                <input
                  type="text"
                  value={customKodeAktiva || computedFixAssetKodeInfo.fullCode || ""}
                  onChange={(e) => setCustomKodeAktiva(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold text-blue-700 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <p className="text-[10px] text-slate-500">
                  Format: <span className="font-mono">FA/Tipe Barang/Kode Barang (ID #{computedFixAssetKodeInfo.jenisId})/Bln Perolehan/DPSA/Th Perolehan/Lokasi</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Tanggal Perolehan
                </label>
                <input
                  type="date"
                  value={tglPerolehan}
                  onChange={(e) => handleTglPerolehanChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Bulan Perolehan
                  </label>
                  <select
                    value={bulanAktiva}
                    onChange={(e) => setBulanAktiva(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="JANUARI">JANUARI (I)</option>
                    <option value="FEBRUARI">FEBRUARI (II)</option>
                    <option value="MARET">MARET (III)</option>
                    <option value="APRIL">APRIL (IV)</option>
                    <option value="MEI">MEI (V)</option>
                    <option value="JUNI">JUNI (VI)</option>
                    <option value="JULI">JULI (VII)</option>
                    <option value="AGUSTUS">AGUSTUS (VIII)</option>
                    <option value="SEPTEMBER">SEPTEMBER (IX)</option>
                    <option value="OKTOBER">OKTOBER (X)</option>
                    <option value="NOVEMBER">NOVEMBER (XI)</option>
                    <option value="DESEMBER">DESEMBER (XII)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Tahun Perolehan
                  </label>
                  <input
                    type="number"
                    placeholder="2026"
                    value={tahunAktiva}
                    onChange={(e) => setTahunAktiva(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Merk
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Biesse"
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Lokasi
                  </label>
                  <select
                    value={isCustomFixLokasi ? "__NEW_FIX_LOKASI__" : lokasi}
                    onChange={(e) => {
                      if (e.target.value === "__NEW_FIX_LOKASI__") {
                        setIsCustomFixLokasi(true);
                      } else {
                        setIsCustomFixLokasi(false);
                        setLokasi(e.target.value);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    {fixLokasiOptions.map((loc) => (
                      <option key={`${loc.id}-${loc.kode}`} value={loc.nama}>
                        {loc.kode}: {loc.nama}
                      </option>
                    ))}
                    <option value="__NEW_FIX_LOKASI__">+ Tambah Lokasi Baru...</option>
                  </select>
                  {isCustomFixLokasi && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik nama lokasi baru (contoh: Gudang Bahan)..."
                        value={customFixLokasi}
                        onChange={(e) => setCustomFixLokasi(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Spesifikasi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 15Kw, 3 Phase"
                    value={spesifikasi}
                    onChange={(e) => setSpesifikasi(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Harga Perolehan (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="50000000"
                    value={hargaPerolehan}
                    onChange={(e) => setHargaPerolehan(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Pemilikan (Pemilik)
                </label>
                <select
                  value={isCustomOwner ? "__NEW_OWNER__" : pemilik}
                  onChange={(e) => {
                    if (e.target.value === "__NEW_OWNER__") {
                      setIsCustomOwner(true);
                    } else {
                      setIsCustomOwner(false);
                      setPemilik(e.target.value);
                    }
                  }}
                  className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                >
                  {ownerOptions.map((ownerName) => (
                    <option key={ownerName} value={ownerName}>
                      {ownerName === "DPSA"
                        ? "DPSA (PT DPSA)"
                        : ownerName === "DPM"
                        ? "DPM (PT DPM)"
                        : ownerName === "Pak Boyke"
                        ? "Pak Boyke (Pribadi)"
                        : ownerName}
                    </option>
                  ))}
                  <option value="__NEW_OWNER__">+ Pemilik Lainnya / Kustom...</option>
                </select>
                {isCustomOwner && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Ketik nama pemilik baru..."
                      value={customPemilik}
                      onChange={(e) => setCustomPemilik(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Umur Ekonomis (Tahun)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="8"
                    value={umurThn}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed select-none font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Otomatis sinkron ke {Number(umurThn) * 12 || 0} bulan
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Umur Ekonomis (Bulan)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="96"
                    value={umurBln}
                    disabled
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed select-none font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Penyusutan: {Number(umurBln) > 0 && Number(hargaPerolehan) > 0 ? formatRupiah(Math.round(Number(hargaPerolehan) / Number(umurBln))) : "Rp 0"} / bln
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Lokasi
                  </label>
                  <select
                    value={isCustomRoom ? "__NEW_ROOM__" : ruangan}
                    onChange={(e) => {
                      if (e.target.value === "__NEW_ROOM__") {
                        setIsCustomRoom(true);
                      } else {
                        setIsCustomRoom(false);
                        setRuangan(e.target.value);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    {roomOptions.map((roomName) => (
                      <option key={roomName} value={roomName}>
                        {roomName}
                      </option>
                    ))}
                    <option value="__NEW_ROOM__">+ Tambah Lokasi Baru...</option>
                  </select>
                  {isCustomRoom && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik nama lokasi baru (contoh: Studio)..."
                        value={customRuangan}
                        onChange={(e) => setCustomRuangan(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Jenis Barang (Dapat dipilih dari daftar atau tambahkan baru di bawahnya) */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Jenis Barang
                  </label>
                  <select
                    value={isCustomInvJenis ? "__NEW_INV_JENIS__" : jenisBarang}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__NEW_INV_JENIS__") {
                        setIsCustomInvJenis(true);
                      } else {
                        setIsCustomInvJenis(false);
                        setJenisBarang(val);
                        if (val && !namaBarang.trim()) {
                          setNamaBarang(val);
                        }
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="">-- Otomatis dari Nama Barang --</option>
                    {existingItemNames.map((entry) => (
                      <option key={`${entry.id}-${entry.namaBarang}`} value={entry.namaBarang}>
                        {entry.namaBarang}
                      </option>
                    ))}
                    <option value="__NEW_INV_JENIS__">+ Tambah Jenis Barang Baru...</option>
                  </select>
                  {isCustomInvJenis && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik jenis barang baru (contoh: Kursi)..."
                        value={customInvJenis}
                        onChange={(e) => setCustomInvJenis(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kursi Kerja, Single Chair, Meja Rapat..."
                  value={namaBarang}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNamaBarang(val);
                    // Jika Jenis Barang masih kosong, otomatis deteksi dari Nama Barang
                    if (!isCustomInvJenis && !jenisBarang.trim() && val.trim()) {
                      const autoJenis = extractJenisBarangFromNama(val);
                      if (autoJenis) {
                        const matched = existingItemNames.find(
                          (m) => m.namaBarang.toLowerCase() === autoJenis.toLowerCase()
                        );
                        if (matched) setJenisBarang(matched.namaBarang);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Preview Kode Barang Otomatis (Terselip ID Jenis Barang) */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Kode Barang Otomatis (ID Jenis Barang #{computedKodeBarangInfo.itemId})
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    {computedKodeBarangInfo.roomAndIdSegment}
                  </span>
                </div>
                <input
                  type="text"
                  value={customKodeBarang || computedKodeBarangInfo.fullCode || ""}
                  onChange={(e) => setCustomKodeBarang(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold text-blue-700 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <p className="text-[10px] text-slate-500">
                  Format: <span className="font-mono">INVNT/{computedKodeBarangInfo.codePrefix}/{computedKodeBarangInfo.roomAndIdSegment}/{computedKodeBarangInfo.cleanYear}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Tipe / Ukuran
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1,20*0,40*2,00"
                    value={tipeUkuran}
                    onChange={(e) => setTipeUkuran(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    value={jumlah}
                    onChange={(e) => {
                      const nextQty = e.target.value;
                      setJumlah(nextQty);
                      recalculateFromPrices(hargaSatuanList, nextQty);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Tahun
                  </label>
                  <input
                    type="text"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Kondisi
                  </label>
                  <select
                    value={isCustomKondisi ? "__NEW_KONDISI__" : kondisi}
                    onChange={(e) => {
                      if (e.target.value === "__NEW_KONDISI__") {
                        setIsCustomKondisi(true);
                      } else {
                        setIsCustomKondisi(false);
                        setKondisi(e.target.value);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="__NEW_KONDISI__">+ Kondisi Lainnya / Baru...</option>
                  </select>
                  {isCustomKondisi && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik kondisi baru..."
                        value={customKondisi}
                        onChange={(e) => setCustomKondisi(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Harga Satuan (Rp)
                    </label>
                    <button
                      type="button"
                      onClick={() => setHargaSatuanList((prev) => [...prev, ""])}
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      title="Tambah baris harga satuan (untuk 1 set berisi beberapa barang)"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {hargaSatuanList.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder={
                            hargaSatuanList.length > 1
                              ? `Harga ke-${idx + 1}`
                              : "1500000"
                          }
                          value={val}
                          onChange={(e) => {
                            const raw = e.target.value;
                            // If user pastes multi-line prices, split into rows automatically
                            if (raw.includes("\n")) {
                              const lines = raw
                                .split(/\r?\n/)
                                .map((l) => l.trim())
                                .filter(Boolean);
                              if (lines.length > 1) {
                                const nextList = [
                                  ...hargaSatuanList.slice(0, idx),
                                  ...lines,
                                  ...hargaSatuanList.slice(idx + 1),
                                ];
                                setHargaSatuanList(nextList);
                                recalculateFromPrices(nextList, jumlah);
                                return;
                              }
                            }
                            const nextList = hargaSatuanList.map((item, i) =>
                              i === idx ? raw : item
                            );
                            setHargaSatuanList(nextList);
                            recalculateFromPrices(nextList, jumlah);
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                        />
                        {hargaSatuanList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextList = hargaSatuanList.filter((_, i) => i !== idx);
                              setHargaSatuanList(nextList);
                              recalculateFromPrices(nextList, jumlah);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            title="Hapus baris harga ini"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Total Harga Perolehan
                  </label>
                  <input
                    type="number"
                    placeholder="1500000"
                    value={totalHargaPerolehan}
                    onChange={(e) => setTotalHargaPerolehan(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-blue-50/40 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Pemilikan (Pemilik)
                  </label>
                  <select
                    value={isCustomOwner ? "__NEW_OWNER__" : pemilik}
                    onChange={(e) => {
                      if (e.target.value === "__NEW_OWNER__") {
                        setIsCustomOwner(true);
                      } else {
                        setIsCustomOwner(false);
                        setPemilik(e.target.value);
                      }
                    }}
                    className="w-full pl-3.5 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 shadow-2xs transition-all cursor-pointer"
                  >
                    {ownerOptions.map((ownerName) => (
                      <option key={ownerName} value={ownerName}>
                        {ownerName === "DPSA"
                          ? "DPSA (PT DPSA)"
                          : ownerName === "DPM"
                          ? "DPM (PT DPM)"
                          : ownerName === "Pak Boyke"
                          ? "Pak Boyke (Pribadi)"
                          : ownerName}
                      </option>
                    ))}
                    <option value="__NEW_OWNER__">+ Pemilik Lainnya / Kustom...</option>
                  </select>
                  {isCustomOwner && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ketik nama pemilik baru..."
                        value={customPemilik}
                        onChange={(e) => setCustomPemilik(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Keterangan (Letak)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang Meeting Lantai 2"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>
            </>
          )}

          {/* Dokumen Gambar / Foto Section (Supports Link GDrive/URL or File Upload) */}
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
                  disabled={true}
                  title="Upload foto dinonaktifkan sementara"
                  className="px-2.5 py-1 rounded-md flex items-center gap-1 transition-all opacity-40 cursor-not-allowed text-slate-400 select-none"
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
                  value={imageValue && !imageValue.startsWith("data:image/") ? imageValue : ""}
                  onChange={(e) => {
                    setUploadedFileName("");
                    setImageValue(e.target.value || "");
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
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
                {uploadedFileName && (
                  <span className="text-xs text-slate-600 truncate max-w-[200px]">
                    {uploadedFileName}
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
                    onError={(e) => handleGoogleDriveImageError(e, imageValue)}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-700">
                      Pratinjau Gambar Siap Disimpan
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[240px]">
                      {imageValue.startsWith("data:image/")
                        ? uploadedFileName || "Foto dari perangkat"
                        : extractGoogleDriveFileId(imageValue)
                        ? `Google Drive ID: ${extractGoogleDriveFileId(imageValue)}`
                        : imageValue}
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

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
