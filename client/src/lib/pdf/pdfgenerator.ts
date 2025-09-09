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
    hsn: string;
    qty: number;
    rate: number;
  }[];
  subTotal: number;
  taxBreakup: { label: string; pct: number; amount: number }[];
  total: number;
  totalInWords: string;
  notes: string;
  terms: string;
  logo?: string; // base64 logo (PNG/JPEG)
};

// helper: auto-wrap text + page break
function addTextWithWrap(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 6
) {
  const split = doc.splitTextToSize(text, maxWidth);
  const pageHeight = doc.internal.pageSize.height;

  let cursorY = y;
  split.forEach((line: string | string[]) => {
    if (cursorY + lineHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = 20; // top margin
    }
    doc.text(line, x, cursorY);
    cursorY += lineHeight;
  });

  return cursorY;
}

export function generatePDF(data: SalesPDFData) {
  const doc = new jsPDF("p", "mm", "a4");

  const logoWidth = 40;
  const logoHeight = 40;
  const marginTop = 10;
  const marginLeft = 14;

  // Logo
  if (data.logo) {
    doc.addImage(data.logo, "PNG", marginLeft, marginTop, logoWidth, logoHeight);
  }

  // Title + Quote No
  const rightBlockX = 210 - marginLeft - 80;
  doc.setFontSize(18);
  doc.text(data.title, rightBlockX, marginTop + 15, { align: "left" });

  doc.setFontSize(12);
  doc.text(`${data.title} No: ${data.documentNumber}`, rightBlockX, marginTop + 30, { align: "left" });


  // Divider
  doc.setLineWidth(0.5);
  doc.line(marginLeft, marginTop + logoHeight + 5, 210 - marginLeft, marginTop + logoHeight + 5);

  // Company details
  let yStart = marginTop + logoHeight + 15;
  doc.setFontSize(12);
  doc.text("GLONIX ELECTRONICS PRIVATE LIMITED", marginLeft, yStart);
  doc.setFontSize(10);
  doc.text("Plot No.54, 2nd Floor, Door No.SF1,", marginLeft, yStart + 6);
  doc.text("Anna nagar 2nd Street, Tansi nagar, Velachery,", marginLeft, yStart + 11);
  doc.text("Chennai - 600 042.", marginLeft, yStart + 16);
  doc.text("GSTIN : 33AAHCGO729N2ZG", marginLeft, yStart + 21);

  // doc details
  yStart += 35;
  doc.setFontSize(11);
  doc.text(`${data.title} : ${data.documentDate}`, 150, yStart);

  // Bill To / Ship To
  yStart += 10;
  doc.setFontSize(12);
  doc.text("Bill To", marginLeft, yStart);
  doc.text("Ship To", 110, yStart);

  doc.setFontSize(10);
  doc.text(data.billTo, marginLeft, yStart + 6, { maxWidth: 80 });
  doc.text(data.shipTo, 110, yStart + 6, { maxWidth: 80 });

  // Place of supply
  yStart += 40;
  doc.setFontSize(10);
  doc.text(`Place Of Supply: ${data.placeOfSupply}`, marginLeft, yStart);

  // Items table
  autoTable(doc, {
    startY: yStart + 10,
    head: [["#", "Item & Description", "Qty", "Rate", "Amount"]],
    body: data.items.map((i, idx) => [
      idx + 1,
      i.name,
      i.qty.toFixed(2),
      i.rate.toFixed(2),
      (i.qty * i.rate).toFixed(2),
    ]),
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [46, 125, 50] },
  });

  let finalY = (doc as any).lastAutoTable.finalY || yStart + 20;
  const pageHeight = doc.internal.pageSize.height;

  // Totals
  doc.setFontSize(11);
  if (finalY + 10 > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }
  doc.text(`Sub Total: ${data.subTotal.toFixed(2)}`, 150, finalY + 10);

  data.taxBreakup.forEach((t, i) => {
    let y = finalY + 20 + i * 10;
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${t.label} (${t.pct}%): ${t.amount.toFixed(2)}`, 150, y);
    finalY = y;
  });

  doc.setFontSize(12);
  if (finalY + 20 > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }
  doc.text(`Total INR ${data.total.toFixed(2)}`, 150, finalY + 20);
  finalY += 20;

  // Total in words
  doc.setFontSize(10);
  finalY = addTextWithWrap(doc, `Total In Words: ${data.totalInWords}`, marginLeft, finalY + 10, 180);

  // Notes
  doc.setFontSize(11);
  finalY = addTextWithWrap(doc, "Notes", marginLeft, finalY + 10, 180);
  doc.setFontSize(10);
  finalY = addTextWithWrap(doc, data.notes || "-", marginLeft, finalY + 6, 180);

  // Bank details
  doc.setFontSize(11);
  finalY = addTextWithWrap(doc, "Bank Details:", marginLeft, finalY + 10, 180);
  doc.setFontSize(10);
  finalY = addTextWithWrap(doc, "NAME : GLONIX ELECTRONICS PRIVATE LIMITED", marginLeft, finalY + 2, 180);
  finalY = addTextWithWrap(doc, "AC NO : 611905056215", marginLeft, finalY + 2, 180);
  finalY = addTextWithWrap(doc, "BANK : ICICI BANK", marginLeft, finalY + 2, 180);
  finalY = addTextWithWrap(doc, "BRANCH : SALEM MAIN BRANCH", marginLeft, finalY + 2, 180);
  finalY = addTextWithWrap(doc, "IFSC : ICIC0006119", marginLeft, finalY + 2, 180);
  finalY = addTextWithWrap(doc, "Swift code: ICICINBBCTS", marginLeft, finalY + 2, 180);

  // Terms
  doc.setFontSize(11);
  finalY = addTextWithWrap(doc, "Terms & Conditions", marginLeft, finalY + 10, 180);
  doc.setFontSize(10);
  finalY = addTextWithWrap(doc, data.terms || "-", marginLeft, finalY + 6, 180);

  // Signature
  if (finalY + 30 > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }
  doc.setFontSize(11);
  doc.text("Authorized Signature", 150, finalY + 30);

  // Save
  doc.save(`${data.title}-${data.documentNumber}.pdf`);

}

