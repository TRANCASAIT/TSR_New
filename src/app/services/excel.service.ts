import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';

import { JwtService } from './jwt.service';
import * as fs from 'file-saver';
@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  uname: string = '';
  date: Date = new Date();
  lang: string = '';

  constructor(private jwt: JwtService) {}

  downloadExcel(dataExcel: any): void {
    this.uname = this.jwt.getUserName();
    const nameDocument = `tsr_report_${this.date.toISOString()}.xlsx`;

    const workbook = new Workbook();
    workbook.creator = this.uname;
    this._createTsrTable(workbook, dataExcel);

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data]);
      fs.saveAs(blob, nameDocument);
      // Explicitly release the workbook reference
      workbook.removeWorksheet('tsr_report');
    }).catch((error) => {
      console.error('Error generating Excel file:', error);
    });
  }

  private _createTsrTable(workbook: Workbook, dataSet: any): void {
    const sheet = workbook.addWorksheet('tsr_report');
    sheet.columns = Array(19).fill({ width: 21, alignment: { vertical: 'middle', wrapText: true } });

    const titleCell = sheet.getCell('C2');
    titleCell.value = 'Reporte de solicitudes';
    titleCell.style.font = { bold: true, size: 22 };

    const headerRow = sheet.getRow(4);
    headerRow.values = [
      'Folio',
      'Referencia',
      'Cliente',
      'Caja',
      'Operacion',
      'Stop',
      'Creacion',
      'TMW',
      'Estatus',
      'Entry/Manifiesto',
      'ACE',
      'Layout',
      'Layout Aceptado',
      'Aceptado Por',
      'Folio Fiscal',
      'Num. Carta Porte',
      'XML',
      'PDF Original',
      'PDF Operacional'
    ];
    headerRow.font = { bold: true, size: 12 };

    for (let index = 0; index < dataSet.length; index++) {
      const row = sheet.getRow(index + 5);
      const itemData = dataSet[index];

      row.values = [
        itemData.serviceRequestId,
        itemData.reference,
        itemData.customerName,
        itemData.boxNumber,
        itemData.operationTypeName,
        itemData.stopNumber,
        itemData.createdAt,
        itemData.tmwOrder,
        itemData.statusDescription,
        itemData.inward,
        itemData.ace,
        itemData.layout,
        itemData.layoutAccepteddtm,
        itemData.acceptedBy,
        itemData.uuid,
        itemData.consignmentNote,
        itemData.xml,
        itemData.originalPdf,
        itemData.operationsPdf
      ];
    }
  }
}
