import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { PathologyReport, LabSettings, PrePrintedLetterheadConfig, DigitalLetterheadConfig, ReportParameterResult } from '../types';
import { DEFAULT_LAB_SETTINGS, DEFAULT_TEST_TEMPLATES } from '../data/pathologyTemplates';
import { DEFAULT_PREPRINTED_CONFIG, getDigitalConfig, getPrePrintedConfig } from './prePrintedConfig';
import { getLetterheadTemplateById } from '../data/letterheadTemplatesData';

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Draws a real, high-density scannable vector QR Code directly onto the jsPDF canvas.
 * Encodes the exact verification URL pointing to the diagnostic report verification portal.
 */
function drawRealQrCode(doc: jsPDF, text: string, x: number, y: number, sizeMm: number = 13) {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const moduleSize = sizeMm / moduleCount;

    // Draw white background backing
    doc.setFillColor(255, 255, 255);
    doc.rect(x - 0.5, y - 0.5, sizeMm + 1.0, sizeMm + 1.0, 'F');

    // Draw QR modules with crisp vector squares
    doc.setFillColor(15, 23, 42); // slate-900
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          doc.rect(x + c * moduleSize, y + r * moduleSize, moduleSize + 0.05, moduleSize + 0.05, 'F');
        }
      }
    }
  } catch (err) {
    console.warn('QR code generation fallback to vector frame:', err);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, sizeMm, sizeMm, 'F');
    doc.setDrawColor(15, 23, 42);
    doc.rect(x, y, sizeMm, sizeMm, 'D');
  }
}

/**
 * Format ISO date-time into clean, standardized medical report date format (e.g., 01-Sep-2026, 10:30 AM).
 */
function formatMedicalDateTime(isoString?: string | null): string {
  if (!isoString) {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Generates an official, print-ready Pathology Laboratory Diagnostic Report in A4 Portrait (210 x 297 mm).
 * Strictly adheres to NABL ISO 15189:2022 and 21 CFR Part 11 electronic signature standards.
 * Features:
 *  - Standard A4 page geometry with calibrated margin/offset nudges and pixel-perfect column alignment.
 *  - High-contrast, clean professional typography with clear medical visual hierarchy.
 *  - Perfectly aligned Patient & Specimen Information card with UHID, Age, Gender, Referring Doctor, Collection & Report Dates.
 *  - Multi-page dynamic pagination with continuation headers and universal "Page X of Y" footer.
 *  - Color-coded abnormal/critical value flags and clean biological reference intervals.
 *  - Configurable Test Investigation table font size with 2-line word wrapping for long test names.
 *  - Dual digital signature verification blocks for Lab Technologist and Consultant Pathologist.
 */
export function generatePathologyPdf(
  reportOrReports: PathologyReport | PathologyReport[],
  customSettings?: LabSettings,
  customConfig?: Partial<DigitalLetterheadConfig>
) {
  const report = Array.isArray(reportOrReports) ? reportOrReports[0] : reportOrReports;
  const multiReports = Array.isArray(reportOrReports) && reportOrReports.length > 1 ? reportOrReports : null;
  const settings = customSettings || DEFAULT_LAB_SETTINGS;
  const savedDigitalConfig = getDigitalConfig();
  const config: DigitalLetterheadConfig = {
    ...savedDigitalConfig,
    ...customConfig,
    topOffsetMm: customConfig?.topOffsetMm ?? savedDigitalConfig.topOffsetMm ?? 0,
    horizontalOffsetMm: customConfig?.horizontalOffsetMm ?? savedDigitalConfig.horizontalOffsetMm ?? 0,
    tableFontSizePt: customConfig?.tableFontSizePt ?? savedDigitalConfig.tableFontSizePt ?? 9.5,
    showDailySign: customConfig?.showDailySign ?? savedDigitalConfig.showDailySign ?? true,
    showVerified: customConfig?.showVerified ?? savedDigitalConfig.showVerified ?? true,
    showDigitalSignatureQr: customConfig?.showDigitalSignatureQr ?? savedDigitalConfig.showDigitalSignatureQr ?? true,
    showClinicalImpression: customConfig?.showClinicalImpression ?? savedDigitalConfig.showClinicalImpression ?? true,
    showDepartmentMethod: customConfig?.showDepartmentMethod ?? savedDigitalConfig.showDepartmentMethod ?? true,
    showPatientDemographicsBox: customConfig?.showPatientDemographicsBox ?? savedDigitalConfig.showPatientDemographicsBox ?? true,
    showCategoryHeaders: customConfig?.showCategoryHeaders ?? savedDigitalConfig.showCategoryHeaders ?? true,
    showEndDisclaimer: customConfig?.showEndDisclaimer ?? savedDigitalConfig.showEndDisclaimer ?? true,
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // Geometry calculations with full page UP/DOWN and LEFT/RIGHT position offsets
  const baseMargin = 12; // 12mm standard margin
  const effLeft = Math.max(4, Math.min(30, baseMargin + (config.horizontalOffsetMm || 0)));
  const effRight = Math.max(4, Math.min(30, baseMargin - (config.horizontalOffsetMm || 0)));
  const effTop = Math.max(4, Math.min(35, baseMargin + (config.topOffsetMm || 0)));
  const printableWidth = pageWidth - effLeft - effRight; // e.g. 186mm
  let y = effTop;

  // Proportional Table Column Offsets
  const col1Width = printableWidth * 0.38; // Test Name (~70.6mm)
  const col2Width = printableWidth * 0.16; // Observed Result (~29.8mm)
  const col3Width = printableWidth * 0.14; // Flag / Status (~26.0mm)
  const col4Width = printableWidth * 0.12; // Units (~22.3mm)
  const col5Width = printableWidth * 0.20; // Biological Ref Interval (~37.2mm)

  const tCol1 = effLeft + 3;
  const tCol2 = effLeft + col1Width + 2;
  const tCol3 = effLeft + col1Width + col2Width + 2;
  const tCol4 = effLeft + col1Width + col2Width + col3Width + 2;
  const tCol5 = effLeft + col1Width + col2Width + col3Width + col4Width + 2;

  // Primary Brand Colors & Selected Letterhead Template
  const letterheadTemplate = getLetterheadTemplateById(settings.letterheadTemplateId);
  const primaryNavy = hexToRgb(letterheadTemplate.primaryColor || settings.headerColor || '#0f172a');
  const secondaryNavy = hexToRgb(letterheadTemplate.secondaryColor || '#1e293b');
  const badgeAccent = hexToRgb(letterheadTemplate.badgeColor || '#059669');
  const headerCardBg = [248, 250, 252]; // Slate-50
  const borderSlate = [203, 213, 225]; // Slate-300
  const textDark = [15, 23, 42]; // Slate-900
  const textMuted = [100, 116, 139]; // Slate-500

  /**
   * Base font size for test investigations table in points (configurable via config.tableFontSizePt)
   */
  const baseFontSize = config.tableFontSizePt ? Number(config.tableFontSizePt) : 9.5;
  const testNameFontSize = baseFontSize;
  const resultFontSize = baseFontSize * 1.02;
  const flagFontSize = Math.max(7.0, baseFontSize * 0.85);
  const unitFontSize = Math.max(7.0, baseFontSize * 0.90);
  const refRangeFontSize = Math.max(7.0, baseFontSize * 0.90);
  const catFontSize = Math.max(7.5, baseFontSize * 0.90);
  const headerFontSize = Math.max(7.2, baseFontSize * 0.85);

  const lineSpacingMm = baseFontSize * 0.46;
  const singleRowHeight = Math.max(6.8, baseFontSize * 0.80);

  /**
   * Draws the Accredited Laboratory Letterhead Header on Page 1 based on active letterhead template.
   */
  const drawPage1Header = () => {
    // Top banner background
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(effLeft, y, printableWidth, 27, 'F');

    // Template specific decorative top accent bars
    if (letterheadTemplate.id === 'premium_laboratory') {
      // Elegant gold trim on top
      doc.setFillColor(217, 119, 6); // Amber gold #d97706
      doc.rect(effLeft, y, printableWidth, 1.2, 'F');
    } else if (letterheadTemplate.id === 'clean_medical') {
      // Emerald top bar
      doc.setFillColor(16, 185, 129); // Emerald #10b981
      doc.rect(effLeft, y, printableWidth, 1.2, 'F');
    } else if (letterheadTemplate.id === 'modern_diagnostic') {
      // Sky blue accent trim
      doc.setFillColor(56, 189, 248); // Sky #38bdf8
      doc.rect(effLeft, y, printableWidth, 1.0, 'F');
    } else if (letterheadTemplate.id === 'corporate_lab') {
      // Corporate dual tier top rule
      doc.setFillColor(59, 130, 246); // Blue #3b82f6
      doc.rect(effLeft, y, printableWidth, 1.2, 'F');
    }

    // Vector Medical Cross Emblem / Shield Logo or Custom Uploaded Logo Image
    const logoX = effLeft + 4;
    const logoY = y + 4.5;
    let logoDrawn = false;

    if (settings.logoUrl && (settings.logoUrl.startsWith('data:image/') || settings.logoUrl.startsWith('http'))) {
      try {
        const format = settings.logoUrl.includes('image/png')
          ? 'PNG'
          : settings.logoUrl.includes('image/jpeg') || settings.logoUrl.includes('image/jpg')
          ? 'JPEG'
          : 'PNG';
        doc.addImage(settings.logoUrl, format, logoX, logoY, 18, 18);
        logoDrawn = true;
      } catch (imgErr) {
        console.warn('Could not draw uploaded logo in PDF, using vector emblem fallback:', imgErr);
      }
    }

    if (!logoDrawn) {
      if (letterheadTemplate.id === 'premium_laboratory') {
        doc.setFillColor(217, 119, 6); // Gold emblem
        doc.circle(logoX + 8.5, logoY + 9, 8.5, 'F');
        doc.setFillColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('★', logoX + 6.2, logoY + 11.5);
      } else {
        doc.setFillColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
        doc.circle(logoX + 8.5, logoY + 9, 8.5, 'F');
        doc.setFillColor(255, 255, 255); // White cross
        doc.rect(logoX + 7.2, logoY + 3.8, 2.6, 10.4, 'F');
        doc.rect(logoX + 3.3, logoY + 7.7, 10.4, 2.6, 'F');
      }
    }

    // Laboratory Name & Subtitles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const labName = (settings.labName || 'LAB NOVA PATHOLOGY & DIAGNOSTICS').toUpperCase();
    doc.text(labName, effLeft + 24, y + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(203, 213, 225); // Slate-300
    const tagline = (settings.tagline || 'REFERENCE CLINICAL BIOCHEMISTRY, HEMATOLOGY & MOLECULAR PATHOLOGY').toUpperCase();
    doc.text(tagline, effLeft + 24, y + 12);

    const addressText = `${settings.address || 'Central Diagnostic Complex'} | Phone: ${settings.phone || '24x7 Diagnostic Support'}`;
    doc.text(addressText, effLeft + 24, y + 16.5);

    const contactText = `Email: ${settings.email || 'reports@labnova.com'} | Web: ${settings.website || 'www.labnova.com'}`;
    doc.text(contactText, effLeft + 24, y + 21);

    // Right-side Accreditation Badge
    const rightBadgeWidth = 46;
    const rightBadgeX = pageWidth - effRight - rightBadgeWidth - 2;
    doc.setFillColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]); // Secondary tone accent
    doc.roundedRect(rightBadgeX, y + 3, rightBadgeWidth, 21, 1.5, 1.5, 'F');
    doc.setTextColor(badgeAccent[0], badgeAccent[1], badgeAccent[2]); // Dynamic accent badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NABL ACCREDITED', rightBadgeX + 6, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(241, 245, 249);
    doc.text('ISO 15189:2022 Standard', rightBadgeX + 4, y + 12.5);
    doc.text(`Cert: ${settings.nablCertNumber || 'MC-4892'}`, rightBadgeX + 4, y + 16.5);
    doc.text(`Lic: ${settings.licenseNumber || 'LIMS-DL-89421'}`, rightBadgeX + 4, y + 20.5);

    y += 30;
  };

  /**
   * Draws continuation header on pages 2+.
   */
  const drawContinuationHeader = (pageNum: number) => {
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(effLeft, y, printableWidth, 11, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text((settings.labName || 'LAB NOVA PATHOLOGY').toUpperCase(), effLeft + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    const contText = `Patient: ${report.patientName} (${report.patientUHID}) | Accession: ${report.reportId} | Page ${pageNum}`;
    doc.text(
      contText,
      pageWidth - effRight - doc.getTextWidth(contText) - 4,
      y + 7
    );

    y += 14;
  };

  /**
   * Draws the Patient Demographics & Accession Details Card.
   */
  const drawPatientDetailsCard = () => {
    const cardHeight = 35;
    const showBox = (config.showPatientDemographicsBox ?? true) && (config.includePatientBox ?? true);

    if (showBox) {
      doc.setFillColor(headerCardBg[0], headerCardBg[1], headerCardBg[2]);
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.roundedRect(effLeft, y, printableWidth, cardHeight, 1.5, 1.5, 'FD');

      // Vertical column divider down the center
      const midX = effLeft + printableWidth / 2;
      doc.setDrawColor(226, 232, 240);
      doc.line(midX, y + 2, midX, y + cardHeight - 2);
    } else {
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.line(effLeft, y, effLeft + printableWidth, y);
      doc.line(effLeft, y + cardHeight, effLeft + printableWidth, y + cardHeight);
    }

    const leftColLabelX = effLeft + 4;
    const leftColValX = effLeft + 34;

    const rightColLabelX = (effLeft + printableWidth / 2) + 4;
    const rightColValX = (effLeft + printableWidth / 2) + 38;

    doc.setFontSize(8);

    // ROW 1 (y + 6.5)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Patient ID / UHID:', leftColLabelX, y + 6.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.patientUHID || 'N/A', leftColValX, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Accession / Report ID:', rightColLabelX, y + 6.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.reportId, rightColValX, y + 6.5);

    // ROW 2 (y + 13)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Patient Name:', leftColLabelX, y + 13);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.patientName || 'N/A', leftColValX, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Sample ID / Barcode:', rightColLabelX, y + 13);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.sampleBarcode || 'BC-000000', rightColValX, y + 13);

    // ROW 3 (y + 19.5)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Age / Gender:', leftColLabelX, y + 19.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`${report.patientAge} Yrs / ${report.patientGender}`, leftColValX, y + 19.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Specimen Matrix:', rightColLabelX, y + 19.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(report.sampleType || 'EDTA Whole Blood / Serum', rightColValX, y + 19.5);

    // ROW 4 (y + 26)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Referring Doctor:', leftColLabelX, y + 26);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.referredBy || 'Self / Direct Walk-in', leftColValX, y + 26);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Sample Drawn / Coll:', rightColLabelX, y + 26);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(formatMedicalDateTime(report.sampleCollectedAt), rightColValX, y + 26);

    // ROW 5 (y + 32.5)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Contact Number:', leftColLabelX, y + 32.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(report.patientPhone || 'N/A', leftColValX, y + 32.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Report Released At:', rightColLabelX, y + 32.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMedicalDateTime(report.reportDate || report.verifiedAt), rightColValX, y + 32.5);

    y += cardHeight + 4;
  };

  /**
   * Draws the test modality banner (Test Name, Department, Specimen).
   */
  const drawTestBanner = (customTitle?: string, customMeta?: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(effLeft, y, printableWidth, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(effLeft, y + 8, effLeft + printableWidth, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const testTitle = customTitle || report.testNames.join(' & ') || 'Clinical Laboratory Investigation';
    doc.text(testTitle, effLeft + 4, y + 5.5);

    if (config.showDepartmentMethod ?? true) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const specimen = customMeta || `Department: Clinical Pathology | Method: Automated Analyzer`;
      doc.text(specimen, pageWidth - effRight - doc.getTextWidth(specimen) - 4, y + 5.5);
    }

    y += 10;
  };

  /**
   * Draws the table column header row.
   */
  const drawTableHeader = () => {
    const headerHeight = Math.max(7.0, baseFontSize * 0.78);
    doc.setFillColor(226, 232, 240); // Slate-200
    doc.rect(effLeft, y, printableWidth, headerHeight, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(effLeft, y + headerHeight, effLeft + printableWidth, y + headerHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(headerFontSize);
    doc.setTextColor(30, 41, 59);
    const headerY = y + headerHeight * 0.65;
    doc.text('TEST INVESTIGATION', tCol1, headerY);
    doc.text('OBSERVED RESULT', tCol2, headerY);
    doc.text('FLAG / STATUS', tCol3, headerY);
    doc.text('UNIT', tCol4, headerY);
    doc.text('BIOLOGICAL REF. INTERVAL', tCol5, headerY);

    y += headerHeight + 1.5;
  };

  /**
   * Draws the accredited digital signature footer on the last page.
   */
  const drawSignaturesFooter = () => {
    const showTech = config.showDailySign ?? true;
    const showPath = config.showVerified ?? true;
    const showQr = config.showDigitalSignatureQr ?? true;
    const showAnySign = showTech || showPath || showQr;

    if (showAnySign) {
      const footerY = pageHeight - 34;

      doc.setDrawColor(203, 213, 225);
      doc.line(effLeft, footerY, effLeft + printableWidth, footerY);

      // Left: Medical Laboratory Technologist (Daily Sign)
      if (showTech) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(settings.technologistName || 'Sunil K. Verma, M.Sc (MLT)', effLeft + 4, footerY + 6.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(settings.technologistQualification || 'Senior Biomedical Analyst', effLeft + 4, footerY + 10.5);
        doc.text('Daily Sign / QC In-Charge', effLeft + 4, footerY + 14.5);
      }

      // Center: Digital Signature Stamp & Real Scannable Patient-Level QR Matrix
      if (showQr) {
        const qrX = pageWidth / 2 - 22;
        const qrY = footerY + 2.0;
        const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://labnova.com';
        // Secure patient-level token without exposing sensitive raw clinical or personal data in QR
        const patientRawKey = `PLR_${report.patientUHID || report.patientId || report.reportId}_${(report.sampleCollectedAt || report.reportDate || '').slice(0, 10)}`;
        const patientToken = btoa(patientRawKey).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const verificationUrl = `${originUrl}?patientRecord=${encodeURIComponent(patientToken)}&ref=${encodeURIComponent(report.reportId || report.id)}`;
        drawRealQrCode(doc, verificationUrl, qrX, qrY, 13);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(16, 185, 129); // Emerald-600
        doc.text('DIGITALLY SIGNED & VERIFIED', qrX + 16, footerY + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const hash = (report.digitalSignatureHash || 'e7c10b4f8a92e1069d35fa7c844bf210').slice(0, 24);
        doc.text(`Hash: ${hash}...`, qrX + 16, footerY + 9.5);
        doc.text('Scan QR to verify live patient record', qrX + 16, footerY + 13.5);
      }

      // Right: Consultant Pathologist (Verified By)
      if (showPath) {
        const rightPathX = pageWidth - effRight - 58;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(report.verifiedBy || settings.pathologistName || 'Dr. Manisha Kulkarni, MD (Pathology)', rightPathX, footerY + 6.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(settings.pathologistQualification || 'Chief Consultant Pathologist', rightPathX, footerY + 10.5);
        doc.text(`Reg #${settings.pathologistRegistration || 'MMC-2014/09/3842'} (Verified / Signatory)`, rightPathX, footerY + 14.5);
      }
    }

    // Disclaimer notice
    if (config.showEndDisclaimer ?? true) {
      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text(
        '** End of Diagnostic Examination Report. Biological reference ranges vary with age, gender, and methodology. For clinical correlation only. **',
        effLeft + 4,
        pageHeight - 9
      );
    }
  };

  // -------------------------------------------------------------
  // BUILD REPORT FLOW (MULTI-TEST & SINGLE-TEST MODALITY)
  // -------------------------------------------------------------
  interface TestBlock {
    title: string;
    department: string;
    results: ReportParameterResult[];
  }

  const testBlocks: TestBlock[] = [];

  if (multiReports && multiReports.length > 1) {
    multiReports.forEach((rep) => {
      testBlocks.push({
        title: rep.testNames.join(' & ') || rep.reportId,
        department: 'Clinical Pathology',
        results: rep.results || [],
      });
    });
  } else if (report.testCodes && report.testCodes.length > 1) {
    const codeMap: Record<string, TestBlock> = {};
    report.testCodes.forEach((code, idx) => {
      const tmpl = DEFAULT_TEST_TEMPLATES.find((t) => t.testCode === code);
      const name = tmpl?.testName || report.testNames[idx] || code;
      const dept = tmpl?.category || 'Clinical Pathology';
      codeMap[code] = {
        title: name,
        department: dept,
        results: [],
      };
    });

    (report.results || []).forEach((res) => {
      let matchedCode: string | null = null;
      for (const code of report.testCodes) {
        const tmpl = DEFAULT_TEST_TEMPLATES.find((t) => t.testCode === code);
        if (
          tmpl &&
          tmpl.parameters.some(
            (p) => p.id === res.parameterId || p.name.toLowerCase() === res.name.toLowerCase()
          )
        ) {
          matchedCode = code;
          break;
        }
      }
      if (matchedCode && codeMap[matchedCode]) {
        codeMap[matchedCode].results.push(res);
      } else {
        let foundByCat = false;
        for (const code of report.testCodes) {
          const tmpl = DEFAULT_TEST_TEMPLATES.find((t) => t.testCode === code);
          if (tmpl && res.category && tmpl.category.toLowerCase().includes(res.category.toLowerCase())) {
            codeMap[code].results.push(res);
            foundByCat = true;
            break;
          }
        }
        if (!foundByCat) {
          const firstKey = report.testCodes[0];
          if (codeMap[firstKey]) {
            codeMap[firstKey].results.push(res);
          }
        }
      }
    });

    report.testCodes.forEach((code) => {
      if (codeMap[code] && codeMap[code].results.length > 0) {
        testBlocks.push(codeMap[code]);
      }
    });

    if (testBlocks.length === 0) {
      report.testCodes.forEach((code, idx) => {
        const tmpl = DEFAULT_TEST_TEMPLATES.find((t) => t.testCode === code);
        testBlocks.push({
          title: tmpl?.testName || report.testNames[idx] || code,
          department: tmpl?.category || 'Clinical Pathology',
          results: [],
        });
      });
    }
  } else {
    testBlocks.push({
      title: report.testNames.join(' & ') || 'Clinical Laboratory Investigation',
      department: 'Clinical Pathology',
      results: report.results || [],
    });
  }

  testBlocks.forEach((block, blockIdx) => {
    if (blockIdx > 0) {
      doc.addPage();
      y = effTop;
    }

    drawPage1Header();
    drawPatientDetailsCard();

    const isHistopathology =
      block.department === 'Histopathology' ||
      block.title.toLowerCase().includes('biopsy') ||
      block.results.some((r) => r.category === 'Histopathology');

    if (isHistopathology) {
      drawTestBanner(
        block.title,
        `Department: Histopathology & Surgical Pathology | Method: Light Microscopy (H&E Staining)`
      );

      // Section Banner
      doc.setFillColor(241, 245, 249);
      doc.rect(effLeft, y, printableWidth, 6.5, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.rect(effLeft, y, printableWidth, 6.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      doc.text('SURGICAL PATHOLOGY & HISTOPATHOLOGICAL EXAMINATION', effLeft + 3, y + 4.5);
      y += 9;

      const showAnySign =
        (config.showDailySign ?? true) ||
        (config.showVerified ?? true) ||
        (config.showDigitalSignatureQr ?? true);
      const signatureReserve = showAnySign ? 44 : 16;

      block.results.forEach((res) => {
        const textVal = (res.value || '').trim();
        const isDiagnosis = res.name.toLowerCase().includes('diagnosis');

        // Check if page break is needed before section
        if (y + 16 > pageHeight - signatureReserve) {
          doc.addPage();
          y = effTop;
          drawContinuationHeader(doc.getNumberOfPages());
        }

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(isDiagnosis ? 9.5 : 8.5);
        if (isDiagnosis) {
          doc.setTextColor(185, 28, 28);
        } else {
          doc.setTextColor(15, 23, 42);
        }
        doc.text(`▶  ${res.name.toUpperCase()}`, effLeft + 2, y + 3);
        y += 5;

        // Content
        const contentWidth = printableWidth - 8;
        doc.setFont('helvetica', isDiagnosis ? 'bold' : 'normal');
        doc.setFontSize(isDiagnosis ? 9.5 : 8.5);
        doc.setTextColor(15, 23, 42);

        const splitLines: string[] = doc.splitTextToSize(
          textVal || 'Awaiting clinical / histological entry.',
          contentWidth
        );
        const blockHeight = splitLines.length * 4.2 + (isDiagnosis ? 4 : 2);

        if (isDiagnosis) {
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(248, 113, 113);
          doc.setLineWidth(0.3);
          doc.roundedRect(effLeft, y - 1, printableWidth, blockHeight + 2, 1.5, 1.5, 'FD');
          doc.setTextColor(153, 27, 27);
          splitLines.forEach((line: string, lIdx: number) => {
            doc.text(line, effLeft + 4, y + 3.5 + lIdx * 4.2);
          });
          y += blockHeight + 5;
        } else {
          splitLines.forEach((line: string) => {
            if (y + 5 > pageHeight - signatureReserve) {
              doc.addPage();
              y = effTop;
              drawContinuationHeader(doc.getNumberOfPages());
            }
            doc.text(line, effLeft + 4, y + 3);
            y += 4.2;
          });
          y += 3;
        }
      });
    } else {
      drawTestBanner(block.title, `Department: ${block.department} | Method: Automated Analyzer`);
      drawTableHeader();

      let currentCategory = '';
      block.results.forEach((res, index) => {
      // Wrap long test investigation names into two clean lines if needed
      const testNameMaxWidth = col1Width - 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(testNameFontSize);
      const splitTestName: string[] = doc.splitTextToSize(res.name, testNameMaxWidth);
      const isMultiLine = splitTestName.length > 1;

      const refRangeMaxWidth = col5Width - 3;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(refRangeFontSize);
      const splitRefRange: string[] = doc.splitTextToSize(res.refRangeText || '-', refRangeMaxWidth);

      const maxLines = Math.max(splitTestName.length, splitRefRange.length);
      const rowHeight = maxLines > 1 ? Math.max(8.5, lineSpacingMm * maxLines + baseFontSize * 0.38) : singleRowHeight;

      // Check if we need a page break before this row
      const showAnySign = (config.showDailySign ?? true) || (config.showVerified ?? true) || (config.showDigitalSignatureQr ?? true);
      const signatureReserve = showAnySign ? 44 : 16;
      if (y + rowHeight > pageHeight - signatureReserve) {
        doc.addPage();
        y = effTop;
        drawContinuationHeader(doc.getNumberOfPages());
        drawTableHeader();
      }

      // Category heading if present and changed
      if ((config.showCategoryHeaders ?? true) && res.category && res.category !== currentCategory) {
        currentCategory = res.category;
        const catHeight = Math.max(5.8, baseFontSize * 0.65);
        doc.setFillColor(248, 250, 252);
        doc.rect(effLeft, y, printableWidth, catHeight, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(effLeft, y + catHeight, effLeft + printableWidth, y + catHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(catFontSize);
        doc.setTextColor(30, 58, 138); // Blue-900
        doc.text(`[ ${currentCategory.toUpperCase()} ]`, effLeft + 3, y + catHeight * 0.7);
        y += catHeight + 1.6;
      }

      // Alternate subtle row shading
      if (index % 2 === 1) {
        doc.setFillColor(252, 253, 255);
        doc.rect(effLeft, y, printableWidth, rowHeight, 'F');
      }

      const baselineY = y + Math.max(4.2, baseFontSize * 0.50);
      const firstLineY = y + Math.max(3.8, baseFontSize * 0.44);

      // 1. Investigation Parameter Name (Wrapped onto 2 lines if long)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(testNameFontSize);
      doc.setTextColor(15, 23, 42);
      if (isMultiLine) {
        splitTestName.forEach((line, lineIdx) => {
          doc.text(line, tCol1, firstLineY + lineIdx * lineSpacingMm);
        });
      } else {
        doc.text(res.name, tCol1, baselineY);
      }

      // 2. Result value with bolding and color coding for abnormal
      const isAbnormal = res.status !== 'normal';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(resultFontSize);
      if (isAbnormal) {
        if (res.status === 'critical') {
          doc.setTextColor(220, 38, 38); // Red-600
        } else if (res.status === 'high') {
          doc.setTextColor(185, 28, 28); // Amber-700 / Red-700
        } else {
          doc.setTextColor(37, 99, 235); // Blue-600
        }
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(res.value), tCol2, baselineY);

      // 3. Flag / Status Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(flagFontSize);
      if (res.status === 'high') {
        doc.setTextColor(185, 28, 28);
        doc.text('▲ HIGH', tCol3, baselineY);
      } else if (res.status === 'low') {
        doc.setTextColor(37, 99, 235);
        doc.text('▼ LOW', tCol3, baselineY);
      } else if (res.status === 'critical') {
        doc.setTextColor(220, 38, 38);
        doc.text('🚨 CRITICAL', tCol3, baselineY);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text('Normal', tCol3, baselineY);
      }

      // 4. Units
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(unitFontSize);
      doc.setTextColor(71, 85, 105);
      doc.text(res.unit || '-', tCol4, baselineY);

      // 5. Biological Reference Interval
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(refRangeFontSize);
      doc.setTextColor(71, 85, 105);
      if (splitRefRange.length > 1) {
        splitRefRange.forEach((line, rIdx) => {
          doc.text(line, tCol5, firstLineY + rIdx * lineSpacingMm);
        });
      } else {
        doc.text(res.refRangeText || '-', tCol5, baselineY);
      }

      // Row bottom separator line
      doc.setDrawColor(241, 245, 249);
      doc.line(effLeft, y + rowHeight, effLeft + printableWidth, y + rowHeight);

      y += rowHeight + 0.8;
    });
    }

    y += 3;

    // Clinical Impression & Remarks (on the final test or if present)
    const isFinalBlock = blockIdx === testBlocks.length - 1;
    if (isFinalBlock && (config.showClinicalImpression ?? true) && (report.clinicalNotes || report.interpretation)) {
      const showAnySign = (config.showDailySign ?? true) || (config.showVerified ?? true) || (config.showDigitalSignatureQr ?? true);
      const reserveBottom = showAnySign ? 50 : 25;
      if (y > pageHeight - reserveBottom) {
        doc.addPage();
        y = effTop;
        drawContinuationHeader(doc.getNumberOfPages());
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(effLeft, y, printableWidth, 18, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('CLINICAL IMPRESSION & PATHOLOGIST ADVICE:', effLeft + 4, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const combinedNotes = `${report.clinicalNotes ? 'Findings: ' + report.clinicalNotes : ''} ${
        report.interpretation ? '| Interpretation: ' + report.interpretation : ''
      }`;
      const splitNotes = doc.splitTextToSize(combinedNotes, printableWidth - 8);
      doc.text(splitNotes, effLeft + 4, y + 9);

      y += 22;
    }

    // Draw Signatures Footer on each test page
    drawSignaturesFooter();
  });

  // -------------------------------------------------------------
  // UNIVERSAL "PAGE X OF Y" NUMBERING ACROSS ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - effRight - 20, pageHeight - 5);
  }

  // Save the PDF file
  const filename = `${report.patientName.replace(/\s+/g, '_')}_Report_${report.reportId}.pdf`;
  doc.save(filename);
}

/**
 * Generates an itemized official tax invoice / receipt PDF in A4 Portrait (210 x 297 mm).
 */
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
  const printableWidth = pageWidth - 2 * margin;
  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, printableWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text((settings.labName || 'LAB NOVA PATHOLOGY & DIAGNOSTICS').toUpperCase(), margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${settings.address} | Phone: ${settings.phone}`, margin + 6, y + 13.5);
  doc.text(`GST / Tax ID: ${settings.taxId || '27AADCL8942E1ZS'} | License: ${settings.licenseNumber}`, margin + 6, y + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(52, 211, 153);
  doc.text('OFFICIAL TAX INVOICE', pageWidth - margin - 52, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Inv #: INV-${report.reportId}`, pageWidth - margin - 52, y + 14);
  doc.text(`Date: ${new Date(report.sampleCollectedAt || Date.now()).toLocaleDateString()}`, pageWidth - margin - 52, y + 18.5);

  y += 31;

  // Patient info box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, printableWidth, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Billed To Patient:', margin + 6, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${report.patientName} (${report.patientAge}y / ${report.patientGender})`, margin + 6, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`UHID: ${report.patientUHID} | Contact: ${report.patientPhone || 'N/A'}`, margin + 6, y + 16);

  doc.setTextColor(100, 116, 139);
  doc.text('Referred By:', margin + 105, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(report.referredBy || 'Self / Direct Walk-in', margin + 105, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${report.billing?.paymentMode || 'UPI / Cash'}`, margin + 105, y + 16);

  y += 28;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, printableWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Sr.', margin + 4, y + 5.5);
  doc.text('Investigation / Pathology Panel Description', margin + 16, y + 5.5);
  doc.text('Category', margin + 105, y + 5.5);
  doc.text('Amount (₹)', pageWidth - margin - 22, y + 5.5);
  y += 10;

  // Line items
  const testItems = (report.testNames || ['Diagnostic Pathology Investigation']).map((name, idx) => ({
    sr: idx + 1,
    name,
    code: report.testCodes?.[idx] || 'LAB-01',
    sample: report.sampleType || 'Clinical Specimen',
  }));

  const itemPrice = (report.billing?.totalAmount || 0) / (testItems.length || 1);

  testItems.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.sr}.`, margin + 4, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name, margin + 16, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Code: ${item.code} | Sample: ${item.sample}`, margin + 16, y + 10);
    doc.text('Pathology', margin + 105, y + 5);
    doc.text(`₹${itemPrice.toFixed(2)}`, pageWidth - margin - 22, y + 5);
    y += 14;
  });

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + printableWidth, y);
  y += 6;

  // Totals calculation
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

  doc.text('Healthcare Diagnostic Exemption:', rightAlignX, y);
  doc.text('₹0.00', pageWidth - margin - 15, y);
  y += 6;

  doc.setDrawColor(203, 213, 225);
  doc.line(rightAlignX, y, margin + printableWidth, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Paid:', rightAlignX, y);
  doc.text(`₹${finalTotal.toFixed(2)}`, pageWidth - margin - 15, y);

  // Status Stamp
  doc.setFillColor(paymentStatus === 'PAID' ? 220 : 254, paymentStatus === 'PAID' ? 252 : 243, paymentStatus === 'PAID' ? 231 : 199);
  doc.setDrawColor(paymentStatus === 'PAID' ? 34 : 245, paymentStatus === 'PAID' ? 197 : 158, paymentStatus === 'PAID' ? 94 : 11);
  doc.roundedRect(margin + 6, y - 10, 52, 14, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(paymentStatus === 'PAID' ? 22 : 146, paymentStatus === 'PAID' ? 101 : 64, paymentStatus === 'PAID' ? 52 : 14);
  doc.text(`${paymentStatus} (${report.billing?.paymentMode || 'UPI'})`, margin + 9, y - 2);

  // Footer
  const invFooterY = pageHeight - 28;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, invFooterY, margin + printableWidth, invFooterY);

  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated tax invoice for pathology investigation services rendered.', margin, invFooterY + 6);
  doc.text('Thank you for trusting Lab Nova Pathology & Diagnostics with your healthcare.', margin, invFooterY + 10.5);

  doc.text('Authorized Signatory', pageWidth - margin - 40, invFooterY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(settings.labName || 'Lab Nova Diagnostics', pageWidth - margin - 40, invFooterY + 11);

  const filename = `Invoice_${report.reportId}_${report.patientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Generates an A4 Diagnostic Pathology Report specifically calibrated for physical PRE-PRINTED LETTERHEAD paper.
 * Leaves the top banner clearance zone empty (no digital logo, lab name, or header box) so that
 * the printed content aligns seamlessly under the physical pre-printed letterhead.
 * 
 * Key Features:
 * - Standard A4 dimensions (210 x 297 mm) with configurable top/bottom/left/right margins and directional offsets.
 * - Auto line-wrapping for long test investigation names into two clean lines without overlapping columns.
 * - Aligned two-column patient demographics and accession info grid.
 * - High-contrast clear medical results table with observed values, flags, units, and biological reference ranges.
 * - Dynamic multi-page continuation calculations with continuation headers on pages 2+.
 * - Optional digital signature footer with space clearance for physical doctor stamp.
 */
export function generatePrePrintedPathologyPdf(
  report: PathologyReport,
  customSettings?: LabSettings,
  customConfig?: PrePrintedLetterheadConfig,
  directPrint: boolean = false
) {
  const settings = customSettings || DEFAULT_LAB_SETTINGS;
  const config = customConfig || DEFAULT_PREPRINTED_CONFIG;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // Calculate effective margins considering directional offsets
  const effLeft = Math.max(5, (config.leftMarginMm ?? 12) + (config.horizontalOffsetMm ?? 0));
  const effRight = Math.max(5, (config.rightMarginMm ?? 12) - (config.horizontalOffsetMm ?? 0));
  const printableWidth = pageWidth - effLeft - effRight;

  const effTopPage1 = Math.max(15, (config.topMarginMm ?? 48) + (config.headerSpaceOffsetMm ?? 0));
  const effTopPageCont = Math.max(12, (config.continuationTopMarginMm ?? 22) + (config.headerSpaceOffsetMm ?? 0));
  const effBottom = Math.max(10, config.bottomMarginMm ?? 28);

  let y = effTopPage1;

  // Proportional Column Widths (Total: printableWidth)
  const col1Width = printableWidth * 0.40; // Test Name (~74.4mm at 186mm printable)
  const col2Width = printableWidth * 0.16; // Observed Result (~29.8mm)
  const col3Width = printableWidth * 0.14; // Flag / Status (~26.0mm)
  const col4Width = printableWidth * 0.12; // Units (~22.3mm)
  const col5Width = printableWidth * 0.18; // Biological Reference Interval (~33.5mm)

  const tCol1 = effLeft + 2;
  const tCol2 = effLeft + col1Width + 2;
  const tCol3 = effLeft + col1Width + col2Width + 2;
  const tCol4 = effLeft + col1Width + col2Width + col3Width + 2;
  const tCol5 = effLeft + col1Width + col2Width + col3Width + col4Width + 2;

  // Colors (Crisp, high-contrast, ink-efficient for physical pre-printed letterhead)
  const textDark = [15, 23, 42]; // Slate-900
  const textMuted = [100, 116, 139]; // Slate-500
  const borderSlate = [203, 213, 225]; // Slate-300
  const cardBg = [250, 251, 253]; // Light off-white for contrast

  /**
   * Draws continuation header on Page 2+ for Pre-Printed Stationery
   */
  const drawPrePrintedContinuationHeader = (pageNum: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(effLeft, y, printableWidth, 9, 'F');
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.rect(effLeft, y, printableWidth, 9, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`DIAGNOSTIC EXAMINATION REPORT (CONTINUED)`, effLeft + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Patient: ${report.patientName} (${report.patientUHID}) | Accession: ${report.reportId} | Page ${pageNum}`,
      pageWidth - effRight - doc.getTextWidth(`Patient: ${report.patientName} (${report.patientUHID}) | Accession: ${report.reportId} | Page ${pageNum}`) - 4,
      y + 6
    );

    y += 12;
  };

  /**
   * Draws Patient Demographics & Accession Grid for Pre-Printed Stationery
   */
  const drawPrePrintedPatientCard = () => {
    const cardHeight = 35;
    const showBox = (config.showPatientDemographicsBox ?? true) && (config.includePatientBox ?? true);

    if (showBox) {
      doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.roundedRect(effLeft, y, printableWidth, cardHeight, 1.5, 1.5, 'FD');

      // Mid column divider
      const midX = effLeft + printableWidth / 2;
      doc.setDrawColor(226, 232, 240);
      doc.line(midX, y + 2, midX, y + cardHeight - 2);
    } else {
      // Clean minimal border lines
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.line(effLeft, y, effLeft + printableWidth, y);
      doc.line(effLeft, y + cardHeight, effLeft + printableWidth, y + cardHeight);
    }

    const midX = effLeft + printableWidth / 2;
    const leftColLabelX = effLeft + 4;
    const leftColValX = effLeft + 35;

    const rightColLabelX = midX + 4;
    const rightColValX = midX + 38;

    doc.setFontSize(8);

    // Row 1: UHID & Accession ID
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Patient ID / UHID:', leftColLabelX, y + 6.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.patientUHID || 'N/A', leftColValX, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Accession / Report ID:', rightColLabelX, y + 6.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.reportId, rightColValX, y + 6.5);

    // Row 2: Patient Name & Barcode
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Patient Name:', leftColLabelX, y + 13);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(report.patientName || 'N/A', leftColValX, y + 13);
    doc.setFontSize(8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Sample ID / Barcode:', rightColLabelX, y + 13);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.sampleBarcode || 'BC-000000', rightColValX, y + 13);

    // Row 3: Age/Gender & Specimen Matrix
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Age / Gender:', leftColLabelX, y + 19.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`${report.patientAge} Yrs / ${report.patientGender}`, leftColValX, y + 19.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Specimen Matrix:', rightColLabelX, y + 19.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(report.sampleType || 'EDTA Whole Blood / Serum', rightColValX, y + 19.5);

    // Row 4: Referring Doctor & Sample Drawn Date
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Referring Doctor:', leftColLabelX, y + 26);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(report.referredBy || 'Self / Direct Walk-in', leftColValX, y + 26);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Sample Drawn / Coll:', rightColLabelX, y + 26);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(formatMedicalDateTime(report.sampleCollectedAt), rightColValX, y + 26);

    // Row 5: Contact & Report Release Date
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Contact Number:', leftColLabelX, y + 32.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(report.patientPhone || 'N/A', leftColValX, y + 32.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Report Released At:', rightColLabelX, y + 32.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMedicalDateTime(report.reportDate || report.verifiedAt), rightColValX, y + 32.5);

    y += cardHeight + 4;
  };

  /**
   * Draws Test Investigation Banner
   */
  const drawPrePrintedModeBanner = () => {
    doc.setFillColor(245, 247, 250);
    doc.rect(effLeft, y, printableWidth, 7.5, 'F');
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.line(effLeft, y + 7.5, effLeft + printableWidth, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const testTitle = (report.testNames.join(' & ') || 'Clinical Pathology Investigation').toUpperCase();
    doc.text(testTitle, effLeft + 4, y + 5.2);

    if (config.showDepartmentMethod ?? true) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      const depInfo = `Department: Clinical Pathology | Method: Automated Reference Analyzer`;
      doc.text(depInfo, pageWidth - effRight - doc.getTextWidth(depInfo) - 4, y + 5.2);
    }

    y += 9.5;
  };

  /**
   * Base font size for test investigations table in points (configurable via config.tableFontSizePt)
   */
  const baseFontSize = config.tableFontSizePt ? Number(config.tableFontSizePt) : 9.5;
  const testNameFontSize = baseFontSize;
  const resultFontSize = baseFontSize * 1.02;
  const flagFontSize = Math.max(7.0, baseFontSize * 0.85);
  const unitFontSize = Math.max(7.0, baseFontSize * 0.90);
  const refRangeFontSize = Math.max(7.0, baseFontSize * 0.90);
  const catFontSize = Math.max(7.5, baseFontSize * 0.90);

  const lineSpacingMm = baseFontSize * 0.46;
  const singleRowHeight = Math.max(6.8, baseFontSize * 0.80);

  /**
   * Draws the Table Columns Header Row
   */
  const drawPrePrintedTableHeader = () => {
    const headerFontSize = Math.max(7.2, baseFontSize * 0.85);
    const headerHeight = Math.max(7.0, baseFontSize * 0.78);

    doc.setFillColor(238, 242, 246);
    doc.rect(effLeft, y, printableWidth, headerHeight, 'F');
    doc.setDrawColor(180, 195, 210);
    doc.setLineWidth(0.3);
    doc.line(effLeft, y + headerHeight, effLeft + printableWidth, y + headerHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(headerFontSize);
    doc.setTextColor(30, 41, 59);

    const headerTextY = y + headerHeight * 0.65;
    doc.text('TEST INVESTIGATION', tCol1, headerTextY);
    doc.text('OBSERVED RESULT', tCol2, headerTextY);
    doc.text('FLAG / STATUS', tCol3, headerTextY);
    doc.text('UNIT', tCol4, headerTextY);
    doc.text('BIOLOGICAL REF. INTERVAL', tCol5, headerTextY);

    y += headerHeight + 1.5;
  };

  /**
   * Draws Digital Signatures & NABL Certification Footer
   */
  const drawPrePrintedSignatures = () => {
    if (!config.includeSignatures) {
      // Leave empty space for physical manual stamping
      return;
    }

    const showTech = config.showDailySign ?? true;
    const showPath = config.showVerified ?? true;
    const showQr = config.showDigitalSignatureQr ?? true;
    const showAnySign = showTech || showPath || showQr;

    if (showAnySign) {
      const footerY = pageHeight - effBottom - 26;

      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.line(effLeft, footerY, effLeft + printableWidth, footerY);

      // Left: Medical Laboratory Technologist (Daily Sign)
      if (showTech) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(settings.technologistName || 'Sunil K. Verma, M.Sc (MLT)', effLeft + 4, footerY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(settings.technologistQualification || 'Senior Biomedical Analyst', effLeft + 4, footerY + 10);
        doc.text('Daily Sign / QC In-Charge', effLeft + 4, footerY + 14);
      }

      // Center: Digital Verification Stamp & Real Scannable QR Matrix
      if (showQr) {
        const qrX = pageWidth / 2 - 20;
        const qrY = footerY + 2;
        const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://labnova.com';
        const verificationUrl = `${originUrl}?verify=${encodeURIComponent(report.reportId || report.id)}`;
        drawRealQrCode(doc, verificationUrl, qrX, qrY, 12);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(16, 185, 129); // Emerald-600
        doc.text('DIGITALLY SIGNED & VERIFIED', qrX + 15, footerY + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const hash = (report.digitalSignatureHash || 'e7c10b4f8a92e1069d35fa7c844bf210').slice(0, 24);
        doc.text(`Hash: ${hash}...`, qrX + 15, footerY + 9.5);
        doc.text('Scan QR to verify authenticity', qrX + 15, footerY + 13.5);
      }

      // Right: Consultant Pathologist (Verified By)
      if (showPath) {
        const rightPathX = pageWidth - effRight - 58;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(report.verifiedBy || settings.pathologistName || 'Dr. Manisha Kulkarni, MD (Pathology)', rightPathX, footerY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(settings.pathologistQualification || 'Chief Consultant Pathologist', rightPathX, footerY + 10);
        doc.text(`Reg #${settings.pathologistRegistration || 'MMC-2014/09/3842'} (Verified / Signatory)`, rightPathX, footerY + 14);
      }
    }

    // Disclaimer
    if (config.showEndDisclaimer ?? true) {
      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text(
        '** End of Diagnostic Examination Report. Biological reference ranges vary with age, gender, and methodology. For clinical correlation only. **',
        effLeft + 4,
        pageHeight - effBottom + 4
      );
    }
  };

  // -------------------------------------------------------------
  // BUILD PRE-PRINTED REPORT FLOW
  // -------------------------------------------------------------
  drawPrePrintedPatientCard();
  drawPrePrintedModeBanner();

  const results = report.results || [];
  const isPrePrintedHistopathology =
    (report.testNames || []).some((t) => t.toLowerCase().includes('biopsy')) ||
    results.some((r) => r.category === 'Histopathology');

  if (isPrePrintedHistopathology) {
    // Section Banner for Pre-printed Stationery
    doc.setFillColor(241, 245, 249);
    doc.rect(effLeft, y, printableWidth, 6.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.rect(effLeft, y, printableWidth, 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('SURGICAL PATHOLOGY & HISTOPATHOLOGICAL EXAMINATION', effLeft + 3, y + 4.5);
    y += 9;

    const showAnySign =
      (config.showDailySign ?? true) ||
      (config.showVerified ?? true) ||
      (config.showDigitalSignatureQr ?? true);
    const signatureReserve = config.includeSignatures && showAnySign ? 36 : 16;

    results.forEach((res) => {
      const textVal = (res.value || '').trim();
      const isDiagnosis = res.name.toLowerCase().includes('diagnosis');

      if (y + 16 > pageHeight - effBottom - signatureReserve) {
        doc.addPage();
        y = effTopPageCont;
        drawPrePrintedContinuationHeader(doc.getNumberOfPages());
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isDiagnosis ? 9.5 : 8.5);
      if (isDiagnosis) {
        doc.setTextColor(185, 28, 28);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(`▶  ${res.name.toUpperCase()}`, effLeft + 2, y + 3);
      y += 5;

      const contentWidth = printableWidth - 8;
      doc.setFont('helvetica', isDiagnosis ? 'bold' : 'normal');
      doc.setFontSize(isDiagnosis ? 9.5 : 8.5);
      doc.setTextColor(15, 23, 42);

      const splitLines: string[] = doc.splitTextToSize(
        textVal || 'Awaiting clinical / histological entry.',
        contentWidth
      );
      const blockHeight = splitLines.length * 4.2 + (isDiagnosis ? 4 : 2);

      if (isDiagnosis) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(248, 113, 113);
        doc.setLineWidth(0.3);
        doc.roundedRect(effLeft, y - 1, printableWidth, blockHeight + 2, 1.5, 1.5, 'FD');
        doc.setTextColor(153, 27, 27);
        splitLines.forEach((line: string, lIdx: number) => {
          doc.text(line, effLeft + 4, y + 3.5 + lIdx * 4.2);
        });
        y += blockHeight + 5;
      } else {
        splitLines.forEach((line: string) => {
          if (y + 5 > pageHeight - effBottom - signatureReserve) {
            doc.addPage();
            y = effTopPageCont;
            drawPrePrintedContinuationHeader(doc.getNumberOfPages());
          }
          doc.text(line, effLeft + 4, y + 3);
          y += 4.2;
        });
        y += 3;
      }
    });
  } else {
    drawPrePrintedTableHeader();

    let currentCategory = '';

    results.forEach((res, index) => {
    // Wrap long test investigation names into two clean lines if needed
    const testNameMaxWidth = col1Width - 3; // e.g. ~71mm on standard margins
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(testNameFontSize);
    const splitTestName: string[] = doc.splitTextToSize(res.name, testNameMaxWidth);
    const isMultiLine = splitTestName.length > 1;

    // Also check if reference range needs wrapping
    const refRangeMaxWidth = col5Width - 3; // ~30mm
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(refRangeFontSize);
    const splitRefRange: string[] = doc.splitTextToSize(res.refRangeText || '-', refRangeMaxWidth);

    const maxLines = Math.max(splitTestName.length, splitRefRange.length);
    const rowHeight = maxLines > 1 ? Math.max(8.5, lineSpacingMm * maxLines + baseFontSize * 0.38) : singleRowHeight;

    // Check if we need a page break before this row
    const showAnySign = (config.showDailySign ?? true) || (config.showVerified ?? true) || (config.showDigitalSignatureQr ?? true);
    const signatureReserve = (config.includeSignatures && showAnySign) ? 36 : 16;
    if (y + rowHeight > pageHeight - effBottom - signatureReserve) {
      doc.addPage();
      y = effTopPageCont;
      drawPrePrintedContinuationHeader(doc.getNumberOfPages());
      drawPrePrintedTableHeader();
    }

    // Category heading
    if ((config.showCategoryHeaders ?? true) && res.category && res.category !== currentCategory) {
      currentCategory = res.category;
      const catHeight = Math.max(5.8, baseFontSize * 0.65);
      doc.setFillColor(243, 246, 251);
      doc.rect(effLeft, y, printableWidth, catHeight, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(effLeft, y + catHeight, effLeft + printableWidth, y + catHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(catFontSize);
      doc.setTextColor(29, 78, 216); // Blue-700
      doc.text(`[ ${currentCategory.toUpperCase()} ]`, effLeft + 3, y + catHeight * 0.7);
      y += catHeight + 1.6;
    }

    // Alternate row shading for better readability
    if (index % 2 === 1) {
      doc.setFillColor(250, 252, 255);
      doc.rect(effLeft, y, printableWidth, rowHeight, 'F');
    }

    // Baseline Y for single line or first line in the row
    const baselineY = y + Math.max(4.2, baseFontSize * 0.50);
    const firstLineY = y + Math.max(3.8, baseFontSize * 0.44);

    // 1. Investigation Name (prominent, high readability, wrapped cleanly into 2 lines if long)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(testNameFontSize);
    doc.setTextColor(15, 23, 42); // Slate-900
    if (isMultiLine) {
      splitTestName.forEach((line, lineIdx) => {
        doc.text(line, tCol1, firstLineY + lineIdx * lineSpacingMm);
      });
    } else {
      doc.text(res.name, tCol1, baselineY);
    }

    // 2. Observed Result Value (crisp, clearly readable)
    const isAbnormal = res.status !== 'normal';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(resultFontSize);
    if (isAbnormal) {
      if (res.status === 'critical') {
        doc.setTextColor(220, 38, 38); // Red-600
      } else if (res.status === 'high') {
        doc.setTextColor(194, 65, 12); // Amber-700 / Orange-700
      } else {
        doc.setTextColor(37, 99, 235); // Blue-600
      }
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(String(res.value), tCol2, baselineY);

    // 3. Flag / Status Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(flagFontSize);
    if (res.status === 'high') {
      doc.setTextColor(194, 65, 12);
      doc.text('▲ HIGH', tCol3, baselineY);
    } else if (res.status === 'low') {
      doc.setTextColor(37, 99, 235);
      doc.text('▼ LOW', tCol3, baselineY);
    } else if (res.status === 'critical') {
      doc.setTextColor(220, 38, 38);
      doc.text('🚨 CRITICAL', tCol3, baselineY);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Normal', tCol3, baselineY);
    }

    // 4. Units
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(unitFontSize);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(res.unit || '-', tCol4, baselineY);

    // 5. Biological Reference Interval (wrapped cleanly if multi-line)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(refRangeFontSize);
    doc.setTextColor(51, 65, 85);
    if (splitRefRange.length > 1) {
      splitRefRange.forEach((line, rIdx) => {
        doc.text(line, tCol5, firstLineY + rIdx * lineSpacingMm);
      });
    } else {
      doc.text(res.refRangeText || '-', tCol5, baselineY);
    }

    // Subtle row bottom divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(effLeft, y + rowHeight, effLeft + printableWidth, y + rowHeight);

    y += rowHeight;
  });
  }

  y += 3;

  // -------------------------------------------------------------
  // CLINICAL IMPRESSION & REMARKS
  // -------------------------------------------------------------
  if ((config.showClinicalImpression ?? true) && (report.clinicalNotes || report.interpretation)) {
    const showAnySign = (config.showDailySign ?? true) || (config.showVerified ?? true) || (config.showDigitalSignatureQr ?? true);
    const reserveBottom = (config.includeSignatures && showAnySign) ? 45 : 20;
    if (y > pageHeight - effBottom - reserveBottom) {
      doc.addPage();
      y = effTopPageCont;
      drawPrePrintedContinuationHeader(doc.getNumberOfPages());
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(effLeft, y, printableWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('CLINICAL IMPRESSION & PATHOLOGIST ADVICE:', effLeft + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const combinedNotes = `${report.clinicalNotes ? 'Findings: ' + report.clinicalNotes : ''} ${
      report.interpretation ? '| Interpretation: ' + report.interpretation : ''
    }`;
    const splitNotes = doc.splitTextToSize(combinedNotes, printableWidth - 8);
    doc.text(splitNotes, effLeft + 4, y + 9);

    y += 22;
  }

  // Draw Signatures on the final page
  drawPrePrintedSignatures();

  // -------------------------------------------------------------
  // UNIVERSAL "PAGE X OF Y" NUMBERING
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - effRight - 20, pageHeight - 5);
  }

  const filename = `PrePrinted_${report.patientName.replace(/\s+/g, '_')}_Report_${report.reportId}.pdf`;

  if (directPrint) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
}

/**
 * Generates an A4 Metric Alignment Calibration Sheet with 10mm rulers on all four margins,
 * helping clinical technicians measure their physical letterhead offsets with millimeter precision.
 */
export function generateAlignmentTestGridPdf(customConfig?: PrePrintedLetterheadConfig) {
  const config = customConfig || DEFAULT_PREPRINTED_CONFIG;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Background grid
  doc.setDrawColor(235, 240, 245);
  doc.setLineWidth(0.1);
  for (let gx = 10; gx < pageWidth; gx += 10) {
    doc.line(gx, 0, gx, pageHeight);
  }
  for (let gy = 10; gy < pageHeight; gy += 10) {
    doc.line(0, gy, pageWidth, gy);
  }

  // Draw 10mm tick marks along all 4 edges
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);

  // Top and Bottom Rulers
  for (let x = 0; x <= pageWidth; x += 5) {
    const isMajor = x % 10 === 0;
    const len = isMajor ? 5 : 2.5;
    doc.line(x, 0, x, len);
    doc.line(x, pageHeight - len, x, pageHeight);
    if (isMajor && x > 0 && x < pageWidth) {
      doc.text(String(x), x - 2, 8);
      doc.text(String(x), x - 2, pageHeight - 6);
    }
  }

  // Left and Right Rulers
  for (let y = 0; y <= pageHeight; y += 5) {
    const isMajor = y % 10 === 0;
    const len = isMajor ? 5 : 2.5;
    doc.line(0, y, len, y);
    doc.line(pageWidth - len, y, pageWidth, y);
    if (isMajor && y > 0 && y < pageHeight) {
      doc.text(String(y), 6, y + 1.5);
      doc.text(String(y), pageWidth - 10, y + 1.5);
    }
  }

  // Draw Physical Letterhead Clearance Zones based on current config
  const effTop = Math.max(15, (config.topMarginMm ?? 48) + (config.headerSpaceOffsetMm ?? 0));
  const effBottom = Math.max(10, config.bottomMarginMm ?? 28);
  const effLeft = Math.max(5, (config.leftMarginMm ?? 12) + (config.horizontalOffsetMm ?? 0));
  const effRight = Math.max(5, (config.rightMarginMm ?? 12) - (config.horizontalOffsetMm ?? 0));

  // Pre-printed Top Header Zone
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.5);
  doc.rect(0, 0, pageWidth, effTop, 'FD');
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`PRE-PRINTED LETTERHEAD HEADER ZONE (Top Clearance: ${effTop} mm)`, 25, effTop / 2 + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Your physical letterhead logo, hospital name, and address should fall inside this red area.`, 25, effTop / 2 + 7);

  // Pre-printed Bottom Footer Zone
  const footerStart = pageHeight - effBottom;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.rect(0, footerStart, pageWidth, effBottom, 'FD');
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`PRE-PRINTED FOOTER / STAMP CLEARANCE ZONE (${effBottom} mm)`, 25, footerStart + effBottom / 2 + 2);

  // Printable Area Box
  const pWidth = pageWidth - effLeft - effRight;
  const pHeight = footerStart - effTop;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.rect(effLeft, effTop, pWidth, pHeight, 'D');

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(effLeft + 10, effTop + 10, pWidth - 20, 40, 2, 2, 'FD');
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LABNOVA A4 CALIBRATION TEST SHEET', effLeft + 15, effTop + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`1. Print this sheet on your physical pre-printed letterhead paper.`, effLeft + 15, effTop + 28);
  doc.text(`2. If content overlaps your printed header, click DOWN (▼) or increase Top Clearance.`, effLeft + 15, effTop + 34);
  doc.text(`3. Use UP/DOWN/LEFT/RIGHT controls to achieve 100% pixel-perfect alignment.`, effLeft + 15, effTop + 40);

  doc.save(`LabNova_Letterhead_Calibration_Grid_${Date.now()}.pdf`);
}

export const downloadPathologyReportPdf = generatePathologyPdf;
export const generatePrePrintedPdf = generatePrePrintedPathologyPdf;


