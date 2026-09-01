import { PrePrintedLetterheadConfig, DigitalLetterheadConfig, ReportLayoutVisibilityConfig } from '../types';

export const DEFAULT_REPORT_LAYOUT_VISIBILITY: ReportLayoutVisibilityConfig = {
  showDailySign: true, // Daily Sign / Lab Technologist signature & QC block
  showVerified: true, // Verified / Consultant Pathologist signature & NABL Signatory stamp
  showDigitalSignatureQr: true, // 21 CFR Part 11 QR Matrix & digital hash badge
  showClinicalImpression: true, // Clinical Impression & Pathologist Advice box
  showDepartmentMethod: true, // Department & Analyzer Method info on test banner
  showPatientDemographicsBox: true, // Bordered Patient Demographics / UHID card
  showCategoryHeaders: true, // Category grouping sub-headers (e.g. [ HEMATOLOGY ])
  showEndDisclaimer: true, // "** End of Diagnostic Examination Report **" disclaimer
};

export const DEFAULT_DIGITAL_CONFIG: DigitalLetterheadConfig = {
  topOffsetMm: 0, // Vertical position offset in mm: UP (negative) or DOWN (positive)
  horizontalOffsetMm: 0, // Horizontal position offset in mm: LEFT (negative) or RIGHT (positive)
  tableFontSizePt: 9.5, // Standard 9.5pt font size for test investigations table
  ...DEFAULT_REPORT_LAYOUT_VISIBILITY,
};

export const DEFAULT_PREPRINTED_CONFIG: PrePrintedLetterheadConfig = {
  topMarginMm: 48, // Standard 48mm top clearance for physical letterhead banner
  bottomMarginMm: 28, // Standard 28mm bottom clearance for physical letterhead footer / signatures
  leftMarginMm: 12, // Standard 12mm left margin
  rightMarginMm: 12, // Standard 12mm right margin
  continuationTopMarginMm: 22, // 22mm top clearance on continuation pages (Page 2+)
  headerSpaceOffsetMm: 0, // Nudge UP (negative) or DOWN (positive)
  horizontalOffsetMm: 0, // Nudge LEFT (negative) or RIGHT (positive)
  includeSignatures: true, // Print digital verification signatures
  includePatientBox: true, // Draw bordered patient demographics box
  tableFontSizePt: 9.5, // Standard 9.5pt font size for test investigations table (clearly readable on A4)
  ...DEFAULT_REPORT_LAYOUT_VISIBILITY,
};

const STORAGE_KEY = 'labnova_preprinted_letterhead_config_v1';
const DIGITAL_STORAGE_KEY = 'labnova_digital_letterhead_config_v1';

/**
 * Loads the saved digital letterhead configuration from localStorage or returns default.
 */
export function getDigitalConfig(): DigitalLetterheadConfig {
  try {
    const saved = localStorage.getItem(DIGITAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_DIGITAL_CONFIG,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to read digital letterhead configuration from storage:', e);
  }
  return { ...DEFAULT_DIGITAL_CONFIG };
}

/**
 * Persists the digital letterhead configuration to localStorage.
 */
export function saveDigitalConfig(config: DigitalLetterheadConfig): void {
  try {
    localStorage.setItem(DIGITAL_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save digital letterhead configuration:', e);
  }
}

/**
 * Resets the digital letterhead configuration to default.
 */
export function resetDigitalConfig(): DigitalLetterheadConfig {
  try {
    localStorage.removeItem(DIGITAL_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset digital letterhead configuration:', e);
  }
  return { ...DEFAULT_DIGITAL_CONFIG };
}

/**
 * Loads the saved pre-printed letterhead configuration from localStorage or returns default.
 */
export function getPrePrintedConfig(): PrePrintedLetterheadConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PREPRINTED_CONFIG,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to read pre-printed letterhead configuration from storage:', e);
  }
  return { ...DEFAULT_PREPRINTED_CONFIG };
}

/**
 * Persists the pre-printed letterhead configuration to localStorage.
 */
export function savePrePrintedConfig(config: PrePrintedLetterheadConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save pre-printed letterhead configuration:', e);
  }
}

/**
 * Resets the pre-printed letterhead configuration to the default laboratory standard.
 */
export function resetPrePrintedConfig(): PrePrintedLetterheadConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset pre-printed letterhead configuration:', e);
  }
  return { ...DEFAULT_PREPRINTED_CONFIG };
}
