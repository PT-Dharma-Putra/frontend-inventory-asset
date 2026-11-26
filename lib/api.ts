const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface OverviewData {
  totalFixAssetCount: number;
  totalFixAssetValue: number;
  totalInventoryCount: number;
  totalInventoryValue: number;
  allocationDPSA: number;
  allocationDPM: number;
  allocationPakBoyke: number;
  sheetsConnected: boolean;
  lastSync: string;
}

export interface FixAssetItem {
  id: number;
  divisi?: string;
  jenisBarang?: string;
  kodeAktiva: string;
  typeAktiva: string;
  namaAktivaTetap: string;
  merk: string;
  spesifikasi: string;
  satuan: string;
  tglPerolehan: string;
  bulan: string;
  tahun: number;
  qty: number;
  hargaPerolehan: number;
  totalPerolehan: number;
  nilaiSisa: number;
  umurThn: number;
  umurBln: number;
  depresiasi: number;
  akumulasiDepresiasi: number;
  nilaiBuku: number;
  tahunKe: number;
  bulanKe: number;
  hasilBln: number;
  penyusutanBln: number;
  fixAkumulasi: number;
  lokasi: string;
  pemilik?: string;
  keterangan: string;
  foto?: string;
}

export interface InventoryItem {
  id: number;
  divisi?: string;
  ruangan?: string;
  jenisBarang?: string;
  kodeBarang: string;
  namaBarang: string;
  tipeUkuran: string;
  satuan: string;
  jumlah: number;
  tahunPerolehan: string;
  kondisi: string;
  hargaSatuan: number;
  hargaSatuanText?: string;
  totalHargaPerolehan?: number;
  pemilik?: string;
  dpsa: number;
  dpm: number;
  pakBoyke: number;
  dokumenGambar?: string;
  keterangan: string;
  kodeBarcode: string;
}

// Fallback initial data in case backend is loading
export const fallbackOverview: OverviewData = {
  totalFixAssetCount: 7,
  totalFixAssetValue: 2815699220,
  totalInventoryCount: 0,
  totalInventoryValue: 0,
  allocationDPSA: 0,
  allocationDPM: 0,
  allocationPakBoyke: 0,
  sheetsConnected: true,
  lastSync: "-"
};

export const fallbackFixAssets: FixAssetItem[] = [
  {
    id: 1,
    kodeAktiva: "FA/PO1/1/VII/DPSA/2021/P",
    typeAktiva: "Bangunan",
    namaAktivaTetap: "Ruko Purwokerto",
    merk: "-",
    spesifikasi: "-",
    satuan: "Unit",
    tglPerolehan: "01/07/21",
    bulan: "JULI",
    tahun: 2021,
    qty: 1,
    hargaPerolehan: 392886900,
    totalPerolehan: 392886900,
    nilaiSisa: 0,
    umurThn: 20,
    umurBln: 240,
    depresiasi: 1637029,
    akumulasiDepresiasi: 96584696,
    nilaiBuku: 296302204,
    tahunKe: 4,
    bulanKe: 11,
    hasilBln: 59,
    penyusutanBln: 1637029,
    fixAkumulasi: 96584696,
    lokasi: "-",
    keterangan: "-",
    foto: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 2,
    kodeAktiva: "FA/PO2/2/VI/DPSA/2018/PM.1",
    typeAktiva: "Peralatan Mesin",
    namaAktivaTetap: "Mesin Felder",
    merk: "Hammer",
    spesifikasi: "K4 Perform Power 4Kw, Freq 50Hz Code Number: 8697",
    satuan: "Unit",
    tglPerolehan: "01/06/18",
    bulan: "JUNI",
    tahun: 2018,
    qty: 1,
    hargaPerolehan: 54474624,
    totalPerolehan: 54474624,
    nilaiSisa: 0,
    umurThn: 8,
    umurBln: 96,
    depresiasi: 567444,
    akumulasiDepresiasi: 54474624,
    nilaiBuku: 0,
    tahunKe: 8,
    bulanKe: 0,
    hasilBln: 96,
    penyusutanBln: 567444,
    fixAkumulasi: 54474624,
    lokasi: "Produksi Mesin",
    keterangan: "Dekat Ruang Maintenance",
    foto: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 3,
    kodeAktiva: "FA/PO2/2/VI/DPSA/2018/PM.2",
    typeAktiva: "Peralatan Mesin",
    namaAktivaTetap: "Mesin Felder",
    merk: "Hammer",
    spesifikasi: "K4 Perform Power 4Kw, Freq 50Hz Code Number: 8697",
    satuan: "Unit",
    tglPerolehan: "-",
    bulan: "-",
    tahun: 0,
    qty: 1,
    hargaPerolehan: 54474624,
    totalPerolehan: 0,
    nilaiSisa: 0,
    umurThn: 4,
    umurBln: 48,
    depresiasi: 0,
    akumulasiDepresiasi: 0,
    nilaiBuku: 0,
    tahunKe: 0,
    bulanKe: 0,
    hasilBln: 0,
    penyusutanBln: 0,
    fixAkumulasi: 0,
    lokasi: "Produksi Mesin",
    keterangan: "Dekat Ruang Maintenance",
    foto: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 4,
    kodeAktiva: "FA/PO2/3/I/DPSA/2019/PM",
    typeAktiva: "Peralatan Mesin",
    namaAktivaTetap: "Mesin CNC",
    merk: "Biesse",
    spesifikasi: "Rover Gold 1232 Power 17,1 Kw SN: 1000027499",
    satuan: "Unit",
    tglPerolehan: "01/01/19",
    bulan: "JANUARI",
    tahun: 2019,
    qty: 1,
    hargaPerolehan: 2159788072,
    totalPerolehan: 2159788072,
    nilaiSisa: 0,
    umurThn: 8,
    umurBln: 96,
    depresiasi: 22497792,
    akumulasiDepresiasi: 2002303525,
    nilaiBuku: 157484547,
    tahunKe: 7,
    bulanKe: 5,
    hasilBln: 89,
    penyusutanBln: 22497792,
    fixAkumulasi: 2002303525,
    lokasi: "Produksi Mesin",
    keterangan: "Sebelah Mesin Edging Jade 340",
    foto: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 5,
    kodeAktiva: "FA/PO2/5/I/DPSA/2021/PM",
    typeAktiva: "Peralatan Mesin",
    namaAktivaTetap: "Mesin Cool Press",
    merk: "WEILI",
    spesifikasi: "MH3248 K50 Power 3,7 Kw SN: 120516016",
    satuan: "Unit",
    tglPerolehan: "01/01/21",
    bulan: "JANUARI",
    tahun: 2021,
    qty: 1,
    hargaPerolehan: 71000000,
    totalPerolehan: 71000000,
    nilaiSisa: 0,
    umurThn: 8,
    umurBln: 96,
    depresiasi: 739583,
    akumulasiDepresiasi: 48072917,
    nilaiBuku: 22927083,
    tahunKe: 5,
    bulanKe: 5,
    hasilBln: 65,
    penyusutanBln: 739583,
    fixAkumulasi: 48072917,
    lokasi: "Produksi Mesin",
    keterangan: "Sebelah Mesin Glue Spreader",
    foto: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 6,
    kodeAktiva: "FA/PO2/8/XII/DPSA/2021/PM",
    typeAktiva: "Peralatan Mesin",
    namaAktivaTetap: "Dust Colector selco",
    merk: "Rakitan",
    spesifikasi: "-",
    satuan: "Unit",
    tglPerolehan: "01/12/21",
    bulan: "DESEMBER",
    tahun: 2021,
    qty: 1,
    hargaPerolehan: 44000000,
    totalPerolehan: 44000000,
    nilaiSisa: 0,
    umurThn: 8,
    umurBln: 96,
    depresiasi: 458333,
    akumulasiDepresiasi: 24750000,
    nilaiBuku: 19250000,
    tahunKe: 4,
    bulanKe: 6,
    hasilBln: 54,
    penyusutanBln: 458333,
    fixAkumulasi: 24750000,
    lokasi: "Produksi Mesin",
    keterangan: "-",
    foto: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 7,
    kodeAktiva: "FA/PO2/9/IV/DPSA/2022/PM",
    typeAktiva: "Peralatan Mesin",
    namaAktivaTetap: "Stabilisator mesin",
    merk: "Niwatori",
    spesifikasi: "25kVA",
    satuan: "Unit",
    tglPerolehan: "01/04/22",
    bulan: "APRIL",
    tahun: 2022,
    qty: 1,
    hargaPerolehan: 39075000,
    totalPerolehan: 39075000,
    nilaiSisa: 0,
    umurThn: 8,
    umurBln: 96,
    depresiasi: 407031,
    akumulasiDepresiasi: 20351563,
    nilaiBuku: 18723438,
    tahunKe: 4,
    bulanKe: 2,
    hasilBln: 50,
    penyusutanBln: 407031,
    fixAkumulasi: 20351563,
    lokasi: "Produksi Mesin",
    keterangan: "-",
    foto: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80"
  }
];

export const fallbackInventory: InventoryItem[] = [];

export interface User {
  id: number;
  username: string;
  nama: string;
  email?: string;
  role: string;
  divisi?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

// Auth Helpers
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dpsa_token');
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dpsa_token', token);
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('dpsa_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dpsa_user', JSON.stringify(user));
  }
}

export function clearStoredAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dpsa_token');
    localStorage.removeItem('dpsa_user');
  }
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; token: string; user: User; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login gagal.');
    }
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Gagal terhubung ke server.');
  }
}

// --- USER MANAGEMENT (Super Admin API) ---
export async function fetchUsers(): Promise<{ total: number; data: User[] }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal memuat data pengguna');
  return data;
}

export async function createUser(payload: { username: string; password: string; nama: string; email?: string; role: string; divisi?: string }): Promise<{ success: boolean; user: User }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal membuat akun pengguna');
  return data;
}

export async function updateUser(id: number, payload: { username?: string; password?: string; nama?: string; email?: string; role?: string; divisi?: string }): Promise<{ success: boolean; user: User }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal memperbarui data pengguna');
  return data;
}

export async function deleteUser(id: number): Promise<{ success: boolean; message: string }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengguna');
  return data;
}

export const DEFAULT_DIVISI_OPTIONS: string[] = ['PT Dharma Putra Sejahtera Abadi'];

export function isDpsaDivisi(divisiName?: string): boolean {
  if (!divisiName || !divisiName.trim()) return false;
  const clean = divisiName.trim().toUpperCase();
  return (
    clean === 'DPSA' ||
    clean === 'PT DHARMA PUTRA SEJAHTERA ABADI' ||
    clean === 'PT. DHARMA PUTRA SEJAHTERA ABADI' ||
    clean.includes('DHARMA PUTRA')
  );
}

export const DEFAULT_ROLE_OPTIONS = [
  'Super Admin',
  'HR',
  'Direktur Utama',
  'Direktur Keuangan',
  'Direktur Operasional',
  'Staff Lainnya',
];

export interface DivisiItem {
  id: number;
  nama: string;
  isCustom?: boolean;
}

export interface UserOptionsResponse {
  divisi: string[];
  divisiItems?: DivisiItem[];
  roles: string[];
  customDivisi: string[];
  customRoles: string[];
}

export function isAllDivisiValue(divisi?: string): boolean {
  const up = String(divisi || '').trim().toUpperCase();
  return up === 'ALL' || up === 'SEMUA' || up === 'SEMUA DIVISI';
}

function getEffectiveActiveDivisi(divisi?: string): string {
  if (divisi && String(divisi).trim()) return String(divisi).trim();
  const stored = getStoredUser();
  if (stored?.role === 'Super Admin') return 'ALL';
  const clean = String(stored?.divisi || 'DPSA').trim();
  return clean || 'DPSA';
}

function buildApiHeaders(divisi?: string, includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    'x-active-divisi': getEffectiveActiveDivisi(divisi),
  };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function fetchUserOptions(): Promise<UserOptionsResponse> {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE_URL}/user-options`, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('fallback');
    const data: UserOptionsResponse = await res.json();
    if (typeof window !== 'undefined' && Array.isArray(data.divisi) && data.divisi.length > 0) {
      try {
        localStorage.setItem('dpsa_cached_divisi_options', JSON.stringify(data.divisi));
      } catch {}
    }
    return data;
  } catch {
    let cachedDivisi: string[] = ['PT Dharma Putra Sejahtera Abadi'];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('dpsa_cached_divisi_options');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) cachedDivisi = parsed;
        }
      } catch {}
    }
    return {
      divisi: cachedDivisi,
      divisiItems: cachedDivisi.map((nama, idx) => ({ id: idx + 1, nama, isCustom: !isDpsaDivisi(nama) })),
      roles: [...DEFAULT_ROLE_OPTIONS],
      customDivisi: cachedDivisi.filter((d) => !isDpsaDivisi(d)),
      customRoles: [],
    };
  }
}

export async function addUserOption(
  category: 'divisi' | 'role',
  value: string
): Promise<{ success: boolean; message: string; category: string; value: string }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/user-options`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify({ category, value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menambahkan opsi master');
  return data;
}

export async function updateUserOption(
  category: 'divisi' | 'role',
  oldValue: string,
  newValue: string
): Promise<{ success: boolean; message: string }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/user-options`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify({ category, oldValue, newValue }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal memperbarui opsi master');
  return data;
}

export async function deleteUserOption(
  category: 'divisi' | 'role',
  value: string
): Promise<{ success: boolean; message: string }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/user-options`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify({ category, value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menghapus opsi master');

  if (typeof window !== 'undefined' && category === 'divisi') {
    try {
      const raw = localStorage.getItem('dpsa_cached_divisi_options');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((d: string) => d.toLowerCase() !== value.toLowerCase());
          localStorage.setItem('dpsa_cached_divisi_options', JSON.stringify(updated));
        }
      }
    } catch {}
  }

  return data;
}

export const PRODUCTION_DOMAIN = "https://assetinventory.dharmaputrainterior.co.id";

export function buildScanQrUrl(code: string, customDomain?: string): string {
  const cleanCode = (code || "").trim();
  if (!cleanCode) return "-";
  let domain = customDomain && customDomain.trim();
  if (!domain) {
    if (typeof window !== "undefined" && window.location.origin) {
      domain = window.location.origin;
    } else {
      domain = PRODUCTION_DOMAIN;
    }
  }
  domain = domain.replace(/\/+$/, "");
  return `${domain}/?kode=${encodeURIComponent(cleanCode)}`;
}

export async function fetchScanItem(
  kode: string
): Promise<{ success: boolean; type: "fixAsset" | "inventory"; item: FixAssetItem | InventoryItem }> {
  const res = await fetch(`${API_BASE_URL}/scan?kode=${encodeURIComponent(kode.trim())}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Data aset tidak ditemukan");
  return data;
}

// Company Images per Divisi (Default menggunakan logo perusahaan)
export const DEFAULT_COMPANY_BUILDING_IMAGE = "/logo-dpsa.png";

export function getCachedDivisiImages(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dpsa_divisi_company_images");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function getDpsaLogo(): string {
  const cached = getCachedDivisiImages();
  if (cached["PT DHARMA PUTRA SEJAHTERA ABADI"]) return cached["PT DHARMA PUTRA SEJAHTERA ABADI"];
  if (cached["DPSA"]) return cached["DPSA"];
  for (const [key, val] of Object.entries(cached)) {
    if (isDpsaDivisi(key) && val) {
      return val;
    }
  }
  return DEFAULT_COMPANY_BUILDING_IMAGE;
}

export function getDivisiCompanyImage(divisiName?: string): string {
  if (!divisiName || !divisiName.trim() || isAllDivisiValue(divisiName)) {
    return "/logo-dpsa.png";
  }
  const clean = divisiName.trim().toUpperCase();
  if (isDpsaDivisi(clean)) {
    return "/logo-dpsa.png";
  }
  const cached = getCachedDivisiImages();
  if (cached[clean]) return cached[clean];

  const cleanNoPrefix = clean.replace(/^(PT|CV|UD|PD)\.?\s+/i, "").trim();
  if (cleanNoPrefix && cached[cleanNoPrefix]) return cached[cleanNoPrefix];

  for (const [key, val] of Object.entries(cached)) {
    if (!val || !val.trim()) continue;
    const keyClean = key.trim().toUpperCase();
    const keyNoPrefix = keyClean.replace(/^(PT|CV|UD|PD)\.?\s+/i, "").trim();

    if (
      keyClean === clean ||
      (keyNoPrefix && cleanNoPrefix && (keyNoPrefix === cleanNoPrefix || cleanNoPrefix.includes(keyNoPrefix) || keyNoPrefix.includes(cleanNoPrefix))) ||
      keyClean === `PT ${cleanNoPrefix}` ||
      clean === `PT ${keyNoPrefix}`
    ) {
      return val;
    }
  }
  return "/logo-dpsa.png";
}

export async function fetchDivisiImages(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE_URL}/divisi-images`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.images && typeof data.images === "object") {
        if (typeof window !== "undefined") {
          try {
            const merged = { ...getCachedDivisiImages(), ...data.images };
            localStorage.setItem("dpsa_divisi_company_images", JSON.stringify(merged));
          } catch {}
        }
        return data.images;
      }
    }
  } catch {}
  return getCachedDivisiImages();
}

export async function saveDivisiCompanyImage(divisi: string, image: string): Promise<Record<string, string>> {
  const clean = divisi.trim().toUpperCase();
  const cleanNoPrefix = clean.replace(/^(PT|CV|UD|PD)\.?\s+/i, "").trim();
  const current = getCachedDivisiImages();
  if (image && image.trim()) {
    current[clean] = image.trim();
    if (cleanNoPrefix) {
      current[cleanNoPrefix] = image.trim();
      current[`PT ${cleanNoPrefix}`] = image.trim();
    }
  } else {
    delete current[clean];
    if (cleanNoPrefix) {
      delete current[cleanNoPrefix];
      delete current[`PT ${cleanNoPrefix}`];
    }
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("dpsa_divisi_company_images", JSON.stringify(current));
      window.dispatchEvent(new CustomEvent("dpsa_divisi_images_updated", { detail: { divisi: clean, image } }));
    } catch {}
  }
  try {
    await fetch(`${API_BASE_URL}/divisi-images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ divisi: clean, image }),
    });
  } catch {}
  return current;
}

// Divisi Codes for Kode Barang (Mapping nama lengkap divisi ke kode singkatan untuk kode barang)
export function getCachedDivisiCodes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dpsa_divisi_codes");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function getDivisiCode(divisiName?: string): string {
  if (!divisiName || !divisiName.trim()) return "DPSA";
  const clean = divisiName.trim().toUpperCase();
  if (isAllDivisiValue(clean) || isDpsaDivisi(clean)) return "DPSA";
  const cached = getCachedDivisiCodes();
  if (cached[clean]) return cached[clean];
  for (const [key, val] of Object.entries(cached)) {
    if (key && (clean === key || clean.includes(key) || key.includes(clean))) {
      return val;
    }
  }
  // Fallback: strip non-alphanumeric, limit to 10 chars, default DPSA
  return clean.replace(/[^A-Z0-9]/g, "").slice(0, 10) || "DPSA";
}

export async function fetchDivisiCodes(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE_URL}/divisi-codes`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.codes && typeof data.codes === "object") {
        if (typeof window !== "undefined") {
          try {
            const merged = { ...getCachedDivisiCodes(), ...data.codes };
            localStorage.setItem("dpsa_divisi_codes", JSON.stringify(merged));
          } catch {}
        }
        return data.codes;
      }
    }
  } catch {}
  return getCachedDivisiCodes();
}

export async function saveDivisiCode(divisi: string, code: string): Promise<Record<string, string>> {
  const cleanDivisi = divisi.trim().toUpperCase();
  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const current = getCachedDivisiCodes();
  if (cleanCode) {
    current[cleanDivisi] = cleanCode;
  } else {
    delete current[cleanDivisi];
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("dpsa_divisi_codes", JSON.stringify(current));
      window.dispatchEvent(
        new CustomEvent("dpsa_divisi_codes_updated", { detail: { divisi: cleanDivisi, code: cleanCode } })
      );
    } catch {}
  }
  try {
    await fetch(`${API_BASE_URL}/divisi-codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ divisi: cleanDivisi, code: cleanCode }),
    });
  } catch {}
  return current;
}

export function extractItemDivisi(item: FixAssetItem | InventoryItem | null): string {
  if (!item) return "DPSA";
  if (item.divisi && item.divisi.trim() && item.divisi.toUpperCase() !== "ALL") {
    return item.divisi.trim().toUpperCase();
  }
  const fix = item as FixAssetItem;
  if (fix.pemilik && fix.pemilik.trim()) {
    const cleaned = fix.pemilik.trim().toUpperCase();
    if (cleaned.includes("-")) {
      const parts = cleaned.split("-");
      return parts[parts.length - 1].trim();
    }
    return cleaned;
  }
  const code = (fix.kodeAktiva || (item as InventoryItem).kodeBarang || (item as InventoryItem).kodeBarcode || "").toUpperCase();
  const segments = code.split("/");
  for (const seg of segments) {
    if (seg.includes("-")) {
      const sub = seg.split("-");
      if (sub[1] && sub[1].length >= 2) {
        return sub[1].trim();
      }
    }
  }
  return "DPSA";
}

export async function fetchOverview(divisi?: string): Promise<OverviewData> {
  const effectiveDivisi = getEffectiveActiveDivisi(divisi);
  const emptyOverview: OverviewData = {
    totalFixAssetCount: 0,
    totalFixAssetValue: 0,
    totalInventoryCount: 0,
    totalInventoryValue: 0,
    allocationDPSA: 0,
    allocationDPM: 0,
    allocationPakBoyke: 0,
    sheetsConnected: true,
    lastSync: '-',
  };
  const allowFallback = effectiveDivisi.toUpperCase() === 'DPSA' || isAllDivisiValue(effectiveDivisi);
  try {
    const res = await fetch(
      `${API_BASE_URL}/overview?divisi=${encodeURIComponent(effectiveDivisi)}`,
      {
        headers: buildApiHeaders(effectiveDivisi),
        cache: 'no-store',
      }
    );
    if (!res.ok) return allowFallback ? fallbackOverview : emptyOverview;
    return await res.json();
  } catch {
    return allowFallback ? fallbackOverview : emptyOverview;
  }
}

export async function fetchFixAssets(
  search = '',
  month = '',
  year = '',
  divisi?: string
): Promise<{ total: number; data: FixAssetItem[] }> {
  const effectiveDivisi = getEffectiveActiveDivisi(divisi);
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (month && month !== 'SEMUA') params.append('month', month);
    if (year && year !== 'SEMUA') params.append('year', year);
    params.append('divisi', effectiveDivisi);

    const res = await fetch(`${API_BASE_URL}/fix-assets?${params.toString()}`, {
      headers: buildApiHeaders(effectiveDivisi),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('fallback');
    return await res.json();
  } catch {
    if (effectiveDivisi.toUpperCase() !== 'DPSA' && !isAllDivisiValue(effectiveDivisi)) {
      return { total: 0, data: [] };
    }
    let filtered = [...fallbackFixAssets];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i => 
        i.kodeAktiva.toLowerCase().includes(q) || 
        i.namaAktivaTetap.toLowerCase().includes(q) ||
        i.merk.toLowerCase().includes(q) ||
        i.lokasi.toLowerCase().includes(q)
      );
    }
    return { total: filtered.length, data: filtered };
  }
}

export async function fetchInventory(
  search = '',
  divisi?: string
): Promise<{ total: number; data: InventoryItem[] }> {
  const effectiveDivisi = getEffectiveActiveDivisi(divisi);
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('divisi', effectiveDivisi);

    const res = await fetch(`${API_BASE_URL}/inventory?${params.toString()}`, {
      headers: buildApiHeaders(effectiveDivisi),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('fallback');
    return await res.json();
  } catch {
    if (effectiveDivisi.toUpperCase() !== 'DPSA' && !isAllDivisiValue(effectiveDivisi)) {
      return { total: 0, data: [] };
    }
    let filtered = [...fallbackInventory];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        (i.kodeBarang && i.kodeBarang.toLowerCase().includes(q)) ||
        i.namaBarang.toLowerCase().includes(q) ||
        i.tipeUkuran.toLowerCase().includes(q) ||
        i.keterangan.toLowerCase().includes(q) ||
        i.kodeBarcode.toLowerCase().includes(q)
      );
    }
    return { total: filtered.length, data: filtered };
  }
}

export async function createFixAsset(
  item: Partial<FixAssetItem>,
  divisi?: string
): Promise<FixAssetItem> {
  const res = await fetch(`${API_BASE_URL}/fix-assets`, {
    method: 'POST',
    headers: buildApiHeaders(divisi, true),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Gagal menambah Fix Asset');
  return res.json();
}

export async function updateFixAsset(
  id: number,
  item: Partial<FixAssetItem>,
  divisi?: string
): Promise<FixAssetItem> {
  const res = await fetch(`${API_BASE_URL}/fix-assets/${id}`, {
    method: 'PUT',
    headers: buildApiHeaders(divisi, true),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Gagal memperbarui Fix Asset');
  return res.json();
}

export async function deleteFixAsset(
  id: number,
  divisi?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/fix-assets/${id}`, {
    method: 'DELETE',
    headers: buildApiHeaders(divisi),
  });
  if (!res.ok) throw new Error('Gagal menghapus Fix Asset');
  return res.json();
}

export async function createInventoryItem(
  item: Partial<InventoryItem>,
  divisi?: string
): Promise<InventoryItem> {
  const res = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers: buildApiHeaders(divisi, true),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Gagal menambah Inventory');
  return res.json();
}

export async function updateInventoryItem(
  id: number,
  item: Partial<InventoryItem>,
  divisi?: string
): Promise<InventoryItem> {
  const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: 'PUT',
    headers: buildApiHeaders(divisi, true),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Gagal memperbarui Inventory');
  return res.json();
}

export async function deleteInventoryItem(
  id: number,
  divisi?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: 'DELETE',
    headers: buildApiHeaders(divisi),
  });
  if (!res.ok) throw new Error('Gagal menghapus Inventory');
  return res.json();
}

export async function clearAllInventory(
  divisi?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'DELETE',
    headers: buildApiHeaders(divisi),
  });
  if (!res.ok) throw new Error('Gagal menghapus semua data Inventory');
  return res.json();
}

export async function clearAllFixAssets(
  divisi?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/fix-assets`, {
    method: 'DELETE',
    headers: buildApiHeaders(divisi),
  });
  if (!res.ok) throw new Error('Gagal menghapus semua data Fix Asset');
  return res.json();
}

export async function importFixAssets(
  items: Partial<FixAssetItem>[],
  divisi?: string
): Promise<{ success: boolean; count: number; message: string }> {
  const res = await fetch(`${API_BASE_URL}/fix-assets/import`, {
    method: 'POST',
    headers: buildApiHeaders(divisi, true),
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mengimpor data Fix Asset ke database');
  return data;
}

export async function importInventory(
  items: Partial<InventoryItem>[],
  divisi?: string
): Promise<{ success: boolean; count: number; message: string }> {
  const res = await fetch(`${API_BASE_URL}/inventory/import`, {
    method: 'POST',
    headers: buildApiHeaders(divisi, true),
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mengimpor data Inventory ke database');
  return data;
}

export function formatRupiah(value: number | string): string {
  const num = Number(value);
  if (isNaN(num) || num === 0) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

export function formatNumber(value: number | string): string {
  const num = Number(value);
  if (isNaN(num)) return "-";
  return num.toLocaleString("id-ID");
}

/**
 * Extracts Google Drive File ID from various Google Drive sharing URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID&export=view
 * - https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
 * - https://lh3.googleusercontent.com/d/FILE_ID=w1000
 */
export function extractGoogleDriveFileId(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const s = rawUrl.trim();
  if (!s || s.startsWith("data:image/")) return null;

  const isGoogleDrive =
    s.includes("drive.google.com") ||
    s.includes("docs.google.com") ||
    s.includes("drive.usercontent.google.com") ||
    s.includes("lh3.googleusercontent.com/d/");

  if (!isGoogleDrive) return null;

  // Match /d/{id} or /file/d/{id} or /folders/{id} or /u/0/d/{id}
  const pathMatch =
    s.match(/\/(?:file\/)?(?:u\/\d+\/)?(?:d|folders)\/([a-zA-Z0-9_-]{10,})/i) ||
    s.match(/\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Match ?id={id} or &id={id} or &fileId={id}
  const queryMatch = s.match(/[?&](?:id|fileId)=([a-zA-Z0-9_-]{10,})/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  return null;
}

/**
 * Converts any image reference (Google Drive sharing link, direct image URL, or Base64 data URI)
 * into a browser-renderable image URL for <img> tags.
 */
export function formatImageDisplayUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "-") return "";

  if (trimmed.startsWith("data:image/")) {
    // Reject corrupt or 1-pixel dummy placeholder base64 strings (e.g. /9j_AAAAAAAAAAAAAAAAAAAAAD//2Q==)
    if (trimmed.length < 250 || trimmed.includes("AAAAAAAAAAAAAAAAAAAA")) {
      return "";
    }
    return trimmed;
  }

  // Extract first http(s) URL if cell text contains a label + URL
  const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>)]+/i);
  const candidate = urlMatch ? urlMatch[0] : trimmed;

  const gdriveId = extractGoogleDriveFileId(candidate);
  if (gdriveId) {
    return `https://drive.google.com/thumbnail?id=${gdriveId}&sz=w1000`;
  }

  return candidate;
}

/**
 * Fallback handler for <img> onError when rendering Google Drive links.
 * Tries lh3.googleusercontent.com and uc?export=view if thumbnail endpoint fails.
 */
export function handleGoogleDriveImageError(
  e: { currentTarget: HTMLImageElement },
  originalUrl?: string
): void {
  const img = e.currentTarget;
  const currentSrc = img.src || "";
  const fileId = extractGoogleDriveFileId(originalUrl) || extractGoogleDriveFileId(currentSrc);

  if (!fileId) {
    return;
  }

  const step = img.dataset.fallbackStep || "0";
  if (step === "0") {
    img.dataset.fallbackStep = "1";
    img.src = `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  } else if (step === "1") {
    img.dataset.fallbackStep = "2";
    img.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
}

/**
 * Reads and compresses an uploaded image File into an optimized Data URL (JPEG/PNG)
 * so it can be saved directly to the database.
 */
export function convertImageFileToDataUrl(file: File, maxDimension = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const result = String(reader.result || "");
      if (typeof document === "undefined") {
        resolve(result);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(result);
            return;
          }
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Returns the combined Total Harga Perolehan for an Inventory item.
 */
export function getInventoryTotalHarga(item: Partial<InventoryItem>): number {
  if (item.totalHargaPerolehan !== undefined && Number(item.totalHargaPerolehan) > 0) {
    return Number(item.totalHargaPerolehan);
  }
  const sumAlloc = (Number(item.dpsa) || 0) + (Number(item.dpm) || 0) + (Number(item.pakBoyke) || 0);
  if (sumAlloc > 0) return sumAlloc;
  return (Number(item.hargaSatuan) || 0) * (Number(item.jumlah) || 1);
}

/**
 * Resolves the Pemilik / Pemilikan label ("DPSA", "DPM", or "Pak Boyke") for an Inventory item.
 */
export function getInventoryPemilik(item: Partial<InventoryItem>): string {
  const raw = String(item.pemilik || "").trim();
  if (raw && raw !== "-") {
    const upper = raw.toUpperCase();
    if (upper.includes("DPM")) return "DPM";
    if (upper.includes("BOYKE") || upper.includes("YBD")) return "Pak Boyke";
    if (upper.includes("DPSA")) return "DPSA";
    return raw;
  }
  if ((Number(item.dpm) || 0) > 0) return "DPM";
  if ((Number(item.pakBoyke) || 0) > 0) return "Pak Boyke";
  if ((Number(item.dpsa) || 0) > 0) return "DPSA";

  const code = String(item.kodeBarang || item.kodeBarcode || "").toUpperCase();
  if (code.includes("/DPM/")) return "DPM";
  if (code.includes("/YBD/") || code.includes("BOYKE")) return "Pak Boyke";
  return "DPSA";
}

const COMPOUND_TWO_WORD_PREFIXES = new Set([
  "air",
  "water",
  "vacuum",
  "exhaust",
  "filing",
  "white",
  "hand",
  "dust",
  "paper",
]);

const DESCRIPTIVE_LEADING_PREFIXES = new Set([
  "tempat",
  "kotak",
  "box",
  "papan",
  "alat",
]);

const UPPERCASE_ACRONYMS = new Set([
  "AC",
  "TV",
  "PC",
  "UPS",
  "CCTV",
  "APAR",
  "CPU",
  "LCD",
  "LED",
  "WIFI",
  "DVR",
  "NVR",
  "HT",
  "P3K",
  "USB",
  "LAN",
  "ATS",
]);

// 1. High-priority multi-word / specific item rules checked BEFORE head-noun or generic rules
const PRIORITY_JENIS_RULES: { pattern: RegExp; canonical: string }[] = [
  // Dust Collector (termasuk "Single Dust Collector", "Dust Colector selco")
  {
    pattern: /\b(dust\s*col+ectors?|single\s*dust\s*col+ectors?)\b/i,
    canonical: "Dust Collector",
  },
  // Laptop (Laptop, Lap Top, Lap-Top, Notebook, Lenovo, Thinkpad)
  {
    pattern: /\b(laptops?|lap[\s\-_.]*tops?|notebooks?|lenovo|thinkpads?)\b/i,
    canonical: "Laptop",
  },
  // Clamp (termasuk "Table Clamp", "Clamp F", "Pres Clamp")
  {
    pattern: /\b(table\s*clamps?|f\s*clamps?|c\s*clamps?|clamp\s*f|pres+\s*clamps?|clamps?|klem)\b/i,
    canonical: "Clamp",
  },
  // CCTV (termasuk "Kamera CCTV", "TV Monitor CCTV", "DVR CCTV")
  {
    pattern: /\b(cctv|kamera\s*cctv|tv\s*monitor\s*cctv|dvr(\s*cctv)?|nvr(\s*cctv)?)\b/i,
    canonical: "CCTV",
  },
  // Tempat Sampah (Trash Bin, Dustbin, Waste Bin, Tong Sampah)
  {
    pattern: /\b(tempat\s*sampah|tong\s*sampah|keranjang\s*sampah|trash\s*(bins?|cans?)|dust\s*bins?|dustbins?|waste\s*bins?)\b/i,
    canonical: "Tempat Sampah",
  },
  // Kotak P3K
  {
    pattern: /\b(kotak\s*p3k|box\s*p3k|p3k|first\s*aid)\b/i,
    canonical: "Kotak P3K",
  },
  // APAR (termasuk "Appar", "Box Appar", "Tempat APAR", "Fire Extinguisher")
  {
    pattern: /\b(ap+ar|box\s*ap+ar|tempat\s*ap+ar|fire\s*extinguishers?|extinguishers?|tabung\s*pemadam|alat\s*pemadam)\b/i,
    canonical: "APAR",
  },
  // Paper Shredder (termasuk "Paper Shreader", "Penghancur Kertas")
  {
    pattern: /\b(paper\s*shre+d+ers?|penghancur\s*kertas|mesin\s*penghancur\s*kertas)\b/i,
    canonical: "Paper Shredder",
  },
  // Vacuum Cleaner (termasuk "Vacum Cleaner")
  {
    pattern: /\b(vacu+m(\s*cleaners?)?)\b/i,
    canonical: "Vacuum Cleaner",
  },
  // Aquarium (termasuk "Tempat Aquarium")
  {
    pattern: /\b(aquariums?|akuarium|tempat\s*aquariums?)\b/i,
    canonical: "Aquarium",
  },
];

// 2. Leading head-noun rules (menjaga kata benda utama di awal nama barang bahasa Indonesia,
//    mis. "Meja Dispenser" -> "Meja", "Meja Alat Kopi" -> "Meja", "Kursi Sofa" -> "Kursi",
//    "Sofa 1 Seater" -> "Sofa", "Lemari Kunci" -> "Lemari", "Stabilisator mesin" -> "Stabilisator")
const HEAD_NOUN_JENIS_RULES: { pattern: RegExp; canonical: string }[] = [
  { pattern: /^(lenovo|thinkpads?)\b/i, canonical: "Laptop" },
  { pattern: /^(kursi|bangku)\b/i, canonical: "Kursi" },
  { pattern: /^sofas?\b/i, canonical: "Sofa" },
  { pattern: /^meja\b/i, canonical: "Meja" },
  { pattern: /^(credensas?|credenzas?)\b/i, canonical: "Credensa" },
  { pattern: /^(lemari|almari|kabinet|loker|lockers?|bufet)\b/i, canonical: "Lemari" },
  { pattern: /^nakas\b/i, canonical: "Nakas" },
  { pattern: /^rak\b/i, canonical: "Rak" },
  { pattern: /^(papan\s*tulis|papan\s*gambar|white\s*boards?|whiteboards?)\b/i, canonical: "Papan Tulis" },
  { pattern: /^kipas(\s*angin)?\b/i, canonical: "Kipas Angin" },
  { pattern: /^jam(\s*dinding)?\b/i, canonical: "Jam Dinding" },
  { pattern: /^(lampu|kap\s*lampu)\b/i, canonical: "Lampu" },
  { pattern: /^cermin\b/i, canonical: "Cermin" },
  { pattern: /^(patung|ukiran|tugu)\b/i, canonical: "Patung" },
  { pattern: /^(lukisan|pigura|figura|foto)\b/i, canonical: "Lukisan" },
  { pattern: /^(hiasan\s*kayu\s*\/?\s*patung)\b/i, canonical: "Patung" },
  { pattern: /^(hiasan|aksesoris\s*dinding|guci)\b/i, canonical: "Hiasan" },
  { pattern: /^kunci\b/i, canonical: "Kunci" },
  { pattern: /^tang\b/i, canonical: "Tang" },
  { pattern: /^palu\b/i, canonical: "Palu" },
  { pattern: /^selang\b/i, canonical: "Selang" },
  { pattern: /^tangga\b/i, canonical: "Tangga" },
  { pattern: /^(stabilisator|stabilizers?)\b/i, canonical: "Stabilisator" },
  { pattern: /^(kompresor|compressors?)\b/i, canonical: "Kompresor" },
  { pattern: /^blowers?\b/i, canonical: "Blower" },
  { pattern: /^pompa\b/i, canonical: "Pompa" },
  { pattern: /^(ph?anel|ats|traff?o)\b/i, canonical: "Panel" },
  { pattern: /^ruko\b/i, canonical: "Ruko" },
  { pattern: /^(gedung|bangunan)\b/i, canonical: "Gedung" },
  { pattern: /^(mesin\s*kopi|coffe+\s*makers?)\b/i, canonical: "Coffee Maker" },
  { pattern: /^mesin\b/i, canonical: "Mesin" },
];

// 3. Synonym & English-to-Indonesian rules checked across the item name
const JENIS_SYNONYM_RULES: { pattern: RegExp; canonical: string }[] = [
  // Kursi (Chair, Single Chair, Singlechair, Stool, Armchair, Puff Chair, Green Chair, Bangku, Seat Cushion)
  {
    pattern: /\b(kursi|chairs?|single\s*chairs?|singlechairs?|arm\s*chairs?|armchairs?|puff\s*chairs?|green\s*chairs?|stools?|barstools?|bangku|seat\s*cushions?)\b/i,
    canonical: "Kursi",
  },
  // Jika nama barang hanya "Single", kelompokkan ke Kursi
  {
    pattern: /^single$/i,
    canonical: "Kursi",
  },
  // Sofa (Couch, Bench, Settee, Lounger, Seater)
  {
    pattern: /\b(sofas?|couch(es)?|settees?|loungers?|bench(es)?|seaters?)\b/i,
    canonical: "Sofa",
  },
  // Meja (Table, Tbl, Desk, Workstation)
  {
    pattern: /\b(meja|tables?|tbl|desks?|workstations?)\b/i,
    canonical: "Meja",
  },
  // Credensa (Credenza, Sideboard)
  {
    pattern: /\b(credensas?|credenzas?|sideboards?)\b/i,
    canonical: "Credensa",
  },
  // Lemari (Cabinet, Kabinet, Filing Cabinet, Cupboard, Wardrobe, Locker, Loker, Closet, Bufet)
  {
    pattern: /\b(lemari|almari|kabinet|cabinets?|filing\s*cabinets?|filling\s*cabinets?|cupboards?|wardrobes?|lockers?|loker|closets?|bufet)\b/i,
    canonical: "Lemari",
  },
  // Nakas (Nightstand)
  {
    pattern: /\b(nakas|nightstands?)\b/i,
    canonical: "Nakas",
  },
  // Rak (Rack, Shelf, Shelves, Bookshelf, Ambalan)
  {
    pattern: /\b(rak|racks?|shel(f|ves)|bookshel(f|ves)|ambalan)\b/i,
    canonical: "Rak",
  },
  // Papan Tulis (Whiteboard, White Board, Blackboard, Papan Gambar)
  {
    pattern: /\b(papan\s*tulis|papan\s*gambar|papan\s*informasi|white\s*boards?|whiteboards?|black\s*boards?|blackboards?)\b/i,
    canonical: "Papan Tulis",
  },
  // AC (Air Conditioner)
  {
    pattern: /\b(ac|air\s*conditioners?|aircons?)\b/i,
    canonical: "AC",
  },
  // Kipas Angin (Fan, Exhaust Fan, Stand Fan, Wall Fan, Ceiling Fan)
  {
    pattern: /\b(kipas(\s*angin)?|exhaust\s*fans?|stand\s*fans?|wall\s*fans?|ceiling\s*fans?|fans?)\b/i,
    canonical: "Kipas Angin",
  },
  // Blower
  {
    pattern: /\b(blowers?)\b/i,
    canonical: "Blower",
  },
  // Jam Dinding (Wall Clock, Clock)
  {
    pattern: /\b(jam(\s*dinding)?|wall\s*clocks?|clocks?)\b/i,
    canonical: "Jam Dinding",
  },
  // Komputer (Computer, Desktop, PC, CPU, Monitor)
  {
    pattern: /\b(komputers?|computers?|desktops?|pc|cpu|monitors?)\b/i,
    canonical: "Komputer",
  },
  // Printer (Printer, Scanner)
  {
    pattern: /\b(printers?|scanners?)\b/i,
    canonical: "Printer",
  },
  // TV (Television, Smart TV, LED TV)
  {
    pattern: /\b(tv|televisi|televisions?|led\s*tv|smart\s*tv)\b/i,
    canonical: "TV",
  },
  // Speaker (Sound Speaker, Sound Mixer, Mic, Microphone)
  {
    pattern: /\b(speakers?|sound\s*speakers?|sound\s*mixers?|sound\s*systems?|microphones?|mic)\b/i,
    canonical: "Speaker",
  },
  // Telepon (Telephone, Telefon, Telp, Phone, Walky Talky, HT)
  {
    pattern: /\b(telepon|telefon|telp|telephones?|phones?|walky\s*talky|walkie\s*talkie|ht)\b/i,
    canonical: "Telepon",
  },
  // Lampu (Lamp, Kap Lampu, Light, Chandelier, Spotlight)
  {
    pattern: /\b(lampu|kap\s*lampu|lamps?|lights?|lightings?|chandeliers?|spotlights?)\b/i,
    canonical: "Lampu",
  },
  // Cermin (Mirror, Kaca Cermin)
  {
    pattern: /\b(cermin|mirrors?)\b/i,
    canonical: "Cermin",
  },
  // Patung (Statue, Ukiran, Tugu)
  {
    pattern: /\b(patung|statues?|ukiran|tugu)\b/i,
    canonical: "Patung",
  },
  // Lukisan (Painting, Picture, Frame, Pigura, Figura, Foto)
  {
    pattern: /\b(lukisan|paintings?|pictures?|artworks?|pigura|figura|bingkai|frames?|foto)\b/i,
    canonical: "Lukisan",
  },
  // Hiasan (Aksesoris Dinding, Dekorasi, Ornamen, Guci)
  {
    pattern: /\b(hiasan|aksesoris\s*dinding|dekorasi|ornamen|guci)\b/i,
    canonical: "Hiasan",
  },
  // Salib
  {
    pattern: /\b(salib)\b/i,
    canonical: "Salib",
  },
  // Kulkas (Refrigerator, Fridge, Chiller, Freezer)
  {
    pattern: /\b(kulkas|refrigerators?|fridges?|chillers?|freezers?)\b/i,
    canonical: "Kulkas",
  },
  // Dispenser (Water Dispenser, Water Purifier)
  {
    pattern: /\b(dispensers?|water\s*dispensers?|water\s*pur+ifiers?)\b/i,
    canonical: "Dispenser",
  },
  // Coffee Maker (Coffe Maker, Mesin Kopi, Alat Kopi)
  {
    pattern: /\b(coffe+\s*makers?|mesin\s*kopi|alat\s*kopi)\b/i,
    canonical: "Coffee Maker",
  },
  // Kompor (Stove, Microwave, Kitchen Set)
  {
    pattern: /\b(kompor|stoves?|microwaves?|kitchen\s*sets?)\b/i,
    canonical: "Kompor",
  },
  // Kompresor (Compressor)
  {
    pattern: /\b(kompresor|compressors?)\b/i,
    canonical: "Kompresor",
  },
  // Panel (Phanel, ATS, Trafo)
  {
    pattern: /\b(ph?anel|ats|traff?o)\b/i,
    canonical: "Panel",
  },
  // Stabilisator (Stabilizer)
  {
    pattern: /\b(stabilisator|stabilizers?)\b/i,
    canonical: "Stabilisator",
  },
  // Mesin (Machine, Running Saw, Saw Blade, Conveyor)
  {
    pattern: /\b(mesin|machines?|running\s*saws?|saw\s*blades?|conveyors?)\b/i,
    canonical: "Mesin",
  },
  // Pompa (Pump)
  {
    pattern: /\b(pompa|pumps?)\b/i,
    canonical: "Pompa",
  },
  // Karpet (Carpet, Rug)
  {
    pattern: /\b(karpet|carpets?|rugs?)\b/i,
    canonical: "Karpet",
  },
  // Gorden (Curtain, Blind, Roller Blind, Vertical Blind, Tirai)
  {
    pattern: /\b(gorden|gordyn|tirai|curtains?|blinds?|roller\s*blinds?|vertical\s*blinds?)\b/i,
    canonical: "Gorden",
  },
  // Brankas (Safe, Safe Box, Safety Box)
  {
    pattern: /\b(brankas|safe\s*box(es)?|safety\s*box(es)?)\b/i,
    canonical: "Brankas",
  },
  // Tangga (Ladder, Step Ladder)
  {
    pattern: /\b(tangga|ladders?|step\s*ladders?)\b/i,
    canonical: "Tangga",
  },
  // Troli (Trolley, Hand Trolley, Cart)
  {
    pattern: /\b(troli|trolleys?|carts?)\b/i,
    canonical: "Troli",
  },
  // Timbangan (Scale, Weighing Scale)
  {
    pattern: /\b(timbangan|weighing\s*scales?|scales?)\b/i,
    canonical: "Timbangan",
  },
  // Meteran / Alat Ukur (Meteran, Jangka Sorong, Water Pass, Pengukur Suhu)
  {
    pattern: /\b(meteran|jangka\s*sorong|water\s*pass|pengukur\s*suhu)\b/i,
    canonical: "Meteran",
  },
  // Kontainer (Container, Belt Kontener)
  {
    pattern: /\b(kontainer|containers?|belt\s*kontener)\b/i,
    canonical: "Kontainer",
  },
  // Kunci Perkakas
  {
    pattern: /\b(kunci\s*(ring|pas|l|inggris|pisau|sok|shock|momen|pipa))\b/i,
    canonical: "Kunci",
  },
  // Tang
  {
    pattern: /\b(tang(\s*potong|\s*kombinasi|\s*lancip|\s*buaya|\s*jepit)?)\b/i,
    canonical: "Tang",
  },
  // Palu
  {
    pattern: /\b(palu|hammers?)\b/i,
    canonical: "Palu",
  },
  // Selang
  {
    pattern: /\b(selang)\b/i,
    canonical: "Selang",
  },
];

function formatJenisWord(word: string): string {
  const clean = word.trim();
  if (!clean) return "";
  const upper = clean.toUpperCase();
  if (UPPERCASE_ACRONYMS.has(upper)) return upper;
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/**
 * Automatically corrects common spelling typos in asset/item names,
 * such as "lap top", "lap-top", "lap.top", "LapTop" -> "Laptop" / "laptop".
 */
export function normalizeItemTypo(text: string): string {
  if (!text) return "";
  return text
    .replace(/\b(lap[\s\-_.]*top)\b/gi, (match) => {
      if (match === match.toUpperCase()) return "LAPTOP";
      if (match.toLowerCase() === "laptop" && match === "Laptop") return match;
      if (match[0] === match[0].toUpperCase()) return "Laptop";
      return "laptop";
    });
}

/**
 * Extracts a concise Jenis Barang category from an item's Nama Barang
 * so imported items of the same category automatically group into a single Jenis Barang
 * (e.g. "Single" / "Single Chair" / "Kursi Putar" -> "Kursi", "Mesin Felder" / "Mesin CNC" -> "Mesin",
 * "Lap Top" / "Lap Top Lenovo" -> "Laptop").
 */
export function extractJenisBarangFromNama(namaBarang?: string): string {
  const raw = normalizeItemTypo(
    String(namaBarang || "")
      .split(/\r?\n/)[0]
      .trim()
  );
  if (!raw || raw === "-") return "";

  // Remove parenthetical notes, dimensions, and leading/trailing punctuation
  const cleaned = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b\d+([.,xX*]\d+)+\s*(cm|mm|m|inch|pk|watt|kva|kw|liter|ltr|kg)?\b/gi, " ")
    .replace(/[^a-zA-Z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 1. Check high-priority multi-word / compound rules first
  for (const rule of PRIORITY_JENIS_RULES) {
    if (rule.pattern.test(cleaned) || rule.pattern.test(raw)) {
      return rule.canonical;
    }
  }

  // 2. Check leading head-noun rules (e.g. "Meja Dispenser" -> "Meja", "Sofa 1 Seater" -> "Sofa")
  for (const rule of HEAD_NOUN_JENIS_RULES) {
    if (rule.pattern.test(cleaned)) {
      return rule.canonical;
    }
  }

  // 3. Check general synonym / English-to-Indonesian mapping rules
  for (const rule of JENIS_SYNONYM_RULES) {
    if (rule.pattern.test(cleaned) || rule.pattern.test(raw)) {
      return rule.canonical;
    }
  }

  const words = cleaned
    .split(/[\s/-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !/^\d+$/.test(w));

  if (words.length === 0) return raw;

  if (words[0].toLowerCase() === "single") {
    return "Kursi";
  }

  const firstLower = words[0].toLowerCase();
  if (
    words.length >= 2 &&
    (COMPOUND_TWO_WORD_PREFIXES.has(firstLower) || DESCRIPTIVE_LEADING_PREFIXES.has(firstLower))
  ) {
    return `${formatJenisWord(words[0])} ${formatJenisWord(words[1])}`;
  }

  return formatJenisWord(words[0]);
}

/**
 * Normalizes text for comparison by lowercasing, stripping non-alphanumeric chars,
 * collapsing spaces, and correcting known typos (e.g. "lap top" -> "laptop").
 */
export function normalizeComparisonText(str: string): string {
  return normalizeItemTypo(String(str || ""))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenizes text into meaningful words (excluding short noise words).
 */
export function getMeaningfulTokens(str: string): string[] {
  const stopWords = new Set(["dan", "atau", "di", "ke", "dari", "yang", "yg", "unit", "set", "no", "nomor"]);
  return normalizeComparisonText(str)
    .split(/\s+/)
    .filter((w) => w.length > 0 && !stopWords.has(w));
}

/**
 * Computes Levenshtein edit-distance similarity between 0 and 1.
 */
export function stringSimilarity(s1: string, s2: string): number {
  const a = normalizeComparisonText(s1);
  const b = normalizeComparisonText(s2);
  if (a === b) return 1;
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) {
    const shorter = Math.min(a.length, b.length);
    const longer = Math.max(a.length, b.length);
    return shorter / longer >= 0.5 ? 0.9 : shorter / longer;
  }
  const track: number[][] = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = track[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

/**
 * Calculates a match score between a candidate item's Nama Barang and a candidate Jenis Barang.
 * Returns a score > 0 if matched, 0 if no match.
 * Higher score means a closer / more specific match (e.g. "Mesin Felder" gets higher score than "Mesin").
 */
export function calculateJenisBarangMatchScore(namaBarang: string, jenisBarang: string): number {
  const cleanNama = normalizeComparisonText(namaBarang);
  const cleanJenis = normalizeComparisonText(jenisBarang);
  if (!cleanNama || !cleanJenis) return 0;

  // 1. Exact match (case-insensitive)
  if (cleanNama === cleanJenis) return 100;

  // Specialized rule: Lenovo / Thinkpad adalah Laptop
  const isLaptopJenis = cleanJenis === "laptop" || cleanJenis === "laptops";
  const isLenovoNama = /\b(lenovo|thinkpads?)\b/i.test(cleanNama);
  if (isLaptopJenis && isLenovoNama) {
    return 95;
  }
  const isLaptopNama = cleanNama === "laptop" || cleanNama === "laptops";
  const isLenovoJenis = /\b(lenovo|thinkpads?)\b/i.test(cleanJenis);
  if (isLaptopNama && isLenovoJenis) {
    return 95;
  }

  // 2. Full phrase inclusion (e.g. "Mesin Felder" inside "Mesin Felder Hammer K4")
  const escaped = cleanJenis.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wholePhraseRegex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i");
  if (wholePhraseRegex.test(cleanNama)) {
    return 80 + Math.min(15, cleanJenis.length);
  }

  // 3. Multi-token match: all tokens of jenisBarang exist in namaBarang
  const jenisTokens = getMeaningfulTokens(jenisBarang);
  const namaTokens = getMeaningfulTokens(namaBarang);

  if (jenisTokens.length >= 2) {
    const allFound = jenisTokens.every((jt) =>
      namaTokens.some(
        (nt) =>
          nt === jt ||
          (nt.length >= 4 && jt.length >= 4 && stringSimilarity(nt, jt) >= 0.8)
      )
    );
    if (allFound) {
      return 70 + Math.min(15, jenisTokens.length * 5);
    }
  }

  // 4. Overall high string similarity (handles typos, e.g. "Mesin Fellder" vs "Mesin Felder", "Dust Colector" vs "Dust Collector")
  const sim = stringSimilarity(cleanNama, cleanJenis);
  if (sim >= 0.8) {
    return 60 + Math.round(sim * 20);
  }

  // 5. Single-token exact or word boundary match
  if (jenisTokens.length === 1) {
    const jt = jenisTokens[0];
    const foundToken = namaTokens.some(
      (nt) =>
        nt === jt ||
        (nt.length >= 4 && jt.length >= 4 && stringSimilarity(nt, jt) >= 0.85)
    );
    if (foundToken) {
      return 50;
    }
  }

  // 6. Extracted canonical category fallback
  const extractedNama = extractJenisBarangFromNama(namaBarang).toLowerCase();
  const extractedJenis = extractJenisBarangFromNama(jenisBarang).toLowerCase();
  if (
    extractedNama &&
    (extractedNama === cleanJenis || (extractedJenis && extractedNama === extractedJenis))
  ) {
    // Only match via canonical fallback if jenisBarang does NOT have a distinguishing modifier
    // (e.g. if jenis is "Mesin", match; if jenis is "Mesin Felder", only match if nama has "felder")
    if (jenisTokens.length <= 1) {
      return 40;
    }
    const hasDistinguishing = jenisTokens.some(
      (jt) => jt !== extractedJenis && namaTokens.some((nt) => nt === jt || stringSimilarity(nt, jt) >= 0.8)
    );
    if (hasDistinguishing) {
      return 60;
    }
  }

  return 0;
}

/**
 * Checks whether an item's Nama Barang belongs to a given Jenis Barang category.
 */
export function matchesJenisBarang(namaBarang: string, jenisBarang: string): boolean {
  return calculateJenisBarangMatchScore(namaBarang, jenisBarang) > 0;
}

/**
 * Finds the best matching Jenis Barang from a list of candidates for a given Nama Barang.
 * Automatically sorts by match score (highest score wins), so specific matches like "Mesin Felder"
 * always take precedence over generic matches like "Mesin".
 */
export function findBestMatchingFixAssetJenis<T extends { namaBarang: string; originalName?: string }>(
  namaBarang: string,
  candidates: T[]
): { item: T; score: number } | undefined {
  if (!namaBarang || !candidates || candidates.length === 0) return undefined;

  let best: { item: T; score: number } | undefined = undefined;

  for (const c of candidates) {
    const scoreNama = calculateJenisBarangMatchScore(namaBarang, c.namaBarang);
    const scoreOrig = c.originalName ? calculateJenisBarangMatchScore(namaBarang, c.originalName) : 0;
    const score = Math.max(scoreNama, scoreOrig);
    if (score > 0) {
      if (!best || score > best.score) {
        best = { item: c, score };
      }
    }
  }

  return best;
}

/**
 * Canonicalizes Fix Asset Jenis Barang names (e.g. "Lenovo" / "Thinkpad" -> "Laptop").
 */
export function canonicalizeFixAssetJenisBarang(jenis?: string): string {
  const trimmed = (jenis || "").trim();
  if (!trimmed || trimmed === "-") return "";
  const lower = trimmed.toLowerCase();
  if (
    lower === "lenovo" ||
    lower === "thinkpad" ||
    lower === "thinkpads" ||
    lower === "laptop lenovo" ||
    lower === "lenovo laptop"
  ) {
    return "Laptop";
  }
  return trimmed;
}

/**
 * Extracts a concise Jenis Barang category from a Fix Asset's Nama Barang
 * so imported items of the same category (e.g. "Mesin Felder" -> "Mesin Felder", "Mesin CNC" -> "Mesin CNC",
 * "Dust Colector selco" -> "Dust Collector", "Stabilisator mesin" -> "Stabilisator", "Lenovo" -> "Laptop") enter the appropriate Jenis Barang.
 */
export function extractFixAssetJenisFromNama(namaBarang?: string): string {
  const raw = normalizeItemTypo(String(namaBarang || "").trim());
  if (!raw || raw === "-") return "";

  // Khusus Lenovo / Thinkpad -> Laptop
  if (/\b(lenovo|thinkpads?)\b/i.test(raw)) {
    return "Laptop";
  }

  // If starts with "Mesin", check if there is a second descriptive word (e.g. "Mesin Felder", "Mesin CNC")
  const words = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^a-zA-Z0-9\s/-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2 && words[0].toLowerCase() === "mesin") {
    const second = words[1].trim();
    if (!/^\d+$/.test(second) && second.length >= 2) {
      return `Mesin ${formatJenisWord(second)}`;
    }
  }

  return extractJenisBarangFromNama(namaBarang);
}

/**
 * Checks whether a Fix Asset's Nama Barang matches a given Fix Asset Jenis Barang category.
 * Accurately scores similarity so specific categories like "Mesin Felder" match "Mesin Felder" items,
 * while general machines match "Mesin".
 */
export function matchesFixAssetJenisBarang(namaBarang: string, jenisBarang: string): boolean {
  return calculateJenisBarangMatchScore(namaBarang, jenisBarang) > 0;
}

/**
 * Builds room abbreviation (e.g. "Studio dan Marketing" -> "R.S.M", "Studio" -> "R.S").
 * If an existingKode is provided (e.g. "INVNT/DPSA/R.S.M.1/2020/1" or "INVNT/DPSA/R.S.M.1.1/2020/"),
 * extracts the room abbreviation prefix from segment 3 when available.
 */
/**
 * Helper to build room abbreviation cleanly:
 * - "Maintenance-Gudang (1)" -> "R.MG1"
 * - "Produksi-Tukang Kayu"   -> "R.PTK"
 * - "Gudang Barang Jadi"     -> "R.GBJ"
 * - "Gudang"                 -> "R.G"
 * - "Maintenance Belakang"   -> "R.MB"
 * - "PPIC & QC"              -> "R.P.Q"
 * Falls back to existingKode only if roomName is empty/"-".
 */
export function buildRoomAbbreviation(roomName?: string, existingKode?: string): string {
  const trimmed = String(roomName || "").trim();
  if (trimmed && trimmed !== "-") {
    const cleanText = trimmed.replace(/[()]/g, " ").trim();
    const groups = cleanText
      .split(/\s*(?:&|\bdan\b)\s*/i)
      .map((g) => g.trim())
      .filter(Boolean);

    if (groups.length > 0) {
      const groupAbbrs: string[] = [];
      groups.forEach((group, gIdx) => {
        const words = group
          .split(/[\s\-_]+/)
          .filter((w) => w && !["di", "ke"].includes(w.toLowerCase()));
        const bodyWords =
          gIdx === 0 && words.length > 0 && /^ruang$/i.test(words[0])
            ? words.slice(1)
            : words;
        if (bodyWords.length > 0) {
          const initials = bodyWords.map((w) =>
            /^\d+$/.test(w) ? w : w[0].toUpperCase()
          );
          groupAbbrs.push(initials.join(""));
        }
      });

      if (groupAbbrs.length > 0) {
        return `R.${groupAbbrs.join(".")}`;
      }
      if (/^ruang$/i.test(cleanText)) return "R";
    }
  }

  const code = String(existingKode || "").trim();
  if (code && code !== "-") {
    const parts = code.split("/").filter(Boolean);
    if (parts.length >= 3) {
      const seg = parts[2].trim();
      const prefix =
        parts.length >= 5
          ? seg.replace(/\.\d+$/, "")
          : seg.replace(/\.\d+\.\d+$/, "").replace(/\.\d+$/, "");
      if (prefix && /^[A-Za-z]/.test(prefix)) {
        return prefix.toUpperCase();
      }
    }
  }

  return "-";
}

/**
 * Ensures every Inventory location entry has a unique room code.
 * Auto-generated entries always compute their base code from `nama` unless `isManualKode` is true.
 * If multiple locations share the same base code (e.g. "R.G"), numbers them
 * sequentially at the end: "R.G1", "R.G2", "R.G3".
 */
export function resolveUniqueInventoryRoomCodes<
  T extends { id: number; kode: string; nama: string; isManualKode?: boolean }
>(entries: T[]): T[] {
  if (entries.length === 0) return entries;

  const isLegacyDotted = (kode: string) => /^R\.[A-Z0-9]+(?:\.[A-Z0-9]+)+$/i.test(kode);

  // Determine normalized base code for each entry
  const baseCodes = entries.map((entry) => {
    const autoBase = buildRoomAbbreviation(entry.nama);
    const rawKode = String(entry.kode || "").trim().toUpperCase();
    if (!entry.isManualKode) {
      return autoBase !== "-" ? autoBase : "R.X";
    }
    if (!rawKode || rawKode === "-" || isLegacyDotted(rawKode)) {
      return autoBase !== "-" ? autoBase : "R.X";
    }
    return rawKode;
  });

  // Count how many entries share each base code
  const baseCounts = new Map<string, number>();
  baseCodes.forEach((b) => {
    baseCounts.set(b, (baseCounts.get(b) || 0) + 1);
  });

  // Assign singletons first so explicitly numbered names (e.g. "Gudang 1" -> "R.G1") reserve their codes
  const usedCodes = new Set<string>();
  const resolved = new Array<T>(entries.length);

  entries.forEach((entry, idx) => {
    const b = baseCodes[idx];
    if ((baseCounts.get(b) || 0) === 1) {
      let candidate = b;
      if (usedCodes.has(candidate)) {
        let num = 1;
        while (usedCodes.has(`${b}${num}`)) num += 1;
        candidate = `${b}${num}`;
      }
      usedCodes.add(candidate);
      resolved[idx] = { ...entry, kode: candidate };
    }
  });

  // Now number colliding groups sequentially starting from 1 (R.G1, R.G2, R.G3...)
  const nextSuffixForBase = new Map<string, number>();
  entries.forEach((entry, idx) => {
    if (resolved[idx]) return;
    const b = baseCodes[idx];
    let num = nextSuffixForBase.get(b) || 1;
    while (usedCodes.has(`${b}${num}`)) {
      num += 1;
    }
    const candidate = `${b}${num}`;
    nextSuffixForBase.set(b, num + 1);
    usedCodes.add(candidate);
    resolved[idx] = { ...entry, kode: candidate };
  });

  return resolved;
}

/**
 * Formats an Inventory Kode Barang into the standard structure:
 * INVNT/(Pemilik)/(Singkatan Ruang).(ID Jenis Barang).(No Urut)/(Tahun Perolehan)
 * Example: INVNT/DPSA/R.MG1.1.1/2024
 */
export function formatInventoryKodeBarang(
  item: Partial<InventoryItem>,
  jenisId: number,
  seqInRoom: number,
  overrideRoomAbbr?: string,
  activeDivisi?: string
): string {
  const pemilikLabel = getInventoryPemilik(item);
  const pUpper = pemilikLabel.toUpperCase();
  const codePrefix = pUpper.includes("DPM")
    ? "DPM"
    : pUpper.includes("BOYKE") || pUpper.includes("YBD")
    ? "YBD"
    : pUpper.includes("DPSA")
    ? "DPSA"
    : pemilikLabel.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "DPSA";

  const rawDiv = String(item.divisi || activeDivisi || "DPSA").trim();
  const divisiCode = !rawDiv || isAllDivisiValue(rawDiv) ? "DPSA" : getDivisiCode(rawDiv);
  const ownerDivSegment = `${codePrefix}-${divisiCode}`;

  const existingKode = String(item.kodeBarang || item.kodeBarcode || "").trim();
  const roomAbbr =
    (overrideRoomAbbr && overrideRoomAbbr.trim().toUpperCase()) ||
    buildRoomAbbreviation(item.ruangan, existingKode);

  const yearFromField = String(item.tahunPerolehan || "").match(/\d{4}/);
  const yearFromKode = existingKode.match(/\b(19\d{2}|20\d{2})\b/);
  const cleanYear = yearFromField
    ? yearFromField[0]
    : yearFromKode
    ? yearFromKode[0]
    : String(new Date().getFullYear());

  return `INVNT/${ownerDivSegment}/${roomAbbr}.${jenisId}.${seqInRoom}/${cleanYear}`;
}

/**
 * Master Type Barang Fix Asset interface
 */
export interface MasterFixAssetTypeEntry {
  id: number;
  kode: string; // "PO1", "PO2", "PO3", "PO4", "PO5", etc.
  nama: string; // "Bangunan", "Peralatan Mesin", "Peralatan Umum", "Peralatan Kendaraan", etc.
  namaBarang?: string;
  count: number;
  kodeBarangList?: string[];
  isFixed: boolean; // PO1 - PO4 are fixed defaults
  umurThn?: number; // 20, 8, 4, 8...
  umurBln?: number; // 240, 96, 48, 96...
}

/**
 * Default fixed Type Barang categories requested:
 * PO1: Bangunan (20 thn / 240 bln), PO2: Peralatan Mesin (8 thn / 96 bln), PO3: Peralatan Umum (4 thn / 48 bln), PO4: Peralatan Kendaraan (8 thn / 96 bln)
 */
export const DEFAULT_FIX_ASSET_TYPES: {
  id: number;
  kode: string;
  nama: string;
  isFixed: boolean;
  umurThn: number;
  umurBln: number;
}[] = [
  { id: 1, kode: "PO1", nama: "Bangunan", isFixed: true, umurThn: 20, umurBln: 240 },
  { id: 2, kode: "PO2", nama: "Peralatan Mesin", isFixed: true, umurThn: 8, umurBln: 96 },
  { id: 3, kode: "PO3", nama: "Peralatan Umum", isFixed: true, umurThn: 4, umurBln: 48 },
  { id: 4, kode: "PO4", nama: "Peralatan Kendaraan", isFixed: true, umurThn: 8, umurBln: 96 },
];

/**
 * Returns the automatic umur ekonomis (tahun dan bulan) according to Fix Asset Type rules:
 * - PO1 (Bangunan): 20 tahun, 240 bulan
 * - PO2 (Peralatan Mesin): 8 tahun, 96 bulan
 * - PO3 (Peralatan Umum): 4 tahun, 48 bulan
 * - PO4 (Peralatan Kendaraan): 8 tahun, 96 bulan
 */
export function getTypeBarangDefaultUmur(typeOrKode?: string): { umurThn: number; umurBln: number } {
  const clean = String(typeOrKode || "").trim().toUpperCase();
  if (clean.includes("PO1") || clean.includes("BANGUNAN")) {
    return { umurThn: 20, umurBln: 240 };
  }
  if (clean.includes("PO2") || clean.includes("MESIN")) {
    return { umurThn: 8, umurBln: 96 };
  }
  if (
    clean.includes("PO3") ||
    clean.includes("UMUM") ||
    clean.includes("KANTOR") ||
    clean.includes("ELEKTRONIK") ||
    clean.includes("IT") ||
    clean.includes("FURNITURE")
  ) {
    return { umurThn: 4, umurBln: 48 };
  }
  if (
    clean.includes("PO4") ||
    clean.includes("KENDARAAN") ||
    clean.includes("MOBIL") ||
    clean.includes("MOTOR")
  ) {
    return { umurThn: 8, umurBln: 96 };
  }
  return { umurThn: 8, umurBln: 96 };
}

/**
 * Helper to parse month number (1-12) from month string / number or date string.
 */
export function parseBulanPerolehan(bulan?: string | number, tgl?: string): number {
  if (typeof bulan === "number" && bulan >= 1 && bulan <= 12) {
    return Math.floor(bulan);
  }
  const cleanBulan = String(bulan || "").trim().toUpperCase();
  const MONTH_MAP: Record<string, number> = {
    JANUARI: 1, JAN: 1, JANUARY: 1, "1": 1, "01": 1, I: 1,
    FEBRUARI: 2, FEB: 2, FEBRUARY: 2, "2": 2, "02": 2, II: 2,
    MARET: 3, MAR: 3, MARCH: 3, "3": 3, "03": 3, III: 3,
    APRIL: 4, APR: 4, "4": 4, "04": 4, IV: 4,
    MEI: 5, MAY: 5, "5": 5, "05": 5, V: 5,
    JUNI: 6, JUN: 6, JUNE: 6, "6": 6, "06": 6, VI: 6,
    JULI: 7, JUL: 7, JULY: 7, "7": 7, "07": 7, VII: 7,
    AGUSTUS: 8, AGU: 8, AUG: 8, AUGUST: 8, "8": 8, "08": 8, VIII: 8,
    SEPTEMBER: 9, SEP: 9, SEPT: 9, "9": 9, "09": 9, IX: 9,
    OKTOBER: 10, OKT: 10, OCT: 10, OCTOBER: 10, "10": 10, X: 10,
    NOVEMBER: 11, NOV: 11, "11": 11, XI: 11,
    DESEMBER: 12, DES: 12, DEC: 12, DECEMBER: 12, "12": 12, XII: 12,
  };
  if (cleanBulan && MONTH_MAP[cleanBulan]) {
    return MONTH_MAP[cleanBulan];
  }
  for (const [name, val] of Object.entries(MONTH_MAP)) {
    if (isNaN(Number(name)) && cleanBulan.includes(name)) {
      return val;
    }
  }

  const cleanTgl = String(tgl || "").trim();
  if (cleanTgl && cleanTgl !== "-") {
    const tglUpper = cleanTgl.toUpperCase();
    for (const [name, val] of Object.entries(MONTH_MAP)) {
      if (isNaN(Number(name)) && tglUpper.includes(name)) {
        return val;
      }
    }
    if (cleanTgl.includes("/")) {
      const parts = cleanTgl.split("/");
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) return m;
      }
    } else if (cleanTgl.includes("-")) {
      const parts = cleanTgl.split("-");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) return m;
      }
    }
  }

  return 1;
}

/**
 * Helper to parse acquisition year (e.g. 2021) from year string / number or date string.
 */
export function parseTahunPerolehan(tahun?: string | number, tgl?: string): number {
  if (typeof tahun === "number" && tahun > 1900 && tahun < 2100) {
    return Math.floor(tahun);
  }
  const cleanThn = String(tahun || "").trim();
  const parsed = parseInt(cleanThn, 10);
  if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) {
    return parsed;
  }
  if (!isNaN(parsed) && parsed > 0 && parsed < 100) {
    return 2000 + parsed;
  }

  const cleanTgl = String(tgl || "").trim();
  if (cleanTgl && cleanTgl !== "-") {
    const yearMatch = cleanTgl.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1], 10);
    }
    if (cleanTgl.includes("/")) {
      const parts = cleanTgl.split("/");
      if (parts.length >= 3) {
        const y = parseInt(parts[2], 10);
        if (!isNaN(y)) {
          return y < 100 ? 2000 + y : y;
        }
      }
    } else if (cleanTgl.includes("-")) {
      const parts = cleanTgl.split("-");
      if (parts.length === 3) {
        const y1 = parseInt(parts[0], 10);
        if (!isNaN(y1) && y1 > 1900) return y1;
        const y3 = parseInt(parts[2], 10);
        if (!isNaN(y3)) return y3 < 100 ? 2000 + y3 : y3;
      }
    }
  }

  return 0;
}

/**
 * Calculates all automatic Fix Asset depreciation, age, and book value fields
 * strictly based on user-defined business rules:
 * 1. Umur Thn & Umur Bln: follows PO1-PO4 based on Type Barang:
 *    - PO1 (Bangunan): 20 thn, 240 bln
 *    - PO2 (Peralatan Mesin): 8 thn, 96 bln
 *    - PO3 (Peralatan Umum): 4 thn, 48 bln
 *    - PO4 (Peralatan Kendaraan): 8 thn, 96 bln
 * 2. Depresiasi = harga perolehan / umur bulan
 * 3. Tahun Ke & Bulan Ke = (Tahun & Bulan sekarang) - (Tahun & Bulan perolehan)
 * 4. Akumulasi Depresiasi = umur bulan yang sudah berjalan * depresiasi (dibatasi maksimal total perolehan)
 * 5. Nilai Buku = total perolehan - akumulasi depresiasi
 */
export function calculateFixAssetAutoValues(
  item: Partial<FixAssetItem>,
  refPeriod?: { year?: number; month?: number }
): {
  umurThn: number;
  umurBln: number;
  tahunKe: number;
  bulanKe: number;
  hasilBln: number;
  depresiasi: number;
  penyusutanBln: number;
  akumulasiDepresiasi: number;
  fixAkumulasi: number;
  nilaiBuku: number;
  totalPerolehan: number;
} {
  // 1. Resolve Umur based on Type Barang (PO1 - PO4)
  const defaultUmur = getTypeBarangDefaultUmur(`${item.typeAktiva || ""} ${item.kodeAktiva || ""}`);
  const umurThn = defaultUmur.umurThn;
  const umurBln = defaultUmur.umurBln;

  const hargaPerolehan = Number(item.hargaPerolehan) || 0;
  const qty = Number(item.qty) || 1;
  const totalPerolehan =
    Number(item.totalPerolehan) > 0 ? Number(item.totalPerolehan) : hargaPerolehan * qty;

  // 2. Depresiasi = harga perolehan dibagi umur bulan
  const depresiasi = umurBln > 0 ? Math.round(hargaPerolehan / umurBln) : 0;
  const penyusutanBln = depresiasi;

  // 3. Tahun Ke & Bulan Ke = Bulan & Tahun acuan (sekarang atau filter) dikurangin Bulan & Tahun perolehan
  const now = new Date();
  const currentYear =
    refPeriod && typeof refPeriod.year === "number" && refPeriod.year > 0
      ? refPeriod.year
      : now.getFullYear();
  const currentMonth =
    refPeriod &&
    typeof refPeriod.month === "number" &&
    refPeriod.month >= 1 &&
    refPeriod.month <= 12
      ? refPeriod.month
      : now.getMonth() + 1; // 1 - 12

  const thnPerolehan = parseTahunPerolehan(item.tahun, item.tglPerolehan);
  const blnPerolehan = parseBulanPerolehan(item.bulan, item.tglPerolehan);

  let tahunKe = 0;
  let bulanKe = 0;
  let totalElapsedMonths = 0;

  if (thnPerolehan > 0) {
    // Perhitungan bulan berjalan inklusif dari awal bulan perolehan hingga akhir bulan acuan:
    // Contoh: 1 Juli 2021 hingga November 2026 = 65 bulan (5 tahun 5 bulan)
    const rawTotalMonths = (currentYear - thnPerolehan) * 12 + (currentMonth - blnPerolehan) + 1;

    if (rawTotalMonths <= 0) {
      // Pada periode acuan yang dipilih, barang belum diperoleh / belum mulai disusutkan
      tahunKe = 0;
      bulanKe = 0;
      totalElapsedMonths = 0;
    } else {
      totalElapsedMonths = rawTotalMonths;
      tahunKe = Math.floor(rawTotalMonths / 12);

      // Aturan: Jika sudah mencapai / melebihi umur bulan penyusutan, kolom tahun ke tetap ada berapa tahun,
      // tapi kolom bulan ke datanya 0 karena sudah melebihi bulan penyusutan.
      if (umurBln > 0 && rawTotalMonths >= umurBln) {
        bulanKe = 0;
      } else {
        bulanKe = rawTotalMonths % 12;
      }
    }
  } else if (item.tahunKe !== undefined || item.bulanKe !== undefined) {
    tahunKe = Math.max(0, Number(item.tahunKe) || 0);
    bulanKe = Math.max(0, Number(item.bulanKe) || 0);
    totalElapsedMonths = tahunKe * 12 + bulanKe;
    if (umurBln > 0 && totalElapsedMonths >= umurBln) {
      bulanKe = 0;
    }
  }

  // Hasil (bln) adalah total bulan berjalan, maksimal tidak melebihi umur total aset
  const hasilBln = Math.min(umurBln, totalElapsedMonths);

  // 4. Akumulasi Depresiasi = umur bulan (yang sudah berjalan) * depresiasi
  // (dibatasi tidak melebihi total perolehan)
  let akumulasiDepresiasi = 0;
  if (thnPerolehan > 0) {
    if (totalElapsedMonths > 0) {
      if (umurBln > 0 && totalElapsedMonths >= umurBln) {
        akumulasiDepresiasi = totalPerolehan;
      } else {
        akumulasiDepresiasi = Math.min(totalPerolehan, Math.round(hasilBln * depresiasi));
      }
    } else {
      akumulasiDepresiasi = 0;
    }
  } else if (totalElapsedMonths > 0) {
    if (umurBln > 0 && totalElapsedMonths >= umurBln) {
      akumulasiDepresiasi = totalPerolehan;
    } else {
      akumulasiDepresiasi = Math.min(totalPerolehan, Math.round(hasilBln * depresiasi));
    }
  } else if (item.akumulasiDepresiasi !== undefined && Number(item.akumulasiDepresiasi) > 0) {
    akumulasiDepresiasi = Math.min(totalPerolehan, Number(item.akumulasiDepresiasi));
  }
  const fixAkumulasi = akumulasiDepresiasi;

  // 5. Nilai Buku = total perolehan - akumulasi depresiasi
  const nilaiBuku = Math.max(0, totalPerolehan - akumulasiDepresiasi);

  return {
    umurThn,
    umurBln,
    tahunKe,
    bulanKe,
    hasilBln,
    depresiasi,
    penyusutanBln,
    akumulasiDepresiasi,
    fixAkumulasi,
    nilaiBuku,
    totalPerolehan,
  };
}

/**
 * Maps Fix Asset Type Barang (e.g. "Bangunan", "Peralatan Mesin", "Peralatan Umum", "Peralatan Kendaraan")
 * to its short code ("PO1", "PO2", "PO3", "PO4", and subsequent "PO5", "PO6"...).
 */
export function getFixAssetTypeCode(
  typeBarang?: string,
  existingKode?: string,
  masterTypes?: { kode: string; nama: string }[]
): string {
  const t = String(typeBarang || "").trim().toUpperCase();

  // 1. If explicit masterTypes provided, lookup match first
  if (masterTypes && masterTypes.length > 0) {
    const exact = masterTypes.find(
      (m) =>
        m.kode.toUpperCase() === t ||
        m.nama.toUpperCase() === t ||
        t === `${m.kode.toUpperCase()}: ${m.nama.toUpperCase()}` ||
        t === `${m.nama.toUpperCase()} (${m.kode.toUpperCase()})`
    );
    if (exact) return exact.kode.toUpperCase();

    const partial = masterTypes.find(
      (m) =>
        m.nama.length >= 4 &&
        (t.includes(m.nama.toUpperCase()) || m.nama.toUpperCase().includes(t))
    );
    if (partial) return partial.kode.toUpperCase();
  }

  // 2. Fixed default categories: PO1: Bangunan, PO2: Peralatan Mesin, PO3: Peralatan Umum, PO4: Peralatan Kendaraan
  if (t.includes("BANGUNAN") || t === "P01" || t === "PO1") return "PO1";
  if (t.includes("MESIN") || t === "P02" || t === "PO2") return "PO2";
  if (t.includes("UMUM") || t === "P03" || t === "PO3") return "PO3";
  if (t.includes("KENDARAAN") || t === "P04" || t === "PO4") return "PO4";
  if (t.includes("ELEKTRONIK") || t.includes("KANTOR") || t.includes("IT")) return "PO3";
  if (t.includes("INVENTARIS") || t.includes("FURNITURE")) return "PO3";

  // 3. Inspect existing code (e.g. FA/PO1/..., FA/P01/..., FA/PO2/..., FA/P02/...)
  const code = String(existingKode || "").trim();
  if (code && code !== "-") {
    const parts = code.split("/").filter(Boolean);
    if (parts.length >= 2 && /^FA$/i.test(parts[0])) {
      const seg2 = parts[1].trim().toUpperCase();
      const matchP = seg2.match(/^P0?(\d+)$/);
      if (matchP) {
        return `PO${matchP[1]}`;
      }
      if (/^PO\d+$/i.test(seg2)) {
        return seg2;
      }
      if (seg2) return seg2;
    }
  }

  // 4. If string itself matches P01.. or PO1..
  const matchPO = t.match(/^P0?(\d+)$/);
  if (matchPO) {
    return `PO${matchPO[1]}`;
  }

  return "PO2";
}

/**
 * Normalizes any Fix Asset type representation (code like "PO1", raw text "Bangunan", etc.)
 * into canonical Type Barang name ("Bangunan", "Peralatan Mesin", "Peralatan Umum", "Peralatan Kendaraan").
 */
export function normalizeFixAssetTypeName(
  typeBarang?: string,
  existingKode?: string,
  masterTypes?: { kode: string; nama: string }[]
): string {
  const code = getFixAssetTypeCode(typeBarang, existingKode, masterTypes);
  const foundMaster = (masterTypes || DEFAULT_FIX_ASSET_TYPES).find(
    (m) => m.kode.toUpperCase() === code.toUpperCase()
  );
  if (foundMaster) return foundMaster.nama;
  const cleanType = String(typeBarang || "").trim();
  if (cleanType && cleanType !== "-" && !cleanType.startsWith("PO")) return cleanType;
  return "Peralatan Mesin";
}

const MONTH_NAME_TO_ROMAN: Record<string, string> = {
  JANUARI: "I",
  JAN: "I",
  JANUARY: "I",
  "1": "I",
  "01": "I",
  FEBRUARI: "II",
  FEB: "II",
  FEBRUARY: "II",
  "2": "II",
  "02": "II",
  MARET: "III",
  MAR: "III",
  MARCH: "III",
  "3": "III",
  "03": "III",
  APRIL: "IV",
  APR: "IV",
  "4": "IV",
  "04": "IV",
  MEI: "V",
  MAY: "V",
  "5": "V",
  "05": "V",
  JUNI: "VI",
  JUN: "VI",
  JUNE: "VI",
  "6": "VI",
  "06": "VI",
  JULI: "VII",
  JUL: "VII",
  JULY: "VII",
  "7": "VII",
  "07": "VII",
  AGUSTUS: "VIII",
  AGU: "VIII",
  AUG: "VIII",
  AUGUST: "VIII",
  "8": "VIII",
  "08": "VIII",
  SEPTEMBER: "IX",
  SEP: "IX",
  SEPT: "IX",
  "9": "IX",
  "09": "IX",
  OKTOBER: "X",
  OKT: "X",
  OCT: "X",
  OCTOBER: "X",
  "10": "X",
  NOVEMBER: "XI",
  NOV: "XI",
  "11": "XI",
  DESEMBER: "XII",
  DES: "XII",
  DEC: "XII",
  DECEMBER: "XII",
  "12": "XII",
};

const VALID_ROMAN_MONTHS = new Set([
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
]);

/**
 * Converts a Fix Asset's Bulan / Tgl Perolehan into Roman numeral month ("I" .. "XII").
 */
export function getFixAssetRomanMonth(
  bulan?: string,
  tglPerolehan?: string,
  existingKode?: string
): string {
  const b = String(bulan || "").trim().toUpperCase();
  if (b && b !== "-") {
    if (VALID_ROMAN_MONTHS.has(b)) return b;
    if (MONTH_NAME_TO_ROMAN[b]) return MONTH_NAME_TO_ROMAN[b];
  }

  const tgl = String(tglPerolehan || "").trim();
  if (tgl && tgl !== "-") {
    const parts = tgl.split(/[\/\-]/);
    if (parts.length >= 2) {
      const m = parts[1].trim();
      if (MONTH_NAME_TO_ROMAN[m]) return MONTH_NAME_TO_ROMAN[m];
    }
  }

  const code = String(existingKode || "").trim();
  if (code && code !== "-") {
    const parts = code.split("/").filter(Boolean);
    if (parts.length >= 4) {
      const seg4 = parts[3].trim().toUpperCase();
      if (VALID_ROMAN_MONTHS.has(seg4)) return seg4;
      if (MONTH_NAME_TO_ROMAN[seg4]) return MONTH_NAME_TO_ROMAN[seg4];
    }
  }

  const currentMonth = String(new Date().getMonth() + 1);
  return MONTH_NAME_TO_ROMAN[currentMonth] || "I";
}

/**
 * Master Lokasi Fix Asset interface
 */
export interface MasterFixAssetLokasiEntry {
  id: number;
  kode: string; // e.g. "PM", "PWKT", "STD", "PQ", "AL2", "KTR", "GDG"
  nama: string; // e.g. "Produksi Mesin", "Purwokerto", "Studio", "PPIC - QC", "Area Lt2", etc.
  count: number;
  kodeBarangList?: string[];
}

/**
 * Known custom abbreviations for single-word locations.
 */
export const KNOWN_SINGLE_WORD_LOCATION_ABBRS: Record<string, string> = {
  purwokerto: "PWKT",
  studio: "STD",
  kantor: "KTR",
  gudang: "GDG",
  workshop: "WKS",
  showroom: "SHR",
  finishing: "FNS",
  marketing: "MKT",
  assembly: "ASM",
  produksi: "PRD",
  pabrik: "PBRK",
  laboratorium: "LAB",
  lab: "LAB",
  musholla: "MSH",
  toilet: "TLT",
  security: "SCR",
  pos: "POS",
  kitchen: "KTN",
  dapur: "DPR",
  arsip: "ARS",
  lobby: "LBY",
};

/**
 * Generates location abbreviation code based on user rules:
 * - 1 kata: purwokerto -> PWKT, studio -> STD, kantor -> KTR, etc.
 * - 2+ kata: produksi mesin -> PM, ppic - qc -> PQ, area lt2 -> AL2
 */
export function generateLocationAbbreviation(locationName: string): string {
  const raw = String(locationName || "").trim();
  if (!raw || raw === "-") return "-";

  // Tokenize by spaces, dashes, slashes, punctuation, ampersands
  // e.g. "ppic - qc" -> ["ppic", "qc"]
  // "area lt2" -> ["area", "lt2"]
  // "produksi mesin" -> ["produksi", "mesin"]
  const clean = raw.replace(/[()_–—/\\,;:]+/g, " ").replace(/-/g, " ");
  const rawTokens = clean
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(
      (t) =>
        t &&
        !["dan", "di", "ke", "&", "the", "in", "at", "of"].includes(
          t.toLowerCase()
        )
    );

  if (rawTokens.length === 0) return "-";

  // Case 1: 1 word
  if (rawTokens.length === 1) {
    const single = rawTokens[0];
    const singleLower = single.toLowerCase();
    if (KNOWN_SINGLE_WORD_LOCATION_ABBRS[singleLower]) {
      return KNOWN_SINGLE_WORD_LOCATION_ABBRS[singleLower];
    }

    // Check if token ends with digits like "LT2" or "R1"
    const digitMatch = single.match(/^([a-zA-Z]+)(\d+)$/);
    if (digitMatch) {
      const prefix = digitMatch[1];
      const digits = digitMatch[2];
      return (prefix[0] + digits).toUpperCase();
    }

    // Short word (<= 3 chars)
    if (single.length <= 3) {
      return single.toUpperCase();
    }

    // Standard consonant extraction for single words:
    // Keep first letter, then pick consonants (skip vowels: a, i, u, e, o)
    const firstChar = single[0].toUpperCase();
    const rest = single.slice(1).toLowerCase().replace(/[^a-z0-9]/g, "");
    const vowels = new Set(["a", "i", "u", "e", "o"]);
    const consonants = rest
      .split("")
      .filter((c) => !vowels.has(c) || /\d/.test(c));

    if (consonants.length > 0) {
      // Pick up to 3 consonants to make a 3-4 char abbreviation (e.g. PWKT, STD)
      const abbr = firstChar + consonants.slice(0, 3).join("").toUpperCase();
      return abbr;
    }

    return single.slice(0, 3).toUpperCase();
  }

  // Case 2: 2 or more words (e.g. "produksi mesin", "ppic - qc", "area lt2")
  let result = "";
  for (const token of rawTokens) {
    // Check if token has letters followed by digits like "lt2", "lt1", "r3"
    const letterDigitMatch = token.match(/^([a-zA-Z]+)(\d+)$/);
    if (letterDigitMatch) {
      // e.g. "lt2" -> "L2" (first letter + digit)
      const letter = letterDigitMatch[1][0].toUpperCase();
      const digit = letterDigitMatch[2];
      result += `${letter}${digit}`;
    } else if (/^\d+$/.test(token)) {
      // pure number token, e.g. "2" in ["area", "lantai", "2"]
      result += token;
    } else {
      // standard word: take the first letter
      result += token[0].toUpperCase();
    }
  }

  return result || "-";
}

export const DEFAULT_FIX_ASSET_LOCATIONS: { id: number; kode: string; nama: string }[] = [
  { id: 1, kode: "PM", nama: "Produksi Mesin" },
  { id: 2, kode: "PWKT", nama: "Purwokerto" },
  { id: 3, kode: "STD", nama: "Studio" },
  { id: 4, kode: "KTR", nama: "Kantor" },
];

/**
 * Builds Lokasi abbreviation for Fix Asset Kode Barang (e.g. "Produksi Mesin" -> "PM", "Purwokerto" -> "PWKT").
 * Uses masterLocations if available, otherwise generates smart abbreviation from words.
 */
export function buildFixAssetLokasiAbbr(
  lokasi?: string,
  existingKode?: string,
  namaBarang?: string,
  masterLocations?: { kode: string; nama: string }[]
): string {
  const loc = String(lokasi || "").trim();
  if (loc && loc !== "-") {
    // 1. If explicit masterLocations provided, check exact or partial match first
    if (masterLocations && masterLocations.length > 0) {
      const locUpper = loc.toUpperCase();
      const exact = masterLocations.find(
        (m) =>
          m.kode.toUpperCase() === locUpper ||
          m.nama.toUpperCase() === locUpper ||
          locUpper === `${m.kode.toUpperCase()}: ${m.nama.toUpperCase()}` ||
          locUpper === `${m.nama.toUpperCase()} (${m.kode.toUpperCase()})`
      );
      if (exact) return exact.kode.toUpperCase();

      const partial = masterLocations.find(
        (m) =>
          m.nama.length >= 3 &&
          (locUpper.includes(m.nama.toUpperCase()) ||
            m.nama.toUpperCase().includes(locUpper))
      );
      if (partial) return partial.kode.toUpperCase();
    }

    // 2. Generate abbreviation using the specified rules
    const generated = generateLocationAbbreviation(loc);
    if (generated && generated !== "-") {
      return generated;
    }
  }

  // 3. Fallback from existingKode if present
  const code = String(existingKode || "").trim();
  if (code && code !== "-") {
    const parts = code.split("/").filter(Boolean);
    if (parts.length >= 7) {
      const seg7 = parts[6].trim().replace(/\.\d+$/, "");
      if (seg7 && seg7 !== "-") return seg7.toUpperCase();
    }
  }

  return "-";
}

/**
 * Resolves the canonical Pemilik / Kepemilikan label for a Fix Asset item.
 */
export function getFixAssetPemilik(item: Partial<FixAssetItem>): string {
  const explicit = String(item.pemilik || "").trim();
  if (explicit && explicit !== "-") {
    return explicit;
  }
  const existingKode = String(item.kodeAktiva || "").trim();
  if (existingKode && existingKode !== "-") {
    const parts = existingKode.split("/").filter(Boolean);
    if (parts.length >= 5) {
      const seg = parts[4].trim().toUpperCase();
      const ownerPrefix = seg.includes("-") ? seg.split("-")[0] : "";
      if (ownerPrefix === "DPM") return "DPM";
      if (ownerPrefix === "YBD") return "Pak Boyke";
      if (ownerPrefix) return ownerPrefix;
    }
  }
  return "DPSA";
}

/**
 * Formats a Fix Asset Kode Barang into the standard structure:
 * FA/Tipe Barang/Kode Barang/Bln Perolehan/PEMILIK-DIVISI/Th Perolehan/Lokasi
 * Example: FA/PO2/2/VI/DPM-SORAJATI/2018/PM.1 or FA/PO1/1/VII/DPSA-DPSA/2021/P
 */
export function formatFixAssetKodeBarang(
  item: Partial<FixAssetItem>,
  jenisId: number,
  seqInLokasi = 1,
  totalInLokasi = 1,
  masterTypes?: { kode: string; nama: string }[],
  masterLocations?: { kode: string; nama: string }[],
  activeDivisi?: string
): string {
  const existingKode = String(item.kodeAktiva || "").trim();
  const tipeCode = getFixAssetTypeCode(item.typeAktiva, existingKode, masterTypes);
  const blnRoman = getFixAssetRomanMonth(item.bulan, item.tglPerolehan, existingKode);

  // Extract Pemilik code (DPSA, DPM, YBD, etc.)
  const pemilikLabel = getFixAssetPemilik(item);
  const pUpper = pemilikLabel.toUpperCase();
  const pemilikCode = pUpper.includes("DPM")
    ? "DPM"
    : pUpper.includes("BOYKE") || pUpper.includes("YBD")
    ? "YBD"
    : pUpper.includes("DPSA")
    ? "DPSA"
    : pemilikLabel.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "DPSA";

  // Extract Divisi segment from item.divisi / activeDivisi, else DPSA
  const rawDiv = String(item.divisi || activeDivisi || "").trim();
  let divisiCode =
    rawDiv && !isAllDivisiValue(rawDiv) ? getDivisiCode(rawDiv) : "DPSA";
  if ((!rawDiv || isAllDivisiValue(rawDiv)) && existingKode && existingKode !== "-") {
    const parts = existingKode.split("/").filter(Boolean);
    if (parts.length >= 5 && parts[4].trim() && !/^\d{4}$/.test(parts[4].trim())) {
      const seg = parts[4].trim().toUpperCase();
      divisiCode = seg.includes("-") ? (seg.split("-").slice(1).join("-") || "DPSA") : seg;
    }
  }
  const ownerCode = `${pemilikCode}-${divisiCode}`;

  // Extract 4-digit year
  let cleanYear = "";
  if (item.tahun && Number(item.tahun) >= 1900) {
    cleanYear = String(item.tahun);
  } else {
    const yearFromKode = existingKode.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearFromKode) {
      cleanYear = yearFromKode[0];
    } else if (item.tglPerolehan && item.tglPerolehan !== "-") {
      const tglParts = String(item.tglPerolehan).split(/[\/\-]/);
      if (tglParts.length >= 3) {
        const yr = tglParts[2].trim();
        if (/^\d{4}$/.test(yr)) cleanYear = yr;
        else if (/^\d{2}$/.test(yr)) cleanYear = `20${yr}`;
      }
    }
  }
  if (!cleanYear) {
    cleanYear = String(new Date().getFullYear());
  }

  const baseLokasi = buildFixAssetLokasiAbbr(
    item.lokasi,
    existingKode,
    item.namaAktivaTetap,
    masterLocations
  );

  const lokasiSegment =
    baseLokasi !== "-"
      ? `${baseLokasi}.${seqInLokasi || 1}`
      : "-";

  return `FA/${tipeCode}/${jenisId}/${blnRoman}/${ownerCode}/${cleanYear}/${lokasiSegment}`;
}





