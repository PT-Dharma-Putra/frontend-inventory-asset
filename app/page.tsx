"use client";

import React, { useState, useEffect } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { OverviewView } from "@/components/OverviewView";
import { FixAssetView } from "@/components/FixAssetView";
import { InventoryView, MasterInventoryLokasiEntry } from "@/components/InventoryView";
import { DetailModal } from "@/components/DetailModal";
import { AssetDetailPage } from "@/components/AssetDetailPage";
import { PrintBarcodeModal } from "@/components/PrintBarcodeModal";
import { AddItemModal } from "@/components/AddItemModal";
import { EditItemModal } from "@/components/EditItemModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { LoginModal } from "@/components/LoginModal";
import { UserManagementView } from "@/components/UserManagementView";
import DivisiView from "@/components/DivisiView";
import { ImportExcelModal } from "@/components/ImportExcelModal";
import { ClearAllConfirmModal } from "@/components/ClearAllConfirmModal";
import {
  OverviewData,
  FixAssetItem,
  InventoryItem,
  User,
  DivisiItem,
  fetchOverview,
  fetchFixAssets,
  fetchInventory,
  createFixAsset,
  updateFixAsset,
  deleteFixAsset,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  clearAllInventory,
  clearAllFixAssets,
  deleteUserOption,
  getInventoryPemilik,
  getInventoryTotalHarga,
  extractJenisBarangFromNama,
  matchesJenisBarang,
  formatInventoryKodeBarang,
  extractFixAssetJenisFromNama,
  matchesFixAssetJenisBarang,
  findBestMatchingFixAssetJenis,
  normalizeItemTypo,
  canonicalizeFixAssetJenisBarang,
  formatFixAssetKodeBarang,
  getFixAssetTypeCode,
  getTypeBarangDefaultUmur,
  calculateFixAssetAutoValues,
  DEFAULT_FIX_ASSET_TYPES,
  MasterFixAssetTypeEntry,
  DEFAULT_FIX_ASSET_LOCATIONS,
  MasterFixAssetLokasiEntry,
  DEFAULT_DIVISI_OPTIONS,
  isAllDivisiValue,
  isDpsaDivisi,
  getDivisiCode,
  fetchUserOptions,
  fetchScanItem,
  generateLocationAbbreviation,
  buildRoomAbbreviation,
  resolveUniqueInventoryRoomCodes,
  getStoredUser,
  clearStoredAuth,
  fallbackOverview,
  fallbackFixAssets,
  fallbackInventory,
} from "@/lib/api";

function getDivisiStorageKey(baseKey: string, divisi?: string): string {
  const clean = (divisi || "DPSA").trim().toUpperCase();
  if (!clean || isDpsaDivisi(clean) || isAllDivisiValue(clean)) return baseKey;
  const slug = clean.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `${baseKey}__${slug || "OTHER"}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "divisi" | "fixAsset" | "inventory" | "users">("overview");
  const [fixAssetSubTab, setFixAssetSubTab] = useState<"list" | "jenisBarang" | "typeBarang" | "lokasi">("list");
  const [inventorySubTab, setInventorySubTab] = useState<"list" | "namaBarang" | "lokasi">("list");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsSmallScreen(isMobile);
    };
    handleResize();
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isEffectiveMobile = viewMode === "mobile" || isSmallScreen;
  const isSimulatedMobile = !isSmallScreen && viewMode === "mobile";

  // Master Type Barang Fix Asset (PO1: Bangunan, PO2: Peralatan Mesin, PO3: Peralatan Umum, PO4: Peralatan Kendaraan, etc.)
  const [fixAssetMasterTypes, setFixAssetMasterTypes] = useState<
    { id: number; kode: string; nama: string; isFixed: boolean }[]
  >(DEFAULT_FIX_ASSET_TYPES);

  // Master Lokasi Fix Asset (PM: Produksi Mesin, P: Purwokerto, S: Studio, KTR: Kantor, etc.)
  const [fixAssetMasterLocations, setFixAssetMasterLocations] = useState<
    { id: number; kode: string; nama: string }[]
  >([]);

  // Master Jenis Barang Fix Asset (persisted in localStorage)
  const [fixAssetCustomJenis, setFixAssetCustomJenis] = useState<string[]>([]);
  const [fixAssetMasterSlots, setFixAssetMasterSlots] = useState<{ namaBarang: string; originalName: string }[]>([]);
  const [fixAssetNamaToJenisMap, setFixAssetNamaToJenisMap] = useState<Record<string, string>>({});
  const [fixAssetMasterCleared, setFixAssetMasterCleared] = useState(false);

  // Master Nama Barang custom additions per Ruangan (persisted in localStorage)
  const [customNamaBarang, setCustomNamaBarang] = useState<{ ruangan: string; namaBarang: string }[]>([]);
  // Ordered slots for Data Nama Barang (persisted in localStorage so edits/swaps don't mutate Data Inventory)
  const [masterSlots, setMasterSlots] = useState<{ namaBarang: string; originalName: string }[]>([]);
  // Explicit mapping of Nama Barang (lowercase) -> Jenis Barang chosen in AddItemModal
  const [namaToJenisMap, setNamaToJenisMap] = useState<Record<string, string>>({});
  // Custom Ruangan additions (persisted in localStorage)
  const [customRooms, setCustomRooms] = useState<string[]>([]);
  // Master Lokasi Inventory (R.S: Studio, R.S.M: Studio dan Marketing, etc.)
  const [inventoryMasterLocations, setInventoryMasterLocations] = useState<
    { id: number; kode: string; nama: string; isManualKode?: boolean }[]
  >([]);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [superAdminDivisi, setSuperAdminDivisi] = useState<string>("ALL");
  const [availableDivisiOptions, setAvailableDivisiOptions] = useState<string[]>(DEFAULT_DIVISI_OPTIONS);
  const [divisiItems, setDivisiItems] = useState<DivisiItem[]>([]);

  const isSuperAdminOrDirektur =
    currentUser?.role === "Super Admin" || currentUser?.role === "Direktur Utama";

  const activeDivisi =
    isSuperAdminOrDirektur
      ? superAdminDivisi || "ALL"
      : currentUser?.divisi || "PT Dharma Putra Sejahtera Abadi";
  const writeDivisi = isAllDivisiValue(activeDivisi)
    ? "PT Dharma Putra Sejahtera Abadi"
    : activeDivisi;
  const defaultCodeDivisi = isAllDivisiValue(activeDivisi)
    ? "DPSA"
    : getDivisiCode(activeDivisi);

  // Data states
  const [overview, setOverview] = useState<OverviewData>(fallbackOverview);
  const [fixAssets, setFixAssets] = useState<FixAssetItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Unified available divisions from API, Menu Divisi, Asset items & User profile
  const headerDivisiOptions = React.useMemo(() => {
    const list = new Set<string>();
    const addClean = (d?: string) => {
      if (!d || isAllDivisiValue(d)) return;
      if (isDpsaDivisi(d)) {
        list.add("PT DHARMA PUTRA SEJAHTERA ABADI");
      } else {
        list.add(d.trim().toUpperCase());
      }
    };

    DEFAULT_DIVISI_OPTIONS.forEach(addClean);
    availableDivisiOptions.forEach(addClean);
    divisiItems.forEach((it) => addClean(it?.nama));
    fixAssets.forEach((it) => addClean(it?.divisi));
    inventory.forEach((it) => addClean(it?.divisi));
    addClean(currentUser?.divisi);

    if (!Array.from(list).some((d) => isDpsaDivisi(d))) {
      list.add("PT DHARMA PUTRA SEJAHTERA ABADI");
    }

    return Array.from(list);
  }, [availableDivisiOptions, divisiItems, fixAssets, inventory, currentUser]);

  // Keep cached division options in sync on client side without breaking SSR hydration
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (headerDivisiOptions.length > 0) {
      try {
        localStorage.setItem("dpsa_cached_divisi_options", JSON.stringify(headerDivisiOptions));
      } catch {}
    }
  }, [headerDivisiOptions]);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [selectedItem, setSelectedItem] = useState<FixAssetItem | InventoryItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState<"fixAsset" | "inventory">("fixAsset");
  const [scanKode, setScanKode] = useState<string | null>(null);
  const [isScanMode, setIsScanMode] = useState<boolean>(false);
  const [loadingScanItem, setLoadingScanItem] = useState<boolean>(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalType, setPrintModalType] = useState<"fixAsset" | "inventory">("fixAsset");
  const [printSelectedIds, setPrintSelectedIds] = useState<number[] | undefined>(undefined);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<"fixAsset" | "inventory">("fixAsset");
  const [defaultAddNamaBarang, setDefaultAddNamaBarang] = useState<string>("");
  const [defaultAddRuangan, setDefaultAddRuangan] = useState<string>("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<"fixAsset" | "inventory">("fixAsset");
  const [itemToEdit, setItemToEdit] = useState<FixAssetItem | InventoryItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState<"fixAsset" | "inventory">("fixAsset");
  const [itemToDelete, setItemToDelete] = useState<FixAssetItem | InventoryItem | null>(null);

  // Clear All Modal state
  const [clearAllModalState, setClearAllModalState] = useState<{
    isOpen: boolean;
    assetType: "fixAsset" | "inventory";
  }>({ isOpen: false, assetType: "fixAsset" });

  // Import Excel Modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importModalType, setImportModalType] = useState<"fixAsset" | "inventory">("fixAsset");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshDivisiOptions = async () => {
    try {
      const opts = await fetchUserOptions();
      if (Array.isArray(opts?.divisi)) {
        setAvailableDivisiOptions(opts.divisi);
      }
      if (Array.isArray(opts?.divisiItems)) {
        setDivisiItems(opts.divisiItems);
      } else if (Array.isArray(opts?.divisi)) {
        setDivisiItems(
          opts.divisi.map((nama, idx) => ({ id: idx + 1, nama, isCustom: true }))
        );
      }
    } catch {
      // ignore offline error
    }
  };

  // Check auth on mount & handle ?kode= URL scan parameter
  useEffect(() => {
    let hasUrlKode = false;
    let removePopStateListener: (() => void) | undefined;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlKode = params.get("kode");
      if (urlKode && urlKode.trim()) {
        hasUrlKode = true;
        const cleanKode = urlKode.trim();
        setScanKode(cleanKode);
        setIsScanMode(true);
        setDetailModalOpen(true);
        setLoadingScanItem(true);
        fetchScanItem(cleanKode)
          .then((res) => {
            if (res?.item) {
              setSelectedItem(res.item);
              setDetailModalType(res.type);
            }
          })
          .catch((err) => {
            showToast(`Scan barcode: ${err.message || "Barang tidak ditemukan"}`);
          })
          .finally(() => {
            setLoadingScanItem(false);
          });
      }

      const handlePopState = () => {
        const p = new URLSearchParams(window.location.search);
        const k = p.get("kode");
        if (k && k.trim()) {
          const ck = k.trim();
          setScanKode(ck);
          setIsScanMode(true);
          setDetailModalOpen(true);
          setLoadingScanItem(true);
          fetchScanItem(ck)
            .then((res) => {
              if (res?.item) {
                setSelectedItem(res.item);
                setDetailModalType(res.type);
              }
            })
            .catch(() => {})
            .finally(() => {
              setLoadingScanItem(false);
            });
        } else {
          setIsScanMode(false);
          setScanKode(null);
          setDetailModalOpen(false);
          setSelectedItem(null);
        }
      };
      window.addEventListener("popstate", handlePopState);
      removePopStateListener = () => window.removeEventListener("popstate", handlePopState);
    }

    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      setSuperAdminDivisi(
        user.role === "Super Admin" || user.role === "Direktur Utama" ? "ALL" : user.divisi || "PT Dharma Putra Sejahtera Abadi"
      );
    } else if (!hasUrlKode) {
      setLoginModalOpen(true);
    }
    try {
      const rawCached = localStorage.getItem("dpsa_cached_divisi_options");
      if (rawCached) {
        const parsed = JSON.parse(rawCached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableDivisiOptions((prev) => {
            const merged = new Set(prev);
            parsed.forEach((d) => {
              if (d && !isAllDivisiValue(d)) {
                merged.add(isDpsaDivisi(d) ? "PT DHARMA PUTRA SEJAHTERA ABADI" : String(d).trim().toUpperCase());
              }
            });
            return Array.from(merged);
          });
        }
      }
    } catch {}
    refreshDivisiOptions();
    setAuthChecked(true);

    return () => {
      if (removePopStateListener) removePopStateListener();
    };
  }, []);

  // Fallback local resolution if scan item was not found via API but exists in memory/state
  useEffect(() => {
    if (scanKode && !selectedItem && !loadingScanItem) {
      const cleanUpper = scanKode.trim().toUpperCase();
      const foundFix = fixAssets.find((f) => (f.kodeAktiva || "").trim().toUpperCase() === cleanUpper);
      if (foundFix) {
        setSelectedItem(foundFix);
        setDetailModalType("fixAsset");
        return;
      }
      const foundInv = inventory.find(
        (inv) =>
          (inv.kodeBarang || "").trim().toUpperCase() === cleanUpper ||
          (inv.kodeBarcode || "").trim().toUpperCase() === cleanUpper
      );
      if (foundInv) {
        setSelectedItem(foundInv);
        setDetailModalType("inventory");
      }
    }
  }, [scanKode, selectedItem, loadingScanItem, fixAssets, inventory]);

  // Redirect non-Super Admin out of Users tab
  useEffect(() => {
    if (authChecked && currentUser && currentUser.role !== "Super Admin" && activeTab === "users") {
      setActiveTab("overview");
    }
  }, [authChecked, currentUser, activeTab]);

  // Load Divisi-scoped Master data from localStorage
  // - DPSA / ALL retains existing localStorage data & default Fix Asset locations
  // - Other Divisi/PT start empty (except Type Barang PO1..PO4 which remain fixed & available)
  useEffect(() => {
    if (!authChecked) return;
    if (!currentUser) {
      setCustomNamaBarang([]);
      setMasterSlots([]);
      setNamaToJenisMap({});
      setCustomRooms([]);
      setFixAssetCustomJenis([]);
      setFixAssetMasterSlots([]);
      setFixAssetNamaToJenisMap({});
      setFixAssetMasterCleared(false);
      setFixAssetMasterTypes(DEFAULT_FIX_ASSET_TYPES);
      setFixAssetMasterLocations([]);
      setInventoryMasterLocations([]);
      setFixAssets([]);
      setInventory([]);
      setLoading(false);
      return;
    }
    const isDpsa =
      activeDivisi.trim().toUpperCase() === "DPSA" || isAllDivisiValue(activeDivisi);
    const keyOf = (base: string) => getDivisiStorageKey(base, activeDivisi);

    setCustomNamaBarang([]);
    setMasterSlots([]);
    setNamaToJenisMap({});
    setCustomRooms([]);
    setFixAssetCustomJenis([]);
    setFixAssetMasterSlots([]);
    setFixAssetNamaToJenisMap({});
    setFixAssetMasterCleared(false);
    setFixAssetMasterTypes(DEFAULT_FIX_ASSET_TYPES);
    setFixAssetMasterLocations(isDpsa ? DEFAULT_FIX_ASSET_LOCATIONS : []);
    setInventoryMasterLocations([]);

    try {
      const savedNames = localStorage.getItem(keyOf("dpsa_master_jenis_barang"));
      if (savedNames) {
        const parsed = JSON.parse(savedNames);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((item) => {
              if (typeof item === "string") {
                return { ruangan: isDpsa ? "Studio" : "-", namaBarang: item };
              }
              if (item && typeof item === "object" && item.namaBarang) {
                return {
                  ruangan: String(item.ruangan || (isDpsa ? "Studio" : "-")).trim(),
                  namaBarang: String(item.namaBarang).trim(),
                };
              }
              return null;
            })
            .filter(Boolean) as { ruangan: string; namaBarang: string }[];
          setCustomNamaBarang(normalized);
        }
      }
      const savedSlots = localStorage.getItem(keyOf("dpsa_master_jenis_slots"));
      if (savedSlots) {
        const parsedSlots = JSON.parse(savedSlots);
        if (Array.isArray(parsedSlots)) {
          const normalizedSlots = parsedSlots
            .map((s) => {
              if (typeof s === "string") {
                const trimmed = s.trim();
                return trimmed ? { namaBarang: trimmed, originalName: trimmed } : null;
              }
              if (s && typeof s === "object" && s.namaBarang) {
                const nama = String(s.namaBarang).trim();
                const orig = String(s.originalName || s.namaBarang).trim();
                return nama ? { namaBarang: nama, originalName: orig } : null;
              }
              return null;
            })
            .filter(Boolean) as { namaBarang: string; originalName: string }[];
          setMasterSlots(normalizedSlots);
        }
      }
      const savedNamaToJenis = localStorage.getItem(keyOf("dpsa_nama_to_jenis_map"));
      if (savedNamaToJenis) {
        const parsedMap = JSON.parse(savedNamaToJenis);
        if (parsedMap && typeof parsedMap === "object") {
          setNamaToJenisMap(parsedMap);
        }
      }
      const savedRooms = localStorage.getItem(keyOf("dpsa_custom_rooms"));
      if (savedRooms) {
        const parsedRooms = JSON.parse(savedRooms);
        if (Array.isArray(parsedRooms)) {
          setCustomRooms(
            parsedRooms
              .map((r) => String(r || "").trim())
              .filter(Boolean)
          );
        }
      }
      const savedFixCustomJenis = localStorage.getItem(keyOf("dpsa_fix_master_jenis"));
      if (savedFixCustomJenis) {
        const parsedFixJenis = JSON.parse(savedFixCustomJenis);
        if (Array.isArray(parsedFixJenis)) {
          setFixAssetCustomJenis(
            parsedFixJenis.map((j) => String(j || "").trim()).filter(Boolean)
          );
        }
      }
      const savedFixSlots = localStorage.getItem(keyOf("dpsa_fix_master_slots"));
      if (savedFixSlots) {
        const parsedFixSlots = JSON.parse(savedFixSlots);
        if (Array.isArray(parsedFixSlots)) {
          const normalizedFixSlots = parsedFixSlots
            .map((s) => {
              if (typeof s === "string") {
                const trimmed = s.trim();
                return trimmed ? { namaBarang: trimmed, originalName: trimmed } : null;
              }
              if (s && typeof s === "object" && s.namaBarang) {
                const nama = String(s.namaBarang).trim();
                const orig = String(s.originalName || s.namaBarang).trim();
                return nama ? { namaBarang: nama, originalName: orig } : null;
              }
              return null;
            })
            .filter(Boolean) as { namaBarang: string; originalName: string }[];
          setFixAssetMasterSlots(normalizedFixSlots);
        }
      }
      const savedFixNamaToJenis = localStorage.getItem(keyOf("dpsa_fix_nama_to_jenis_map"));
      if (savedFixNamaToJenis) {
        const parsedFixMap = JSON.parse(savedFixNamaToJenis);
        if (parsedFixMap && typeof parsedFixMap === "object") {
          setFixAssetNamaToJenisMap(parsedFixMap);
        }
      }
      const savedFixCleared = localStorage.getItem(keyOf("dpsa_fix_master_cleared"));
      if (savedFixCleared === "true") {
        setFixAssetMasterCleared(true);
      }
      const savedFixTypes = localStorage.getItem(keyOf("dpsa_fix_master_types"));
      if (savedFixTypes) {
        const parsedFixTypes = JSON.parse(savedFixTypes);
        if (Array.isArray(parsedFixTypes) && parsedFixTypes.length >= 4) {
          setFixAssetMasterTypes(parsedFixTypes);
        }
      }
      const savedFixLocations = localStorage.getItem(keyOf("dpsa_fix_master_locations"));
      if (savedFixLocations) {
        const parsedLocs = JSON.parse(savedFixLocations);
        if (Array.isArray(parsedLocs) && parsedLocs.length > 0) {
          setFixAssetMasterLocations(parsedLocs);
        }
      }
      const savedInvLocations = localStorage.getItem(keyOf("dpsa_inv_master_locations"));
      if (savedInvLocations) {
        const parsedInvLocs = JSON.parse(savedInvLocations);
        if (Array.isArray(parsedInvLocs) && parsedInvLocs.length > 0) {
          setInventoryMasterLocations(resolveUniqueInventoryRoomCodes(parsedInvLocs));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [authChecked, currentUser, activeDivisi]);

  // Reload data from backend / MySQL scoped by activeDivisi
  const loadData = async (targetDivisi = activeDivisi) => {
    setLoading(true);
    setFixAssets([]);
    setInventory([]);
    try {
      const [ovData, faData, invData] = await Promise.all([
        fetchOverview(targetDivisi),
        fetchFixAssets("", "", "", targetDivisi),
        fetchInventory("", targetDivisi),
      ]);
      setOverview(ovData);
      setFixAssets(faData.data);
      setInventory(invData.data);

      // Clean up any stale leaked inventory master locations if new non-DPSA divisi has 0 items and 0 custom rooms
      const upperTarget = (targetDivisi || "DPSA").trim().toUpperCase();
      if (upperTarget !== "DPSA" && !isAllDivisiValue(upperTarget) && invData.data.length === 0) {
        try {
          const savedRooms = localStorage.getItem(getDivisiStorageKey("dpsa_custom_rooms", targetDivisi));
          const parsedRooms = savedRooms ? JSON.parse(savedRooms) : [];
          if (!Array.isArray(parsedRooms) || parsedRooms.length === 0) {
            setInventoryMasterLocations([]);
            localStorage.removeItem(getDivisiStorageKey("dpsa_inv_master_locations", targetDivisi));
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn("Could not load from backend, using fallback data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecked || !currentUser) return;
    loadData(activeDivisi);
  }, [authChecked, currentUser, activeDivisi]);

  // Sync unique locations from Fix Asset items into Master Lokasi so imported/existing locations populate Data Lokasi
  useEffect(() => {
    if (loading || !currentUser || !fixAssets || fixAssets.length === 0) return;
    const isAll = isAllDivisiValue(activeDivisi);
    const activeUpper = activeDivisi.trim().toUpperCase();
    const scopedFixAssets = isAll
      ? fixAssets
      : fixAssets.filter((it) => (it.divisi || "DPSA").trim().toUpperCase() === activeUpper);
    if (scopedFixAssets.length === 0) return;

    const uniqueLocations: string[] = [];
    const seenLoc = new Set<string>();
    scopedFixAssets.forEach((it) => {
      const loc = (it.lokasi || "").trim();
      if (loc && loc !== "-" && !seenLoc.has(loc.toLowerCase())) {
        uniqueLocations.push(loc);
        seenLoc.add(loc.toLowerCase());
      }
    });

    if (uniqueLocations.length === 0) return;

    setFixAssetMasterLocations((prev) => {
      const existingNames = new Set(prev.map((l) => l.nama.toLowerCase()));
      const existingCodes = new Set(prev.map((l) => l.kode.toUpperCase()));
      let nextId = prev.length > 0 ? Math.max(...prev.map((l) => l.id)) : 0;
      const toAdd: { id: number; kode: string; nama: string }[] = [];

      uniqueLocations.forEach((locName) => {
        if (!existingNames.has(locName.toLowerCase())) {
          existingNames.add(locName.toLowerCase());
          nextId += 1;
          let abbr = generateLocationAbbreviation(locName);
          if (existingCodes.has(abbr)) {
            let suffix = 2;
            while (existingCodes.has(`${abbr}${suffix}`)) {
              suffix += 1;
            }
            abbr = `${abbr}${suffix}`;
          }
          existingCodes.add(abbr);
          toAdd.push({ id: nextId, kode: abbr, nama: locName });
        }
      });

      if (toAdd.length === 0) return prev;
      const next = [...prev, ...toAdd];
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_locations", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [fixAssets, activeDivisi, loading, currentUser]);

  // Sync unique locations from Inventory items & customRooms into Inventory Master Lokasi
  useEffect(() => {
    if (loading || !currentUser) return;
    const isAll = isAllDivisiValue(activeDivisi);
    const activeUpper = activeDivisi.trim().toUpperCase();
    const scopedInventory = isAll
      ? inventory
      : inventory.filter((it) => (it.divisi || "DPSA").trim().toUpperCase() === activeUpper);

    const uniqueRooms: string[] = [];
    const seen = new Set<string>();
    scopedInventory.forEach((it) => {
      const room = (it.ruangan || "").trim();
      if (room && room !== "-" && !seen.has(room.toLowerCase())) {
        uniqueRooms.push(room);
        seen.add(room.toLowerCase());
      }
    });
    customRooms.forEach((r) => {
      const room = (r || "").trim();
      if (room && room !== "-" && !seen.has(room.toLowerCase())) {
        uniqueRooms.push(room);
        seen.add(room.toLowerCase());
      }
    });

    if (uniqueRooms.length === 0) return;

    setInventoryMasterLocations((prev) => {
      const existingNames = new Set(prev.map((l) => l.nama.toLowerCase()));
      let nextId = prev.length > 0 ? Math.max(...prev.map((l) => l.id)) : 0;
      const toAdd: { id: number; kode: string; nama: string; isManualKode?: boolean }[] = [];

      uniqueRooms.forEach((locName) => {
        if (!existingNames.has(locName.toLowerCase())) {
          existingNames.add(locName.toLowerCase());
          nextId += 1;
          const abbr = buildRoomAbbreviation(locName);
          toAdd.push({
            id: nextId,
            kode: abbr && abbr !== "-" ? abbr : `R.${locName[0]?.toUpperCase() || "X"}`,
            nama: locName,
          });
        }
      });

      const resolved = resolveUniqueInventoryRoomCodes([...prev, ...toAdd]);
      const changed =
        resolved.length !== prev.length ||
        resolved.some((r, idx) => r.kode !== prev[idx]?.kode || r.nama !== prev[idx]?.nama);
      if (!changed) return prev;

      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_inv_master_locations", activeDivisi), JSON.stringify(resolved));
      } catch {
        // ignore
      }
      return resolved;
    });
  }, [inventory, customRooms, activeDivisi, loading, currentUser]);

  // Authentication Handlers
  const handleLoginSuccess = (user: User) => {
    const isSuperOrDirektur = user.role === "Super Admin" || user.role === "Direktur Utama";
    const targetDiv = isSuperOrDirektur ? "ALL" : user.divisi || "DPSA";
    setCurrentUser(user);
    setSuperAdminDivisi(targetDiv);
    if (user.role !== "Super Admin" && activeTab === "users") {
      setActiveTab("overview");
    }
    setLoginModalOpen(false);
    showToast(
      `Selamat datang kembali, ${user.nama}! (${
        isSuperOrDirektur ? "Semua Divisi" : targetDiv
      })`
    );
    refreshDivisiOptions();
    loadData(targetDiv);
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      clearStoredAuth();
      setCurrentUser(null);
      setSuperAdminDivisi("ALL");
      setActiveTab("overview");
      setLoginModalOpen(true);
      showToast("Anda telah keluar dari sistem.");
    }
  };

  // Detail Page / Modal Handlers (Navigates to ?kode=... and renders dedicated page)
  const handleOpenDetail = (item: FixAssetItem | InventoryItem, type: "fixAsset" | "inventory") => {
    const code =
      type === "fixAsset"
        ? (item as FixAssetItem).kodeAktiva
        : ((item as InventoryItem).kodeBarang || (item as InventoryItem).kodeBarcode);
    setSelectedItem(item);
    setDetailModalType(type);
    setScanKode(code || null);
    setIsScanMode(true);
    setDetailModalOpen(true);

    if (typeof window !== "undefined" && code) {
      const targetUrl = `/?kode=${encodeURIComponent(code)}`;
      window.history.pushState({ kode: code }, "", targetUrl);
    }
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setIsScanMode(false);
    setScanKode(null);
    setSelectedItem(null);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", window.location.pathname);
    }
  };

  const handleOpenDashboardFromScan = () => {
    setIsScanMode(false);
    setScanKode(null);
    setDetailModalOpen(false);
    setSelectedItem(null);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", window.location.pathname);
    }
    const user = getStoredUser();
    if (!user) {
      setLoginModalOpen(true);
    }
  };

  const handleOpenPrint = (type: "fixAsset" | "inventory", selectedIds?: number[]) => {
    setPrintModalType(type);
    setPrintSelectedIds(selectedIds && selectedIds.length > 0 ? selectedIds : undefined);
    setPrintModalOpen(true);
  };

  const handleOpenAddNew = (
    type: "fixAsset" | "inventory",
    defaultNama?: string,
    defaultRuang?: string
  ) => {
    setAddModalType(type);
    setDefaultAddNamaBarang(defaultNama || "");
    setDefaultAddRuangan(defaultRuang || "");
    setAddModalOpen(true);
  };

  // Compute unified Master Jenis Barang list & formatted Inventory items with Kode Barang:
  // INVNT/(Pemilik)/(Singkatan Ruang).(ID Jenis Barang).(No Urut)/(Tahun Perolehan)
  // Example: INVNT/DPSA/R.S.M.1.1/2024
  const { masterNamaBarang, formattedInventory } = React.useMemo(() => {
    // 1. Start with persisted slots (manual additions / edits / swaps),
    //    preserving user custom slots while migrating legacy English synonyms ("Single", "Single Chair" -> "Kursi")
    const effectiveSlots: { namaBarang: string; originalName: string; isCustom: boolean }[] = [];
    const coveredKeys = new Set<string>();

    masterSlots.forEach((s) => {
      const rawNama = (s.namaBarang || "").trim();
      const rawOrig = (s.originalName || s.namaBarang || "").trim();
      if (!rawNama || rawNama === "-") return;

      let finalNama = rawNama;
      let finalOrig = rawOrig;
      if (/^single(\s+chair)?$/i.test(rawNama)) {
        finalNama = "Kursi";
      }
      if (/^single(\s+chair)?$/i.test(rawOrig)) {
        finalOrig = "Kursi";
      }

      const key = finalNama.toLowerCase();
      if (!coveredKeys.has(key)) {
        effectiveSlots.push({
          namaBarang: finalNama,
          originalName: finalOrig,
          isCustom: true,
        });
        coveredKeys.add(key);
        coveredKeys.add(finalOrig.toLowerCase());
      }
    });

    // 2. Include any custom Jenis Barang entries not yet in effectiveSlots
    customNamaBarang.forEach((entry) => {
      const rawJenis = (entry.namaBarang || "").trim();
      if (!rawJenis || rawJenis === "-") return;
      let jenis = rawJenis;
      if (/^single(\s+chair)?$/i.test(rawJenis)) {
        jenis = "Kursi";
      }
      const key = jenis.toLowerCase();
      if (!coveredKeys.has(key)) {
        effectiveSlots.push({
          namaBarang: jenis,
          originalName: jenis,
          isCustom: true,
        });
        coveredKeys.add(key);
      }
    });

    // 3. Scan inventory items: either match to an existing Jenis Barang slot (longest keyword match first)
    //    or extract concise Jenis Barang from Nama Barang (e.g. "Meja Kerja" -> "Meja")
    inventory.forEach((it) => {
      const rawName = normalizeItemTypo((it.namaBarang || "").trim());
      if (!rawName || rawName === "-") return;

      const matchedExisting = effectiveSlots.some(
        (slot) =>
          matchesJenisBarang(rawName, slot.namaBarang) ||
          matchesJenisBarang(rawName, slot.originalName)
      );
      if (matchedExisting) return;

      const extractedJenis = extractJenisBarangFromNama(rawName);
      if (!extractedJenis || extractedJenis === "-") return;
      const key = extractedJenis.toLowerCase();
      if (!coveredKeys.has(key)) {
        effectiveSlots.push({
          namaBarang: extractedJenis,
          originalName: extractedJenis,
          isCustom: false,
        });
        coveredKeys.add(key);
      }
    });

    // 4. Group inventory items into their best-matching Jenis Barang slot (longest match wins)
    const slotStats = effectiveSlots.map(() => ({
      kodeBarangList: [] as string[],
      ruanganList: [] as string[],
      count: 0,
    }));

    // Order slot indices by keyword length descending so specific Jenis Barang (e.g. "Meja Rapat") matches before "Meja"
    const sortedSlotIndices = effectiveSlots
      .map((_, idx) => idx)
      .sort(
        (a, b) =>
          effectiveSlots[b].namaBarang.length - effectiveSlots[a].namaBarang.length
      );

    // Sequence counter per (ruangan, jenisSlotIdx) so each item in a room gets .1, .2, .3...
    const roomJenisSeqMap = new Map<string, number>();

    const nextFormattedInventory = inventory.map((it) => {
      const rawName = (it.namaBarang || "").trim();
      const ruang = (it.ruangan || "").trim();
      if (!rawName || rawName === "-") return it;

      const explicitJenis =
        (it.jenisBarang || "").trim() ||
        (namaToJenisMap[rawName.toLowerCase()] || "").trim();
      const matchCandidate = explicitJenis || rawName;

      let matchedIdx = sortedSlotIndices.find((idx) =>
        matchesJenisBarang(matchCandidate, effectiveSlots[idx].namaBarang)
      );
      if (matchedIdx === undefined) {
        matchedIdx = sortedSlotIndices.find((idx) =>
          matchesJenisBarang(matchCandidate, effectiveSlots[idx].originalName)
        );
      }

      if (matchedIdx !== undefined) {
        const jenisId = matchedIdx + 1;
        const seqKey = `${ruang.toLowerCase()}__${jenisId}`;
        const nextSeq = (roomJenisSeqMap.get(seqKey) || 0) + 1;
        roomJenisSeqMap.set(seqKey, nextSeq);

        const matchedRoomLoc = inventoryMasterLocations.find(
          (l) => l.nama.trim().toLowerCase() === ruang.toLowerCase()
        );
        const formattedKode = formatInventoryKodeBarang(
          it,
          jenisId,
          nextSeq,
          matchedRoomLoc?.kode,
          it.divisi || defaultCodeDivisi
        );

        const st = slotStats[matchedIdx];
        st.count += 1;
        if (formattedKode && !st.kodeBarangList.includes(formattedKode)) {
          st.kodeBarangList.push(formattedKode);
        }
        if (
          ruang &&
          ruang !== "-" &&
          !st.ruanganList.some((r) => r.toLowerCase() === ruang.toLowerCase())
        ) {
          st.ruanganList.push(ruang);
        }

        return {
          ...it,
          jenisBarang: it.jenisBarang || effectiveSlots[matchedIdx].namaBarang,
          namaBarang: normalizeItemTypo(it.namaBarang || ""),
          kodeBarang: formattedKode,
          kodeBarcode: formattedKode,
        };
      }

      return {
        ...it,
        jenisBarang: it.jenisBarang || extractJenisBarangFromNama(it.namaBarang) || "-",
        namaBarang: normalizeItemTypo(it.namaBarang || ""),
      };
    });

    const masterList = effectiveSlots.map((slot, idx) => {
      const st = slotStats[idx];
      return {
        id: idx + 1,
        ruangan: st.ruanganList.length > 0 ? st.ruanganList.join(", ") : "-",
        ruanganList: st.ruanganList,
        kodeBarang: st.kodeBarangList.length > 0 ? st.kodeBarangList[0] : "-",
        kodeBarangList: st.kodeBarangList,
        namaBarang: slot.namaBarang,
        originalName: slot.originalName,
        count: st.count,
        isCustom: st.count === 0 ? true : slot.isCustom,
      };
    });

    return {
      masterNamaBarang: masterList,
      formattedInventory: nextFormattedInventory,
    };
  }, [inventory, customNamaBarang, masterSlots, namaToJenisMap, inventoryMasterLocations, defaultCodeDivisi]);

  // Compute Master Jenis Barang for Fix Asset & formatted Fix Assets with Kode Barang:
  // FA/Tipe Barang/Kode Barang/Bln Perolehan/DPSA/Th Perolehan/Lokasi
  const { masterFixAssetJenis, formattedFixAssets } = React.useMemo(() => {
    const effectiveSlots: { namaBarang: string; originalName: string; isCustom: boolean }[] = [];
    const coveredKeys = new Set<string>();

    // 1. Start with persisted slots (manual additions / edits / swaps)
    //    Keep user-defined names exactly as entered so manual categories (e.g. ID #5, #6, #7) are preserved
    fixAssetMasterSlots.forEach((s) => {
      const trimmedNama = (s.namaBarang || "").trim();
      const trimmedOrig = (s.originalName || s.namaBarang || "").trim();
      if (!trimmedNama || trimmedNama === "-") return;

      const key = trimmedNama.toLowerCase();
      if (!coveredKeys.has(key)) {
        effectiveSlots.push({
          namaBarang: trimmedNama,
          originalName: trimmedOrig,
          isCustom: true,
        });
        coveredKeys.add(key);
        if (trimmedOrig) {
          coveredKeys.add(trimmedOrig.toLowerCase());
        }
      }
    });

    // 2. Include any custom Jenis Barang entries not yet in effectiveSlots
    fixAssetCustomJenis.forEach((rawJenis) => {
      const trimmed = (rawJenis || "").trim();
      if (!trimmed || trimmed === "-") return;
      const key = trimmed.toLowerCase();
      if (!coveredKeys.has(key)) {
        effectiveSlots.push({
          namaBarang: trimmed,
          originalName: trimmed,
          isCustom: true,
        });
        coveredKeys.add(key);
      }
    });

    // 2.5. Include explicit jenisBarang from Fix Asset items if not yet covered
    if (!fixAssetMasterCleared) {
      fixAssets.forEach((it) => {
        let explicitJenis = canonicalizeFixAssetJenisBarang(
          normalizeItemTypo((it.jenisBarang || "").trim())
        );
        if (explicitJenis && it.jenisBarang !== explicitJenis && (it.jenisBarang || "").toLowerCase() === "lenovo") {
          it.jenisBarang = explicitJenis;
        }
        if (!explicitJenis || explicitJenis === "-") return;
        const key = explicitJenis.toLowerCase();
        if (!coveredKeys.has(key)) {
          effectiveSlots.push({
            namaBarang: explicitJenis,
            originalName: explicitJenis,
            isCustom: true,
          });
          coveredKeys.add(key);
        }
      });
    }

    // 3. Scan Fix Asset items and auto-extract Jenis Barang ONLY if no slots defined and not cleared
    if (!fixAssetMasterCleared && fixAssetMasterSlots.length === 0) {
      fixAssets.forEach((it) => {
        const rawName = normalizeItemTypo((it.namaAktivaTetap || "").trim());
        if (!rawName || rawName === "-") return;

        const matchedExisting = effectiveSlots.some(
          (slot) =>
            matchesFixAssetJenisBarang(rawName, slot.namaBarang) ||
            matchesFixAssetJenisBarang(rawName, slot.originalName)
        );
        if (matchedExisting) return;

        const extractedJenis = extractFixAssetJenisFromNama(rawName);
        if (!extractedJenis || extractedJenis === "-") return;
        const key = extractedJenis.toLowerCase();
        if (!coveredKeys.has(key)) {
          effectiveSlots.push({
            namaBarang: extractedJenis,
            originalName: extractedJenis,
            isCustom: false,
          });
          coveredKeys.add(key);
        }
      });
    }

    const slotStats = effectiveSlots.map(() => ({
      kodeBarangList: [] as string[],
      lokasiList: [] as string[],
      count: 0,
    }));

    const sortedSlotIndices = effectiveSlots
      .map((_, idx) => idx)
      .sort(
        (a, b) =>
          effectiveSlots[b].namaBarang.length - effectiveSlots[a].namaBarang.length
      );

    // First pass: find matched slot index for each Fix Asset & count items per (lokasi, jenisId)
    const itemMatchedSlot: (number | undefined)[] = [];
    const lokasiJenisTotalMap = new Map<string, number>();

    fixAssets.forEach((it, itemIdx) => {
      const rawName = normalizeItemTypo((it.namaAktivaTetap || "").trim());
      const lok = (it.lokasi || "").trim().toLowerCase();
      if (!rawName || rawName === "-") {
        itemMatchedSlot[itemIdx] = undefined;
        return;
      }

      const explicitJenis =
        canonicalizeFixAssetJenisBarang((it.jenisBarang || "").trim()) ||
        (fixAssetNamaToJenisMap[rawName.toLowerCase()] || "").trim();
      const matchCandidate = explicitJenis || rawName;

      // Use intelligent scoring: best matching slot wins (e.g. "Mesin Felder" matches "Mesin Felder" over "Mesin")
      const candidateList = effectiveSlots.map((slot, idx) => ({
        idx,
        namaBarang: slot.namaBarang,
        originalName: slot.originalName,
      }));
      const best = findBestMatchingFixAssetJenis(matchCandidate, candidateList);
      let matchedIdx = best ? best.item.idx : undefined;

      itemMatchedSlot[itemIdx] = matchedIdx;
      if (matchedIdx !== undefined) {
        const jenisId = matchedIdx + 1;
        const seqKey = `${lok}__${jenisId}`;
        lokasiJenisTotalMap.set(seqKey, (lokasiJenisTotalMap.get(seqKey) || 0) + 1);
      }
    });

    const lokasiJenisSeqMap = new Map<string, number>();

    const nextFormattedFixAssets = fixAssets.map((it, itemIdx) => {
      const matchedIdx = itemMatchedSlot[itemIdx];
      if (matchedIdx !== undefined) {
        const jenisId = matchedIdx + 1;
        const lok = (it.lokasi || "").trim();
        const seqKey = `${lok.toLowerCase()}__${jenisId}`;
        const nextSeq = (lokasiJenisSeqMap.get(seqKey) || 0) + 1;
        lokasiJenisSeqMap.set(seqKey, nextSeq);
        const totalInLok = lokasiJenisTotalMap.get(seqKey) || 1;

        const formattedKode = formatFixAssetKodeBarang(
          it,
          jenisId,
          nextSeq,
          totalInLok,
          fixAssetMasterTypes,
          fixAssetMasterLocations,
          it.divisi || defaultCodeDivisi
        );

        const st = slotStats[matchedIdx];
        st.count += 1;
        if (formattedKode && !st.kodeBarangList.includes(formattedKode)) {
          st.kodeBarangList.push(formattedKode);
        }
        if (
          lok &&
          lok !== "-" &&
          !st.lokasiList.some((l) => l.toLowerCase() === lok.toLowerCase())
        ) {
          st.lokasiList.push(lok);
        }

        const autoValues = calculateFixAssetAutoValues({
          ...it,
          kodeAktiva: formattedKode,
          jenisBarang: it.jenisBarang || effectiveSlots[matchedIdx]?.namaBarang || "-",
        });

        return {
          ...it,
          namaAktivaTetap: normalizeItemTypo(it.namaAktivaTetap || ""),
          kodeAktiva: formattedKode,
          jenisBarang: it.jenisBarang || effectiveSlots[matchedIdx]?.namaBarang || "-",
          ...autoValues,
        };
      }
      const autoValues = calculateFixAssetAutoValues(it);
      return {
        ...it,
        namaAktivaTetap: normalizeItemTypo(it.namaAktivaTetap || ""),
        jenisBarang: it.jenisBarang || "-",
        ...autoValues,
      };
    });

    const masterList = effectiveSlots.map((slot, idx) => {
      const st = slotStats[idx];
      return {
        id: idx + 1,
        ruangan: st.lokasiList.length > 0 ? st.lokasiList.join(", ") : "-",
        ruanganList: st.lokasiList,
        kodeBarang: st.kodeBarangList.length > 0 ? st.kodeBarangList[0] : "-",
        kodeBarangList: st.kodeBarangList,
        namaBarang: slot.namaBarang,
        originalName: slot.originalName,
        count: st.count,
        isCustom: st.count === 0 ? true : slot.isCustom,
      };
    });

    return {
      masterFixAssetJenis: masterList,
      formattedFixAssets: nextFormattedFixAssets,
    };
  }, [
    fixAssets,
    fixAssetCustomJenis,
    fixAssetMasterSlots,
    fixAssetNamaToJenisMap,
    fixAssetMasterTypes,
    fixAssetMasterLocations,
    fixAssetMasterCleared,
    defaultCodeDivisi,
  ]);

  // Compute unified Master Type Barang Fix Asset (PO1 - seterusnya)
  const masterFixAssetTypes: MasterFixAssetTypeEntry[] = React.useMemo(() => {
    return fixAssetMasterTypes.map((typeEntry) => {
      const matchingItems = formattedFixAssets.filter((item) => {
        const code = getFixAssetTypeCode(item.typeAktiva, item.kodeAktiva, fixAssetMasterTypes);
        return code.toUpperCase() === typeEntry.kode.toUpperCase();
      });
      const kodeList = Array.from(
        new Set(
          matchingItems
            .map((it) => it.kodeAktiva)
            .filter((k): k is string => Boolean(k && k !== "-"))
        )
      );
      const umur = getTypeBarangDefaultUmur(typeEntry.kode || typeEntry.nama);
      return {
        id: typeEntry.id,
        kode: typeEntry.kode,
        nama: typeEntry.nama,
        namaBarang: typeEntry.nama,
        count: matchingItems.length,
        kodeBarangList: kodeList,
        isFixed: typeEntry.isFixed ?? (typeEntry.id <= 4),
        umurThn: (typeEntry as { umurThn?: number }).umurThn || umur.umurThn,
        umurBln: (typeEntry as { umurBln?: number }).umurBln || umur.umurBln,
      };
    });
  }, [fixAssetMasterTypes, formattedFixAssets]);

  const handleAddMasterFixAssetType = (nama: string) => {
    const rawNames = (nama || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawNames.length === 0) return;

    const existingLower = new Set(
      fixAssetMasterTypes.map((t) => t.nama.toLowerCase())
    );

    const added: { id: number; kode: string; nama: string; isFixed: boolean }[] = [];
    let nextIdx = fixAssetMasterTypes.length;

    for (const candidate of rawNames) {
      if (!existingLower.has(candidate.toLowerCase())) {
        existingLower.add(candidate.toLowerCase());
        nextIdx += 1;
        added.push({
          id: nextIdx,
          kode: `PO${nextIdx}`,
          nama: candidate,
          isFixed: false,
        });
      }
    }

    if (added.length === 0) {
      const firstExisting = fixAssetMasterTypes.find(
        (e) => e.nama.toLowerCase() === rawNames[0].toLowerCase()
      );
      if (firstExisting) {
        showToast(
          `Type barang "${firstExisting.nama}" sudah terdaftar dengan kode ${firstExisting.kode}.`
        );
      }
      return;
    }

    const nextList = [...fixAssetMasterTypes, ...added];
    setFixAssetMasterTypes(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_types", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }

    if (added.length === 1) {
      showToast(
        `Type barang "${added[0].nama}" berhasil ditambahkan dengan kode ${added[0].kode}!`
      );
    } else {
      showToast(
        `${added.length} Type barang berhasil ditambahkan (${added[0].kode} – ${added[added.length - 1].kode})!`
      );
    }
  };

  const handleEditMasterFixAssetType = (targetId: number, newNama: string) => {
    const trimmedNew = (newNama || "").trim();
    if (!trimmedNew) return;

    const targetIdx = fixAssetMasterTypes.findIndex((t) => t.id === targetId);
    if (targetIdx === -1) return;

    const oldEntry = fixAssetMasterTypes[targetIdx];
    if (oldEntry.nama.toLowerCase() === trimmedNew.toLowerCase()) return;

    const other = fixAssetMasterTypes.find(
      (t) => t.id !== targetId && t.nama.toLowerCase() === trimmedNew.toLowerCase()
    );
    if (other) {
      showToast(
        `Type barang "${trimmedNew}" sudah terdaftar pada kode ${other.kode}. Silakan gunakan nama lain.`
      );
      return;
    }

    const nextList = [...fixAssetMasterTypes];
    nextList[targetIdx] = {
      ...oldEntry,
      nama: trimmedNew,
    };

    setFixAssetMasterTypes(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_types", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }

    setFixAssets((prev) =>
      prev.map((it) => {
        if (
          it.typeAktiva &&
          it.typeAktiva.toLowerCase() === oldEntry.nama.toLowerCase()
        ) {
          return { ...it, typeAktiva: trimmedNew };
        }
        return it;
      })
    );

    showToast(
      `Nama type barang pada kode ${oldEntry.kode} berhasil diubah menjadi "${trimmedNew}".`
    );
  };

  const handleDeleteMasterFixAssetType = (targetId: number) => {
    const entry = fixAssetMasterTypes.find((t) => t.id === targetId);
    if (!entry) return;
    if (entry.isFixed) {
      showToast(
        `Type barang ${entry.kode} (${entry.nama}) adalah type tetap dan tidak dapat dihapus.`
      );
      return;
    }

    const nextList = fixAssetMasterTypes.filter((t) => t.id !== targetId);
    setFixAssetMasterTypes(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_types", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }

    showToast(`Type barang ${entry.kode} ("${entry.nama}") berhasil dihapus.`);
  };

  // Compute unified Master Lokasi Fix Asset (PM, P, S, KTR, ...)
  const masterFixAssetLokasi: MasterFixAssetLokasiEntry[] = React.useMemo(() => {
    return fixAssetMasterLocations.map((locEntry) => {
      const locUpper = locEntry.nama.toUpperCase();
      const codeUpper = locEntry.kode.toUpperCase();
      const matchingItems = formattedFixAssets.filter((item) => {
        const itLoc = (item.lokasi || "").trim().toUpperCase();
        const itKode = (item.kodeAktiva || "").trim().toUpperCase();
        const parts = itKode.split("/").filter(Boolean);
        const lastSeg = parts.length >= 7 ? parts[6].replace(/\.\d+$/, "") : "";
        return (
          itLoc === locUpper ||
          itLoc === codeUpper ||
          itLoc.includes(locUpper) ||
          locUpper.includes(itLoc) ||
          lastSeg === codeUpper
        );
      });
      const kodeList = Array.from(
        new Set(
          matchingItems
            .map((it) => it.kodeAktiva)
            .filter((k): k is string => Boolean(k && k !== "-"))
        )
      );
      return {
        id: locEntry.id,
        kode: locEntry.kode,
        nama: locEntry.nama,
        count: matchingItems.length,
        kodeBarangList: kodeList,
      };
    });
  }, [fixAssetMasterLocations, formattedFixAssets]);

  const handleAddMasterFixAssetLokasi = (kode: string, nama: string) => {
    const trimmedKode = kode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const trimmedNama = nama.trim();
    if (!trimmedKode || !trimmedNama) {
      showToast("Kode dan Nama Lokasi wajib diisi!");
      return;
    }

    const exists = fixAssetMasterLocations.some(
      (l) =>
        l.kode.toUpperCase() === trimmedKode ||
        l.nama.toLowerCase() === trimmedNama.toLowerCase()
    );
    if (exists) {
      showToast(
        `Lokasi dengan kode "${trimmedKode}" atau nama "${trimmedNama}" sudah ada.`
      );
      return;
    }

    const nextId =
      fixAssetMasterLocations.length > 0
        ? Math.max(...fixAssetMasterLocations.map((l) => l.id)) + 1
        : 1;
    const nextList = [
      ...fixAssetMasterLocations,
      { id: nextId, kode: trimmedKode, nama: trimmedNama },
    ];
    setFixAssetMasterLocations(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_locations", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }
    showToast(
      `Lokasi "${trimmedNama}" (${trimmedKode}) berhasil ditambahkan ke Master Lokasi Fix Asset.`
    );
  };

  const handleEditMasterFixAssetLokasi = (
    id: number,
    newKode: string,
    newNama: string
  ) => {
    const trimmedKode = newKode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const trimmedNama = newNama.trim();
    if (!trimmedKode || !trimmedNama) {
      showToast("Kode dan Nama Lokasi tidak boleh kosong!");
      return;
    }

    const targetIdx = fixAssetMasterLocations.findIndex((l) => l.id === id);
    if (targetIdx === -1) return;

    const oldEntry = fixAssetMasterLocations[targetIdx];
    const conflict = fixAssetMasterLocations.find(
      (l) =>
        l.id !== id &&
        (l.kode.toUpperCase() === trimmedKode ||
          l.nama.toLowerCase() === trimmedNama.toLowerCase())
    );
    if (conflict) {
      showToast(
        `Kode "${trimmedKode}" atau nama "${trimmedNama}" sudah digunakan oleh lokasi lain.`
      );
      return;
    }

    const nextList = [...fixAssetMasterLocations];
    nextList[targetIdx] = { id, kode: trimmedKode, nama: trimmedNama };
    setFixAssetMasterLocations(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_locations", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }

    // Also update existing fixAssets in state if they match old location name or code
    setFixAssets((prev) =>
      prev.map((it) => {
        if (
          it.lokasi &&
          (it.lokasi.toLowerCase() === oldEntry.nama.toLowerCase() ||
            it.lokasi.toUpperCase() === oldEntry.kode.toUpperCase())
        ) {
          return { ...it, lokasi: trimmedNama };
        }
        return it;
      })
    );

    showToast(
      `Lokasi berhasil diperbarui menjadi "${trimmedNama}" (${trimmedKode}).`
    );
  };

  const handleDeleteMasterFixAssetLokasi = (id: number) => {
    const entry = fixAssetMasterLocations.find((l) => l.id === id);
    if (!entry) return;

    const nextList = fixAssetMasterLocations.filter((l) => l.id !== id);
    setFixAssetMasterLocations(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_locations", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }
    showToast(`Lokasi "${entry.nama}" (${entry.kode}) berhasil dihapus.`);
  };

  const handleClearAllMasterFixAssetLokasi = () => {
    if (masterFixAssetLokasi.length === 0) {
      showToast("Daftar lokasi Fix Asset sudah kosong.");
      return;
    }
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus semua (${masterFixAssetLokasi.length}) data lokasi Fix Asset? Tindakan ini akan mengosongkan seluruh daftar lokasi Fix Asset.`
      )
    ) {
      return;
    }

    setFixAssetMasterLocations([]);
    try {
      localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_locations", activeDivisi));
    } catch {
      // ignore
    }
    showToast("Semua data lokasi Fix Asset berhasil dihapus.");
  };

  const handleAddMasterFixAssetJenis = (nama: string) => {
    const rawNames = (nama || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawNames.length === 0) return;

    const currentSlots = masterFixAssetJenis.map((entry) => ({
      namaBarang: entry.namaBarang,
      originalName: entry.originalName || entry.namaBarang,
    }));

    const existingLower = new Set(
      currentSlots.map((s) => s.namaBarang.toLowerCase())
    );

    const addedNames: string[] = [];
    for (const candidate of rawNames) {
      const lower = candidate.toLowerCase();
      if (!existingLower.has(lower)) {
        existingLower.add(lower);
        addedNames.push(candidate);
      }
    }

    if (addedNames.length === 0) {
      const firstExisting = masterFixAssetJenis.find(
        (e) => e.namaBarang.toLowerCase() === rawNames[0].toLowerCase()
      );
      if (firstExisting) {
        showToast(
          `Jenis barang Fix Asset "${firstExisting.namaBarang}" sudah terdaftar pada ID #${firstExisting.id}.`
        );
      }
      return;
    }

    setFixAssetMasterCleared(false);
    try {
      localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_cleared", activeDivisi));
    } catch {
      // ignore
    }

    const nextSlots = [
      ...currentSlots,
      ...addedNames.map((n) => ({ namaBarang: n, originalName: n })),
    ];
    setFixAssetMasterSlots(nextSlots);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_slots", activeDivisi), JSON.stringify(nextSlots));
    } catch {
      // ignore
    }

    setFixAssetCustomJenis((prev) => {
      const next = [...prev, ...addedNames];
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_jenis", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (addedNames.length === 1) {
      showToast(
        `Jenis barang Fix Asset "${addedNames[0]}" berhasil ditambahkan dengan ID #${currentSlots.length + 1}!`
      );
    } else {
      showToast(
        `${addedNames.length} Jenis barang Fix Asset berhasil ditambahkan (ID #${currentSlots.length + 1} – #${nextSlots.length})!`
      );
    }
  };

  const handleDeleteMasterFixAssetJenis = (nama: string) => {
    const targetNameLower = nama.toLowerCase().trim();
    const remainingSlots = masterFixAssetJenis
      .filter(
        (entry) =>
          entry.namaBarang.toLowerCase().trim() !== targetNameLower &&
          (entry.originalName || entry.namaBarang).toLowerCase().trim() !== targetNameLower
      )
      .map((entry) => ({
        namaBarang: entry.namaBarang,
        originalName: entry.originalName || entry.namaBarang,
      }));

    if (remainingSlots.length === 0) {
      setFixAssetMasterCleared(true);
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_cleared", activeDivisi), "true");
      } catch {
        // ignore
      }
    }

    setFixAssetMasterSlots(remainingSlots);
    setFixAssetCustomJenis((prev) =>
      prev.filter((j) => j.toLowerCase().trim() !== targetNameLower)
    );
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_slots", activeDivisi), JSON.stringify(remainingSlots));
      localStorage.setItem(
        getDivisiStorageKey("dpsa_fix_master_jenis", activeDivisi),
        JSON.stringify(remainingSlots.map((s) => s.namaBarang))
      );
    } catch {
      // ignore
    }
    showToast(`Jenis barang Fix Asset "${nama}" dihapus dari daftar master.`);
  };

  const handleClearAllMasterJenisBarang = () => {
    if (masterFixAssetJenis.length === 0) {
      showToast("Daftar jenis barang Fix Asset sudah kosong.");
      return;
    }
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus semua (${masterFixAssetJenis.length}) data jenis barang Fix Asset? Tindakan ini akan mengosongkan seluruh daftar jenis barang.`
      )
    ) {
      return;
    }

    setFixAssetMasterCleared(true);
    setFixAssetMasterSlots([]);
    setFixAssetCustomJenis([]);
    setFixAssetNamaToJenisMap({});
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_cleared", activeDivisi), "true");
      localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_slots", activeDivisi));
      localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_jenis", activeDivisi));
      localStorage.removeItem(getDivisiStorageKey("dpsa_fix_nama_to_jenis_map", activeDivisi));
    } catch {
      // ignore
    }
    showToast("Semua data jenis barang Fix Asset berhasil dihapus.");
  };

  const handleEditMasterFixAssetJenis = (targetId: number, newNama: string) => {
    const trimmedNew = (newNama || "").trim();
    if (!trimmedNew) return;

    const currentSlots = masterFixAssetJenis.map((entry) => ({
      namaBarang: entry.namaBarang,
      originalName: entry.originalName || entry.namaBarang,
    }));

    const targetIdx = targetId - 1;
    if (targetIdx < 0 || targetIdx >= currentSlots.length) return;

    const oldEntry = currentSlots[targetIdx];
    if (oldEntry.namaBarang.toLowerCase() === trimmedNew.toLowerCase()) return;

    // Check if trimmedNew already exists on another ID -> Do NOT swap, alert duplicate
    const otherIdx = currentSlots.findIndex(
      (s, idx) =>
        idx !== targetIdx && s.namaBarang.toLowerCase() === trimmedNew.toLowerCase()
    );

    if (otherIdx !== -1) {
      showToast(
        `Jenis barang "${trimmedNew}" sudah terdaftar pada ID #${otherIdx + 1}. Silakan gunakan nama yang berbeda.`
      );
      return;
    }

    // Rename the Jenis Barang at targetIdx directly without swapping
    const nextSlots = [...currentSlots];
    nextSlots[targetIdx] = {
      namaBarang: trimmedNew,
      originalName: oldEntry.originalName || oldEntry.namaBarang,
    };

    setFixAssetMasterSlots(nextSlots);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_slots", activeDivisi), JSON.stringify(nextSlots));
    } catch {
      // ignore
    }

    setFixAssetCustomJenis((prev) => {
      const next = prev.map((j) =>
        j.toLowerCase() === oldEntry.namaBarang.toLowerCase() ? trimmedNew : j
      );
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_jenis", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setFixAssetNamaToJenisMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [key, val] of Object.entries(next)) {
        if (val.toLowerCase() === oldEntry.namaBarang.toLowerCase()) {
          next[key] = trimmedNew;
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(getDivisiStorageKey("dpsa_fix_nama_to_jenis_map", activeDivisi), JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return changed ? next : prev;
    });

    setFixAssets((prev) =>
      prev.map((it) => {
        if (
          it.jenisBarang &&
          it.jenisBarang.toLowerCase() === oldEntry.namaBarang.toLowerCase()
        ) {
          return { ...it, jenisBarang: trimmedNew };
        }
        return it;
      })
    );

    showToast(
      `Nama jenis barang pada ID #${targetId} berhasil diubah menjadi "${trimmedNew}".`
    );
  };

  const handleAddMasterNamaBarang = (nama: string, ruangan = "") => {
    const rawNames = (nama || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const trimmedRoom = (ruangan || "").trim();
    if (rawNames.length === 0) return;

    const currentSlots = masterNamaBarang.map((entry) => ({
      namaBarang: entry.namaBarang,
      originalName: entry.originalName || entry.namaBarang,
    }));

    const existingLower = new Set(
      currentSlots.map((s) => s.namaBarang.toLowerCase())
    );

    const addedNames: string[] = [];
    for (const candidate of rawNames) {
      const lower = candidate.toLowerCase();
      if (!existingLower.has(lower)) {
        existingLower.add(lower);
        addedNames.push(candidate);
      }
    }

    if (addedNames.length === 0) {
      const firstExisting = masterNamaBarang.find(
        (e) => e.namaBarang.toLowerCase() === rawNames[0].toLowerCase()
      );
      if (firstExisting) {
        showToast(
          `Jenis barang "${firstExisting.namaBarang}" sudah terdaftar pada ID #${firstExisting.id}.`
        );
      }
      return;
    }

    const nextSlots = [
      ...currentSlots,
      ...addedNames.map((n) => ({ namaBarang: n, originalName: n })),
    ];
    setMasterSlots(nextSlots);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_master_jenis_slots", activeDivisi), JSON.stringify(nextSlots));
    } catch {
      // ignore
    }

    setCustomNamaBarang((prev) => {
      const next = [
        ...prev,
        ...addedNames.map((n) => ({ ruangan: trimmedRoom, namaBarang: n })),
      ];
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_master_jenis_barang", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (addedNames.length === 1) {
      showToast(
        `Jenis barang "${addedNames[0]}" berhasil ditambahkan dengan ID #${currentSlots.length + 1}!`
      );
    } else {
      showToast(
        `${addedNames.length} Jenis barang berhasil ditambahkan (ID #${currentSlots.length + 1} – #${nextSlots.length})!`
      );
    }
  };

  const handleDeleteMasterNamaBarang = (nama: string) => {
    setCustomNamaBarang((prev) => {
      const next = prev.filter(
        (item) => item.namaBarang.toLowerCase() !== nama.toLowerCase()
      );
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_master_jenis_barang", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setMasterSlots((prev) => {
      const next = prev.filter(
        (s) =>
          s.namaBarang.toLowerCase() !== nama.toLowerCase() &&
          s.originalName.toLowerCase() !== nama.toLowerCase()
      );
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_master_jenis_slots", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    showToast(`Jenis barang "${nama}" dihapus dari daftar master.`);
  };

  const handleEditMasterNamaBarang = (targetId: number, newNama: string) => {
    const trimmedNew = (newNama || "").trim();
    if (!trimmedNew) return;

    const currentSlots = masterNamaBarang.map((entry) => ({
      namaBarang: entry.namaBarang,
      originalName: entry.originalName || entry.namaBarang,
    }));

    const targetIdx = targetId - 1;
    if (targetIdx < 0 || targetIdx >= currentSlots.length) return;

    const oldEntry = currentSlots[targetIdx];
    if (oldEntry.namaBarang.toLowerCase() === trimmedNew.toLowerCase()) return;

    // Check if trimmedNew already exists on another ID -> Do NOT swap, alert duplicate
    const otherIdx = currentSlots.findIndex(
      (s, idx) =>
        idx !== targetIdx && s.namaBarang.toLowerCase() === trimmedNew.toLowerCase()
    );

    if (otherIdx !== -1) {
      showToast(
        `Jenis barang "${trimmedNew}" sudah terdaftar pada ID #${otherIdx + 1}. Silakan gunakan nama yang berbeda.`
      );
      return;
    }

    // Rename the Jenis Barang at targetIdx directly without swapping
    const nextSlots = [...currentSlots];
    nextSlots[targetIdx] = {
      namaBarang: trimmedNew,
      originalName: oldEntry.originalName || oldEntry.namaBarang,
    };

    setMasterSlots(nextSlots);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_master_jenis_slots", activeDivisi), JSON.stringify(nextSlots));
    } catch {
      // ignore
    }

    setCustomNamaBarang((prev) => {
      const next = prev.map((item) =>
        item.namaBarang.toLowerCase() === oldEntry.namaBarang.toLowerCase()
          ? { ...item, namaBarang: trimmedNew }
          : item
      );
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_master_jenis_barang", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setNamaToJenisMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [key, val] of Object.entries(next)) {
        if (val.toLowerCase() === oldEntry.namaBarang.toLowerCase()) {
          next[key] = trimmedNew;
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(getDivisiStorageKey("dpsa_nama_to_jenis_map", activeDivisi), JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return changed ? next : prev;
    });

    setInventory((prev) =>
      prev.map((it) => {
        if (
          it.jenisBarang &&
          it.jenisBarang.toLowerCase() === oldEntry.namaBarang.toLowerCase()
        ) {
          return { ...it, jenisBarang: trimmedNew };
        }
        return it;
      })
    );

    showToast(
      `Nama jenis barang pada ID #${targetId} berhasil diubah menjadi "${trimmedNew}".`
    );
  };

  const masterInventoryLokasi: MasterInventoryLokasiEntry[] = React.useMemo(() => {
    return inventoryMasterLocations.map((locEntry) => {
      const locLower = locEntry.nama.toLowerCase();
      const codeUpper = locEntry.kode.toUpperCase();
      const matchingItems = formattedInventory.filter((item) => {
        const itLoc = (item.ruangan || "").trim().toLowerCase();
        const itKode = (item.kodeBarang || "").trim().toUpperCase();
        const parts = itKode.split("/").filter(Boolean);
        const seg = parts.length >= 3 ? parts[2] : "";
        const roomPrefix = seg.replace(/\.\d+\.\d+$/, "").replace(/\.\d+$/, "");
        return itLoc === locLower || roomPrefix === codeUpper;
      });
      const kodeList = Array.from(
        new Set(
          matchingItems
            .map((it) => it.kodeBarang)
            .filter((k): k is string => Boolean(k && k !== "-"))
        )
      );
      return {
        id: locEntry.id,
        kode: locEntry.kode,
        nama: locEntry.nama,
        count: matchingItems.length,
        kodeBarangList: kodeList,
      };
    });
  }, [inventoryMasterLocations, formattedInventory]);

  const handleAddInventoryLokasi = (kode: string, nama: string) => {
    const trimmedNama = nama.trim();
    const rawKode = kode.trim().toUpperCase() || buildRoomAbbreviation(trimmedNama);
    const trimmedKode = rawKode.replace(/[^A-Z0-9._-]/g, "");
    if (!trimmedKode || !trimmedNama) {
      showToast("Kode dan Nama Lokasi Inventory wajib diisi!");
      return;
    }

    const exists = inventoryMasterLocations.some(
      (l) => l.nama.toLowerCase() === trimmedNama.toLowerCase()
    );
    if (exists) {
      showToast(`Lokasi "${trimmedNama}" sudah terdaftar di Data Lokasi Inventory.`);
      return;
    }

    const nextId =
      inventoryMasterLocations.length > 0
        ? Math.max(...inventoryMasterLocations.map((l) => l.id)) + 1
        : 1;
    const isManualKode = Boolean(
      kode.trim() && trimmedKode !== buildRoomAbbreviation(trimmedNama)
    );
    const nextList = resolveUniqueInventoryRoomCodes([
      ...inventoryMasterLocations,
      { id: nextId, kode: trimmedKode, nama: trimmedNama, isManualKode },
    ]);
    const addedEntry = nextList.find((l) => l.id === nextId);
    const finalAddedKode = addedEntry?.kode || trimmedKode;

    setInventoryMasterLocations(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_inv_master_locations", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }

    // Update kodeBarang room segment on any existing items whose location got renumbered (e.g. R.G -> R.G1)
    const renumberedMap = new Map<string, string>();
    nextList.forEach((loc) => {
      const oldLoc = inventoryMasterLocations.find((p) => p.id === loc.id);
      if (oldLoc && oldLoc.kode !== loc.kode) {
        renumberedMap.set(loc.nama.toLowerCase(), loc.kode);
      }
    });
    if (renumberedMap.size > 0) {
      setInventory((prev) =>
        prev.map((it) => {
          const newRoomKode = renumberedMap.get((it.ruangan || "").trim().toLowerCase());
          if (!newRoomKode || !it.kodeBarang || it.kodeBarang === "-") return it;
          const parts = it.kodeBarang.split("/");
          if (parts.length < 3) return it;
          const suffixMatch = parts[2].match(/((?:\.\d+)+)$/);
          const suffix = suffixMatch ? suffixMatch[1] : "";
          parts[2] = `${newRoomKode}${suffix}`;
          const nextKode = parts.join("/");
          return {
            ...it,
            kodeBarang: nextKode,
            kodeBarcode: it.kodeBarcode === it.kodeBarang ? nextKode : it.kodeBarcode,
          };
        })
      );
    }

    setCustomRooms((prev) => {
      if (prev.some((r) => r.toLowerCase() === trimmedNama.toLowerCase())) return prev;
      const nextRooms = [...prev, trimmedNama];
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_custom_rooms", activeDivisi), JSON.stringify(nextRooms));
      } catch {
        // ignore
      }
      return nextRooms;
    });

    showToast(
      `Lokasi "${trimmedNama}" (${finalAddedKode}) berhasil ditambahkan ke Data Lokasi Inventory.`
    );
  };

  const handleEditInventoryLokasi = (
    id: number,
    newKode: string,
    newNama: string
  ) => {
    const trimmedNama = newNama.trim();
    const trimmedKode = (newKode.trim().toUpperCase() || buildRoomAbbreviation(trimmedNama)).replace(
      /[^A-Z0-9._-]/g,
      ""
    );
    if (!trimmedKode || !trimmedNama) {
      showToast("Kode dan Nama Lokasi tidak boleh kosong!");
      return;
    }

    const targetIdx = inventoryMasterLocations.findIndex((l) => l.id === id);
    if (targetIdx === -1) return;

    const oldEntry = inventoryMasterLocations[targetIdx];
    const conflict = inventoryMasterLocations.find(
      (l) => l.id !== id && l.nama.toLowerCase() === trimmedNama.toLowerCase()
    );
    if (conflict) {
      showToast(`Nama lokasi "${trimmedNama}" sudah digunakan oleh lokasi lain.`);
      return;
    }

    const isManualKode = trimmedKode !== buildRoomAbbreviation(trimmedNama);
    const rawNextList = [...inventoryMasterLocations];
    rawNextList[targetIdx] = { id, kode: trimmedKode, nama: trimmedNama, isManualKode };
    const nextList = resolveUniqueInventoryRoomCodes(rawNextList);
    const finalEditedKode = nextList.find((l) => l.id === id)?.kode || trimmedKode;
    setInventoryMasterLocations(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_inv_master_locations", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }

    setCustomRooms((prev) => {
      const nextRooms = prev.map((r) =>
        r.toLowerCase() === oldEntry.nama.toLowerCase() ? trimmedNama : r
      );
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_custom_rooms", activeDivisi), JSON.stringify(nextRooms));
      } catch {
        // ignore
      }
      return nextRooms;
    });

    const prevCodeMap = new Map(inventoryMasterLocations.map((l) => [l.id, l.kode]));
    const renumberedNamaMap = new Map<string, string>();
    nextList.forEach((loc) => {
      const prevKode = prevCodeMap.get(loc.id);
      if (loc.id !== id && prevKode && prevKode !== loc.kode) {
        renumberedNamaMap.set(loc.nama.trim().toLowerCase(), loc.kode);
      }
    });

    setInventory((prev) =>
      prev.map((it) => {
        const roomLower = (it.ruangan || "").trim().toLowerCase();
        const matchesEdited = roomLower === oldEntry.nama.trim().toLowerCase();
        const siblingNewKode = !matchesEdited ? renumberedNamaMap.get(roomLower) : undefined;
        if (!matchesEdited && !siblingNewKode) return it;

        const appliedRoomKode = matchesEdited ? finalEditedKode : (siblingNewKode as string);
        let nextKode = it.kodeBarang;
        if (nextKode && nextKode !== "-") {
          const parts = nextKode.split("/");
          if (parts.length >= 3) {
            const suffixMatch = parts[2].match(/((?:\.\d+)+)$/);
            const suffix = suffixMatch ? suffixMatch[1] : "";
            parts[2] = `${appliedRoomKode}${suffix}`;
            nextKode = parts.join("/");
          }
        }
        return {
          ...it,
          ruangan: matchesEdited ? trimmedNama : it.ruangan,
          kodeBarang: nextKode,
          kodeBarcode: it.kodeBarcode === it.kodeBarang ? nextKode : it.kodeBarcode,
        };
      })
    );

    showToast(
      `Lokasi Inventory berhasil diperbarui menjadi "${trimmedNama}" (${trimmedKode}).`
    );
  };

  const handleDeleteInventoryLokasi = (id: number) => {
    const entry = inventoryMasterLocations.find((l) => l.id === id);
    if (!entry) return;

    const usedCount = inventory.filter(
      (it) => (it.ruangan || "").trim().toLowerCase() === entry.nama.toLowerCase()
    ).length;
    if (usedCount > 0) {
      showToast(
        `Lokasi "${entry.nama}" masih digunakan oleh ${usedCount} barang di Data Inventory.`
      );
      return;
    }

    const nextList = inventoryMasterLocations.filter((l) => l.id !== id);
    setInventoryMasterLocations(nextList);
    try {
      localStorage.setItem(getDivisiStorageKey("dpsa_inv_master_locations", activeDivisi), JSON.stringify(nextList));
    } catch {
      // ignore
    }

    setCustomRooms((prev) => {
      const nextRooms = prev.filter((r) => r.toLowerCase() !== entry.nama.toLowerCase());
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_custom_rooms", activeDivisi), JSON.stringify(nextRooms));
      } catch {
        // ignore
      }
      return nextRooms;
    });

    showToast(`Lokasi "${entry.nama}" (${entry.kode}) berhasil dihapus.`);
  };

  const handleClearAllInventoryLokasi = () => {
    if (masterInventoryLokasi.length === 0) {
      showToast("Daftar lokasi Inventory sudah kosong.");
      return;
    }
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus semua (${masterInventoryLokasi.length}) data lokasi Inventory? Tindakan ini akan mengosongkan seluruh daftar lokasi Inventory.`
      )
    ) {
      return;
    }

    setInventoryMasterLocations([]);
    setCustomRooms([]);
    try {
      localStorage.removeItem(getDivisiStorageKey("dpsa_inv_master_locations", activeDivisi));
      localStorage.removeItem(getDivisiStorageKey("dpsa_custom_rooms", activeDivisi));
    } catch {
      // ignore
    }
    showToast("Semua data lokasi Inventory berhasil dihapus.");
  };

  const handleAddCustomRoom = (roomName: string) => {
    const trimmed = roomName.trim();
    if (!trimmed) return;
    setCustomRooms((prev) => {
      if (prev.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const next = [...prev, trimmed];
      try {
        localStorage.setItem(getDivisiStorageKey("dpsa_custom_rooms", activeDivisi), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    showToast(`Lokasi "${trimmed}" berhasil ditambahkan!`);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: FixAssetItem | InventoryItem, type: "fixAsset" | "inventory") => {
    setItemToEdit(item);
    setEditModalType(type);
    setEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: FixAssetItem | InventoryItem, type: "fixAsset" | "inventory") => {
    if (currentUser?.role !== "Super Admin") {
      showToast("Akses ditolak: Hanya Super Admin yang dapat menghapus data.");
      return;
    }
    setItemToDelete(item);
    setDeleteModalType(type);
    setDeleteModalOpen(true);
  };

  // Open Import Excel Modal
  const handleOpenImport = (type: "fixAsset" | "inventory") => {
    setImportModalType(type);
    setImportModalOpen(true);
  };

  const handleImportSuccess = (
    count: number,
    importedItems?: (Partial<FixAssetItem> | Partial<InventoryItem>)[]
  ) => {
    if (importModalType === "fixAsset" && Array.isArray(importedItems)) {
      // 1. Reset cleared flag if it was cleared, because new items have been imported
      setFixAssetMasterCleared(false);
      try {
        localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_cleared", activeDivisi));
      } catch {
        // ignore
      }

      // 2. Collect unique Jenis Barang from imported items
      const importedJenisNames: string[] = [];
      const seen = new Set<string>();
      importedItems.forEach((it) => {
        const fixIt = it as Partial<FixAssetItem>;
        const rawJenis = normalizeItemTypo((fixIt.jenisBarang || "").trim());
        if (rawJenis && rawJenis !== "-" && !seen.has(rawJenis.toLowerCase())) {
          importedJenisNames.push(rawJenis);
          seen.add(rawJenis.toLowerCase());
        }
      });

      // 3. Register any new Jenis Barang into master slots
      if (importedJenisNames.length > 0) {
        setFixAssetMasterSlots((prev) => {
          const existingLower = new Set(prev.map((s) => s.namaBarang.toLowerCase()));
          const toAdd: { namaBarang: string; originalName: string }[] = [];
          importedJenisNames.forEach((name) => {
            if (!existingLower.has(name.toLowerCase())) {
              existingLower.add(name.toLowerCase());
              toAdd.push({ namaBarang: name, originalName: name });
            }
          });
          if (toAdd.length === 0) return prev;
          const next = [...prev, ...toAdd];
          try {
            localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_slots", activeDivisi), JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });

        setFixAssetCustomJenis((prev) => {
          const existingLower = new Set(prev.map((j) => j.toLowerCase()));
          const toAdd: string[] = [];
          importedJenisNames.forEach((name) => {
            if (!existingLower.has(name.toLowerCase())) {
              existingLower.add(name.toLowerCase());
              toAdd.push(name);
            }
          });
          if (toAdd.length === 0) return prev;
          const next = [...prev, ...toAdd];
          try {
            localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_jenis", activeDivisi), JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }

      // 4. Collect unique Lokasi from imported items and register to Data Lokasi
      const importedLocations: string[] = [];
      const seenLoc = new Set<string>();
      importedItems.forEach((it) => {
        const fixIt = it as Partial<FixAssetItem>;
        const rawLokasi = (fixIt.lokasi || "").trim();
        if (rawLokasi && rawLokasi !== "-" && !seenLoc.has(rawLokasi.toLowerCase())) {
          importedLocations.push(rawLokasi);
          seenLoc.add(rawLokasi.toLowerCase());
        }
      });

      if (importedLocations.length > 0) {
        setFixAssetMasterLocations((prev) => {
          const existingNames = new Set(prev.map((l) => l.nama.toLowerCase()));
          const existingCodes = new Set(prev.map((l) => l.kode.toUpperCase()));
          let nextId = prev.length > 0 ? Math.max(...prev.map((l) => l.id)) : 0;
          const toAdd: { id: number; kode: string; nama: string }[] = [];

          importedLocations.forEach((locName) => {
            if (!existingNames.has(locName.toLowerCase())) {
              existingNames.add(locName.toLowerCase());
              nextId += 1;
              let abbr = generateLocationAbbreviation(locName);
              if (existingCodes.has(abbr)) {
                let suffix = 2;
                while (existingCodes.has(`${abbr}${suffix}`)) {
                  suffix += 1;
                }
                abbr = `${abbr}${suffix}`;
              }
              existingCodes.add(abbr);
              toAdd.push({ id: nextId, kode: abbr, nama: locName });
            }
          });

          if (toAdd.length === 0) return prev;
          const next = [...prev, ...toAdd];
          try {
            localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_locations", activeDivisi), JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    }

    showToast(
      `${count} data ${
        importModalType === "fixAsset" ? "Fix Asset" : "Inventory"
      } berhasil diimpor & tersimpan otomatis di MySQL!`
    );
    loadData();
  };

  // CRUD: Create Fix Asset
  const handleAddFixAsset = async (item: Partial<FixAssetItem>) => {
    try {
      if (item.namaAktivaTetap && item.jenisBarang) {
        const key = item.namaAktivaTetap.trim().toLowerCase();
        const val = item.jenisBarang.trim();
        if (key && val) {
          setFixAssetNamaToJenisMap((prev) => {
            const next = { ...prev, [key]: val };
            try {
              localStorage.setItem(getDivisiStorageKey("dpsa_fix_nama_to_jenis_map", activeDivisi), JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      }
      const created = await createFixAsset({ ...item, divisi: writeDivisi }, activeDivisi);
      setFixAssets((prev) => [created, ...prev]);
      showToast("Fix Asset berhasil disimpan ke database MySQL!");
      loadData(activeDivisi);
    } catch (err: any) {
      showToast("Gagal menyimpan Fix Asset: " + err.message);
    }
  };

  // CRUD: Create Inventory
  const handleAddInventory = async (item: Partial<InventoryItem>) => {
    try {
      if (item.namaBarang && item.jenisBarang) {
        const key = item.namaBarang.trim().toLowerCase();
        const val = item.jenisBarang.trim();
        if (key && val) {
          setNamaToJenisMap((prev) => {
            const next = { ...prev, [key]: val };
            try {
              localStorage.setItem(getDivisiStorageKey("dpsa_nama_to_jenis_map", activeDivisi), JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      }
      const created = await createInventoryItem({ ...item, divisi: writeDivisi }, activeDivisi);
      setInventory((prev) => [created, ...prev]);
      showToast("Barang Inventory berhasil disimpan ke database MySQL!");
      loadData(activeDivisi);
    } catch (err: any) {
      showToast("Gagal menyimpan Inventory: " + err.message);
    }
  };

  // CRUD: Update Fix Asset
  const handleSaveEditFixAsset = async (id: number, data: Partial<FixAssetItem>) => {
    const updated = await updateFixAsset(id, data, activeDivisi);
    setFixAssets((prev) => prev.map((item) => (item.id === id ? updated : item)));
    showToast("Data Fix Asset berhasil diperbarui di database!");
    loadData(activeDivisi);
  };

  // CRUD: Update Inventory
  const handleSaveEditInventory = async (id: number, data: Partial<InventoryItem>) => {
    const updated = await updateInventoryItem(id, data, activeDivisi);
    setInventory((prev) => prev.map((item) => (item.id === id ? updated : item)));
    showToast("Data Inventory berhasil diperbarui di database!");
    loadData(activeDivisi);
  };

  // CRUD: Delete Fix Asset
  const handleDeleteFixAssetConfirm = async (id: number) => {
    await deleteFixAsset(id, activeDivisi);
    setFixAssets((prev) => prev.filter((item) => item.id !== id));
    showToast("Fix Asset berhasil dihapus dari database MySQL.");
    loadData(activeDivisi);
  };

  // CRUD: Delete Inventory
  const handleDeleteInventoryConfirm = async (id: number) => {
    await deleteInventoryItem(id, activeDivisi);
    setInventory((prev) => prev.filter((item) => item.id !== id));
    showToast("Barang Inventory berhasil dihapus dari database MySQL.");
    loadData(activeDivisi);
  };

  // CRUD: Clear All Inventory
  const handleClearAllInventory = () => {
    if (currentUser?.role !== "Super Admin") {
      showToast("Akses ditolak: Hanya Super Admin yang dapat menghapus semua data.");
      return;
    }
    setClearAllModalState({ isOpen: true, assetType: "inventory" });
  };

  // CRUD: Clear All Fix Assets
  const handleClearAllFixAssets = () => {
    if (currentUser?.role !== "Super Admin") {
      showToast("Akses ditolak: Hanya Super Admin yang dapat menghapus semua data.");
      return;
    }
    setClearAllModalState({ isOpen: true, assetType: "fixAsset" });
  };

  const handleConfirmClearAll = async (options: { deleteJenisBarang: boolean; deleteLokasi: boolean }) => {
    if (currentUser?.role !== "Super Admin") return;
    const isFixAsset = clearAllModalState.assetType === "fixAsset";

    if (isFixAsset) {
      try {
        await clearAllFixAssets(activeDivisi);
        setFixAssets([]);

        if (options.deleteJenisBarang) {
          setFixAssetMasterCleared(true);
          setFixAssetMasterSlots([]);
          setFixAssetCustomJenis([]);
          setFixAssetNamaToJenisMap({});
          try {
            localStorage.setItem(getDivisiStorageKey("dpsa_fix_master_cleared", activeDivisi), "true");
            localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_slots", activeDivisi));
            localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_jenis", activeDivisi));
            localStorage.removeItem(getDivisiStorageKey("dpsa_fix_nama_to_jenis_map", activeDivisi));
          } catch {
            // ignore
          }
        }

        if (options.deleteLokasi) {
          setFixAssetMasterLocations([]);
          try {
            localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_locations", activeDivisi));
          } catch {
            // ignore
          }
        }

        const extraInfo = [
          options.deleteJenisBarang ? "Data Jenis Barang" : "",
          options.deleteLokasi ? "Data Lokasi" : "",
        ].filter(Boolean);
        const msgExtra = extraInfo.length > 0 ? ` (beserta ${extraInfo.join(" & ")})` : "";
        showToast(`Semua data Fix Asset${msgExtra} berhasil dihapus!`);
        loadData(activeDivisi);
      } catch (err: any) {
        showToast("Gagal mengosongkan Fix Asset: " + err.message);
      }
    } else {
      try {
        await clearAllInventory(activeDivisi);
        setInventory([]);

        if (options.deleteJenisBarang) {
          setMasterSlots([]);
          setCustomNamaBarang([]);
          setNamaToJenisMap({});
          try {
            localStorage.removeItem(getDivisiStorageKey("dpsa_master_jenis_slots", activeDivisi));
            localStorage.removeItem(getDivisiStorageKey("dpsa_master_jenis_barang", activeDivisi));
            localStorage.removeItem(getDivisiStorageKey("dpsa_nama_to_jenis_map", activeDivisi));
          } catch {
            // ignore
          }
        }

        if (options.deleteLokasi) {
          setInventoryMasterLocations([]);
          setCustomRooms([]);
          try {
            localStorage.removeItem(getDivisiStorageKey("dpsa_inv_master_locations", activeDivisi));
            localStorage.removeItem(getDivisiStorageKey("dpsa_custom_rooms", activeDivisi));
          } catch {
            // ignore
          }
        }

        const extraInfo = [
          options.deleteJenisBarang ? "Data Jenis Barang" : "",
          options.deleteLokasi ? "Data Lokasi" : "",
        ].filter(Boolean);
        const msgExtra = extraInfo.length > 0 ? ` (beserta ${extraInfo.join(" & ")})` : "";
        showToast(`Semua data Inventory${msgExtra} berhasil dihapus!`);
        loadData(activeDivisi);
      } catch (err: any) {
        showToast("Gagal mengosongkan Inventory: " + err.message);
      }
    }
  };

  const handleDeleteDivisi = async (
    divisiName: string,
    options: { deleteFixAssets: boolean; deleteInventory: boolean }
  ) => {
    if (currentUser?.role !== "Super Admin") return;
    try {
      if (options.deleteFixAssets) {
        await clearAllFixAssets(divisiName);
      }
      if (options.deleteInventory) {
        await clearAllInventory(divisiName);
      }
      await deleteUserOption("divisi", divisiName);

      // Clean local storage keys associated with this division
      try {
        localStorage.removeItem(getDivisiStorageKey("dpsa_master_jenis_slots", divisiName));
        localStorage.removeItem(getDivisiStorageKey("dpsa_master_jenis_barang", divisiName));
        localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_slots", divisiName));
        localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_jenis", divisiName));
        localStorage.removeItem(getDivisiStorageKey("dpsa_fix_master_locations", divisiName));
        localStorage.removeItem(getDivisiStorageKey("dpsa_custom_rooms", divisiName));
      } catch {
        // ignore
      }

      // If active workspace is the deleted division, switch back to default
      if (activeDivisi.trim().toUpperCase() === divisiName.trim().toUpperCase()) {
        setSuperAdminDivisi("PT Dharma Putra Sejahtera Abadi");
      }
      await refreshDivisiOptions();
      await loadData(activeDivisi);
      const extra = [
        options.deleteFixAssets ? "Data Fix Asset" : "",
        options.deleteInventory ? "Data Inventory" : "",
      ].filter(Boolean);
      const extraMsg = extra.length > 0 ? ` (beserta ${extra.join(" & ")})` : "";
      showToast(`Divisi "${divisiName}"${extraMsg} berhasil dihapus!`);
    } catch (err: any) {
      showToast("Gagal menghapus divisi: " + (err.message || "Error server"));
    }
  };

  const computedOverview = React.useMemo<OverviewData>(() => {
    const totalFixAssetCount = formattedFixAssets.length;
    const totalFixAssetValue = formattedFixAssets.reduce((sum, it) => {
      const tp = Number(it.totalPerolehan) || 0;
      return sum + (tp > 0 ? tp : (Number(it.hargaPerolehan) || 0) * (Number(it.qty) || 1));
    }, 0);

    const totalInventoryCount = formattedInventory.length;
    let totalInventoryValue = 0;
    let allocationDPSA = 0;
    let allocationDPM = 0;
    let allocationPakBoyke = 0;

    formattedInventory.forEach((it) => {
      const val = getInventoryTotalHarga(it);
      totalInventoryValue += val;
      const pemilikUpper = getInventoryPemilik(it).toUpperCase();
      if (pemilikUpper.includes("DPM")) {
        allocationDPM += val;
      } else if (pemilikUpper.includes("BOYKE") || pemilikUpper.includes("YBD")) {
        allocationPakBoyke += val;
      } else if (pemilikUpper.includes("DPSA")) {
        allocationDPSA += val;
      }
    });

    return {
      ...overview,
      totalFixAssetCount,
      totalFixAssetValue,
      totalInventoryCount,
      totalInventoryValue,
      allocationDPSA,
      allocationDPM,
      allocationPakBoyke,
    };
  }, [overview, formattedFixAssets, formattedInventory]);

  const pageTitle =
    activeTab === "overview"
      ? "Overview"
      : activeTab === "divisi"
      ? "Data Divisi / PT"
      : activeTab === "fixAsset"
      ? "Dashboard Fix Asset"
      : activeTab === "inventory"
      ? "Dashboard Inventory"
      : "User Management & Hak Akses";

  // Dedicated Asset Detail Page (When scanned via QR code or clicked "Detail")
  if (isScanMode && scanKode) {
    return (
      <AssetDetailPage
        item={selectedItem}
        type={detailModalType}
        scanKode={scanKode}
        isLoading={loadingScanItem}
        onClose={handleCloseDetailModal}
        onOpenDashboard={handleOpenDashboardFromScan}
      />
    );
  }

  return (
    <div
      className={
        isSimulatedMobile
          ? "min-h-screen bg-slate-900/15 py-0 sm:py-6 flex flex-col items-center justify-start print-modal-root"
          : "min-h-screen flex bg-[#f3f6fa] relative print-modal-root"
      }
    >
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200 flex items-center gap-2 no-print">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Top Control when in Simulated Mobile Mode on Desktop */}
      {isSimulatedMobile && (
        <div className="w-full max-w-[460px] bg-slate-900 text-white px-4 py-2.5 rounded-t-2xl shadow-lg border-b border-slate-700/80 text-xs flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Mode Mobile Aktif (Simulasi)</span>
          </div>
          <button
            onClick={() => setViewMode("desktop")}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Beralih kembali ke Tampilan Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Mode Desktop</span>
          </button>
        </div>
      )}

      {/* Main Container Wrapper */}
      <div
        className={
          isSimulatedMobile
            ? "w-full max-w-[460px] min-h-[85vh] bg-[#f3f6fa] shadow-2xl rounded-b-2xl border-x border-b border-slate-300 relative flex flex-col overflow-hidden ring-8 ring-slate-800/10"
            : "w-full flex min-h-screen"
        }
      >
        {/* Sidebar */}
        <div className="no-print">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            divisiCount={headerDivisiOptions.length}
            fixAssetSubTab={fixAssetSubTab}
            setFixAssetSubTab={setFixAssetSubTab}
            fixAssetJenisCount={masterFixAssetJenis.length}
            fixAssetTypeCount={masterFixAssetTypes.length}
            fixAssetLokasiCount={fixAssetMasterLocations.length}
            inventorySubTab={inventorySubTab}
            setInventorySubTab={setInventorySubTab}
            namaBarangCount={masterNamaBarang.length}
            inventoryLokasiCount={masterInventoryLokasi.length}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isMobile={isEffectiveMobile}
            fixAssetCount={computedOverview.totalFixAssetCount}
            inventoryCount={computedOverview.totalInventoryCount}
            currentUser={currentUser}
            activeDivisi={activeDivisi}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 no-print ${
            isEffectiveMobile
              ? "ml-0 w-full"
              : sidebarOpen
              ? "md:ml-64 ml-0"
              : "md:ml-20 ml-0"
          }`}
        >
          {/* Header */}
          <Header
            title={pageTitle}
            subtitle={`${
              isAllDivisiValue(activeDivisi)
                ? "Multi-Divisi"
                : isDpsaDivisi(activeDivisi)
                ? "PT Dharma Putra Sejahtera Abadi"
                : activeDivisi
            } Asset & Inventory Management`}
            currentUser={currentUser}
            activeDivisi={activeDivisi}
            divisiOptions={headerDivisiOptions}
            onChangeDivisi={(div) => setSuperAdminDivisi(div)}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onLogout={handleLogout}
            onOpenLogin={() => setLoginModalOpen(true)}
            viewMode={viewMode}
            onToggleViewMode={() =>
              setViewMode((prev) => (prev === "desktop" ? "mobile" : "desktop"))
            }
            isMobile={isEffectiveMobile}
          />

          {/* Body View */}
          <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8">
          {activeTab === "overview" && (
            <OverviewView
              data={computedOverview}
              fixAssets={formattedFixAssets}
              inventory={formattedInventory}
              masterInventoryLokasi={masterInventoryLokasi}
              loading={loading}
              onNavigateToFixAsset={() => setActiveTab("fixAsset")}
              onNavigateToInventory={() => setActiveTab("inventory")}
            />
          )}

          {activeTab === "divisi" && (
            <DivisiView
              currentUser={currentUser}
              divisiItems={divisiItems}
              activeDivisi={activeDivisi}
              fixAssets={formattedFixAssets}
              inventory={formattedInventory}
              onSelectDivisi={(div) => {
                setSuperAdminDivisi(div);
                showToast(`Workspace dialihkan ke divisi ${div}`);
              }}
              onRefreshOptions={refreshDivisiOptions}
              onShowToast={showToast}
              onDeleteDivisi={handleDeleteDivisi}
            />
          )}

          {activeTab === "fixAsset" && (
            <FixAssetView
              currentUser={currentUser}
              items={formattedFixAssets}
              subTab={fixAssetSubTab}
              onChangeSubTab={setFixAssetSubTab}
              masterJenisBarang={masterFixAssetJenis}
              onAddMasterJenisBarang={handleAddMasterFixAssetJenis}
              onEditMasterJenisBarang={handleEditMasterFixAssetJenis}
              onDeleteMasterJenisBarang={
                currentUser?.role === "Super Admin" ? handleDeleteMasterFixAssetJenis : undefined
              }
              onClearAllMasterJenisBarang={
                currentUser?.role === "Super Admin" ? handleClearAllMasterJenisBarang : undefined
              }
              masterTypeBarang={masterFixAssetTypes}
              onAddMasterTypeBarang={handleAddMasterFixAssetType}
              onEditMasterTypeBarang={handleEditMasterFixAssetType}
              onDeleteMasterTypeBarang={
                currentUser?.role === "Super Admin" ? handleDeleteMasterFixAssetType : undefined
              }
              masterLokasi={masterFixAssetLokasi}
              onAddMasterLokasi={handleAddMasterFixAssetLokasi}
              onEditMasterLokasi={handleEditMasterFixAssetLokasi}
              onDeleteMasterLokasi={
                currentUser?.role === "Super Admin" ? handleDeleteMasterFixAssetLokasi : undefined
              }
              onClearAllMasterLokasi={
                currentUser?.role === "Super Admin" ? handleClearAllMasterFixAssetLokasi : undefined
              }
              onOpenDetail={(item) => handleOpenDetail(item, "fixAsset")}
              onOpenPrintAll={(selectedIds) => handleOpenPrint("fixAsset", selectedIds)}
              onOpenAddNew={() => handleOpenAddNew("fixAsset")}
              onOpenImport={() => handleOpenImport("fixAsset")}
              onClearAll={currentUser?.role === "Super Admin" ? handleClearAllFixAssets : undefined}
              onEditItem={(item) => handleOpenEdit(item, "fixAsset")}
              onDeleteItem={
                currentUser?.role === "Super Admin" ? (item) => handleOpenDelete(item, "fixAsset") : undefined
              }
            />
          )}

          {activeTab === "inventory" && (
            <InventoryView
              currentUser={currentUser}
              items={formattedInventory}
              subTab={inventorySubTab}
              onChangeSubTab={setInventorySubTab}
              masterNamaBarang={masterNamaBarang}
              masterLokasi={masterInventoryLokasi}
              customRooms={customRooms}
              onAddRoom={handleAddCustomRoom}
              onAddMasterNamaBarang={handleAddMasterNamaBarang}
              onEditMasterNamaBarang={handleEditMasterNamaBarang}
              onDeleteMasterNamaBarang={
                currentUser?.role === "Super Admin" ? handleDeleteMasterNamaBarang : undefined
              }
              onAddMasterLokasi={handleAddInventoryLokasi}
              onEditMasterLokasi={handleEditInventoryLokasi}
              onDeleteMasterLokasi={
                currentUser?.role === "Super Admin" ? handleDeleteInventoryLokasi : undefined
              }
              onClearAllMasterLokasi={
                currentUser?.role === "Super Admin" ? handleClearAllInventoryLokasi : undefined
              }
              onOpenDetail={(item) => handleOpenDetail(item, "inventory")}
              onOpenPrintAll={(selectedIds) => handleOpenPrint("inventory", selectedIds)}
              onOpenAddNew={(defaultNama, defaultRuang) =>
                handleOpenAddNew("inventory", defaultNama, defaultRuang)
              }
              onOpenImport={() => handleOpenImport("inventory")}
              onClearAll={currentUser?.role === "Super Admin" ? handleClearAllInventory : undefined}
              onEditItem={(item) => handleOpenEdit(item, "inventory")}
              onDeleteItem={
                currentUser?.role === "Super Admin" ? (item) => handleOpenDelete(item, "inventory") : undefined
              }
            />
          )}

          {activeTab === "users" && currentUser?.role === "Super Admin" && (
            <UserManagementView
              currentUser={currentUser}
              onShowToast={showToast}
              onOptionsChanged={refreshDivisiOptions}
            />
          )}
        </main>
      </div>
    </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onSuccess={handleLoginSuccess}
        onClose={() => setLoginModalOpen(false)}
        isClosable={!!currentUser}
      />

      {/* Detail Modal */}
      {detailModalOpen && (
        <DetailModal
          item={selectedItem}
          type={detailModalType}
          isScanView={isScanMode}
          currentUser={currentUser}
          activeDivisi={activeDivisi}
          onClose={handleCloseDetailModal}
          onOpenDashboard={handleOpenDashboardFromScan}
          onEdit={(item, type) => handleOpenEdit(item, type)}
          onDelete={
            currentUser?.role === "Super Admin" ? (item, type) => handleOpenDelete(item, type) : undefined
          }
        />
      )}

      {/* Edit Item Modal */}
      {editModalOpen && (
        <EditItemModal
          isOpen={editModalOpen}
          item={itemToEdit}
          type={editModalType}
          masterTypeBarang={masterFixAssetTypes}
          masterLokasi={fixAssetMasterLocations}
          masterInventoryLokasi={inventoryMasterLocations}
          existingFixAssetJenisNames={masterFixAssetJenis}
          existingRooms={Array.from(
            new Set([
              ...inventory.map((i) => (i.ruangan || "").trim()).filter((r) => Boolean(r) && r !== "-"),
              ...inventoryMasterLocations.map((l) => l.nama.trim()).filter(Boolean),
              ...customRooms.map((r) => r.trim()).filter(Boolean),
            ])
          )}
          existingOwners={Array.from(
            new Set([
              ...(isDpsaDivisi(activeDivisi) || isAllDivisiValue(activeDivisi)
                ? ["DPSA", "DPM", "Pak Boyke"]
                : [activeDivisi]),
              ...inventory.map((i) => (i.pemilik || getInventoryPemilik(i) || "").trim()).filter(Boolean),
            ])
          )}
          onAddMasterFixAssetType={handleAddMasterFixAssetType}
          onAddMasterFixAssetJenis={handleAddMasterFixAssetJenis}
          onAddMasterFixAssetLokasi={handleAddMasterFixAssetLokasi}
          onClose={() => {
            setEditModalOpen(false);
            setItemToEdit(null);
          }}
          onSaveFixAsset={handleSaveEditFixAsset}
          onSaveInventory={handleSaveEditInventory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          item={itemToDelete}
          type={deleteModalType}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={async (id) => {
            if (deleteModalType === "fixAsset") {
              await handleDeleteFixAssetConfirm(id);
            } else {
              await handleDeleteInventoryConfirm(id);
            }
          }}
        />
      )}

      {/* Clear All Data Confirmation Modal (Super Admin) */}
      <ClearAllConfirmModal
        isOpen={clearAllModalState.isOpen}
        onClose={() => setClearAllModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmClearAll}
        assetType={clearAllModalState.assetType}
        itemCount={clearAllModalState.assetType === "fixAsset" ? formattedFixAssets.length : formattedInventory.length}
        jenisCount={clearAllModalState.assetType === "fixAsset" ? masterFixAssetJenis.length : masterNamaBarang.length}
        lokasiCount={clearAllModalState.assetType === "fixAsset" ? masterFixAssetLokasi.length : masterInventoryLokasi.length}
        activeDivisi={activeDivisi}
      />

      {/* Print Barcodes Modal */}
      {printModalOpen && (
        <PrintBarcodeModal
          type={printModalType}
          fixAssets={formattedFixAssets}
          inventory={formattedInventory}
          initialSelectedIds={printSelectedIds}
          currentUser={currentUser}
          activeDivisi={activeDivisi}
          onClose={() => setPrintModalOpen(false)}
        />
      )}

      {/* Add Item Modal */}
      {addModalOpen && (
        <AddItemModal
          type={addModalType}
          activeDivisi={writeDivisi}
          fixAssetItems={formattedFixAssets}
          inventoryItems={formattedInventory}
          masterTypeBarang={masterFixAssetTypes}
          masterLokasi={fixAssetMasterLocations}
          masterInventoryLokasi={inventoryMasterLocations}
          existingRooms={Array.from(
            new Set([
              ...inventory
                .map((i) => (i.ruangan || "").trim())
                .filter((r) => Boolean(r) && r !== "-"),
              ...inventoryMasterLocations.map((l) => l.nama.trim()).filter(Boolean),
              ...masterNamaBarang
                .flatMap((m) => m.ruanganList || [])
                .map((r) => r.trim())
                .filter((r) => Boolean(r) && r !== "-"),
              ...customRooms.map((r) => r.trim()).filter(Boolean),
            ])
          )}
          existingOwners={Array.from(
            new Set([
              ...fixAssets.map((f) => (f.pemilik || "").trim()).filter((p) => Boolean(p) && p !== "-"),
              ...inventory
                .map((i) => (i.pemilik || getInventoryPemilik(i) || "").trim())
                .filter((p) => Boolean(p) && p !== "-"),
            ])
          )}
          existingItemNames={masterNamaBarang}
          existingFixAssetJenisNames={masterFixAssetJenis}
          defaultNamaBarang={defaultAddNamaBarang}
          defaultRuangan={defaultAddRuangan}
          onAddMasterNamaBarang={handleAddMasterNamaBarang}
          onAddMasterFixAssetType={handleAddMasterFixAssetType}
          onAddMasterFixAssetJenis={handleAddMasterFixAssetJenis}
          onAddMasterFixAssetLokasi={handleAddMasterFixAssetLokasi}
          onAddMasterInventoryLokasi={handleAddInventoryLokasi}
          onClose={() => {
            setAddModalOpen(false);
            setDefaultAddNamaBarang("");
            setDefaultAddRuangan("");
          }}
          onAddFixAsset={handleAddFixAsset}
          onAddInventory={handleAddInventory}
        />
      )}

      {/* Import Excel / Spreadsheet Modal */}
      <ImportExcelModal
        isOpen={importModalOpen}
        type={importModalType}
        activeDivisi={activeDivisi}
        existingItemNames={
          importModalType === "fixAsset" ? masterFixAssetJenis : masterNamaBarang
        }
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
