import { randomUUID } from "crypto";

export function generateId(): string {
  return randomUUID();
}

export function generateMaterialId(categoryNo: number, sequentialNo: number): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const catPadded = categoryNo.toString().padStart(2, "0");
  const seqPadded = sequentialNo.toString().padStart(7, "0");
  return `${year}iA${catPadded}${seqPadded}`;
}
