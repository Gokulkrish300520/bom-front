import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SalesPDFData = {
  title: string;
  documentNumber: string;
  documentDate: string;
  expiryDate: string;
  customerName: string;
  billTo: string;
  shipTo: string;
  placeOfSupply: string;
  items: {
    name: string;
    hsn?: string;
    qty: number;
    rate: number;
    sales_description?: string;
  }[];
  subTotal: number;
  taxBreakup: { label: string; pct: number; amount: number }[];
  total: number;
  totalInWords: string;
  notes: string;
  terms: string;
  logo?: string; // base64 logo (PNG/JPEG)
};

const LOGO_BASE64 = "logo_url"; // Replace with your actual base64 logo

function addCommonHeader(doc: jsPDF, data: SalesPDFData, docTitle: string) {
  const logoWidth = 40;
  const logoHeight = 40;
  const marginTop = 10;
  const marginLeft = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Reset cursor to top of the page
  let yPosition = marginTop;

  // Logo
  doc.addImage(LOGO_BASE64, "PNG", marginLeft, yPosition, logoWidth, logoHeight);

  // Company Details
  yPosition += logoHeight + 5;
  doc.setFontSize(12);
  doc.text("GLONIX ELECTRONICS PRIVATE LIMITED", marginLeft, yPosition);
  doc.setFontSize(10);
  doc.text("Plot No.54, 2nd Floor, Door No.SF1,", marginLeft, yPosition + 6);
  doc.text("Anna nagar 2nd Street, Tansi nagar, Velachery,", marginLeft, yPosition + 11);
  doc.text("Chennai - 600 042.", marginLeft, yPosition + 16);
  doc.text("GSTIN : 33AAHCGO729N2ZG", marginLeft, yPosition + 21);

  // Title + Quote No + Dates
  const rightBlockX = pageWidth - marginLeft;
  doc.setFontSize(18);
  doc.text(docTitle, rightBlockX, marginTop + 15, { align: "right" });
  doc.setFontSize(12);
  doc.text(`${docTitle} No: ${data.documentNumber}`, rightBlockX, marginTop + 25, { align: "right" });
  doc.text(`${docTitle} Date: ${data.documentDate}`, rightBlockX, marginTop + 32, { align: "right" });
  
  // Divider
  doc.setLineWidth(0.5);
  doc.line(marginLeft, marginTop + logoHeight + 5, pageWidth - marginLeft, marginTop + logoHeight + 5);

  // Bill To / Ship To
  yPosition += 35;
  doc.setFontSize(12);
  doc.text("Bill To", marginLeft, yPosition);
  doc.text("Ship To", pageWidth / 2, yPosition);

  doc.setFontSize(10);
  doc.text(data.billTo, marginLeft, yPosition + 6, { maxWidth: pageWidth / 2 - marginLeft * 2 });
  doc.text(data.shipTo, pageWidth / 2, yPosition + 6, { maxWidth: pageWidth / 2 - marginLeft * 2 });

  // Place of supply
  yPosition += 40;
  doc.setFontSize(10);
  doc.text(`Place Of Supply: ${data.placeOfSupply}`, marginLeft, yPosition);

  return yPosition;
}

export function generatePDF(data: SalesPDFData) {
  const doc = new jsPDF("p", "mm", "a4");
  const marginLeft = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  // Set initial Y position after the header
  let finalY = addCommonHeader(doc, data, data.title) + 10;

  autoTable(doc, {
    startY: finalY,
    head: [["#", "Item & Description", "HSN/SAC", "Qty", "Rate", "Amount"]],
    body: data.items.map((i, idx): any[] => [
      { content: (idx + 1).toString() },
      {
        content: [
          i.name.toUpperCase(),
          i.sales_description || "",
        ].filter(line => line.length > 0),
      },
      { content: i.hsn || "-" },
      { content: i.qty.toFixed(2) },
      { content: i.rate.toFixed(2) },
      { content: (i.qty * i.rate).toFixed(2) },
    ]),
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [46, 125, 50] },
    tableWidth: "auto",
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 80, cellPadding: 4 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30, halign: 'right' },
    },
    // Hook to add header on every page
    didDrawPage: (hookData) => {
        if (hookData.pageNumber > 1) {
            addCommonHeader(doc, data, data.title);
            doc.text(`... continued on page ${hookData.pageNumber}`, pageWidth - marginLeft, 15, {align: "right"});
        }
    },
  });

  // Check if there is enough space for the summary section
  finalY = (doc as any).lastAutoTable.finalY;
  const summaryHeight = 10 + (data.taxBreakup.length * 10) + 15 + 10;
  if (finalY + summaryHeight > pageHeight - bottomMargin) {
    doc.addPage();
    finalY = 20; // reset y position on new page
  }

  // Totals
  doc.setFontSize(11);
  doc.text(`Sub Total: ${data.subTotal.toFixed(2)}`, 150, finalY + 10);

  data.taxBreakup.forEach((t, i) => {
    const y = finalY + 20 + i * 10;
    doc.text(`${t.label} (${t.pct}%): ${t.amount.toFixed(2)}`, 150, y);
  });

  doc.setFontSize(12);
  doc.text(`Total INR ${data.total.toFixed(2)}`, 150, finalY + 20 + data.taxBreakup.length * 10);
  finalY += 30 + data.taxBreakup.length * 10;

  // Total in words
  doc.setFontSize(10);
  let yCursor = finalY + 10;
  doc.text(`Total In Words: ${data.totalInWords}`, marginLeft, yCursor, {
    maxWidth: pageWidth - marginLeft * 2,
  });

  // Notes
  yCursor += 10;
  doc.setFontSize(11);
  yCursor = doc.splitTextToSize("Notes", pageWidth - marginLeft * 2, {
    fontSize: 11
  }).reduce((y: number, line: string) => {
    doc.text(line, marginLeft, y);
    return y + 6;
  }, yCursor);

  doc.setFontSize(10);
  yCursor = doc.splitTextToSize(data.notes || "-", pageWidth - marginLeft * 2, {
    fontSize: 10
  }).reduce((y: number, line: string) => {
    doc.text(line, marginLeft, y);
    return y + 5;
  }, yCursor + 5);

  // Bank details box with border
  yCursor += 10;
  const bankX = marginLeft;
  const bankY = yCursor;
  const bankWidth = pageWidth - marginLeft * 2;
  const bankDetails = [
    "Bank Details:",
    "NAME : GLONIX ELECTRONICS PRIVATE LIMITED",
    "AC NO : 611905056215",
    "BANK : ICICI BANK",
    "BRANCH : SALEM MAIN BRANCH",
    "IFSC : ICIC0006119",
    "Swift code: ICICINBBCTS",
  ];
  const bankHeight = (bankDetails.length + 1) * 6; // Approx height
  doc.rect(bankX, bankY, bankWidth, bankHeight);
  bankDetails.forEach((line, index) => {
    doc.setFontSize(index === 0 ? 11 : 10);
    doc.text(line, bankX + 3, bankY + 6 * (index + 1));
  });
  yCursor += bankHeight;

  // Terms & Conditions
  yCursor += 10;
  doc.setFontSize(11);
  yCursor = doc.splitTextToSize("Terms & Conditions", pageWidth - marginLeft * 2, {
    fontSize: 11
  }).reduce((y: number, line: string) => {
    doc.text(line, marginLeft, y);
    return y + 6;
  }, yCursor);

  doc.setFontSize(10);
  yCursor = doc.splitTextToSize(data.terms || "-", pageWidth - marginLeft * 2, {
    fontSize: 10
  }).reduce((y: number, line: string) => {
    doc.text(line, marginLeft, y);
    return y + 5;
  }, yCursor + 5);

  // Signature line with extra spacing
  const signatureY = pageHeight - 30;
  if (yCursor > signatureY) {
    doc.addPage();
    yCursor = 20; // reset y position on new page
  }
  doc.setLineWidth(0.5);
  doc.line(pageWidth - marginLeft - 50, signatureY, pageWidth - marginLeft, signatureY);
  doc.text("Authorized Signature", pageWidth - marginLeft, signatureY + 5, { align: "right" });

  doc.save(`${data.title}-${data.documentNumber}.pdf`);
}
