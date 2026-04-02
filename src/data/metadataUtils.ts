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
