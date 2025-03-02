import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceData } from '../types';

export const generateInvoicePDF = (invoiceData: InvoiceData) => {
  const doc = new jsPDF();
  
  doc.setProperties({
    title: `Invoice ${invoiceData.invoiceNumber}`,
    subject: 'Invoice',
    author: invoiceData.fromName,
    keywords: 'invoice, payment',
    creator: 'Invoice Generator App'
  });
  
  const accentColor = [153, 0, 0];
  
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`NO: ${invoiceData.invoiceNumber}`, 14, 15);
  doc.text(`Date: ${invoiceData.invoiceDate}`, 14, 21);
  
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text('INVOICE', 105, 50, { align: 'center' });
  
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.8);
  doc.line(85, 54, 125, 54);
  
  doc.setTextColor(50, 50, 50);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed to:', 14, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoiceData.billedToCompanyName, 14, 76);
  doc.text(invoiceData.billedToAddress, 14, 82);
  doc.text(`Company ID: ${invoiceData.billedToCompanyId}`, 14, 88);
  doc.text(`VAT: ${invoiceData.billedToVat}`, 14, 94);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 120, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoiceData.fromName, 120, 76);
  doc.text(invoiceData.fromAddress, 120, 82);
  doc.text(`VAT: ${invoiceData.fromVat}`, 120, 88);
  
  const tableColumn = ["Item", "Quantity", "Price", "Amount"];
  const tableRows = invoiceData.items.map(item => [
    item.description,
    item.quantity,
    item.price,
    item.amount
  ]);
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 105,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: [...accentColor], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });
  
  const total = invoiceData.items.reduce((sum, item) => {
    const amount = Number(item.amount.replace(/\./g, "").replace(/[^0-9-]/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const formattedTotal = `IDR ${total.toLocaleString('id-ID')}`;
  
  
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  autoTable(doc, {
    body: [['', '', 'Total', formattedTotal]],
    startY: finalY + 1,
    theme: 'grid',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30 },
      2: { 
        cellWidth: 40, 
        halign: 'right', 
        fontStyle: 'bold',
        fillColor: [240, 240, 240]
      },
      3: { 
        cellWidth: 40, 
        halign: 'right', 
        fontStyle: 'bold',
        fillColor: [240, 240, 240]
      }
    },
  });
  
  return doc;
};
