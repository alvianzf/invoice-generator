import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceData } from '../types';

export const generateInvoicePDF = (invoiceData: InvoiceData) => {
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: `Invoice ${invoiceData.invoiceNumber}`,
    subject: 'Invoice',
    author: invoiceData.fromName,
    keywords: 'invoice, payment',
    creator: 'Invoice Generator App'
  });
  
  // Add accent color
  const accentColor = [41, 82, 163]; // Professional blue
  
  // Add header with subtle background
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Add invoice number and date
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`NO: ${invoiceData.invoiceNumber}`, 14, 15);
  doc.text(`Date: ${invoiceData.invoiceDate}`, 14, 21);
  
  // Add divider line
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);
  
  // Add title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text('INVOICE', 105, 50, { align: 'center' });
  
  // Add subtle decorative element
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.8);
  doc.line(85, 54, 125, 54);
  
  // Reset text color for content
  doc.setTextColor(50, 50, 50);
  
  // Add billed to section with improved layout
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed to:', 14, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoiceData.billedToCompanyName, 14, 76);
  doc.text(invoiceData.billedToAddress, 14, 82);
  doc.text(`Company ID: ${invoiceData.billedToCompanyId}`, 14, 88);
  doc.text(`VAT: ${invoiceData.billedToVat}`, 14, 94);
  
  // Add from section with improved layout
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 120, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoiceData.fromName, 120, 76);
  doc.text(invoiceData.fromAddress, 120, 82);
  doc.text(`VAT: ${invoiceData.fromVat}`, 120, 88);
  
  // Add items table with improved styling
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
  
  // Calculate total
  const total = invoiceData.items.reduce((sum, item) => {
    const amount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  // Format total with currency
  const formattedTotal = `IDR ${total.toLocaleString('id-ID')}`;
  
  // Add total row with improved styling
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
  
  // Add payment details with improved layout
  const paymentY = (doc as any).lastAutoTable.finalY + 15;
  
  // Add payment details section with subtle background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, paymentY - 5, 182, 40, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text('Payment Details', 14, paymentY);
  
  // Add horizontal line under the title
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.3);
  doc.line(14, paymentY + 2, 60, paymentY + 2);
  
  // Reset text color
  doc.setTextColor(50, 50, 50);
  
  // Create a grid layout for payment details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank:', 20, paymentY + 10);
  doc.text('Account Name:', 20, paymentY + 17);
  doc.text('Account Number:', 100, paymentY + 10);
  doc.text('Swift Code:', 100, paymentY + 17);
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.bankName, 50, paymentY + 10);
  doc.text(invoiceData.accountName, 50, paymentY + 17);
  doc.text(invoiceData.accountNumber, 140, paymentY + 10);
  doc.text(invoiceData.swiftCode, 140, paymentY + 17);
  
  // Add contact information with improved styling
  const contactY = paymentY + 35;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, contactY - 5, 182, 15, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`For inquiries: ${invoiceData.contactEmail} | ${invoiceData.contactPhone}`, 105, contactY + 2, { align: 'center' });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    
    // Add subtle footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, doc.internal.pageSize.height - 15, 196, doc.internal.pageSize.height - 15);
  }
  
  return doc;
};