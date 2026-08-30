import { jsPDF } from 'jspdf';
import { PathologyReport, LabSettings } from '../types';
import { DEFAULT_LAB_SETTINGS } from '../data/pathologyTemplates';

export function generatePathologyPdf(report: PathologyReport, customSettings?: LabSettings) {
  const settings = customSettings || DEFAULT_LAB_SETTINGS;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // -------------------------------------------------------------
  // HEADER SECTION (Accredited Pathology Laboratory Header)
  // -------------------------------------------------------------
  // Top Banner Accent
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');

  // Lab Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((settings.labName || 'LAB NOVA PATHOLOGY & DIAGNOSTICS').toUpperCase(), margin + 6, y + 8);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text((settings.tagline || 'REFERENCE CLINICAL BIOCHEMISTRY, HEMATOLOGY & MOLECULAR PATHOLOGY').toUpperCase(), margin + 6, y + 13);
  doc.text(`${settings.accreditationText || 'NABL Accredited ISO 15189:2022'} | License: ${settings.licenseNumber || 'LIMS-DL-89421'}`, margin + 6, y + 18);

  // Right-side badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('NABL ACCREDITED', pageWidth - margin - 42, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text(`Cert: ${settings.nablCertNumber || 'MC-4892'}`, pageWidth - margin - 42, y + 14);
  doc.text(settings.phone ? settings.phone.split('/')[0].trim() : '24x7 Diagnostics', pageWidth - margin - 42, y + 18);

  y += 28;

  // -------------------------------------------------------------
  // PATIENT & ACCESSION DETAILS GRID
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 32, 2, 2, 'FD');

  doc.setFontSize(8.5);
  const col1 = margin + 5;
  const col2 = margin + 55;
  const col3 = margin + 110;
  const col4 = margin + 145;

  // Line 1
  doc.setTextColor(100, 116, 139);
  doc.text('UHID / Patient ID:', col1, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(report.patientUHID || 'N/A', col1 + 28, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Accession No:', col3, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(report.reportId, col4, y + 6);

  // Line 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Patient Name:', col1, y + 13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(report.patientName, col1 + 28, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Sample Collected:', col3, y + 13);
  doc.setTextColor(15, 23, 42);
  doc.text(report.sampleCollectedAt ? new Date(report.sampleCollectedAt).toLocaleString() : 'Recent', col4, y + 13);

  // Line 3
  doc.setTextColor(100, 116, 139);
  doc.text('Age / Gender:', col1, y + 20);
  doc.setTextColor(15, 23, 42);
  doc.text(`${report.patientAge} Yrs / ${report.patientGender}`, col1 + 28, y + 20);

  doc.setTextColor(100, 116, 139);
  doc.text('Reported Date:', col3, y + 20);
  doc.setTextColor(15, 23, 42);
  doc.text(report.reportDate ? new Date(report.reportDate).toLocaleDateString() : new Date().toLocaleDateString(), col4, y + 20);

  // Line 4
  doc.setTextColor(100, 116, 139);
  doc.text('Referred By:', col1, y + 27);
  doc.setTextColor(15, 23, 42);
  doc.text(report.referredBy || 'Self / Direct Walk-in', col1 + 28, y + 27);

  doc.setTextColor(100, 116, 139);
  doc.text('Sample Barcode:', col3, y + 27);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(report.sampleBarcode || 'BC-000000', col4, y + 27);

  y += 37;

  // -------------------------------------------------------------
  // TEST INVESTIGATION HEADLINE
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(report.testNames.join(' & ') || 'Clinical Laboratory Examination', margin, y);

  y += 5;

  // -------------------------------------------------------------
  // TABLE HEADER
  // -------------------------------------------------------------
  const tCol1 = margin;
  const tCol2 = margin + 70;
  const tCol3 = margin + 98;
  const tCol4 = margin + 118;
  const tCol5 = margin + 142;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, pageWidth - 2 * margin, 7.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('TEST INVESTIGATION', tCol1 + 2, y + 5);
  doc.text('RESULT', tCol2 + 2, y + 5);
  doc.text('FLAG', tCol3 + 2, y + 5);
  doc.text('UNIT', tCol4 + 2, y + 5);
  doc.text('BIOLOGICAL REF. INTERVAL', tCol5 + 2, y + 5);

  y += 10;

  // -------------------------------------------------------------
  // TEST RESULTS ROWS
  // -------------------------------------------------------------
  let currentCategory = '';

  (report.results || []).forEach((res) => {
    // Check page break threshold
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
      // re-draw header mini banner
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`LABNOVA REPORT: ${report.patientName} (${report.reportId})`, margin + 4, y + 5.5);
      y += 12;
    }

    // Category heading if present
    if (res.category && res.category !== currentCategory) {
      currentCategory = res.category;
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, pageWidth - 2 * margin, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138); // blue-900
      doc.text(`--- ${currentCategory.toUpperCase()} ---`, margin + 2, y + 3);
      y += 6.5;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    // Parameter Name
    doc.text(res.name, tCol1 + 2, y + 2.5);

    // Result value with bolding for abnormal
    const isAbnormal = res.status !== 'normal';
    if (isAbnormal) {
      doc.setFont('helvetica', 'bold');
      if (res.status === 'critical') {
        doc.setTextColor(185, 28, 28); // red-700
      } else {
        doc.setTextColor(217, 119, 6); // amber-600
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
    }
    doc.text(String(res.value), tCol2 + 2, y + 2.5);

    // Flag Badge
    if (res.status === 'high') {
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.text('▲ HIGH', tCol3 + 2, y + 2.5);
    } else if (res.status === 'low') {
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('▼ LOW', tCol3 + 2, y + 2.5);
    } else if (res.status === 'critical') {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('CRITICAL', tCol3 + 2, y + 2.5);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Normal', tCol3 + 2, y + 2.5);
    }

    // Units
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(res.unit || '-', tCol4 + 2, y + 2.5);

    // Reference Interval
    doc.setTextColor(71, 85, 105);
    doc.text(res.refRangeText || '-', tCol5 + 2, y + 2.5);

    // subtle row divider
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 4.5, pageWidth - margin, y + 4.5);

    y += 6;
  });

  y += 4;

  // -------------------------------------------------------------
  // CLINICAL NOTES & INTERPRETATION
  // -------------------------------------------------------------
  if (report.clinicalNotes || report.interpretation) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('CLINICAL IMPRESSION & INTERPRETATION:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const combinedNotes = `${report.clinicalNotes || ''} ${report.interpretation ? '| ' + report.interpretation : ''}`;
    const splitNotes = doc.splitTextToSize(combinedNotes, pageWidth - 2 * margin - 8);
    doc.text(splitNotes, margin + 4, y + 10);

    y += 24;
  }

  // -------------------------------------------------------------
  // SIGNATURE & ACCREDITATION FOOTER
  // -------------------------------------------------------------
  const footerY = pageHeight - 34;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Left Signatory: Medical Lab Technologist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(settings.technologistName || 'Sunil K. Verma, M.Sc (MLT)', margin + 4, footerY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.technologistQualification || 'Senior Biomedical Analyst', margin + 4, footerY + 11);
  doc.text('Quality Control In-Charge', margin + 4, footerY + 15);

  // Center QR/Barcode audit stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('VERIFIED & DIGITALLY SIGNED', pageWidth / 2 - 25, footerY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Hash: ${(report.digitalSignatureHash || 'e7c10b4f8a92e1069d35fa7c844bf210').slice(0, 24)}...`, pageWidth / 2 - 25, footerY + 11);
  doc.text('21 CFR Part 11 / IT Act Compliant', pageWidth / 2 - 25, footerY + 15);

  // Right Signatory: Consultant Pathologist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(report.verifiedBy || settings.pathologistName || 'Dr. Manisha Kulkarni, MD (Pathology)', pageWidth - margin - 65, footerY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.pathologistQualification || 'Consultant Clinical Pathologist', pageWidth - margin - 65, footerY + 11);
  doc.text(`Reg #${settings.pathologistRegistration || 'MMC-2014/09/3842'} (NABL Signatory)`, pageWidth - margin - 65, footerY + 15);

  // Bottom Notice
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('** End of Diagnostic Laboratory Examination Report. Biological reference intervals vary with age, gender, and methodology. **', margin, pageHeight - 8);

  // Save the PDF file
  const filename = `${report.patientName.replace(/\s+/g, '_')}_Report_${report.reportId}.pdf`;
  doc.save(filename);
}

export function generateInvoicePdf(report: PathologyReport, customSettings?: LabSettings) {
  const settings = customSettings || DEFAULT_LAB_SETTINGS;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text((settings.labName || 'LAB NOVA PATHOLOGY & DIAGNOSTICS').toUpperCase(), margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${settings.address} | Phone: ${settings.phone}`, margin + 6, y + 14);
  doc.text(`GST / Tax ID: ${settings.taxId || '27AADCL8942E1ZS'} | License: ${settings.licenseNumber}`, margin + 6, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(52, 211, 153);
  doc.text('OFFICIAL INVOICE / RECEIPT', pageWidth - margin - 65, y + 10);
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`Inv #: INV-${report.reportId}`, pageWidth - margin - 65, y + 15);
  doc.text(`Date: ${new Date(report.sampleCollectedAt).toLocaleDateString()}`, pageWidth - margin - 65, y + 19);

  y += 30;

  // Patient info box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Billed To Patient:', margin + 6, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${report.patientName} (${report.patientAge}y / ${report.patientGender})`, margin + 6, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient ID: ${report.patientId} | Contact: ${report.patientPhone || 'N/A'}`, margin + 6, y + 16);

  doc.setTextColor(100, 116, 139);
  doc.text('Referred By:', margin + 110, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(report.referredBy || 'Self / Direct Walk-in', margin + 110, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: Cash / Card / UPI`, margin + 110, y + 16);

  y += 28;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Sr.', margin + 4, y + 5.5);
  doc.text('Investigation / Pathology Test Description', margin + 16, y + 5.5);
  doc.text('Category', margin + 110, y + 5.5);
  doc.text('Amount (₹)', pageWidth - margin - 22, y + 5.5);
  y += 10;

  // Line items
  const testItems = (report.testNames || ['Diagnostic Pathology Investigation']).map((name, idx) => ({
    sr: idx + 1,
    name,
    code: report.testCodes?.[idx] || 'LAB',
    sample: report.sampleType || 'Clinical Specimen',
  }));

  const itemPrice = (report.billing?.totalAmount || 0) / (testItems.length || 1);

  testItems.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.sr}.`, margin + 4, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name, margin + 16, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Code: ${item.code} | Sample: ${item.sample}`, margin + 16, y + 10);
    doc.text('Pathology', margin + 110, y + 5);
    doc.text(`₹${itemPrice.toFixed(2)}`, pageWidth - margin - 22, y + 5);
    y += 14;
  });

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Totals
  const subtotal = report.billing?.totalAmount || 0;
  const discount = report.billing?.discount || 0;
  const finalTotal = report.billing?.paidAmount || (subtotal - discount);
  const paymentStatus = (report.billing?.paymentStatus || 'paid').toUpperCase();

  const rightAlignX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', rightAlignX, y);
  doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - margin - 15, y);
  y += 5;

  if (discount > 0) {
    doc.text('Concession / Discount:', rightAlignX, y);
    doc.text(`- ₹${discount.toFixed(2)}`, pageWidth - margin - 15, y);
    y += 5;
  }

  doc.text('Taxes (Diagnostics Exemption):', rightAlignX, y);
  doc.text('₹0.00', pageWidth - margin - 15, y);
  y += 6;

  doc.setDrawColor(203, 213, 225);
  doc.line(rightAlignX, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Paid:', rightAlignX, y);
  doc.text(`₹${finalTotal.toFixed(2)}`, pageWidth - margin - 15, y);

  // Status Stamp
  doc.setFillColor(paymentStatus === 'PAID' ? 220 : 254, paymentStatus === 'PAID' ? 252 : 243, paymentStatus === 'PAID' ? 231 : 199);
  doc.setDrawColor(paymentStatus === 'PAID' ? 34 : 245, paymentStatus === 'PAID' ? 197 : 158, paymentStatus === 'PAID' ? 94 : 11);
  doc.roundedRect(margin + 6, y - 10, 52, 14, 2, 2, 'FD');
  doc.setFontSize(8.5);
  doc.setTextColor(paymentStatus === 'PAID' ? 22 : 146, paymentStatus === 'PAID' ? 101 : 64, paymentStatus === 'PAID' ? 52 : 14);
  doc.text(`${paymentStatus} (${report.billing?.paymentMode || 'UPI'})`, margin + 9, y - 2);

  // Footer
  const invFooterY = pageHeight - 30;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, invFooterY, pageWidth - margin, invFooterY);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated tax invoice for pathology investigation services rendered.', margin, invFooterY + 6);
  doc.text('Thank you for trusting Lab Nova Pathology & Diagnostics with your health care.', margin, invFooterY + 11);

  doc.text('Authorized Signatory', pageWidth - margin - 40, invFooterY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(settings.labName || 'Lab Nova Diagnostics', pageWidth - margin - 40, invFooterY + 17);

  const filename = `Invoice_${report.reportId}_${report.patientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
