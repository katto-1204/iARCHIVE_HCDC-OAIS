// ═══════════════════════════════════════════════════════════════════════════════
// iArchive — Metadata Computation Utilities
// ═══════════════════════════════════════════════════════════════════════════════

import {
  COMBINED_FIELDS,
  ISADG_FIELDS,
  DUBLIN_CORE_FIELDS,
  ESSENTIAL_FIELDS,
  ISADG_AREAS,
  type ArchivalMaterial,
  type MetadataFieldDef,
} from "./sampleData";

/** Check if a field value is considered "filled" */
function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

/** Get the value of a metadata field from a material */
export function getFieldValue(material: ArchivalMaterial, fieldKey: string): string | null {
  return (material as any)[fieldKey] ?? null;
}

/** Count filled fields from a given field set */
function countFilled(material: ArchivalMaterial, fields: MetadataFieldDef[]): number {
  // Deduplicate by fieldKey to avoid counting shared fields twice
  const uniqueKeys = [...new Set(fields.map(f => f.fieldKey))];
  return uniqueKeys.filter(key => isFilled(getFieldValue(material, key))).length;
}

/** Count unique field keys in a field set */
function uniqueFieldCount(fields: MetadataFieldDef[]): number {
  return new Set(fields.map(f => f.fieldKey)).size;
}

/** Overall completion % across all 36 combined fields */
export function computeCompletion(material: ArchivalMaterial): number {
  const total = uniqueFieldCount(COMBINED_FIELDS);
  const filled = countFilled(material, COMBINED_FIELDS);
  return Math.round((filled / total) * 100);
}

/** ISAD(G) completion % (26 fields) */
export function computeISADGCompletion(material: ArchivalMaterial): number {
  const total = uniqueFieldCount(ISADG_FIELDS);
  const filled = countFilled(material, ISADG_FIELDS);
  return Math.round((filled / total) * 100);
}

/** Dublin Core completion % (15 fields) */
export function computeDCCompletion(material: ArchivalMaterial): number {
  const total = uniqueFieldCount(DUBLIN_CORE_FIELDS);
  const filled = countFilled(material, DUBLIN_CORE_FIELDS);
  return Math.round((filled / total) * 100);
}

/** Per-area completion % for a specific ISAD(G) area (1-7) */
export function computeAreaCompletion(material: ArchivalMaterial, areaNumber: number): number {
  const areaFields = ISADG_FIELDS.filter(f => f.area === areaNumber);
  if (areaFields.length === 0) return 0;
  const total = uniqueFieldCount(areaFields);
  const filled = countFilled(material, areaFields);
  return Math.round((filled / total) * 100);
}

/** Get essential fields status (the 6 required ISAD(G) fields) */
export function getEssentialFieldsStatus(material: ArchivalMaterial): Array<{
  field: MetadataFieldDef;
  filled: boolean;
  value: string | null;
}> {
  return ESSENTIAL_FIELDS.map(field => ({
    field,
    filled: isFilled(getFieldValue(material, field.fieldKey)),
    value: getFieldValue(material, field.fieldKey),
  }));
}

/** Get completion category */
export function getCompletionCategory(pct: number): "complete" | "partial" | "incomplete" {
  if (pct >= 100) return "complete";
  if (pct >= 50) return "partial";
  return "incomplete";
}

/** Color for completion percentage */
export function getCompletionColor(pct: number): string {
  if (pct >= 100) return "#10B981"; // green
  if (pct >= 50) return "#F59E0B";  // amber
  return "#EF4444";                  // red
}

/** Heatmap color for field coverage */
export function getHeatmapColor(pct: number): string {
  if (pct >= 100) return "#10B981";
  if (pct >= 67) return "#F59E0B";
  if (pct >= 33) return "#FCA5A5";
  return "#D1D5DB";
}

/** Check OAIS compliance (all 6 essential fields must be filled) */
export function checkOAISCompliance(material: ArchivalMaterial): boolean {
  return getEssentialFieldsStatus(material).every(s => s.filled);
}

/** Compute field coverage across all materials (what % of materials have each field filled) */
export function computeFieldCoverage(materials: ArchivalMaterial[]): Array<{
  field: MetadataFieldDef;
  percentage: number;
  filledCount: number;
  totalCount: number;
}> {
  if (materials.length === 0) return [];

  return COMBINED_FIELDS.map(field => {
    const filledCount = materials.filter(m => isFilled(getFieldValue(m, field.fieldKey))).length;
    return {
      field,
      percentage: Math.round((filledCount / materials.length) * 100),
      filledCount,
      totalCount: materials.length,
    };
  });
}

/** Compute per-area breakdown for a material */
export function computeAreaBreakdown(material: ArchivalMaterial): Array<{
  area: typeof ISADG_AREAS[number];
  completion: number;
  filled: number;
  total: number;
}> {
  return ISADG_AREAS.map(area => {
    const areaFields = ISADG_FIELDS.filter(f => f.area === area.number);
    const total = uniqueFieldCount(areaFields);
    const filled = countFilled(material, areaFields);
    return {
      area,
      completion: total > 0 ? Math.round((filled / total) * 100) : 0,
      filled,
      total,
    };
  });
}

/** Get all field values for a material with status */
export function getAllFieldValues(material: ArchivalMaterial): Array<{
  field: MetadataFieldDef;
  value: string | null;
  filled: boolean;
}> {
  return COMBINED_FIELDS.map(field => ({
    field,
    value: getFieldValue(material, field.fieldKey),
    filled: isFilled(getFieldValue(material, field.fieldKey)),
  }));
}

/** Generate a simple barcode SVG string for a unique ID */
export function generateBarcodeBars(uniqueId: string): number[] {
  // Simple Code128-style visual — convert each character to a bar pattern
  const bars: number[] = [];
  for (let i = 0; i < uniqueId.length; i++) {
    const code = uniqueId.charCodeAt(i);
    // Generate a deterministic pattern based on char code
    bars.push(code % 4 + 1); // bar width 1-4
    bars.push((code % 3) + 1); // gap width 1-3
  }
  // Add start/stop bars
  bars.unshift(2, 1, 1, 1);
  bars.push(2, 1, 1, 2);
  return bars;
}

/** Aggregate stats for dashboard metric cards */
export function computeDashboardStats(materials: ArchivalMaterial[]) {
  const completions = materials.map(m => computeCompletion(m));
  const fullyDescribed = completions.filter(c => c >= 100).length;
  const avgCompletion = materials.length > 0
    ? Math.round(completions.reduce((a, b) => a + b, 0) / materials.length)
    : 0;
  
  const essentialCompliance = materials.length > 0
    ? Math.round((materials.filter(m => checkOAISCompliance(m)).length / materials.length) * 100)
    : 0;

  return {
    totalMaterials: materials.length,
    fullyDescribed,
    essentialCompliance,
    avgCompletion,
  };
}

/** Download metadata as a clean and organized Excel file */
export function downloadMetadataExcel(material: ArchivalMaterial) {
  const ExcelJS = (window as any).ExcelJS;
  const saveAs = (window as any).saveAs;
  
  if (!ExcelJS || !saveAs) {
    // Fallback to simple CSV if script not loaded
    return downloadMetadataCSV(material);
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Archival Metadata', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2, activePane: 'bottomLeft' }]
  });

  // 0. Column Definitions (Widths)
  worksheet.columns = [
    { header: 'FIELD CODE', key: 'code', width: 15 },
    { header: 'FIELD NAME', key: 'name', width: 35 },
    { header: 'STANDARD', key: 'standard', width: 15 },
    { header: 'CONTENT', key: 'content', width: 90 }
  ];

  // 1. Title Banner (Row 1)
  const titleRow = worksheet.getRow(1);
  titleRow.height = 30;
  worksheet.mergeCells('A1:D1');
  titleRow.getCell(1).value = `iArchive Digital Archival Record | ${material.title}`;
  titleRow.getCell(1).font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12, name: 'Calibri' };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1628' } };
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Column Headers (Row 2) - overwrite headers added by columns def
  const headerRow = worksheet.getRow(2);
  headerRow.height = 20;
  ['FIELD CODE', 'FIELD NAME', 'STANDARD', 'CONTENT'].forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4682B4' } }; // Steel Blue
    cell.alignment = { vertical: 'middle', horizontal: h === 'CONTENT' ? 'left' : 'center' };
  });

  // 3. Organization Helper Functions
  let currentRowIndex = 3;
  const addDivider = (text: string) => {
    const row = worksheet.getRow(currentRowIndex++);
    worksheet.mergeCells(`A${row.number}:D${row.number}`);
    const cell = row.getCell(1);
    cell.value = text;
    cell.font = { bold: true, size: 10, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } }; // Warm Gold
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    row.height = 22;
  };

  const addDataRow = (fieldDef: any, value: string, rowIndex: number) => {
    const row = worksheet.getRow(currentRowIndex++);
    const isEven = rowIndex % 2 === 0;
    const bgColor = isEven ? 'FFF0F8FF' : 'FFFFFFFF'; // Soft Pale Blue vs White
    
    // Field Code (Col A)
    const cellA = row.getCell(1);
    cellA.value = fieldDef.code;
    cellA.font = { bold: true, color: { argb: 'FF0A1628' }, name: 'Calibri', size: 10 };
    cellA.alignment = { vertical: 'middle', horizontal: 'center' };
    cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };

    // Field Name (Col B)
    const cellB = row.getCell(2);
    cellB.value = fieldDef.name;
    cellB.font = { name: 'Calibri', size: 10 };
    cellB.alignment = { vertical: 'middle' };
    cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };

    // Standard (Col C)
    const cellC = row.getCell(3);
    cellC.value = fieldDef.standard === 'Both' ? 'Mixed' : fieldDef.standard === 'Dublin Core' ? 'DC' : fieldDef.standard;
    cellC.font = { italic: true, color: { argb: 'FF5F9EA0' }, name: 'Calibri', size: 10 };
    cellC.alignment = { vertical: 'middle', horizontal: 'center' };
    cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };

    // Content (Col D)
    const cellD = row.getCell(4);
    cellD.value = value;
    cellD.font = { name: 'Calibri', size: 10 };
    cellD.alignment = { vertical: 'middle', wrapText: true };
    cellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  };

  // 4. Populate ISAD(G) Section
  addDivider('--- ISAD(G) ARCHIVAL DESCRIPTION STANDARDS ---');
  let counter = 0;
  COMBINED_FIELDS.filter(f => f.standard === "ISAD(G)" || f.standard === "Both").forEach(f => {
    addDataRow(f, (material as any)[f.fieldKey] || "-", counter++);
  });

  // 5. Populate Dublin Core Section
  addDivider('--- DUBLIN CORE METADATA STANDARDS ---');
  counter = 0;
  COMBINED_FIELDS.filter(f => f.standard === "Dublin Core").forEach(f => {
    addDataRow(f, (material as any)[f.fieldKey] || "-", counter++);
  });

  // 6. Footer Layout
  const footerRow = worksheet.getRow(currentRowIndex++);
  worksheet.mergeCells(`A${footerRow.number}:D${footerRow.number}`);
  const footerCell = footerRow.getCell(1);
  footerCell.value = `© HOLY CROSS OF DAVAO COLLEGE ARCHIVES | GENERATED BY iARCHIVE SYSTEM ON ${new Date().toLocaleDateString()}`;
  footerCell.font = { size: 9, bold: true, color: { argb: 'FF0A1628' }, italic: true, name: 'Calibri' };
  footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } }; // Light Blue
  footerCell.alignment = { vertical: 'middle', horizontal: 'center' };
  footerRow.height = 20;

  // 7. Generate & Save
  workbook.xlsx.writeBuffer().then((buffer: any) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `metadata_${material.uniqueId || "record"}.xlsx`);
  });
}

/** Download metadata as a CSV file */
export function downloadMetadataCSV(material: ArchivalMaterial) {
  const headers = ["Field Code", "Field Name", "Standard", "Value"];
  
  const rows = COMBINED_FIELDS.map(f => {
    const value = (material as any)[f.fieldKey] || "";
    // Basic CSV escaping: quote values and escape existing quotes
    const escapedValue = `"${String(value).replace(/"/g, '""')}"`;
    return [f.code, f.name, f.standard, escapedValue].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `metadata_${material.uniqueId || material.id}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
