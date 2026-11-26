"use client";

import React, { useMemo } from "react";
import {
  Building2,
  Package2,
  Wallet,
  MapPin,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  OverviewData,
  FixAssetItem,
  InventoryItem,
  formatRupiah,
  getInventoryPemilik,
  getFixAssetPemilik,
  getInventoryTotalHarga,
} from "@/lib/api";

interface OverviewViewProps {
  data: OverviewData;
  fixAssets?: FixAssetItem[];
  inventory?: InventoryItem[];
  masterInventoryLokasi?: { kode: string; nama: string }[];
  loading?: boolean;
  onNavigateToFixAsset: () => void;
  onNavigateToInventory: () => void;
}

interface BreakdownEntry {
  label: string;
  subLabel?: string;
  count: number;
  qty: number;
  value: number;
}

interface CombinedOwnerEntry {
  label: string;
  totalValue: number;
  totalCount: number;
  totalQty: number;
  fixCount: number;
  fixQty: number;
  fixValue: number;
  invCount: number;
  invQty: number;
  invValue: number;
}

function normalizeOwnerKey(owner: string): string {
  const upper = (owner || "").trim().toUpperCase();
  if (upper.includes("DPM")) return "dpm";
  if (upper.includes("BOYKE") || upper.includes("YBD")) return "pak boyke";
  if (upper.includes("DPSA")) return "dpsa";
  return upper.toLowerCase();
}

function getCanonicalOwnerLabel(owner: string): string {
  const upper = (owner || "").trim().toUpperCase();
  if (upper.includes("DPM")) return "DPM";
  if (upper.includes("BOYKE") || upper.includes("YBD")) return "Pak Boyke";
  if (upper.includes("DPSA")) return "PT DPSA";
  return owner.trim();
}

function formatQty(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value)
    ? value.toLocaleString("id-ID")
    : Number(value.toFixed(2)).toLocaleString("id-ID");
}

function getFixAssetTotalValue(item: FixAssetItem): number {
  const tp = Number(item.totalPerolehan) || 0;
  if (tp > 0) return tp;
  return (Number(item.hargaPerolehan) || 0) * (Number(item.qty) || 1);
}

function getOwnerAccent(label: string) {
  const upper = label.toUpperCase();
  if (upper.includes("DPM")) {
    return {
      border: "border-l-emerald-600",
      text: "text-emerald-600",
      pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
      subtitle: "Alokasi Aset DPM",
    };
  }
  if (upper.includes("BOYKE") || upper.includes("YBD")) {
    return {
      border: "border-l-purple-600",
      text: "text-purple-600",
      pill: "bg-purple-50 text-purple-700 border-purple-200",
      subtitle: "Alokasi Aset Pak Boyke",
    };
  }
  if (upper.includes("DPSA")) {
    return {
      border: "border-l-blue-600",
      text: "text-blue-600",
      pill: "bg-blue-50 text-blue-700 border-blue-200",
      subtitle: "Alokasi Aset PT DPSA",
    };
  }
  return {
    border: "border-l-amber-500",
    text: "text-amber-600",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    subtitle: `Alokasi Aset ${label}`,
  };
}

function normalizeConditionLabel(raw?: string): string | null {
  const cleaned = String(raw || "").trim();
  if (!cleaned || cleaned === "-") return null;

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "-");

  if (lines.length === 0) return null;

  const hasIssue = lines.some((line) =>
    /(rusak|tidak|kurang|mati|pecah|hilang|perlu)/i.test(line)
  );
  if (hasIssue) {
    return "Rusak / Perlu Perhatian";
  }

  const allGood = lines.every((line) => /^baik$/i.test(line));
  if (allGood) {
    return "Baik";
  }

  return lines[0];
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  fixAssets = [],
  inventory = [],
  masterInventoryLokasi = [],
  loading = false,
  onNavigateToFixAsset,
  onNavigateToInventory,
}) => {
  const stats = useMemo(() => {
    const hasFixArray = fixAssets.length > 0;
    const hasInvArray = inventory.length > 0;

    // 1. Fix Asset Stats
    const totalFixAssetCount = hasFixArray ? fixAssets.length : data.totalFixAssetCount;
    const totalFixAssetValue = hasFixArray
      ? fixAssets.reduce((sum, it) => sum + getFixAssetTotalValue(it), 0)
      : data.totalFixAssetValue;
    const totalFixAssetQty = fixAssets.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
    const totalFixAssetNilaiBuku = fixAssets.reduce(
      (sum, it) => sum + Math.max(0, Number(it.nilaiBuku) || 0),
      0
    );
    const totalFixAssetAkumulasi = fixAssets.reduce(
      (sum, it) => sum + Math.max(0, Number(it.akumulasiDepresiasi) || 0),
      0
    );
    const totalFixAssetDepresiasi = fixAssets.reduce(
      (sum, it) => sum + Math.max(0, Number(it.depresiasi) || 0),
      0
    );
    const totalFixAssetNilaiSisa = fixAssets.reduce(
      (sum, it) => sum + Math.max(0, Number(it.nilaiSisa) || 0),
      0
    );

    const fixJenisMap = new Map<string, BreakdownEntry>();
    const fixTypeMap = new Map<string, BreakdownEntry>();
    const fixLokasiMap = new Map<string, BreakdownEntry>();
    const fixOwnerMap = new Map<string, BreakdownEntry>();

    fixAssets.forEach((it) => {
      const val = getFixAssetTotalValue(it);
      const qty = Number(it.qty) || 1;

      const owner = getFixAssetPemilik(it);
      if (owner && owner !== "-") {
        const ownerKey = normalizeOwnerKey(owner);
        const canonLabel = getCanonicalOwnerLabel(owner);
        const cur = fixOwnerMap.get(ownerKey) || { label: canonLabel, count: 0, qty: 0, value: 0 };
        cur.count += 1;
        cur.qty += qty;
        cur.value += val;
        fixOwnerMap.set(ownerKey, cur);
      }

      const jenis = String(it.jenisBarang || "").trim();
      if (jenis && jenis !== "-") {
        const key = jenis.toLowerCase();
        const cur = fixJenisMap.get(key) || { label: jenis, count: 0, qty: 0, value: 0 };
        cur.count += 1;
        cur.qty += qty;
        cur.value += val;
        fixJenisMap.set(key, cur);
      }

      const tipe = String(it.typeAktiva || "").trim();
      if (tipe && tipe !== "-") {
        const key = tipe.toLowerCase();
        const cur = fixTypeMap.get(key) || { label: tipe, count: 0, qty: 0, value: 0 };
        cur.count += 1;
        cur.qty += qty;
        cur.value += val;
        fixTypeMap.set(key, cur);
      }

      const lokasi = String(it.lokasi || "").trim();
      if (lokasi && lokasi !== "-") {
        const key = lokasi.toLowerCase();
        const cur = fixLokasiMap.get(key) || { label: lokasi, count: 0, qty: 0, value: 0 };
        cur.count += 1;
        cur.qty += qty;
        cur.value += val;
        fixLokasiMap.set(key, cur);
      }
    });

    const sortByValueDesc = (a: BreakdownEntry, b: BreakdownEntry) =>
      b.value - a.value || b.count - a.count;

    const fixJenisBreakdown = Array.from(fixJenisMap.values()).sort(sortByValueDesc);
    const fixTypeBreakdown = Array.from(fixTypeMap.values()).sort(sortByValueDesc);
    const fixLokasiBreakdown = Array.from(fixLokasiMap.values()).sort(sortByValueDesc);
    const fixOwnerBreakdown = Array.from(fixOwnerMap.values()).sort(sortByValueDesc);

    // 2. Inventory Stats
    const totalInventoryCount = hasInvArray ? inventory.length : data.totalInventoryCount;
    const totalInventoryValue = hasInvArray
      ? inventory.reduce((sum, it) => sum + getInventoryTotalHarga(it), 0)
      : data.totalInventoryValue;
    const totalInventoryQty = inventory.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0);

    const roomCodeMap = new Map<string, string>();
    masterInventoryLokasi.forEach((loc) => {
      if (loc.nama && loc.kode) {
        roomCodeMap.set(loc.nama.trim().toLowerCase(), loc.kode.trim());
      }
    });

    const ownerMap = new Map<string, BreakdownEntry>();
    const kondisiMap = new Map<string, BreakdownEntry>();
    const roomMap = new Map<string, BreakdownEntry>();

    if (hasInvArray) {
      inventory.forEach((it) => {
        const val = getInventoryTotalHarga(it);
        const qty = Number(it.jumlah) || 0;
        const owner = getInventoryPemilik(it);
        const ownerKey = normalizeOwnerKey(owner);
        const canonLabel = getCanonicalOwnerLabel(owner);
        const curOwner = ownerMap.get(ownerKey) || { label: canonLabel, count: 0, qty: 0, value: 0 };
        curOwner.count += 1;
        curOwner.qty += qty;
        curOwner.value += val;
        ownerMap.set(ownerKey, curOwner);

        const cond = normalizeConditionLabel(it.kondisi);
        if (cond) {
          const condKey = cond.toLowerCase();
          const curCond = kondisiMap.get(condKey) || { label: cond, count: 0, qty: 0, value: 0 };
          curCond.count += 1;
          curCond.qty += qty;
          curCond.value += val;
          kondisiMap.set(condKey, curCond);
        }

        const room = String(it.ruangan || "").trim();
        if (room && room !== "-") {
          const roomKey = room.toLowerCase();
          const curRoom = roomMap.get(roomKey) || {
            label: room,
            subLabel: roomCodeMap.get(roomKey),
            count: 0,
            qty: 0,
            value: 0,
          };
          curRoom.count += 1;
          curRoom.qty += qty;
          curRoom.value += val;
          roomMap.set(roomKey, curRoom);
        }
      });
    } else {
      if (data.allocationDPSA > 0) {
        ownerMap.set("dpsa", { label: "PT DPSA", count: 0, qty: 0, value: data.allocationDPSA });
      }
      if (data.allocationDPM > 0) {
        ownerMap.set("dpm", { label: "DPM", count: 0, qty: 0, value: data.allocationDPM });
      }
      if (data.allocationPakBoyke > 0) {
        ownerMap.set("pak boyke", {
          label: "Pak Boyke",
          count: 0,
          qty: 0,
          value: data.allocationPakBoyke,
        });
      }
    }

    const invOwnerBreakdown = Array.from(ownerMap.values())
      .filter((entry) => entry.value > 0 || entry.count > 0)
      .sort(sortByValueDesc);
    const invKondisiBreakdown = Array.from(kondisiMap.values())
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
    const invRoomBreakdown = Array.from(roomMap.values())
      .filter((entry) => entry.count > 0)
      .sort(sortByValueDesc);

    // Combined Owner Breakdown
    const combinedOwnerMap = new Map<string, CombinedOwnerEntry>();

    fixOwnerMap.forEach((entry, key) => {
      const existing = combinedOwnerMap.get(key) || {
        label: entry.label,
        totalValue: 0,
        totalCount: 0,
        totalQty: 0,
        fixCount: 0,
        fixQty: 0,
        fixValue: 0,
        invCount: 0,
        invQty: 0,
        invValue: 0,
      };
      existing.totalValue += entry.value;
      existing.totalCount += entry.count;
      existing.totalQty += entry.qty;
      existing.fixCount += entry.count;
      existing.fixQty += entry.qty;
      existing.fixValue += entry.value;
      combinedOwnerMap.set(key, existing);
    });

    ownerMap.forEach((entry, key) => {
      const existing = combinedOwnerMap.get(key) || {
        label: entry.label,
        totalValue: 0,
        totalCount: 0,
        totalQty: 0,
        fixCount: 0,
        fixQty: 0,
        fixValue: 0,
        invCount: 0,
        invQty: 0,
        invValue: 0,
      };
      existing.totalValue += entry.value;
      existing.totalCount += entry.count;
      existing.totalQty += entry.qty;
      existing.invCount += entry.count;
      existing.invQty += entry.qty;
      existing.invValue += entry.value;
      combinedOwnerMap.set(key, existing);
    });

    const combinedOwnerBreakdown = Array.from(combinedOwnerMap.values())
      .filter((entry) => entry.totalValue > 0 || entry.totalCount > 0)
      .sort((a, b) => b.totalValue - a.totalValue || b.totalCount - a.totalCount);

    const totalCombinedCount = totalFixAssetCount + totalInventoryCount;
    const totalCombinedValue = totalFixAssetValue + totalInventoryValue;
    const totalCombinedQty = totalFixAssetQty + totalInventoryQty;

    return {
      totalCombinedCount,
      totalCombinedValue,
      totalCombinedQty,
      combinedOwnerBreakdown,
      totalFixAssetCount,
      totalFixAssetValue,
      totalFixAssetQty,
      totalFixAssetNilaiBuku,
      totalFixAssetAkumulasi,
      totalFixAssetDepresiasi,
      totalFixAssetNilaiSisa,
      fixJenisBreakdown,
      fixTypeBreakdown,
      fixLokasiBreakdown,
      fixOwnerBreakdown,
      totalInventoryCount,
      totalInventoryValue,
      totalInventoryQty,
      invOwnerBreakdown,
      invKondisiBreakdown,
      invRoomBreakdown,
    };
  }, [data, fixAssets, inventory, masterInventoryLokasi]);

  if (loading && stats.totalCombinedCount === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-36 rounded-2xl bg-slate-200/70" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-36 rounded-2xl bg-slate-200/70" />
          <div className="h-36 rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (stats.totalCombinedCount === 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Belum Ada Data Aset Maupun Inventory
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Ringkasan nilai perolehan dan statistik penting akan muncul otomatis setelah Anda
          menambahkan atau mengimpor data Fix Asset atau Inventory.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onNavigateToFixAsset}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Buka Menu Fix Asset
          </button>
          <button
            onClick={onNavigateToInventory}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            Buka Menu Inventory
          </button>
        </div>
      </div>
    );
  }

  const showFixAssetSection = stats.totalFixAssetCount > 0;
  const showInventorySection = stats.totalInventoryCount > 0;

  const ownerWithValues = stats.invOwnerBreakdown.filter((o) => o.value > 0);
  const ownerSummarySubtitle =
    ownerWithValues.length > 0
      ? `Akumulasi: ${ownerWithValues.map((o) => o.label).join(" + ")}`
      : "Akumulasi Seluruh Kepemilikan";

  const fixFinanceCardCount =
    1 +
    (stats.totalFixAssetValue > 0 ? 1 : 0) +
    (stats.totalFixAssetNilaiBuku > 0 ? 1 : 0) +
    (stats.totalFixAssetAkumulasi > 0 ? 1 : 0);

  const fixGridClass =
    fixFinanceCardCount >= 4
      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
      : fixFinanceCardCount === 3
      ? "grid grid-cols-1 md:grid-cols-3 gap-5"
      : fixFinanceCardCount === 2
      ? "grid grid-cols-1 md:grid-cols-2 gap-5"
      : "grid grid-cols-1 gap-5";

  const showPrimaryCategoryPanel =
    stats.fixJenisBreakdown.length > 0 || stats.fixTypeBreakdown.length > 1;
  const primaryFixCategories =
    stats.fixJenisBreakdown.length > 0 ? stats.fixJenisBreakdown : stats.fixTypeBreakdown;
  const primaryFixCategoryTitle =
    stats.fixJenisBreakdown.length > 0
      ? "Kelompok Jenis Fix Asset Terbesar"
      : "Kategori Type Aktiva";
  const showFixOwnerPanel = stats.fixOwnerBreakdown.length > 0;
  const fixBreakdownPanelCount =
    (showPrimaryCategoryPanel ? 1 : 0) +
    (showFixOwnerPanel ? 1 : 0) +
    (stats.fixLokasiBreakdown.length > 0 ? 1 : 0);
  const fixBreakdownGridClass =
    fixBreakdownPanelCount >= 3
      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      : fixBreakdownPanelCount === 2
      ? "grid grid-cols-1 lg:grid-cols-2 gap-5"
      : "grid grid-cols-1 gap-5";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* COMBINED SUMMARY BANNER (shown when combined value or multiple sections exist) */}
      {(stats.totalCombinedValue > 0 || (showFixAssetSection && showInventorySection)) && (
        <div className="bg-gradient-to-br from-slate-900 via-[#0f1f3d] to-[#0a2a29] rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
                <Wallet className="w-4 h-4" />
                <span>TOTAL KESELURUHAN PEROLEHAN ASET &amp; INVENTORY</span>
              </div>
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {formatRupiah(stats.totalCombinedValue)}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-1.5">
                Total {stats.totalCombinedCount} item terdaftar
                {stats.totalCombinedQty > 0 &&
                  Math.abs(stats.totalCombinedQty - stats.totalCombinedCount) > 0.001 && (
                    <> &bull; {formatQty(stats.totalCombinedQty)} unit</>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {showFixAssetSection && (
                <button
                  onClick={onNavigateToFixAsset}
                  className="text-left bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/15 rounded-xl px-4 py-3 transition-colors"
                >
                  <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1">
                    <span>Fix Asset ({stats.totalFixAssetCount})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  {stats.totalFixAssetValue > 0 && (
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {formatRupiah(stats.totalFixAssetValue)}
                    </div>
                  )}
                </button>
              )}

              {showInventorySection && (
                <button
                  onClick={onNavigateToInventory}
                  className="text-left bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/15 rounded-xl px-4 py-3 transition-colors"
                >
                  <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1">
                    <span>Inventory ({stats.totalInventoryCount})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  {stats.totalInventoryValue > 0 && (
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {formatRupiah(stats.totalInventoryValue)}
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="absolute -right-14 -bottom-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}

      {/* TOTAL KEPEMILIKAN GABUNGAN (FIX ASSET & INVENTORY) */}
      {stats.combinedOwnerBreakdown.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-100 text-indigo-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
                  TOTAL KEPEMILIKAN ASET GABUNGAN (FIX ASSET &amp; INVENTORY)
                </h2>
                <p className="text-xs text-slate-500">
                  Akumulasi total nilai perolehan dan jumlah barang dari gabungan Fix Asset dan Inventory per kepemilikan
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              {stats.combinedOwnerBreakdown.length} Kepemilikan Terdaftar
            </span>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              stats.combinedOwnerBreakdown.length >= 4
                ? "xl:grid-cols-4"
                : stats.combinedOwnerBreakdown.length === 3
                ? "lg:grid-cols-3"
                : ""
            } gap-5`}
          >
            {stats.combinedOwnerBreakdown.map((owner) => {
              const accent = getOwnerAccent(owner.label);
              const pctOfCombined =
                stats.totalCombinedValue > 0
                  ? Math.round((owner.totalValue / stats.totalCombinedValue) * 100)
                  : 0;

              return (
                <div
                  key={owner.label}
                  className={`bg-white rounded-2xl p-5 border-l-4 ${accent.border} border-y border-r border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider truncate">
                        {owner.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accent.pill} shrink-0`}
                      >
                        Total {owner.totalCount} Item
                      </span>
                    </div>

                    <div className={`text-2xl font-black ${accent.text} tracking-tight mb-1`}>
                      {formatRupiah(owner.totalValue)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-3">
                      <span>{accent.subtitle}</span>
                      {pctOfCombined > 0 && (
                        <span className="font-semibold text-slate-500">{pctOfCombined}% Total Aset</span>
                      )}
                    </div>
                  </div>

                  {/* Sub-breakdown Fix Asset vs Inventory */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Fix Asset ({owner.fixCount})</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatRupiah(owner.fixValue)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <Package2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Inventory ({owner.invCount})</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatRupiah(owner.invValue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 1: RINGKASAN FIX ASSET */}
      {showFixAssetSection && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold tracking-wider text-slate-700 uppercase">
                RINGKASAN FIX ASSET
              </h2>
            </div>
            <button
              onClick={onNavigateToFixAsset}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Lihat Detail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={fixGridClass}>
            {/* Card 1: Total Item Fix Asset */}
            <div
              onClick={onNavigateToFixAsset}
              className="cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
            >
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                TOTAL ITEM FIX ASSET
              </div>
              <div className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                {stats.totalFixAssetCount} Item
              </div>
              <div className="text-xs font-medium text-slate-400">
                Unit Aktiva Tetap Terdaftar
                {stats.totalFixAssetQty > 0 &&
                  stats.totalFixAssetQty !== stats.totalFixAssetCount && (
                    <> &bull; Total Qty: {formatQty(stats.totalFixAssetQty)}</>
                  )}
              </div>
            </div>

            {/* Card 2: Total Perolehan Fix Asset */}
            {stats.totalFixAssetValue > 0 && (
              <div className="bg-[#0b172e] rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-3">
                    TOTAL PEROLEHAN FIX ASSET
                  </div>
                  <div className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-2 text-white">
                    {formatRupiah(stats.totalFixAssetValue)}
                  </div>
                  <div className="text-xs font-medium text-blue-200/70">
                    Total Nilai Perolehan Aktiva Tetap
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              </div>
            )}

            {/* Card 3: Total Nilai Buku (only when > 0) */}
            {stats.totalFixAssetNilaiBuku > 0 && (
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-emerald-600 border-y border-r border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  TOTAL NILAI BUKU SAAT INI
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold text-emerald-700 tracking-tight mb-2">
                  {formatRupiah(stats.totalFixAssetNilaiBuku)}
                </div>
                <div className="text-xs font-medium text-slate-400">
                  {stats.totalFixAssetValue > 0
                    ? `${Math.round(
                        (stats.totalFixAssetNilaiBuku / stats.totalFixAssetValue) * 100
                      )}% tersisa dari total perolehan`
                    : "Sisa Nilai Buku Aktiva"}
                </div>
              </div>
            )}

            {/* Card 4: Total Akumulasi Depresiasi (only when > 0) */}
            {stats.totalFixAssetAkumulasi > 0 && (
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-amber-500 border-y border-r border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                  <span>AKUMULASI DEPRESIASI</span>
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                  {formatRupiah(stats.totalFixAssetAkumulasi)}
                </div>
                <div className="text-xs font-medium text-slate-400 space-y-0.5">
                  {stats.totalFixAssetDepresiasi > 0 && (
                    <div>Penyusutan/bln: {formatRupiah(stats.totalFixAssetDepresiasi)}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fix Asset Breakdown Panels (only show non-empty panels) */}
          {(showPrimaryCategoryPanel || stats.fixLokasiBreakdown.length > 0 || showFixOwnerPanel) && (
            <div className={fixBreakdownGridClass}>
              {showFixOwnerPanel && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Distribusi Kepemilikan Fix Asset
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {stats.fixOwnerBreakdown.length} pemilik
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stats.fixOwnerBreakdown.slice(0, 6).map((entry) => {
                      const pct =
                        stats.totalFixAssetValue > 0
                          ? Math.max(4, Math.round((entry.value / stats.totalFixAssetValue) * 100))
                          : 0;
                      return (
                        <div key={entry.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-semibold text-slate-800 truncate">
                              {entry.label}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {entry.count} item
                              </span>
                              {entry.value > 0 && (
                                <span className="font-bold text-slate-900">
                                  {formatRupiah(entry.value)}
                                </span>
                              )}
                            </div>
                          </div>
                          {entry.value > 0 && (
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {showPrimaryCategoryPanel && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {primaryFixCategoryTitle}
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {primaryFixCategories.length} kategori
                    </span>
                  </div>
                  <div className="space-y-3">
                    {primaryFixCategories.slice(0, 6).map((entry) => {
                      const pct =
                        stats.totalFixAssetValue > 0
                          ? Math.max(4, Math.round((entry.value / stats.totalFixAssetValue) * 100))
                          : 0;
                      return (
                        <div key={entry.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-semibold text-slate-800 truncate">
                              {entry.label}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {entry.count} item
                              </span>
                              {entry.value > 0 && (
                                <span className="font-bold text-slate-900">
                                  {formatRupiah(entry.value)}
                                </span>
                              )}
                            </div>
                          </div>
                          {entry.value > 0 && (
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {stats.fixLokasiBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Distribusi Lokasi Fix Asset
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {stats.fixLokasiBreakdown.length} lokasi
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stats.fixLokasiBreakdown.slice(0, 6).map((entry) => {
                      const pct =
                        stats.totalFixAssetValue > 0
                          ? Math.max(4, Math.round((entry.value / stats.totalFixAssetValue) * 100))
                          : 0;
                      return (
                        <div key={entry.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-semibold text-slate-800 truncate">
                              {entry.label}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {entry.count} item
                              </span>
                              {entry.value > 0 && (
                                <span className="font-bold text-slate-900">
                                  {formatRupiah(entry.value)}
                                </span>
                              )}
                            </div>
                          </div>
                          {entry.value > 0 && (
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: RINGKASAN INVENTORY */}
      {showInventorySection && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-100 text-emerald-600">
                <Package2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold tracking-wider text-slate-700 uppercase">
                RINGKASAN INVENTORY
              </h2>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Lihat Detail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className={`grid grid-cols-1 ${
              stats.totalInventoryValue > 0 ? "md:grid-cols-2" : ""
            } gap-5`}
          >
            {/* Card 1: Total Item Inventory */}
            <div
              onClick={onNavigateToInventory}
              className="cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
            >
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                TOTAL ITEM INVENTORY
              </div>
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">
                {stats.totalInventoryCount} Item
              </div>
              <div className="text-xs font-medium text-slate-400">
                SKU Persediaan Terdaftar
                {stats.totalInventoryQty > 0 &&
                  Math.abs(stats.totalInventoryQty - stats.totalInventoryCount) > 0.001 && (
                    <> &bull; Total Kuantitas: {formatQty(stats.totalInventoryQty)} unit</>
                  )}
              </div>
            </div>

            {/* Card 2: Total Harga Perolehan (only if > 0) */}
            {stats.totalInventoryValue > 0 && (
              <div className="bg-[#082a24] rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10 border border-emerald-950/80 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
                    TOTAL HARGA PEROLEHAN INVENTORY
                  </div>
                  <div className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 text-white">
                    {formatRupiah(stats.totalInventoryValue)}
                  </div>
                  <div className="text-xs font-medium text-emerald-200/70">
                    {ownerSummarySubtitle}
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              </div>
            )}
          </div>

          {/* Dynamic Owner Sub-Cards (only render owners with data) */}
          {ownerWithValues.length > 0 && (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${
                ownerWithValues.length >= 4
                  ? "xl:grid-cols-4"
                  : ownerWithValues.length === 3
                  ? "lg:grid-cols-3"
                  : ""
              } gap-5`}
            >
              {ownerWithValues.map((owner) => {
                const accent = getOwnerAccent(owner.label);
                return (
                  <div
                    key={owner.label}
                    className={`bg-white rounded-2xl p-5 border-l-4 ${accent.border} border-y border-r border-slate-200 shadow-sm`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        TOTAL PEROLEHAN {owner.label.toUpperCase()}
                      </div>
                      {owner.count > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accent.pill}`}
                        >
                          {owner.count} item
                        </span>
                      )}
                    </div>
                    <div className={`text-2xl font-bold ${accent.text} tracking-tight mb-1`}>
                      {formatRupiah(owner.value)}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">{accent.subtitle}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inventory Detail Panels (only render non-empty panels) */}
          {(stats.invKondisiBreakdown.length > 0 || stats.invRoomBreakdown.length > 0) && (
            <div
              className={`grid grid-cols-1 ${
                stats.invKondisiBreakdown.length > 0 && stats.invRoomBreakdown.length > 0
                  ? "lg:grid-cols-2"
                  : ""
              } gap-5`}
            >
              {stats.invKondisiBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Kondisi Barang Inventory
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {stats.invKondisiBreakdown.reduce((s, c) => s + c.count, 0)} tercatat
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stats.invKondisiBreakdown.map((entry) => {
                      const isIssue = /(rusak|perlu|tidak|kurang)/i.test(entry.label);
                      const totalRecorded = stats.invKondisiBreakdown.reduce(
                        (s, c) => s + c.count,
                        0
                      );
                      const pct =
                        totalRecorded > 0 ? Math.round((entry.count / totalRecorded) * 100) : 0;
                      return (
                        <div
                          key={entry.label}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-2.5">
                            {isIssue ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            <div>
                              <div className="text-xs font-bold text-slate-800">{entry.label}</div>
                              {entry.value > 0 && (
                                <div className="text-[11px] text-slate-400">
                                  Nilai: {formatRupiah(entry.value)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-extrabold text-slate-900">
                              {entry.count} item
                            </div>
                            <div className="text-[11px] text-slate-400">{pct}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {stats.invRoomBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Lokasi / Ruangan Inventory Teratas
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {stats.invRoomBreakdown.length} ruangan
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stats.invRoomBreakdown.slice(0, 6).map((entry) => {
                      const pct =
                        stats.totalInventoryValue > 0
                          ? Math.max(4, Math.round((entry.value / stats.totalInventoryValue) * 100))
                          : 0;
                      return (
                        <div key={entry.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {entry.subLabel && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  {entry.subLabel}
                                </span>
                              )}
                              <span className="font-semibold text-slate-800 truncate">
                                {entry.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {entry.count} item
                              </span>
                              {entry.value > 0 && (
                                <span className="font-bold text-slate-900">
                                  {formatRupiah(entry.value)}
                                </span>
                              )}
                            </div>
                          </div>
                          {entry.value > 0 && (
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
