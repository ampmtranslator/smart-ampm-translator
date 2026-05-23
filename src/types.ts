/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationLead {
  id: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail?: string;
  sourceLanguage: string;
  targetLanguage: string;
  translationType: 'sworn' | 'non-sworn';
  fileName: string;
  fileSize?: string;
  textExtractedSnippet?: string;
  documentCategory: 'Reguler' | 'Non Reguler';
  documentTypeDetected: string;
  wordCount: number;
  charCount: number;
  calculatedStandardPages: number;
  speedTier: 'Normal' | 'Super Speed' | 'Same Day' | 'Speed Jadi Besok';
  costPerPage: number;
  totalTranslationCost: number;
  
  // Optional certifications / add-ons
  addons: {
    apostille?: 'Express' | 'Reguler' | null;
    legalisation?: string[] | null;
    skck?: boolean;
    otherEmbassy?: string | null;
  };
  addonCost: number;
  grandTotalCost: number;
  status: 'Pending' | 'Selesai' | 'Dihubungi';
  createdAt: string;

  // Order Management fields for Deal Status
  isDealed?: boolean;
  dealDeadline?: string;
  dealStatus?: 'Dalam Antrean' | 'Pengerjaan Terjemah' | 'Proses Proofreading' | 'Penyegelan Tersumpah' | 'Selesai' | 'Dibatalkan';
  dealFinalPrice?: number;
  orderNotes?: string;
}

export interface PricingRule {
  targetLanguage: string;
  isSworn: boolean;
  prices: {
    normalReguler: number;
    normalNonReguler: number;
    // Kilat packages
    superSpeedReguler?: number;
    sameDayReguler?: number;
    nextDayReguler?: number;
    superSpeedNonReguler?: number;
    sameDayNonReguler?: number;
    nextDayNonReguler?: number;
    
    // Fallback or generic prices
    normalGeneral?: number;
    kilatGeneral?: number;
  };
}

// Config for Google Sheets Integration
export interface GoogleSheetConfig {
  googleSpreadsheetId?: string;
  googleDirectSyncEnabled?: boolean;
}

export interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  type: string;
  base64: string;
  status: 'idle' | 'analyzing' | 'success' | 'error';
  errorMessage?: string;
  documentTypeDetected?: string;
  category?: 'Reguler' | 'Non Reguler';
  wordCount?: number;
  charCount?: number;
  simulatedPages?: number;
  explanation?: string;
  textSnippet?: string;
}
