import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { type ArchivalMaterial, COMBINED_FIELDS, ISADG_AREAS } from '../data/sampleData';
import { format } from 'date-fns';

export async function exportSingleMaterialToExcel(material: ArchivalMaterial) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'iArchive Digital Repository';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Record Details', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  // Setup Columns
  sheet.columns = [
    { key: 'code', width: 20 },
    { key: 'name', width: 40 },
    { key: 'standard', width: 15 },
    { key: 'value', width: 80 }
  ];

  // Row 1: Title Banner
  const titleRow = sheet.addRow(['ARCHIVAL DESCRIPTION RECORD']);
  sheet.mergeCells('A1:D1');
  titleRow.height = 30;
  const titleCell = sheet.getCell('A1');
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2A44' } }; // Dark navy
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 2: Headers
  const headerRow = sheet.addRow(['FIELD CODE', 'FIELD NAME', 'STANDARD', 'VALUE']);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4775B3' } }; // Steel blue
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF8FAACC' } },
      bottom: { style: 'thin', color: { argb: 'FF8FAACC' } },
      left: { style: 'thin', color: { argb: 'FF8FAACC' } },
      right: { style: 'thin', color: { argb: 'FF8FAACC' } }
    };
  });

  // Add ISAD(G) Section Divider
  const isadgDiv = sheet.addRow(['--- ISAD(G) ARCHIVAL DESCRIPTION ---']);
  sheet.mergeCells(`A${isadgDiv.number}:D${isadgDiv.number}`);
  const isadgCell = sheet.getCell(`A${isadgDiv.number}`);
  isadgCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
  isadgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF3D0' } }; // Gold background
  isadgCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Track row number for alternating colors
  let dataRowIndex = 0;

  const addDataRow = (code: string, name: string, standard: string, value: string) => {
    const row = sheet.addRow([code, name, standard, value]);
    const isAlternating = dataRowIndex % 2 !== 0;
    const bgColor = isAlternating ? 'FFF4f8FC' : 'FFFFFFFF'; // Pale blue / white

    // Field Code
    const cellA = row.getCell(1);
    cellA.font = { name: 'Calibri', size: 10, bold: true };
    cellA.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Field Name
    const cellB = row.getCell(2);
    cellB.font = { name: 'Calibri', size: 10 };
    cellB.alignment = { vertical: 'middle' };

    // Standard
    const cellC = row.getCell(3);
    cellC.font = { name: 'Calibri', size: 10, italic: true };
    cellC.alignment = { horizontal: 'center', vertical: 'middle' };

    // Value
    const cellD = row.getCell(4);
    cellD.font = { name: 'Calibri', size: 10 };
    cellD.alignment = { vertical: 'top', wrapText: true };

    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9E2EE' } },
        bottom: { style: 'thin', color: { argb: 'FFD9E2EE' } },
        left: { style: 'thin', color: { argb: 'FFD9E2EE' } },
        right: { style: 'thin', color: { argb: 'FFD9E2EE' } }
      };
    });

    dataRowIndex++;
  };

  // Populate ISAD(G) fields
  const isadgFields = COMBINED_FIELDS.filter(f => f.standard === 'ISAD(G)' || f.standard === 'Both');
  for (const field of isadgFields) {
    const value = (material[field.id as keyof ArchivalMaterial] || '') as string;
    addDataRow(field.code, field.name, field.standard, value);
  }

  // Add Dublin Core Section Divider
  const dcDiv = sheet.addRow(['--- DUBLIN CORE METADATA ---']);
  sheet.mergeCells(`A${dcDiv.number}:D${dcDiv.number}`);
  const dcCell = sheet.getCell(`A${dcDiv.number}`);
  dcCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
  dcCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF3D0' } }; // Gold background
  dcCell.alignment = { horizontal: 'center', vertical: 'middle' };

  dataRowIndex = 0; // reset for alternating rows

  // Populate Dublin Core only fields
  const dcFields = COMBINED_FIELDS.filter(f => f.standard === 'Dublin Core');
  for (const field of dcFields) {
    const value = (material[field.id as keyof ArchivalMaterial] || '') as string;
    addDataRow(field.code, field.name, field.standard, value);
  }

  // Footer
  const footerRow = sheet.addRow([`iArchive Digital Repository • Holy Cross of Davao College • Generated: ${format(new Date(), 'yyyy-MM-dd')}`]);
  sheet.mergeCells(`A${footerRow.number}:D${footerRow.number}`);
  footerRow.height = 20;
  const footerCell = sheet.getCell(`A${footerRow.number}`);
  footerCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF5A7394' } };
  footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6ECF5' } }; // Light blue footer
  footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `metadata_${material.referenceCode || material.uniqueId}.xlsx`);
}
