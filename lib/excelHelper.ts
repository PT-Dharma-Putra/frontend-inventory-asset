import * as XLSX from "xlsx";
import {
  FixAssetItem,
  InventoryItem,
  formatRupiah,
  formatImageDisplayUrl,
  extractGoogleDriveFileId,
  getInventoryTotalHarga,
  getInventoryPemilik,
  extractJenisBarangFromNama,
  matchesJenisBarang,
  extractFixAssetJenisFromNama,
  matchesFixAssetJenisBarang,
  findBestMatchingFixAssetJenis,
  formatFixAssetKodeBarang,
  formatInventoryKodeBarang,
  normalizeFixAssetTypeName,
  normalizeItemTypo,
  canonicalizeFixAssetJenisBarang,
  buildRoomAbbreviation as buildSharedRoomAbbreviation,
  resolveUniqueInventoryRoomCodes,
  calculateFixAssetAutoValues,
  parseBulanPerolehan,
  parseTahunPerolehan,
} from "./api";

/**
 * Checks whether a string is a valid renderable Base64 image,
 * rejecting corrupt or 1-pixel dummy placeholders like "/9j_AAAAAAAAAAAAAAAAAAAAAD//2Q==".
 */
export function isValidBase64Image(s?: string): boolean {
  if (!s || typeof s !== "string") return false;
  const trimmed = s.trim();
  if (!trimmed.startsWith("data:image/")) return false;
  if (trimmed.length < 250 || trimmed.includes("AAAAAAAAAAAAAAAAAAAA")) {
    return false;
  }
  return true;
}

// Helper to normalize header keys: remove spaces, underscores, symbols, lowercase
function cleanKey(key: string): string {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Parse a single Indonesian / standard numeric string:
 * - Handles "Rp 1.265.000", "1.265.000", "1,265,000", "15.000.000,00"
 * - Correctly treats dots followed by 3 digits (e.g. "1.265.000" or "20.944.000") as thousand separators
 */
export function parseSingleNumber(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;

  const s = String(val).trim();
  if (!s || s === "-" || s === "—") return 0;

  // Keep only digits, dots, commas, and minus sign
  let clean = s.replace(/[^0-9.,-]/g, "");
  if (!clean || clean === "-") return 0;

  if (clean.includes(",") && clean.includes(".")) {
    // Check which separator appears last
    const lastComma = clean.lastIndexOf(",");
    const lastDot = clean.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Indonesian format: "15.000.000,50"
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: "15,000,000.50"
      clean = clean.replace(/,/g, "");
    }
  } else if (clean.includes(".")) {
    // Only dots present: e.g. "1.265.000" or "650.000" or "20.944.000"
    const parts = clean.split(".");
    if (parts.length > 2) {
      // Multiple dots -> definitely thousand separators
      clean = clean.replace(/\./g, "");
    } else if (parts.length === 2) {
      // Single dot: if fractional part has exactly 3 digits (e.g. "650.000", "1.265"),
      // in Indonesian Rupiah currency it is a thousand separator (Rp 650.000)
      if (parts[1].length === 3) {
        clean = parts[0] + parts[1];
      }
    }
  } else if (clean.includes(",")) {
    const parts = clean.split(",");
    if (parts.length > 2) {
      clean = clean.replace(/,/g, "");
    } else if (parts.length === 2 && parts[1].length === 3 && Number(parts[0]) > 0) {
      // Could be US thousand separator "1,000" or decimal; in Rupiah 3 digits after separator is thousand
      clean = parts[0] + parts[1];
    } else {
      clean = clean.replace(",", ".");
    }
  }

  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

/**
 * Parse numeric cell that may contain 1 value OR multiple lines/values (e.g. 3 prices in 1 cell for Monitor, CPU, UPS).
 * Sums each price token if multiple values exist in the cell.
 */
export function parseNumber(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;

  const s = String(val).trim();
  if (!s || s === "-") return 0;

  // Match all distinct numeric tokens (e.g. "1.265.000", "535.000", "4.995.000") across lines or spaces
  const tokens = s.match(/\d[\d.,]*/g);
  if (tokens && tokens.length > 1) {
    return tokens.reduce((sum, tok) => sum + parseSingleNumber(tok), 0);
  }

  return parseSingleNumber(s);
}

/**
 * Parse quantity (Jumlah / Qty) cell that may have multiple lines like "1\n1\n1" for 1 Set of 3 components.
 * Prevents "1\n1\n1" from becoming 111.
 */
export function parseQuantity(val: any, isMultiComponent = false): number {
  if (val === undefined || val === null || val === "") return 1;
  if (typeof val === "number") return val > 0 ? val : 1;

  const lines = String(val)
    .split(/\r?\n/)
    .map((l) => parseSingleNumber(l))
    .filter((n) => n > 0);

  if (lines.length === 0) return 1;
  if (lines.length > 1) {
    // If all lines are 1 (e.g. 1 Monitor, 1 CPU, 1 UPS in a single set), the set quantity is 1
    const allOnes = lines.every((n) => n === 1);
    if (allOnes || isMultiComponent) return 1;
    return lines[0];
  }
  return lines[0];
}

/**
 * Normalize multi-line cell text (e.g., 3 items in 1 cell: Monitor, CPU, UPS)
 */
function formatMultilineText(val: any, fallback = "-"): string {
  if (val === undefined || val === null) return fallback;
  const lines = String(val)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "");
  if (lines.length === 0) return fallback;
  return lines.join("\n");
}

// Helper to parse date string or excel serial date
function parseDateString(val: any): string {
  if (val === undefined || val === null || val === "" || val === "-") return "-";
  if (typeof val === "number") {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  const s = String(val).trim();
  return s || "-";
}

const INDONESIAN_MONTHS = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

function extractDateParts(tglStr: string): { bulan?: string; tahun?: number } {
  if (!tglStr || tglStr === "-") return {};
  // Match YYYY-MM-DD
  const isoMatch = tglStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    return {
      bulan: m >= 1 && m <= 12 ? INDONESIAN_MONTHS[m - 1] : undefined,
      tahun: y,
    };
  }
  // Match DD/MM/YY or DD/MM/YYYY
  const slashMatch = tglStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const m = parseInt(slashMatch[2], 10);
    let y = parseInt(slashMatch[3], 10);
    if (y < 100) y += 2000;
    return {
      bulan: m >= 1 && m <= 12 ? INDONESIAN_MONTHS[m - 1] : undefined,
      tahun: y,
    };
  }
  return {};
}

const MONTH_ALIASES: Record<string, number> = {
  JANUARI: 1, JANUARY: 1, JAN: 1,
  FEBRUARI: 2, FEBRUARY: 2, PEBRUARI: 2, FEB: 2, PEB: 2,
  MARET: 3, MARCH: 3, MAR: 3,
  APRIL: 4, APR: 4,
  MEI: 5, MAY: 5,
  JUNI: 6, JUNE: 6, JUN: 6,
  JULI: 7, JULY: 7, JUL: 7,
  AGUSTUS: 8, AUGUST: 8, AGU: 8, AGT: 8, AGS: 8, AUG: 8,
  SEPTEMBER: 9, SEPT: 9, SEP: 9,
  OKTOBER: 10, OCTOBER: 10, OKT: 10, OCT: 10,
  NOVEMBER: 11, NOPEMBER: 11, NOV: 11, NOP: 11,
  DESEMBER: 12, DECEMBER: 12, DES: 12, DEC: 12,
};
const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function excelSerialToDate(serial: number): Date | null {
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return isNaN(date.getTime()) ? null : date;
}

function monthFromText(s: string): number {
  const up = String(s || "").trim().toUpperCase().replace(/\./g, "");
  if (!up) return 0;
  if (MONTH_ALIASES[up]) return MONTH_ALIASES[up];
  const romanIdx = ROMAN_MONTHS.indexOf(up);
  if (romanIdx >= 0) return romanIdx + 1;
  if (/^\d{1,2}$/.test(up)) {
    const n = parseInt(up, 10);
    return n >= 1 && n <= 12 ? n : 0;
  }
  // Text containing a month name, e.g. "Juli 2021" / "01-Jul-21"
  const words = up.split(/[^A-Z]+/).filter(Boolean);
  for (const w of words) {
    if (MONTH_ALIASES[w]) return MONTH_ALIASES[w];
  }
  return 0;
}

/**
 * Normalize "Tgl Perolehan" cell (Excel serial date, Date, "01/07/21", "2021-07-01", "1 Juli 2021")
 * into "DD/MM/YYYY". Returns "-" when empty / not a date.
 */
function normalizeFixAssetDate(raw: any, text = ""): string {
  if (raw === undefined || raw === null || raw === "" || raw === "-") return "-";
  const fmt = (d: number, m: number, y: number) =>
    `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return fmt(raw.getDate(), raw.getMonth() + 1, raw.getFullYear());
  }
  if (typeof raw === "number") {
    if (raw >= 1900 && raw <= 2100) return "-"; // only a year -> handled by tahun
    if (raw > 20000) {
      const d = excelSerialToDate(raw);
      if (d) return fmt(d.getDate(), d.getMonth() + 1, d.getFullYear());
    }
    return "-";
  }

  const s = String(raw).trim();
  if (!s || s === "-") return "-";
  // Pure numeric string that is an Excel serial
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const d = excelSerialToDate(parseFloat(s));
    if (d) return fmt(d.getDate(), d.getMonth() + 1, d.getFullYear());
  }
  const iso = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (iso) return fmt(parseInt(iso[3], 10), parseInt(iso[2], 10), parseInt(iso[1], 10));
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    let y = parseInt(dmy[3], 10);
    if (y < 100) y += 2000;
    return fmt(parseInt(dmy[1], 10), parseInt(dmy[2], 10), y);
  }
  // "1 Juli 2021", "01-Jul-21", "Juli 2021"
  const m = monthFromText(s);
  const yMatch = s.match(/(\d{4})|(?:[^\d]|^)(\d{2})$/);
  if (m > 0 && yMatch) {
    let y = parseInt(yMatch[1] || yMatch[2], 10);
    if (y < 100) y += 2000;
    const dMatch = s.match(/^(\d{1,2})[\s\-\/.]/);
    const d = dMatch ? parseInt(dMatch[1], 10) : 1;
    return fmt(d, m, y);
  }
  return text && text !== s ? normalizeFixAssetDate(text) : s;
}

/** Parse "Bulan" cell (JULI, Jul, 7, VII, Excel date serial) into Indonesian month name (uppercase). */
function parseBulanValue(raw: any, text = ""): string {
  if (raw === undefined || raw === null || raw === "" || raw === "-") return "";
  if (raw instanceof Date && !isNaN(raw.getTime())) return INDONESIAN_MONTHS[raw.getMonth()];
  if (typeof raw === "number") {
    if (raw >= 1 && raw <= 12) return INDONESIAN_MONTHS[Math.round(raw) - 1];
    if (raw > 20000) {
      const d = excelSerialToDate(raw);
      if (d) return INDONESIAN_MONTHS[d.getMonth()];
    }
    const mt = monthFromText(text);
    return mt > 0 ? INDONESIAN_MONTHS[mt - 1] : "";
  }
  const s = String(raw).trim();
  const m = monthFromText(s) || monthFromText(text);
  if (m > 0) return INDONESIAN_MONTHS[m - 1];
  return s ? s.toUpperCase() : "";
}

/** Parse "Tahun" cell (2021, "21", "Th 2021", Excel date serial) into 4-digit year. */
function parseTahunValue(raw: any, text = ""): number {
  if (raw === undefined || raw === null || raw === "" || raw === "-") return 0;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw.getFullYear();
  if (typeof raw === "number") {
    if (raw >= 1900 && raw <= 2100) return Math.round(raw);
    if (raw >= 0 && raw < 100) return 2000 + Math.round(raw);
    if (raw > 20000) {
      const d = excelSerialToDate(raw);
      if (d) return d.getFullYear();
    }
  }
  const s = String(text || raw).trim();
  const y4 = s.match(/(19|20)\d{2}/);
  if (y4) return parseInt(y4[0], 10);
  const y2 = s.match(/^\d{2}$/);
  if (y2) return 2000 + parseInt(y2[0], 10);
  return 0;
}

// ============================================================================
// EMBEDDED EXCEL (.XLSX) IMAGE EXTRACTOR
// Extracts images from xl/media/* and maps them to worksheet rows via
// xl/drawings/drawing*.xml and xl/cellimages.xml
// ============================================================================

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream not supported");
  }
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(compressed as unknown as BufferSource);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLen = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      totalLen += value.length;
    }
  }
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "bmp") return "image/bmp";
  return "image/jpeg";
}

/**
 * Downscale/compress image DataURL in browser so large Excel photos don't bloat DB payloads
 */
async function optimizeImageDataUrl(dataUrl: string, maxDim = 480): Promise<string> {
  if (typeof document === "undefined" || typeof Image === "undefined") return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && dataUrl.length < 80_000) {
          resolve(dataUrl);
          return;
        }
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface ExtractedExcelImages {
  /** Maps 0-based Excel row index -> image data URL */
  byRow: Map<number, string>;
  /** Maps DISPIMG ID (e.g. "ID_...") -> image data URL */
  byDispImgId: Map<string, string>;
  /** Ordered list of all media data URLs in the workbook */
  allMedia: string[];
}

async function extractExcelImages(buffer: ArrayBuffer): Promise<ExtractedExcelImages> {
  const byRow = new Map<number, string>();
  const byDispImgId = new Map<string, string>();
  const allMedia: string[] = [];

  try {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // Check PKZIP magic header
    if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) {
      return { byRow, byDispImgId, allMedia };
    }

    // Locate End of Central Directory (EOCD) record (0x06054b50)
    let eocdOffset = -1;
    const minEocd = Math.max(0, bytes.length - 65557);
    for (let i = bytes.length - 22; i >= minEocd; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    if (eocdOffset === -1) return { byRow, byDispImgId, allMedia };

    const cdEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);

    const decoder = new TextDecoder("utf-8");
    const zipFiles = new Map<string, Uint8Array>();

    let ptr = cdOffset;
    for (let i = 0; i < cdEntries; i++) {
      if (ptr + 46 > bytes.length || view.getUint32(ptr, true) !== 0x02014b50) break;

      const compressionMethod = view.getUint16(ptr + 10, true);
      const compressedSize = view.getUint32(ptr + 20, true);
      const fileNameLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localHeaderOffset = view.getUint32(ptr + 42, true);

      const fileName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + fileNameLen));
      ptr += 46 + fileNameLen + extraLen + commentLen;

      // Extract media, drawings, cellimages, richData, and sheet1.xml (for vm="..." Place-in-Cell images)
      if (
        fileName.startsWith("xl/media/") ||
        fileName.startsWith("xl/drawings/") ||
        fileName.startsWith("xl/cellimages") ||
        fileName.startsWith("xl/_rels/cellimages") ||
        fileName.startsWith("xl/richData/") ||
        fileName === "xl/worksheets/sheet1.xml"
      ) {
        if (localHeaderOffset + 30 > bytes.length) continue;
        const localNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const rawSlice = bytes.subarray(dataStart, dataStart + compressedSize);

        if (compressionMethod === 0) {
          zipFiles.set(fileName, rawSlice);
        } else if (compressionMethod === 8) {
          try {
            const inflated = await inflateRaw(rawSlice);
            zipFiles.set(fileName, inflated);
          } catch {
            // ignore corrupt entry
          }
        }
      }
    }

    // 1. Convert all xl/media/* into optimized Data URLs
    const mediaMap = new Map<string, string>();
    const mediaEntries = Array.from(zipFiles.entries())
      .filter(([name]) => name.startsWith("xl/media/"))
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    for (const [name, data] of mediaEntries) {
      const mime = getMimeType(name);
      const rawDataUrl = `data:${mime};base64,${uint8ToBase64(data)}`;
      const optimized = await optimizeImageDataUrl(rawDataUrl);
      mediaMap.set(name, optimized);
      const shortName = name.split("/").pop() || name;
      mediaMap.set(shortName, optimized);
      allMedia.push(optimized);
    }

    if (mediaMap.size === 0) {
      return { byRow, byDispImgId, allMedia };
    }

    // 2. Parse xl/drawings/_rels/drawing*.xml.rels and xl/drawings/drawing*.xml
    for (const [name, data] of zipFiles.entries()) {
      if (name.startsWith("xl/drawings/drawing") && name.endsWith(".xml")) {
        const drawingFile = name.split("/").pop()!;
        const relsPath = `xl/drawings/_rels/${drawingFile}.rels`;
        const relsBytes = zipFiles.get(relsPath);
        const rIdToMedia = new Map<string, string>();

        if (relsBytes) {
          const relsXml = decoder.decode(relsBytes);
          const relRegex = /<Relationship\b[^>]*>/gi;
          let m: RegExpExecArray | null;
          while ((m = relRegex.exec(relsXml)) !== null) {
            const tag = m[0];
            const idMatch = tag.match(/\bId="([^"]+)"/i);
            const targetMatch = tag.match(/\bTarget="([^"]+)"/i);
            if (idMatch && targetMatch) {
              const targetFile = targetMatch[1].split("/").pop() || "";
              const mediaUrl = mediaMap.get(targetFile);
              if (mediaUrl) {
                rIdToMedia.set(idMatch[1], mediaUrl);
              }
            }
          }
        }

        const drawingXml = decoder.decode(data);
        const anchorRegex = /<(?:xdr:)?(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/(?:xdr:)?(?:twoCellAnchor|oneCellAnchor)>/gi;
        let anchorMatch: RegExpExecArray | null;
        while ((anchorMatch = anchorRegex.exec(drawingXml)) !== null) {
          const block = anchorMatch[0];
          const fromBlock = block.match(/<(?:xdr:)?from>([\s\S]*?)<\/(?:xdr:)?from>/i);
          const rowMatch = (fromBlock ? fromBlock[1] : block).match(/<(?:xdr:)?row>(\d+)<\/(?:xdr:)?row>/i);
          const blipMatch = block.match(/<(?:a:)?blip\b[^>]*\b(?:r:)?embed="([^"]+)"/i);

          if (rowMatch && blipMatch) {
            const rowIndex = parseInt(rowMatch[1], 10);
            const rId = blipMatch[1];
            const mediaUrl = rIdToMedia.get(rId);
            if (mediaUrl && isValidBase64Image(mediaUrl) && !byRow.has(rowIndex)) {
              byRow.set(rowIndex, mediaUrl);
            }
          }
        }
      }
    }

    // 3. Parse WPS / Excel DISPIMG cell images (xl/cellimages.xml + xl/cellimages.xml.rels)
    const cellImagesBytes = zipFiles.get("xl/cellimages.xml");
    const cellImagesRelsBytes = zipFiles.get("xl/_rels/cellimages.xml.rels") || zipFiles.get("xl/cellimages.xml.rels");
    if (cellImagesBytes) {
      const rIdToMedia = new Map<string, string>();
      if (cellImagesRelsBytes) {
        const relsXml = decoder.decode(cellImagesRelsBytes);
        const relRegex = /<Relationship\b[^>]*>/gi;
        let m: RegExpExecArray | null;
        while ((m = relRegex.exec(relsXml)) !== null) {
          const tag = m[0];
          const idMatch = tag.match(/\bId="([^"]+)"/i);
          const targetMatch = tag.match(/\bTarget="([^"]+)"/i);
          if (idMatch && targetMatch) {
            const targetFile = targetMatch[1].split("/").pop() || "";
            const mediaUrl = mediaMap.get(targetFile);
            if (mediaUrl) rIdToMedia.set(idMatch[1], mediaUrl);
          }
        }
      }

      const cellXml = decoder.decode(cellImagesBytes);
      const cellImgRegex = /<(?:etc:)?cellImage\b[\s\S]*?<\/(?:etc:)?cellImage>/gi;
      let cm: RegExpExecArray | null;
      while ((cm = cellImgRegex.exec(cellXml)) !== null) {
        const block = cm[0];
        const nameMatch = block.match(/\bname="(ID_[^"]+)"/i) || block.match(/\bname="([^"]+)"/i);
        const blipMatch = block.match(/<(?:a:)?blip\b[^>]*\b(?:r:)?embed="([^"]+)"/i);
        if (nameMatch && blipMatch) {
          const mediaUrl = rIdToMedia.get(blipMatch[1]);
          if (mediaUrl && isValidBase64Image(mediaUrl)) {
            byDispImgId.set(nameMatch[1], mediaUrl);
          }
        }
      }
    }

    // 4. Parse Excel 365 "Place in Cell" RichData images (xl/richData/richValueRel.xml + xl/worksheets/sheet1.xml vm="...")
    const richRelRelsBytes = zipFiles.get("xl/richData/_rels/richValueRel.xml.rels");
    const richRelBytes = zipFiles.get("xl/richData/richValueRel.xml");
    const sheet1Bytes = zipFiles.get("xl/worksheets/sheet1.xml");
    if (richRelRelsBytes && sheet1Bytes) {
      const rIdToMedia = new Map<string, string>();
      const relsXml = decoder.decode(richRelRelsBytes);
      const relRegex = /<Relationship\b[^>]*>/gi;
      let m: RegExpExecArray | null;
      while ((m = relRegex.exec(relsXml)) !== null) {
        const tag = m[0];
        const idMatch = tag.match(/\bId="([^"]+)"/i);
        const targetMatch = tag.match(/\bTarget="([^"]+)"/i);
        if (idMatch && targetMatch) {
          const targetFile = targetMatch[1].split("/").pop() || "";
          const mediaUrl = mediaMap.get(targetFile);
          if (mediaUrl) rIdToMedia.set(idMatch[1], mediaUrl);
        }
      }

      // Build ordered list of media by richValueRel index (0-based)
      const orderedRichMedia: string[] = [];
      if (richRelBytes) {
        const richRelXml = decoder.decode(richRelBytes);
        const relItemRegex = /<(?:[\w]+:)?rel\b[^>]*\b(?:r:)?id="([^"]+)"/gi;
        let rm: RegExpExecArray | null;
        while ((rm = relItemRegex.exec(richRelXml)) !== null) {
          const mediaUrl = rIdToMedia.get(rm[1]) || "";
          orderedRichMedia.push(mediaUrl);
        }
      }

      // Scan sheet1.xml for cells with vm="..." attribute
      const sheetXml = decoder.decode(sheet1Bytes);
      const cellVmRegex = /<c\b[^>]*\br="([A-Z]+)(\d+)"[^>]*\bvm="(\d+)"[^>]*>/gi;
      let cvm: RegExpExecArray | null;
      while ((cvm = cellVmRegex.exec(sheetXml)) !== null) {
        const excelRow1Based = parseInt(cvm[2], 10);
        const vmIdx1Based = parseInt(cvm[3], 10);
        const row0Based = excelRow1Based - 1;
        const mediaUrl =
          orderedRichMedia[vmIdx1Based - 1] ||
          rIdToMedia.get(`rId${vmIdx1Based}`) ||
          allMedia[vmIdx1Based - 1];
        if (mediaUrl && isValidBase64Image(mediaUrl) && !byRow.has(row0Based)) {
          byRow.set(row0Based, mediaUrl);
        }
      }
    }
  } catch (err) {
    console.warn("Could not extract embedded Excel images:", err);
  }

  return { byRow, byDispImgId, allMedia };
}

/**
 * Resolve image from either direct URL/Base64 string in cell, Excel cell hyperlink,
 * =HYPERLINK formula, Google Drive sharing link, or embedded Excel row image.
 */
function resolveRowImage(
  cellValue: any,
  excelRowIndex: number,
  extracted: ExtractedExcelImages,
  firstSheet?: XLSX.WorkSheet,
  maxCols = 35
): string {
  // Helper to check a single string candidate for Google Drive URL, DISPIMG, or image URL
  const parseImageCandidate = (raw: string): string => {
    const s = String(raw || "").trim();
    if (!s || s === "-") return "";

    // 1. Check if string contains a Google Drive link anywhere
    if (extractGoogleDriveFileId(s)) {
      return formatImageDisplayUrl(s);
    }

    // 2. Check if cell contains DISPIMG("ID_...")
    const dispMatch = s.match(/ID_[A-Za-z0-9_-]+/);
    if (dispMatch && extracted.byDispImgId.has(dispMatch[0])) {
      const dispImg = extracted.byDispImgId.get(dispMatch[0])!;
      if (isValidBase64Image(dispImg)) return dispImg;
    }

    // 3. Extract URL if embedded inside text or HYPERLINK formula
    const urlMatch = s.match(/https?:\/\/[^\s"'<>)]+/i);
    if (urlMatch) {
      return formatImageDisplayUrl(urlMatch[0]);
    }

    // 4. Direct data:image URI (must be valid, not dummy/corrupt) or relative image path
    if (s.startsWith("data:image/")) {
      return isValidBase64Image(s) ? s : "";
    }

    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(s)) {
      return s;
    }

    return "";
  };

  // Priority 1: Check the explicit cellValue from the Dokumen Gambar / Foto / Link GDrive column
  if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
    const resolved = parseImageCandidate(String(cellValue));
    if (resolved) return resolved;
  }

  // Priority 2: Inspect underlying worksheet cells in this row for Excel Hyperlinks (cell.l.Target),
  //             =HYPERLINK("url", "label") formulas (cell.f), or Google Drive links in any column
  if (firstSheet && excelRowIndex >= 0) {
    for (let c = 0; c < maxCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: excelRowIndex, c });
      const cellObj = firstSheet[addr];
      if (!cellObj) continue;

      // Check Excel hyperlink target
      const linkTarget = cellObj.l?.Target ? String(cellObj.l.Target).trim() : "";
      if (linkTarget) {
        const resolvedLink = parseImageCandidate(linkTarget);
        if (resolvedLink) return resolvedLink;
      }

      // Check Excel formula for HYPERLINK("https://...", "...")
      const formula = cellObj.f ? String(cellObj.f).trim() : "";
      if (formula) {
        const resolvedFormula = parseImageCandidate(formula);
        if (resolvedFormula) return resolvedFormula;
      }

      // Check cell raw value if it is a Google Drive URL or image URL
      const rawCellText = String(cellObj.v ?? cellObj.w ?? "").trim();
      if (rawCellText) {
        const resolvedRaw = parseImageCandidate(rawCellText);
        if (resolvedRaw) return resolvedRaw;
      }
    }
  }

  // Priority 3: Check if there's a valid drawing image anchored to this exact Excel row
  const rowImg = extracted.byRow.get(excelRowIndex);
  if (rowImg && isValidBase64Image(rowImg)) {
    return rowImg;
  }

  return "";
}

// ============================================================================
// HEADER & EMPTY/NOISE ROW DETECTION
// ============================================================================

const HEADER_NOISE_WORDS = new Set([
  "no",
  "nomor",
  "ruangan",
  "ruang",
  "kodebarang",
  "kodeaktiva",
  "namabarang",
  "namaaktivatetap",
  "namaaktiva",
  "tipeukuran",
  "spesifikasi",
  "satuan",
  "satuankemasanterkecil",
  "jumlah",
  "qty",
  "tahunperolehan",
  "kondisi",
  "hargasatuan",
  "totalhargaperolehan",
  "pemilikan",
  "pemilik",
  "dpsa",
  "dpm",
  "pakboyke",
  "dokumengambar",
  "keterangan",
  "keteranganletak",
  "total",
  "subtotal",
  "grandtotal",
  "jumlahkeseluruhan",
]);

function isHeaderOrSummaryRow(code: string, name: string): boolean {
  const c = cleanKey(code);
  const n = cleanKey(name);

  if (HEADER_NOISE_WORDS.has(c) || HEADER_NOISE_WORDS.has(n)) return true;
  if (n.startsWith("total") || n.startsWith("subtotal") || n.startsWith("grandtotal") || n.startsWith("jumlah")) {
    return true;
  }
  if (c.startsWith("total") || c.startsWith("subtotal") || c.startsWith("grandtotal")) {
    return true;
  }
  return false;
}

function isLikelyAssetCode(val: string): boolean {
  if (!val) return false;
  const s = val.trim();
  // Matches codes like INVNT/DPSA/..., INV/DPM/..., FA/P01/...
  return /^(INVNT|INV|FA|AKT|BRG)[\/\-]/i.test(s) || (s.includes("/") && /\d/.test(s));
}

// ============================================================================
// PARSE FIX ASSET EXCEL
// ============================================================================

export async function parseFixAssetExcel(
  file: File,
  existingMasterNames: { id: number; namaBarang: string }[] = [],
  activeDivisi?: string
): Promise<{
  items: Partial<FixAssetItem>[];
  sheetNames: string[];
  summary: { totalRows: number; totalValue: number; withImagesCount?: number };
}> {
  const buffer = await file.arrayBuffer();
  const extractedImages = await extractExcelImages(buffer);
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error("File Excel tidak memiliki sheet yang valid.");
  }

  const firstSheet = workbook.Sheets[sheetNames[0]];
  const sheetRange = XLSX.utils.decode_range(firstSheet["!ref"] || "A1");
  const sheetStartRow = sheetRange.s.r || 0;
  const rows2D: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
  // Formatted (as displayed in Excel) values — used for date / bulan / tahun cells stored as date serials
  const rows2DText: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false });

  if (rows2D.length === 0) {
    throw new Error("Sheet Excel kosong atau tidak memiliki baris data.");
  }

  // Locate header row (look in first 15 rows for "kode barang" / "kode aktiva" / "nama barang" / "nama aktiva" / "merk" / "spesifikasi")
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(15, rows2D.length); r++) {
    const rowClean = rows2D[r].map((c) => cleanKey(String(c)));
    const hasHeader =
      rowClean.some(
        (k) =>
          k.includes("kodebarang") ||
          k.includes("kodeaktiva") ||
          k.includes("namaaktiva") ||
          k.includes("namabarang") ||
          k.includes("jenisbarang") ||
          k.includes("jenisaktiva")
      ) ||
      (rowClean.some((k) => k === "merk" || k === "spesifikasi") && rowClean.some((k) => k.includes("harga") || k.includes("lokasi")));
    if (hasHeader) {
      headerRowIdx = r;
      break;
    }
  }

  // Check if headerRowIdx + 1 is a sub-header row (e.g. TGL | BULAN | TAHUN under TGL PEROLEHAN)
  const mainHeader = rows2D[headerRowIdx] || [];
  const nextRow = rows2D[headerRowIdx + 1] || [];
  const nextRowClean = nextRow.map((c) => cleanKey(String(c)));
  const isNextRowSubHeader =
    nextRowClean.some((k) => ["tgl", "tanggal", "hari", "bulan", "tahun", "thn", "th", "bln", "bl", "dpsa", "dpm"].includes(k)) &&
    !nextRow.some((c) => isLikelyAssetCode(String(c)));

  const dataStartRow = isNextRowSubHeader ? headerRowIdx + 2 : headerRowIdx + 1;

  // Build effective column names
  const colCount = Math.max(mainHeader.length, nextRow.length);
  const colKeys: string[] = [];
  const altKeys: string[] = [];
  let lastMainHeader = "";
  let groupOffset = 0; // position of the column inside a merged main header group

  const isUmurGroup = (k: string) =>
    k.includes("umur") || k.includes("masamanfaat") || k.includes("masapakai") || k.includes("manfaat");
  const isTglGroup = (k: string) =>
    k.includes("tglperolehan") ||
    k.includes("tanggalperolehan") ||
    k.includes("tglbeli") ||
    k.includes("tanggalbeli") ||
    k === "perolehan" ||
    k === "tglpembelian" ||
    k === "tanggalpembelian";

  for (let c = 0; c < colCount; c++) {
    const h1 = String(mainHeader[c] || "").trim();
    if (h1) {
      lastMainHeader = h1;
      groupOffset = 0;
    } else {
      groupOffset++;
    }
    const h2 = isNextRowSubHeader ? String(nextRow[c] || "").trim() : "";

    const k1 = cleanKey(h1);
    const k2 = cleanKey(h2);
    const groupKey = cleanKey(lastMainHeader);

    // 1. Columns under merged UMUR / MASA MANFAAT header (THN | BLN)
    //    -> "umurthn" / "umurbln" so they never collide with Tahun / Bulan Perolehan
    if (isUmurGroup(groupKey)) {
      const sub = k2;
      if (/^(th|thn|tahun|tahunan|year)$/.test(sub)) {
        colKeys[c] = "umurthn";
      } else if (/^(bl|bln|bulan|bulanan|month)$/.test(sub)) {
        colKeys[c] = "umurbln";
      } else if (k1 && /(bln|bulan)/.test(k1.replace(/umur|masamanfaat|masapakai|manfaat/g, ""))) {
        colKeys[c] = "umurbln";
      } else if (k1 && /(thn|tahun|th)/.test(k1.replace(/umur|masamanfaat|masapakai|manfaat/g, ""))) {
        colKeys[c] = "umurthn";
      } else {
        // Unlabelled: 1st column of the group = tahun, 2nd = bulan
        colKeys[c] = groupOffset === 0 ? "umurthn" : groupOffset === 1 ? "umurbln" : `col_${c}`;
      }
      continue;
    }

    // 2. Columns under merged TGL PEROLEHAN header (TGL | BULAN | TAHUN)
    if (isTglGroup(groupKey)) {
      if (/^(tgl|tanggal|hari|date)$/.test(k2)) {
        colKeys[c] = "tglperolehan";
      } else if (/^(bl|bln|bulan|month)$/.test(k2)) {
        colKeys[c] = "bulan";
      } else if (/^(th|thn|tahun|year)$/.test(k2)) {
        colKeys[c] = "tahun";
      } else if (k2) {
        colKeys[c] = k2;
      } else {
        // Unlabelled sub-columns of the merged group: 0 = tgl, 1 = bulan, 2 = tahun
        colKeys[c] =
          groupOffset === 0 ? "tglperolehan" : groupOffset === 1 ? "bulan" : groupOffset === 2 ? "tahun" : `col_${c}`;
      }
      continue;
    }

    // 3. Generic merged group with sub-headers (e.g. NILAI -> SISA | BUKU)
    const nextH1Empty = c + 1 < colCount && !String(mainHeader[c + 1] || "").trim();
    const nextK2 = isNextRowSubHeader ? cleanKey(String(nextRow[c + 1] || "")) : "";
    const isMergedGroup = k2 !== "" && (!h1 || (nextH1Empty && nextK2 !== ""));
    if (isMergedGroup && groupKey) {
      colKeys[c] = `${groupKey}${k2}`;
      altKeys[c] = k2;
      continue;
    }

    if (k1) {
      colKeys[c] = k1;
    } else if (k2) {
      colKeys[c] = k2;
    } else {
      colKeys[c] = `col_${c}`;
    }
  }

  /**
   * Classify a cleaned header key into a canonical Fix Asset field (fuzzy),
   * so header variations like "NILAI SISA (Rp)", "BULAN PEROLEHAN", "TH. PEROLEHAN",
   * "UMUR EKONOMIS (THN)" are still recognised.
   */
  const classifyFixAssetKey = (k: string): string | null => {
    if (!k || k.startsWith("col")) return null;
    if (k === "umurthn" || k === "umurbln") return k;
    if (/ke$/.test(k) || /^(tahunke|thnke|bulanke|blnke)/.test(k)) return null;

    const isUmur = /(umur|masamanfaat|masapakai|usia)/.test(k);
    if (isUmur) {
      const rest = k.replace(/umurekonomis|umur|masamanfaat|masapakai|usia|ekonomis/g, "");
      if (/(bln|bulan|bl)/.test(rest)) return "umurbln";
      return "umurthn";
    }

    if (/(nilaisisa|nilairesidu|residu|salvage)/.test(k) || k === "sisa") return "nilaisisa";

    if (/^(tgl|tanggal)/.test(k) && !/(input|update|cetak|print)/.test(k)) return "tglperolehan";
    if (/^(bln|bulan|bl)(perolehan|beli|pembelian)?$/.test(k)) return "bulan";
    if (/^(th|thn|tahun)(perolehan|beli|pembelian)?$/.test(k)) return "tahun";

    if (
      /(dokumengambar|fotobarang|gambarbarang|linkfoto|linkgdrive|googledrive|gdrive|foto|gambar|image|photo|buktifisik|fotoaktiva|fotofisik|urlfoto|urlgambar)/.test(
        k
      )
    ) {
      return "foto";
    }

    return null;
  };

  const canonKeys: (string | null)[] = colKeys.map((k) => classifyFixAssetKey(k || ""));

  const items: Partial<FixAssetItem>[] = [];
  let totalValue = 0;

  for (let r = dataStartRow; r < rows2D.length; r++) {
    const row = rows2D[r];
    if (!row || row.every((cell) => String(cell ?? "").trim() === "")) {
      continue;
    }

    const rowMap: Record<string, any> = {};
    const canonMap: Record<string, any> = {};
    const canonTextMap: Record<string, string> = {};
    const rowText = rows2DText[r] || [];
    for (let c = 0; c < row.length; c++) {
      const key = colKeys[c] || `col_${c}`;
      if (rowMap[key] === undefined || rowMap[key] === "") {
        rowMap[key] = row[c];
      }
      const alt = altKeys[c];
      if (alt && (rowMap[alt] === undefined || rowMap[alt] === "")) {
        rowMap[alt] = row[c];
      }
      const canon = canonKeys[c];
      if (canon && String(row[c] ?? "").trim() !== "" && canonMap[canon] === undefined) {
        canonMap[canon] = row[c];
        canonTextMap[canon] = String(rowText[c] ?? "").trim();
      }
    }

    const getVal = (...aliases: string[]) => {
      for (const a of aliases) {
        const cleaned = cleanKey(a);
        if (rowMap[cleaned] !== undefined && String(rowMap[cleaned]).trim() !== "") {
          return rowMap[cleaned];
        }
      }
      return "";
    };

    /** Value of canonical (fuzzy-detected) Fix Asset column, falling back to exact aliases */
    const getCanon = (canon: string, ...aliases: string[]) => {
      if (canonMap[canon] !== undefined) return canonMap[canon];
      return getVal(...aliases);
    };

    const rawKode = String(getVal("kodebarang", "kodeaktiva", "kode", "nobarang", "noaktiva", "nomoraktiva")).trim();
    const rawNama = normalizeItemTypo(String(getVal("namabarang", "namaaktivatetap", "namaaktiva", "nama", "item")).trim());
    const rawSpesifikasi = formatMultilineText(getVal("spesifikasi", "spek", "deskripsi"), "-");
    const rawMerk = formatMultilineText(getVal("merk", "brand"), "-");

    // Skip repeated header or summary/total rows
    if (isHeaderOrSummaryRow(rawKode, rawNama)) {
      continue;
    }

    // If this is a continuation sub-row (no Kode and no Nama, but has Spesifikasi/Merk/Harga)
    if (!rawKode && !rawNama) {
      if (items.length > 0 && (rawSpesifikasi !== "-" || rawMerk !== "-")) {
        const prev = items[items.length - 1];
        if (rawSpesifikasi !== "-") {
          prev.spesifikasi = prev.spesifikasi && prev.spesifikasi !== "-"
            ? `${prev.spesifikasi}\n${rawSpesifikasi}`
            : rawSpesifikasi;
        }
        if (rawMerk !== "-") {
          prev.merk = prev.merk && prev.merk !== "-"
            ? `${prev.merk}\n${rawMerk}`
            : rawMerk;
        }
        const subHarga = parseNumber(getVal("hargaperolehan", "harga", "hargasatuan"));
        const subTotal = parseNumber(getVal("totalperolehan", "total", "totalharga")) || subHarga;
        if (subTotal > 0) {
          prev.hargaPerolehan = (prev.hargaPerolehan || 0) + subHarga;
          prev.totalPerolehan = (prev.totalPerolehan || 0) + subTotal;
          totalValue += subTotal;
        }
        if (!prev.foto) {
          const subImg = resolveRowImage(
            getCanon(
              "foto",
              "foto",
              "gambar",
              "dokumengambar",
              "image",
              "photo",
              "link",
              "linkfoto",
              "linkgambar",
              "linkgdrive",
              "gdrive",
              "googledrive",
              "linkgoogledrive",
              "drive",
              "fotobarang",
              "gambarbarang",
              "dokumentasi",
              "buktifisik",
              "fotoaktiva",
              "fotofisik",
              "file",
              "urlfoto",
              "urlgambar",
              "url"
            ),
            sheetStartRow + r,
            extractedImages,
            firstSheet,
            Math.max(colCount, row.length)
          );
          if (subImg) prev.foto = subImg;
        }
      }
      continue;
    }

    // Skip if row has neither valid code nor valid item name
    if (!rawNama && !isLikelyAssetCode(rawKode)) {
      continue;
    }

    const kodeAktiva = rawKode || "-";
    const namaAktivaTetap = rawNama || "-";
    const rawType = String(
      getVal(
        "typebarang",
        "tipebarang",
        "typeaktiva",
        "tipeaktiva",
        "tipe",
        "type",
        "golongan"
      ) || ""
    ).trim();
    const typeAktiva = normalizeFixAssetTypeName(rawType, rawKode);
    const rawJenis = canonicalizeFixAssetJenisBarang(
      normalizeItemTypo(
        String(
          getVal(
            "jenisbarang",
            "jenisaktiva",
            "jenis",
            "jenisset",
            "kategoribarang",
            "kategori",
            "kelompokbarang",
            "kelompok"
          ) || ""
        ).trim()
      )
    );
    const satuan = formatMultilineText(getVal("satuan", "unit", "kemasan"), "Unit");

    // --- Tanggal / Bulan / Tahun Perolehan ---
    const rawTglVal = getCanon("tglperolehan", "tglperolehan", "tanggalperolehan", "tanggal", "tgl");
    const tglText = canonTextMap["tglperolehan"] || "";
    let dayFromTgl = 0;
    let tglPerolehan = "-";
    if (typeof rawTglVal === "number" && rawTglVal >= 1 && rawTglVal <= 31) {
      // Sub-column "TGL" that only contains the day number
      dayFromTgl = rawTglVal;
    } else {
      tglPerolehan = normalizeFixAssetDate(rawTglVal, tglText);
    }

    const extractedParts = extractDateParts(tglPerolehan);
    const bulanParsed = parseBulanValue(getCanon("bulan", "bulan", "bln"), canonTextMap["bulan"] || "");
    const rawBulan = bulanParsed || extractedParts.bulan || "";
    const mNum = parseBulanPerolehan(rawBulan, tglPerolehan);
    const bulan = (mNum >= 1 && mNum <= 12) ? INDONESIAN_MONTHS[mNum - 1] : (rawBulan || "JANUARI");

    const tahunParsed = parseTahunValue(getCanon("tahun", "tahun", "thn"), canonTextMap["tahun"] || "");
    const rawTahun = tahunParsed || extractedParts.tahun || 0;
    const tahun = parseTahunPerolehan(rawTahun, tglPerolehan) || new Date().getFullYear();

    // If tglPerolehan wasn't in a single cell, construct it from tgl + bulan + tahun
    if ((!tglPerolehan || tglPerolehan === "-") && tahun > 0) {
      const dayStr = String(dayFromTgl > 0 ? dayFromTgl : 1).padStart(2, "0");
      const mIdx = INDONESIAN_MONTHS.indexOf(bulan.toUpperCase());
      const mStr = mIdx >= 0 ? String(mIdx + 1).padStart(2, "0") : "01";
      tglPerolehan = `${dayStr}/${mStr}/${tahun}`;
    }

    const isMultiComp = rawSpesifikasi.includes("\n") || rawNama.includes("\n");
    const qty = parseQuantity(getVal("qty", "jumlah", "kuantitas", "banyak"), isMultiComp);
    const hargaPerolehan = parseNumber(getVal("hargaperolehan", "harga", "hargasatuan", "satuanharga"));
    const rawTotal = parseNumber(getVal("totalperolehan", "total", "nilaipol", "totalharga", "hargatotal", "nilaiperolehan"));
    const totalPerolehan = rawTotal > 0 ? rawTotal : hargaPerolehan * qty;

    // Perhitungan otomatis untuk umur, depresiasi, akumulasi, dan nilai buku:
    // Baik user mengunggah template ringkas (tanpa kolom perhitungan) maupun file komplit,
    // nilai yang salah akan otomatis diperbaiki menjadi benar sesuai aturan bisnis.
    const auto = calculateFixAssetAutoValues({
      typeAktiva,
      kodeAktiva,
      hargaPerolehan,
      qty,
      totalPerolehan,
      tglPerolehan,
      bulan,
      tahun,
    });

    const nilaiSisa = 0;
    const umurThn = auto.umurThn;
    const umurBln = auto.umurBln;
    const depresiasi = auto.depresiasi;
    const akumulasiDepresiasi = auto.akumulasiDepresiasi;
    const nilaiBuku = auto.nilaiBuku;
    const tahunKe = auto.tahunKe;
    const bulanKe = auto.bulanKe;
    const hasilBln = auto.hasilBln;
    const penyusutanBln = auto.penyusutanBln;
    const fixAkumulasi = auto.fixAkumulasi;
    const rawLokasiVal = getVal("lokasi", "ruang", "ruangan", "divisi", "penempatan");
    const lokasi =
      rawLokasiVal !== undefined &&
      String(rawLokasiVal).trim() !== "" &&
      String(rawLokasiVal).trim() !== "-"
        ? formatMultilineText(rawLokasiVal, "-")
        : "-";
    const keterangan = formatMultilineText(getVal("keterangan", "ket", "notes", "catatan"), "-");
    const foto = resolveRowImage(
      getCanon(
        "foto",
        "foto",
        "gambar",
        "dokumengambar",
        "image",
        "photo",
        "link",
        "linkfoto",
        "linkgambar",
        "linkgdrive",
        "gdrive",
        "googledrive",
        "linkgoogledrive",
        "drive",
        "fotobarang",
        "gambarbarang",
        "dokumentasi",
        "buktifisik",
        "fotoaktiva",
        "fotofisik",
        "file",
        "urlfoto",
        "urlgambar",
        "url"
      ),
      sheetStartRow + r,
      extractedImages,
      firstSheet,
      Math.max(colCount, row.length)
    );

    totalValue += totalPerolehan;

    items.push({
      kodeAktiva,
      typeAktiva,
      jenisBarang: rawJenis,
      namaAktivaTetap,
      merk: rawMerk,
      spesifikasi: rawSpesifikasi,
      satuan,
      tglPerolehan,
      bulan,
      tahun,
      qty,
      hargaPerolehan,
      totalPerolehan,
      nilaiSisa,
      umurThn,
      umurBln,
      depresiasi,
      akumulasiDepresiasi,
      nilaiBuku,
      tahunKe,
      bulanKe,
      hasilBln,
      penyusutanBln,
      fixAkumulasi,
      lokasi,
      keterangan,
      foto,
    });
  }

  if (items.length === 0) {
    throw new Error("Tidak ada data Fix Asset yang valid di dalam berkas Excel ini. Pastikan baris data tidak kosong.");
  }

  // Assign Jenis Barang ID and format Kode Barang: FA/Tipe Barang/Kode Barang/Bln Perolehan/DPSA/Th Perolehan/Lokasi
  const jenisSlots: string[] = [];
  const seenLower = new Set<string>();
  existingMasterNames.forEach((m) => {
    const raw = (m.namaBarang || "").trim();
    if (raw && !seenLower.has(raw.toLowerCase())) {
      jenisSlots.push(raw);
      seenLower.add(raw.toLowerCase());
    }
  });

  // First pass: register explicit or matched/extracted Jenis Barang into jenisSlots
  items.forEach((it) => {
    const rawNama = normalizeItemTypo((it.namaAktivaTetap || "").trim());
    const explicitJenis = canonicalizeFixAssetJenisBarang(
      normalizeItemTypo((it.jenisBarang || "").trim())
    );

    if (explicitJenis && explicitJenis !== "-") {
      // If item has explicit Jenis Barang from Excel
      const candidateList = jenisSlots.map((s, idx) => ({ idx, namaBarang: s }));
      const matched = findBestMatchingFixAssetJenis(explicitJenis, candidateList);
      if (matched) {
        it.jenisBarang = matched.item.namaBarang;
      } else if (!seenLower.has(explicitJenis.toLowerCase())) {
        jenisSlots.push(explicitJenis);
        seenLower.add(explicitJenis.toLowerCase());
        it.jenisBarang = explicitJenis;
      }
      return;
    }

    // If item does NOT have Jenis Barang in Excel -> automatically determine relevant category
    if (!rawNama || rawNama === "-") return;
    const candidateList = jenisSlots.map((s, idx) => ({ idx, namaBarang: s }));
    const matched = findBestMatchingFixAssetJenis(rawNama, candidateList);
    if (matched) {
      it.jenisBarang = matched.item.namaBarang;
    } else {
      const ext = extractFixAssetJenisFromNama(rawNama) || rawNama;
      if (ext && !seenLower.has(ext.toLowerCase())) {
        jenisSlots.push(ext);
        seenLower.add(ext.toLowerCase());
      }
      it.jenisBarang = ext;
    }
  });

  const slotCandidates = jenisSlots.map((s, idx) => ({ idx, namaBarang: s }));
  const itemSlotIdx: (number | undefined)[] = [];
  const lokJenisTotal = new Map<string, number>();

  items.forEach((it, idx) => {
    const target = (
      canonicalizeFixAssetJenisBarang(it.jenisBarang) ||
      it.namaAktivaTetap ||
      ""
    ).trim();
    const matched = findBestMatchingFixAssetJenis(target, slotCandidates);
    let matchedIdx = matched ? matched.item.idx : undefined;
    if (matchedIdx === undefined && it.jenisBarang) {
      matchedIdx = jenisSlots.findIndex(
        (s) => s.toLowerCase() === it.jenisBarang?.toLowerCase().trim()
      );
      if (matchedIdx === -1) matchedIdx = undefined;
    }
    itemSlotIdx[idx] = matchedIdx;
    if (matchedIdx !== undefined) {
      const key = `${(it.lokasi || "").trim().toLowerCase()}__${matchedIdx + 1}`;
      lokJenisTotal.set(key, (lokJenisTotal.get(key) || 0) + 1);
    }
  });

  const lokJenisSeq = new Map<string, number>();
  items.forEach((it, idx) => {
    const matchedIdx = itemSlotIdx[idx];
    if (matchedIdx !== undefined) {
      const jenisId = matchedIdx + 1;
      const key = `${(it.lokasi || "").trim().toLowerCase()}__${jenisId}`;
      const seq = (lokJenisSeq.get(key) || 0) + 1;
      lokJenisSeq.set(key, seq);
      const total = lokJenisTotal.get(key) || 1;
      it.jenisBarang = jenisSlots[matchedIdx];
      // Selalu buat kode aktiva sesuai standar template lokalan (mengaitkan lokasi, type barang, jenis barang, divisi)
      it.kodeAktiva = formatFixAssetKodeBarang(it, jenisId, seq, total, undefined, undefined, it.divisi || activeDivisi);
    } else {
      it.kodeAktiva = formatFixAssetKodeBarang(it, 1, 1, 1, undefined, undefined, it.divisi || activeDivisi);
    }
  });

  return {
    items,
    sheetNames,
    summary: {
      totalRows: items.length,
      totalValue,
      withImagesCount: items.filter((i) => !!i.foto).length,
    },
  };
}

// ============================================================================
// PARSE INVENTORY EXCEL
// ============================================================================

/**
 * Helper to build room abbreviation like "R.S" for "Studio" / "Ruang Studio"
 * or "R.S.M" for "Ruang Studio dan Marketing".
 */
export function buildRoomAbbreviation(roomName?: string): string {
  const abbr = buildSharedRoomAbbreviation(roomName);
  return abbr && abbr !== "-" ? abbr : "R.S";
}

export async function parseInventoryExcel(
  file: File,
  existingItemNames: { id: number; namaBarang: string }[] = [],
  activeDivisi?: string
): Promise<{
  items: Partial<InventoryItem>[];
  sheetNames: string[];
  summary: { totalRows: number; totalValue: number; withImagesCount?: number };
}> {
  const buffer = await file.arrayBuffer();
  const extractedImages = await extractExcelImages(buffer);
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error("File Excel tidak memiliki sheet yang valid.");
  }

  const firstSheet = workbook.Sheets[sheetNames[0]];
  const sheetRange = XLSX.utils.decode_range(firstSheet["!ref"] || "A1");
  const sheetStartRow = sheetRange.s.r || 0;
  const rows2D: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

  if (rows2D.length === 0) {
    throw new Error("Sheet Excel kosong atau tidak memiliki baris data.");
  }

  // Locate header row (look in first 15 rows for "kode barang" / "nama barang" / "tipe/ukuran")
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(15, rows2D.length); r++) {
    const rowClean = rows2D[r].map((c) => cleanKey(String(c)));
    const hasHeader =
      rowClean.some((k) => k.includes("kodebarang") || k.includes("namabarang")) ||
      (rowClean.some((k) => k.includes("tipe") || k.includes("ukuran")) &&
        rowClean.some((k) => k.includes("kondisi") || k.includes("satuan")));
    if (hasHeader) {
      headerRowIdx = r;
      break;
    }
  }

  // Check if headerRowIdx + 1 is the sub-header row (only when it does NOT contain an asset code and mainHeader doesn't already have PEMILIKAN)
  const mainHeader = rows2D[headerRowIdx] || [];
  const mainHeaderClean = mainHeader.map((c) => cleanKey(String(c)));
  const hasPemilikanColumn = mainHeaderClean.some((k) => k.includes("pemilik") || k.includes("kepemilikan"));

  const nextRow = rows2D[headerRowIdx + 1] || [];
  const nextRowClean = nextRow.map((c) => cleanKey(String(c)));
  const isNextRowSubHeader =
    !hasPemilikanColumn &&
    !nextRow.some((c) => isLikelyAssetCode(String(c))) &&
    nextRowClean.filter(Boolean).length <= 5 &&
    nextRowClean.some((k) => ["dpsa", "dpm", "pakboyke", "boyke", "ybd"].includes(k));

  const dataStartRow = isNextRowSubHeader ? headerRowIdx + 2 : headerRowIdx + 1;

  // Build effective column keys supporting both the unified (Total Harga Perolehan + PEMILIKAN) format
  // and legacy 3-subcolumn (DPSA | DPM | PAK BOYKE) format
  const colCount = Math.max(mainHeader.length, nextRow.length);
  const colKeys: string[] = [];
  let totalHargaStartCol = -1;

  for (let c = 0; c < colCount; c++) {
    const h1 = String(mainHeader[c] || "").trim();
    const h2 = isNextRowSubHeader ? String(nextRow[c] || "").trim() : "";
    const k1 = cleanKey(h1);
    const k2 = cleanKey(h2);

    if (k1.includes("totalhargaperolehan") || k1 === "totalharga") {
      totalHargaStartCol = c;
    }

    if (isNextRowSubHeader) {
      if (k2 === "dpsa" || k2.includes("alokasidpsa")) {
        colKeys[c] = "dpsa";
      } else if (k2 === "dpm" || k2.includes("alokasidpm")) {
        colKeys[c] = "dpm";
      } else if (k2.includes("boyke") || k2 === "ybd") {
        colKeys[c] = "pakboyke";
      } else if (totalHargaStartCol !== -1 && c === totalHargaStartCol && !k2) {
        colKeys[c] = "dpsa";
      } else if (totalHargaStartCol !== -1 && c === totalHargaStartCol + 1 && !k1 && !k2) {
        colKeys[c] = "dpm";
      } else if (totalHargaStartCol !== -1 && c === totalHargaStartCol + 2 && !k1 && !k2) {
        colKeys[c] = "pakboyke";
      } else if (k1.includes("hargasatuan") || (k1.includes("harga") && !k1.includes("total"))) {
        colKeys[c] = "hargasatuan";
      } else if (k1.includes("satuan")) {
        colKeys[c] = "satuan";
      } else if (k1) {
        colKeys[c] = k1;
      } else if (k2) {
        colKeys[c] = k2;
      } else {
        colKeys[c] = `col_${c}`;
      }
    } else {
      if (k1.includes("totalhargaperolehan") || k1 === "totalharga") {
        colKeys[c] = "totalhargaperolehan";
      } else if (k1.includes("hargasatuan") || (k1.includes("harga") && !k1.includes("total"))) {
        colKeys[c] = "hargasatuan";
      } else if (k1.includes("pemilik") || k1.includes("kepemilikan")) {
        colKeys[c] = "pemilikan";
      } else if (
        k1.includes("ruang") ||
        k1.includes("lokasi") ||
        k1.includes("penempatan") ||
        k1.includes("tempat")
      ) {
        colKeys[c] = "ruangan";
      } else if (k1.includes("satuan")) {
        colKeys[c] = "satuan";
      } else if (k1) {
        colKeys[c] = k1;
      } else {
        colKeys[c] = `col_${c}`;
      }
    }
  }

  const items: Partial<InventoryItem>[] = [];
  let totalValue = 0;

  // Map unique Jenis Barang -> sequential ID (1, 2, 3, 4...)
  const namaBarangIdMap = new Map<string, number>();
  const namaBarangLabelMap = new Map<string, string>();
  existingItemNames.forEach((entry) => {
    const raw = String(entry.namaBarang || "").trim();
    const canonical = extractJenisBarangFromNama(raw) || raw;
    const key = canonical.toLowerCase();
    if (key && !namaBarangIdMap.has(key)) {
      namaBarangIdMap.set(key, entry.id);
      namaBarangLabelMap.set(key, canonical);
    }
  });

  // Track sequence number per (ruangan, namaBarang) for auto-generated Kode Barang
  const itemSequenceMap = new Map<string, number>();

  for (let r = dataStartRow; r < rows2D.length; r++) {
    const row = rows2D[r];
    if (!row || row.every((cell) => String(cell ?? "").trim() === "")) {
      continue;
    }

    const rowMap: Record<string, any> = {};
    for (let c = 0; c < row.length; c++) {
      const key = colKeys[c] || `col_${c}`;
      if (rowMap[key] === undefined || rowMap[key] === "") {
        rowMap[key] = row[c];
      }
    }

    const getVal = (...aliases: string[]) => {
      for (const a of aliases) {
        const cleaned = cleanKey(a);
        if (rowMap[cleaned] !== undefined && String(rowMap[cleaned]).trim() !== "") {
          return rowMap[cleaned];
        }
      }
      return "";
    };

    const rawRuanganCell = getVal(
      "ruangan",
      "ruang",
      "room",
      "lokasi",
      "lokasiruang",
      "penempatan",
      "tempat"
    );
    const rawRuangan =
      rawRuanganCell !== undefined &&
      String(rawRuanganCell).trim() !== "" &&
      String(rawRuanganCell).trim() !== "-"
        ? formatMultilineText(rawRuanganCell, "-")
        : "-";
    const rawKode = String(getVal("kodebarang", "nopl", "noregistrasi", "kode", "nomor")).trim();
    const rawNama = normalizeItemTypo(String(getVal("namabarang", "nama", "item", "deskripsi", "barang")).trim());
    const rawTipe = formatMultilineText(getVal("tipeukuran", "tipe", "ukuran", "spesifikasi", "spek"), "-");
    const rawTahun = formatMultilineText(getVal("tahunperolehan", "tahun", "thn", "tahunpembuatan"), "-");
    const rawKondisi = formatMultilineText(getVal("kondisi", "keadaan", "status"), "-");
    const rawHargaCell = getVal("hargasatuan", "harga", "satuanharga");
    const rawHargaTokens =
      rawHargaCell !== undefined && String(rawHargaCell).trim() !== ""
        ? String(rawHargaCell).match(/\d[\d.,]*/g) || []
        : [];
    const rawHargaLines = rawHargaTokens
      .map((tok) => parseSingleNumber(tok))
      .filter((n) => n > 0)
      .map((n) => formatRupiah(n));

    // Skip repeated headers, sub-headers (DPSA/DPM/PAK BOYKE), room titles, or summary/total rows
    if (isHeaderOrSummaryRow(rawKode, rawNama)) {
      continue;
    }

    // Handle continuation sub-rows (when 1 item is split across 3 sub-rows in Excel with merged Kode & Nama)
    if (!rawKode && !rawNama) {
      if (items.length > 0 && (rawTipe !== "-" || rawHargaLines.length > 0) && !isHeaderOrSummaryRow("", rawTipe)) {
        const prev = items[items.length - 1];
        if (rawTipe !== "-") {
          prev.tipeUkuran = prev.tipeUkuran && prev.tipeUkuran !== "-"
            ? `${prev.tipeUkuran}\n${rawTipe}`
            : rawTipe;
        }

        if (rawTahun !== "-") {
          prev.tahunPerolehan = prev.tahunPerolehan && prev.tahunPerolehan !== "-"
            ? `${prev.tahunPerolehan}\n${rawTahun}`
            : rawTahun;
        }
        if (rawKondisi !== "-") {
          prev.kondisi = prev.kondisi && prev.kondisi !== "-"
            ? `${prev.kondisi}\n${rawKondisi}`
            : rawKondisi;
        }
        if (rawHargaLines.length > 0) {
          const lineStr = rawHargaLines.join("\n");
          const existingText =
            prev.hargaSatuanText && prev.hargaSatuanText !== "-"
              ? prev.hargaSatuanText
              : prev.hargaSatuan && prev.hargaSatuan > 0
              ? formatRupiah(prev.hargaSatuan)
              : "";
          prev.hargaSatuanText = existingText
            ? `${existingText}\n${lineStr}`
            : lineStr;
        }

        const subHarga = parseNumber(rawHargaCell);
        const subTotalCol = parseNumber(getVal("totalhargaperolehan", "totalharga", "totalperolehan"));
        const subDpsa = parseNumber(getVal("dpsa", "totaldpsa", "alokasidpsa"));
        const subDpm = parseNumber(getVal("dpm", "totaldpm", "alokasidpm"));
        const subBoyke = parseNumber(getVal("pakboyke", "boyke", "alokasiboyke", "ybd"));

        if (subHarga > 0) prev.hargaSatuan = (prev.hargaSatuan || 0) + subHarga;
        const addTotal = subTotalCol || subDpsa || subDpm || subBoyke || subHarga;
        if (addTotal > 0) {
          prev.totalHargaPerolehan = (prev.totalHargaPerolehan || 0) + addTotal;
          const p = (prev.pemilik || "DPSA").toUpperCase();
          if (p.includes("DPM")) {
            prev.dpm = (prev.dpm || 0) + addTotal;
          } else if (p.includes("BOYKE") || p.includes("YBD")) {
            prev.pakBoyke = (prev.pakBoyke || 0) + addTotal;
          } else {
            prev.dpsa = (prev.dpsa || 0) + addTotal;
          }
          totalValue += addTotal;
        }

        if (!prev.dokumenGambar) {
          const subImg = resolveRowImage(
            getVal(
              "dokumengambar",
              "gambar",
              "foto",
              "image",
              "photo",
              "dokumentasi",
              "link",
              "linkfoto",
              "linkgambar",
              "linkgdrive",
              "gdrive",
              "googledrive",
              "linkgoogledrive",
              "drive",
              "fotobarang",
              "gambarbarang",
              "buktifisik",
              "fotofisik",
              "file",
              "urlfoto",
              "urlgambar",
              "url"
            ),
            sheetStartRow + r,
            extractedImages,
            firstSheet,
            Math.max(colCount, row.length)
          );
          if (subImg) prev.dokumenGambar = subImg;
        }
      }
      continue;
    }

    // Do NOT import rows that have neither a valid asset code nor an item name
    if (!rawKode && !rawNama) {
      continue;
    }
    const hasOtherItemData =
      rawRuangan !== "-" ||
      rawTipe !== "-" ||
      rawKondisi !== "-" ||
      rawTahun !== "-" ||
      rawHargaLines.length > 0 ||
      parseNumber(rawHargaCell) > 0 ||
      String(
        getVal(
          "satuan",
          "satuankemasanterkecil",
          "jumlah",
          "qty",
          "totalhargaperolehan",
          "dpsa",
          "dpm",
          "pakboyke",
          "pemilikan",
          "pemilik",
          "keterangan"
        )
      ).trim() !== "";

    if (!isLikelyAssetCode(rawKode) && (!rawNama || !hasOtherItemData)) {
      continue;
    }

    // If ruangan in Excel is empty, keep it empty ("-") to be filled via Edit later
    const ruangan = rawRuangan;
    const namaBarang = rawNama || "-";

    // Assign or retrieve sequential ID (1, 2, 3, 4...) for this Jenis Barang
    const extractedJenis = extractJenisBarangFromNama(namaBarang) || namaBarang;
    let matchedJenisKey = "";
    const existingKeysByLen = Array.from(namaBarangIdMap.keys()).sort(
      (a, b) => b.length - a.length
    );
    for (const key of existingKeysByLen) {
      if (matchesJenisBarang(namaBarang, key)) {
        matchedJenisKey = key;
        break;
      }
    }
    const namaKey = matchedJenisKey || extractedJenis.toLowerCase();
    let itemMasterId = namaBarangIdMap.get(namaKey);
    if (!itemMasterId) {
      itemMasterId = namaBarangIdMap.size + 1;
      namaBarangIdMap.set(namaKey, itemMasterId);
      namaBarangLabelMap.set(namaKey, extractedJenis);
    }
    const jenisBarang = namaBarangLabelMap.get(namaKey) || extractedJenis;

    // Check if Tipe/Ukuran has multiple lines (e.g. 3 items in 1 column: Monitor, CPU, UPS)
    const tipeLines = rawTipe !== "-" ? rawTipe.split("\n").filter(Boolean) : [];
    const isMultiComponent = tipeLines.length > 1;

    // Satuan: if multi-line like "Unit\nUnit\nUnit", condense to "Set" or single unit
    const rawSatuanVal = getVal("satuan", "satuankemasanterkecil", "unit", "kemasan", "kemasanterkecil");
    let satuan = "-";
    if (rawSatuanVal !== undefined && String(rawSatuanVal).trim() !== "") {
      const sLines = String(rawSatuanVal)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const uniqueSatuan = Array.from(new Set(sLines.map((s) => s.toLowerCase())));
      satuan = uniqueSatuan.length === 1 ? sLines[0] : sLines.join(" / ");
    } else {
      satuan = isMultiComponent ? "Set" : "Unit";
    }

    const kondisi = rawKondisi !== "-" ? rawKondisi : "-";
    const tahunPerolehan = rawTahun !== "-" ? rawTahun : "-";

    const jumlah = parseQuantity(getVal("jumlah", "qty", "kuantitas", "banyak"), isMultiComponent);
    const hargaSatuan = parseNumber(rawHargaCell);
    const hargaSatuanText = rawHargaLines.length > 0 ? rawHargaLines.join("\n") : "";
    const totalCalc = hargaSatuan * jumlah;

    const rawTotalHargaCol = parseNumber(getVal("totalhargaperolehan", "totalharga", "totalperolehan", "jumlahharga", "hargatotal"));
    let dpsa = parseNumber(getVal("dpsa", "totaldpsa", "alokasidpsa"));
    let dpm = parseNumber(getVal("dpm", "totaldpm", "alokasidpm"));
    let pakBoyke = parseNumber(getVal("pakboyke", "boyke", "alokasiboyke", "ybd"));

    // Resolve Pemilik / Pemilikan
    const rawPemilik = String(getVal("pemilikan", "pemilik", "kepemilikan", "owner", "alokasi") || "").trim();
    const rawKodeUpper = rawKode.toUpperCase();
    let pemilik = "DPSA";

    if (rawPemilik && rawPemilik !== "-") {
      const pUpper = rawPemilik.toUpperCase();
      if (pUpper.includes("DPM")) pemilik = "DPM";
      else if (pUpper.includes("BOYKE") || pUpper.includes("YBD")) pemilik = "Pak Boyke";
      else if (pUpper.includes("DPSA")) pemilik = "DPSA";
      else pemilik = rawPemilik;
    } else if (dpm > 0 || rawKodeUpper.includes("/DPM/")) {
      pemilik = "DPM";
    } else if (pakBoyke > 0 || rawKodeUpper.includes("/YBD/") || rawKodeUpper.includes("BOYKE")) {
      pemilik = "Pak Boyke";
    }

    // Track sequence per (ruangan, jenisBarang) and format Kode Barang:
    // INVNT/(Pemilik)/(Singkatan Ruang).(ID Jenis Barang).(No Urut)/(Tahun Perolehan)/
    // Example: INVNT/DPSA/R.S.M.1.1/2020/
    const seqKey = `${ruangan.toLowerCase()}__${namaKey}`;
    const nextSeq = (itemSequenceMap.get(seqKey) || 0) + 1;
    itemSequenceMap.set(seqKey, nextSeq);

    const pUpper = pemilik.toUpperCase();
    const codePrefix = pUpper.includes("DPM")
      ? "DPM"
      : pUpper.includes("BOYKE") || pUpper.includes("YBD")
      ? "YBD"
      : pUpper.includes("DPSA")
      ? "DPSA"
      : pemilik.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "DPSA";

    let roomAbbr = buildRoomAbbreviation(ruangan);
    if ((!ruangan || ruangan === "-") && rawKode && rawKode !== "-") {
      const codeParts = rawKode.split("/").filter(Boolean);
      if (codeParts.length >= 3) {
        const seg = codeParts[2].trim();
        const extractedPrefix =
          codeParts.length >= 5
            ? seg.replace(/\.\d+$/, "")
            : seg.replace(/\.\d+\.\d+$/, "").replace(/\.\d+$/, "");
        if (extractedPrefix && /^[A-Za-z]/.test(extractedPrefix)) {
          roomAbbr = extractedPrefix.toUpperCase();
        }
      }
    }

    const yearMatch =
      String(tahunPerolehan || "").match(/\d{4}/) ||
      String(rawKode || "").match(/\b(19\d{2}|20\d{2})\b/);
    const cleanYear = yearMatch ? yearMatch[0] : String(new Date().getFullYear());

    const effectiveDivisi = activeDivisi || (rawKodeUpper.includes("SORA") ? "PT SORAJATI" : "DPSA");
    const kodeBarang = formatInventoryKodeBarang(
      {
        ruangan,
        namaBarang,
        jenisBarang,
        tahunPerolehan: cleanYear,
        pemilik,
        divisi: effectiveDivisi,
      },
      itemMasterId,
      nextSeq,
      roomAbbr,
      effectiveDivisi
    );

    const totalHargaPerolehan =
      rawTotalHargaCol > 0
        ? rawTotalHargaCol
        : dpsa + dpm + pakBoyke > 0
        ? dpsa + dpm + pakBoyke
        : totalCalc;

    // Keep dpsa, dpm, pakBoyke synced with pemilik & totalHargaPerolehan so Overview dashboard stays accurate
    if (pemilik.toUpperCase().includes("DPM")) {
      dpm = totalHargaPerolehan;
      dpsa = 0;
      pakBoyke = 0;
    } else if (pemilik.toUpperCase().includes("BOYKE") || pemilik.toUpperCase().includes("YBD")) {
      pakBoyke = totalHargaPerolehan;
      dpsa = 0;
      dpm = 0;
    } else {
      dpsa = totalHargaPerolehan;
      dpm = 0;
      pakBoyke = 0;
    }

    const keterangan = formatMultilineText(
      getVal("keterangan", "keteranganletak", "letak", "pengguna", "user"),
      "-"
    );
    const kodeBarcode = kodeBarang;
    const dokumenGambar = resolveRowImage(
      getVal(
        "dokumengambar",
        "gambar",
        "foto",
        "image",
        "photo",
        "dokumentasi",
        "link",
        "linkfoto",
        "linkgambar",
        "linkgdrive",
        "gdrive",
        "googledrive",
        "linkgoogledrive",
        "drive",
        "fotobarang",
        "gambarbarang",
        "buktifisik",
        "fotofisik",
        "file",
        "urlfoto",
        "urlgambar",
        "url"
      ),
      sheetStartRow + r,
      extractedImages,
      firstSheet,
      Math.max(colCount, row.length)
    );

    totalValue += totalHargaPerolehan;

    items.push({
      ruangan,
      jenisBarang,
      kodeBarang,
      namaBarang,
      tipeUkuran: rawTipe,
      satuan,
      jumlah,
      tahunPerolehan,
      kondisi,
      hargaSatuan,
      hargaSatuanText,
      totalHargaPerolehan,
      pemilik,
      dpsa,
      dpm,
      pakBoyke,
      dokumenGambar,
      keterangan,
      kodeBarcode,
    });
  }

  if (items.length === 0) {
    throw new Error("Tidak ada data Inventory yang valid di dalam berkas Excel ini. Pastikan baris data tidak kosong.");
  }

  // Ensure colliding room abbreviations across imported locations get numbered suffixes (e.g. R.G1, R.G2, R.G3)
  const uniqueImportedRooms: { id: number; kode: string; nama: string }[] = [];
  const seenRoomNames = new Set<string>();
  items.forEach((it) => {
    const rName = String(it.ruangan || "").trim();
    if (rName && rName !== "-" && !seenRoomNames.has(rName.toLowerCase())) {
      seenRoomNames.add(rName.toLowerCase());
      uniqueImportedRooms.push({
        id: uniqueImportedRooms.length + 1,
        kode: buildRoomAbbreviation(rName),
        nama: rName,
      });
    }
  });
  const resolvedRoomCodes = resolveUniqueInventoryRoomCodes(uniqueImportedRooms);
  const roomCodeMap = new Map(
    resolvedRoomCodes.map((r) => [r.nama.toLowerCase(), r.kode])
  );
  items.forEach((it) => {
    const rName = String(it.ruangan || "").trim().toLowerCase();
    const uniqueKode = roomCodeMap.get(rName);
    if (uniqueKode && it.kodeBarang) {
      const parts = it.kodeBarang.split("/");
      if (parts.length >= 3) {
        const suffixMatch = parts[2].match(/((?:\.\d+)+)$/);
        const suffix = suffixMatch ? suffixMatch[1] : "";
        parts[2] = `${uniqueKode}${suffix}`;
        const updatedKode = parts.join("/");
        if (it.kodeBarcode === it.kodeBarang) {
          it.kodeBarcode = updatedKode;
        }
        it.kodeBarang = updatedKode;
      }
    }
  });

  return {
    items,
    sheetNames,
    summary: {
      totalRows: items.length,
      totalValue,
      withImagesCount: items.filter((i) => !!i.dokumenGambar).length,
    },
  };
}

/**
 * Generate and download standard Fix Asset Excel Template
 */
export function downloadFixAssetTemplate(): void {
  const templateData = [
    {
      "Type Barang": "PO3 - PERALATAN UMUM",
      "Jenis Barang": "Laptop",
      "Nama Barang": "Laptop Dell Latitude 5420 i7 16GB",
      "Merk": "Dell",
      "Spesifikasi": "Intel Core i7-1185G7, 16GB DDR4, SSD 512GB, Win 11 Pro",
      "Satuan": "Unit",
      "Tgl Perolehan": "15/01/2026",
      "Qty": 1,
      "Harga Perolehan": 16500000,
      "Total Perolehan": 16500000,
      "Lokasi": "Lantai 2 - IT Department",
      "Pemilik": "DPSA",
      "Keterangan": "Kondisi sangat baik, operasional harian",
      "Foto": "",
    },
    {
      "Type Barang": "PO2 - PERALATAN MESIN",
      "Jenis Barang": "Mesin Felder",
      "Nama Barang": "Mesin Felder",
      "Merk": "Hammer",
      "Spesifikasi": "Dimensi 300 x 120 x 75 cm + 10 Kursi Putar Ergonomis",
      "Satuan": "Set",
      "Tgl Perolehan": "20/01/2026",
      "Qty": 1,
      "Harga Perolehan": 18500000,
      "Total Perolehan": 18500000,
      "Lokasi": "Ruang Rapat Utama Lt. 3",
      "Pemilik": "DPSA",
      "Keterangan": "Ruang Meeting Direksi",
      "Foto": "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet["!cols"] = [
    { wch: 26 }, // Type Barang
    { wch: 18 }, // Jenis Barang
    { wch: 35 }, // Nama Barang
    { wch: 14 }, // Merk
    { wch: 45 }, // Spesifikasi
    { wch: 10 }, // Satuan
    { wch: 16 }, // Tgl Perolehan
    { wch: 8 },  // Qty
    { wch: 18 }, // Harga Perolehan
    { wch: 18 }, // Total Perolehan
    { wch: 26 }, // Lokasi
    { wch: 12 }, // Pemilik
    { wch: 35 }, // Keterangan
    { wch: 25 }, // Foto
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Fix Assets");
  XLSX.writeFile(workbook, "Template_Import_Fix_Asset_PT_DPSA.xlsx");
}

/**
 * Generate and download standard Inventory Excel Template
 */
export function downloadInventoryTemplate(): void {
  const templateData = [
    {
      "No": 1,
      "Ruangan": "Studio",
      "Kode Barang": "INVNT/DPSA/R.S.1/2020/1",
      "Nama Barang": "Komputer",
      "Tipe/Ukuran": "Monitor: Samsung (I7)\nCPU: DST\nUPS: Prolink",
      "Satuan/kemasan terkecil": "Set",
      "Jumlah": 1,
      "Tahun Perolehan": "2024\n2019\n2019",
      "Kondisi": "Baik\nBaik\nBaik",
      "Harga Satuan": "1.265.000\n5.350.000\n595.000",
      "Total Harga Perolehan": 7210000,
      "PEMILIKAN": "DPSA",
      "Dokumen Gambar": "",
      "Keterangan": "flo",
    },
    {
      "No": 2,
      "Ruangan": "Studio",
      "Kode Barang": "INVNT/DPM/R.S.8/2009/4",
      "Nama Barang": "Credensa",
      "Tipe/Ukuran": "0,81*0,61*0,71",
      "Satuan/kemasan terkecil": "Unit",
      "Jumlah": 1,
      "Tahun Perolehan": "2009",
      "Kondisi": "Baik",
      "Harga Satuan": 1450000,
      "Total Harga Perolehan": 1450000,
      "PEMILIKAN": "DPM",
      "Dokumen Gambar": "",
      "Keterangan": "Credensa Print warna biru",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet["!cols"] = [
    { wch: 26 },
    { wch: 24 },
    { wch: 45 },
    { wch: 10 },
    { wch: 8 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 22 },
    { wch: 28 },
    { wch: 26 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Assets");
  XLSX.writeFile(workbook, "Template_Import_Inventory_PT_DPSA.xlsx");
}

/**
 * Safely format image cell for Excel export so base64 strings > 32767 chars do not crash SheetJS
 */
function formatImageForExcelCell(val?: string): string {
  if (!val || val === "-") return "";
  const s = String(val).trim();
  if (s.startsWith("data:image/")) {
    return s.length > 32000 ? "[Gambar Tersimpan di Sistem]" : s;
  }
  return s;
}

/**
 * Export Fix Assets data array to an Excel (.xlsx) file
 */
export function exportFixAssetsToExcel(items: FixAssetItem[]): void {
  const rows = items.map((item, idx) => ({
    "No": idx + 1,
    "Kode Barang": item.kodeAktiva || "-",
    "Type Barang": item.typeAktiva || "-",
    "Jenis Barang": item.jenisBarang || "-",
    "Nama Barang": item.namaAktivaTetap || "-",
    "Merk": item.merk || "-",
    "Spesifikasi": item.spesifikasi || "-",
    "Satuan": item.satuan || "Unit",
    "Tgl Perolehan": item.tglPerolehan || "-",
    "Bulan": item.bulan || "-",
    "Tahun": item.tahun || 0,
    "Qty": item.qty || 1,
    "Harga Perolehan (Rp)": Number(item.hargaPerolehan) || 0,
    "Total Perolehan (Rp)": Number(item.totalPerolehan) || 0,
    "Umur (Thn)": Number(item.umurThn) || 0,
    "Umur (Bln)": Number(item.umurBln) || 0,
    "Depresiasi (Rp)": Number(item.depresiasi) || 0,
    "Akumulasi Depresiasi (Rp)": Number(item.akumulasiDepresiasi) || 0,
    "Nilai Buku (Rp)": Number(item.nilaiBuku) || 0,
    "Tahun Ke": Number(item.tahunKe) || 0,
    "Bulan Ke": Number(item.bulanKe) || 0,
    "Hasil (Bln)": Number(item.hasilBln) || 0,
    "Penyusutan / Bln": Number(item.penyusutanBln) || 0,
    "Fix Akumulasi": Number(item.fixAkumulasi) || 0,
    "Lokasi": item.lokasi || "-",
    "Keterangan": item.keterangan || "-",
    "Foto": formatImageForExcelCell(item.foto),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },  // No
    { wch: 26 }, // Kode Aktiva
    { wch: 20 }, // Type Aktiva
    { wch: 32 }, // Nama Aktiva Tetap
    { wch: 16 }, // Merk
    { wch: 38 }, // Spesifikasi
    { wch: 10 }, // Satuan
    { wch: 14 }, // Tgl Perolehan
    { wch: 14 }, // Bulan
    { wch: 10 }, // Tahun
    { wch: 8 },  // Qty
    { wch: 20 }, // Harga Perolehan
    { wch: 20 }, // Total Perolehan
    { wch: 12 }, // Umur Thn
    { wch: 12 }, // Umur Bln
    { wch: 18 }, // Depresiasi
    { wch: 22 }, // Akumulasi Depresiasi
    { wch: 20 }, // Nilai Buku
    { wch: 10 }, // Tahun Ke
    { wch: 10 }, // Bulan Ke
    { wch: 12 }, // Hasil Bln
    { wch: 18 }, // Penyusutan / Bln
    { wch: 18 }, // Fix Akumulasi
    { wch: 22 }, // Lokasi
    { wch: 28 }, // Keterangan
    { wch: 45 }, // Foto
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Fix Asset");
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Data_Fix_Asset_PT_DPSA_${dateStr}.xlsx`);
}

/**
 * Export Inventory data array to an Excel (.xlsx) file matching the spreadsheet layout
 */
export function exportInventoryToExcel(items: InventoryItem[]): void {
  const rows = items.map((item, idx) => {
    const totalHarga = getInventoryTotalHarga(item);
    const pemilik = getInventoryPemilik(item);
    const hargaSatuanCell =
      item.hargaSatuanText && item.hargaSatuanText !== "-"
        ? item.hargaSatuanText
        : Number(item.hargaSatuan) || 0;

    return {
      "No": idx + 1,
      "Kode Barang": item.kodeBarang || item.kodeBarcode || "-",
      "Lokasi": item.ruangan && item.ruangan !== "-" ? item.ruangan : "-",
      "Nama Barang": item.namaBarang || "-",
      "Jenis Barang": item.jenisBarang || extractJenisBarangFromNama(item.namaBarang) || "-",
      "Tipe/Ukuran": item.tipeUkuran || "-",
      "Satuan/kemasan terkecil": item.satuan || "Unit",
      "Jumlah": Number(item.jumlah) || 1,
      "Tahun Perolehan": item.tahunPerolehan || "-",
      "Kondisi": item.kondisi || "-",
      "Harga Satuan": hargaSatuanCell,
      "Total Harga Perolehan": totalHarga,
      "PEMILIKAN": pemilik,
      "Dokumen Gambar": formatImageForExcelCell(item.dokumenGambar),
      "Keterangan": item.keterangan || "-",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },  // No
    { wch: 18 }, // Ruangan
    { wch: 26 }, // Kode Barang
    { wch: 28 }, // Nama Barang
    { wch: 36 }, // Tipe/Ukuran
    { wch: 14 }, // Satuan
    { wch: 10 }, // Jumlah
    { wch: 16 }, // Tahun Perolehan
    { wch: 14 }, // Kondisi
    { wch: 18 }, // Harga Satuan
    { wch: 22 }, // Total Harga Perolehan
    { wch: 16 }, // PEMILIKAN
    { wch: 45 }, // Dokumen Gambar
    { wch: 28 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inventory");
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Data_Inventory_PT_DPSA_${dateStr}.xlsx`);
}
