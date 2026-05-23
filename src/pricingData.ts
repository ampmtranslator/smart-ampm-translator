/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PricingRule } from './types';

export const SWORN_PRICING: Record<string, PricingRule> = {
  English: {
    targetLanguage: 'Inggris',
    isSworn: true,
    prices: {
      normalReguler: 75000,
      normalNonReguler: 90000,
      superSpeedReguler: 225000,
      sameDayReguler: 200000,
      nextDayReguler: 150000,
      superSpeedNonReguler: 250000,
      sameDayNonReguler: 225000,
      nextDayNonReguler: 200000,
    }
  },
  Dutch: {
    targetLanguage: 'Belanda',
    isSworn: true,
    prices: {
      normalReguler: 250000,
      normalNonReguler: 350000,
      superSpeedReguler: 450000,
      nextDayReguler: 350000,
      superSpeedNonReguler: 650000,
      nextDayNonReguler: 450000,
    }
  },
  Mandarin: {
    targetLanguage: 'Mandarin (Tiongkok)',
    isSworn: true,
    prices: {
      normalReguler: 320000,
      normalNonReguler: 320000,
      superSpeedReguler: 650000,
      superSpeedNonReguler: 650000,
      normalGeneral: 320000,
      kilatGeneral: 650000
    }
  },
  German: {
    targetLanguage: 'Jerman',
    isSworn: true,
    prices: {
      normalReguler: 375000,
      normalNonReguler: 375000,
      superSpeedReguler: 750000,
      superSpeedNonReguler: 750000,
      normalGeneral: 375000,
      kilatGeneral: 750000
    }
  },
  Arabic: {
    targetLanguage: 'Arab',
    isSworn: true,
    prices: {
      normalReguler: 200000,
      normalNonReguler: 200000,
      superSpeedReguler: 380000,
      superSpeedNonReguler: 380000,
      normalGeneral: 200000,
      kilatGeneral: 380000
    }
  },
  French: {
    targetLanguage: 'Perancis',
    isSworn: true,
    prices: {
      normalReguler: 325000,
      normalNonReguler: 325000,
      superSpeedReguler: 650000,
      superSpeedNonReguler: 650000,
      normalGeneral: 325000,
      kilatGeneral: 650000
    }
  },
  Korean: {
    targetLanguage: 'Korea',
    isSworn: true,
    prices: {
      normalReguler: 350000,
      normalNonReguler: 350000,
      superSpeedReguler: 700000,
      superSpeedNonReguler: 700000,
      normalGeneral: 350000,
      kilatGeneral: 700000
    }
  },
  Japanese: {
    targetLanguage: 'Jepang',
    isSworn: true,
    prices: {
      normalReguler: 450000,
      normalNonReguler: 450000,
      superSpeedReguler: 900000,
      superSpeedNonReguler: 900000,
      normalGeneral: 450000,
      kilatGeneral: 900000
    }
  },
  Russian: {
    targetLanguage: 'Rusia',
    isSworn: true,
    prices: {
      normalReguler: 325000,
      normalNonReguler: 325000,
      superSpeedReguler: 650000,
      superSpeedNonReguler: 650000,
      normalGeneral: 325000,
      kilatGeneral: 650000
    }
  },
  Spanish: {
    targetLanguage: 'Spanyol',
    isSworn: true,
    prices: {
      normalReguler: 300000,
      normalNonReguler: 300000,
      superSpeedReguler: 600000,
      superSpeedNonReguler: 600000,
      normalGeneral: 300000,
      kilatGeneral: 600000
    }
  }
};

export const NON_SWORN_PRICING: Record<string, { term: string; price: number }> = {
  EnglishNonTechnical: {
    term: 'Inggris Non-Teknik',
    price: 30000
  },
  EnglishTechnical: {
    term: 'Inggris Dokumen Teknik',
    price: 35000
  },
  MandarinNonSworn: {
    term: 'Mandarin',
    price: 100000
  },
  TurkishHPI: {
    term: 'Turki (HPI)',
    price: 200000
  }
};

export const APOSTILLE_PRICING = {
  Express: { name: 'Apostille Express (1-2 Hari Kerja)', price: 1300000 },
  Reguler: { name: 'Apostille Reguler (4-6 Hari Kerja)', price: 700000 }
};

export const LEGALISATION_PRICING: Record<string, { name: string; price: number }> = {
  NotarisExpress: { name: 'Notaris Express (1-2 Hari)', price: 475000 },
  NotarisReguler: { name: 'Notaris Reguler (2-4 Hari)', price: 350000 },
  KemenkumhamReguler: { name: 'Kemenkumham Kerja Reguler (2-4 Hari)', price: 400000 },
  KemenkumhamExpress: { name: 'Kemenkumham Express (1-3 Hari)', price: 550000 },
  Kemenag: { name: 'Kementerian Agama (1-4 Hari)', price: 600000 },
  KemenluReguler: { name: 'Kemenlu Reguler (2-4 Hari)', price: 475000 },
  KemenluExpress: { name: 'Kemenlu Express (1-3 Hari)', price: 650000 },
  Dikti: { name: 'Dikti (7-11 Hari)', price: 800000 },
  MA: { name: 'MA (3-6 Hari)', price: 700000 },
  
  // Kedutaan Asing
  TaiwanTETO: { name: 'Kedutaan Taiwan (TETO) (5-7 Hari)', price: 850000 },
  Iraq: { name: 'Kedutaan Iraq (4-6 Hari)', price: 950000 },
  Iran: { name: 'Kedutaan Iran (20-32 Hari)', price: 1100000 },
  Vietnam: { name: 'Kedutaan Vietnam (2-4 Hari)', price: 750000 },
  UEA: { name: 'Kedutaan UEA (Dubai) (3-6 Hari)', price: 1400000 },
  Thailand: { name: 'Kedutaan Thailand (5-8 Hari)', price: 850000 },
  Malaysia: { name: 'Kedutaan Malaysia (1-4 Hari)', price: 450000 },
  Qatar: { name: 'Kedutaan Qatar (4-7 Hari)', price: 1200000 },
  Kuwait: { name: 'Kedutaan Kuwait (3-6 Hari)', price: 1100000 },
  Etiopia: { name: 'Kedutaan Etiopia (3-5 Hari)', price: 1800000 },
  Jordan: { name: 'Kedutaan Jordan (4-8 Hari)', price: 1100000 },
  
  // SKCK
  SKCKMabesPolri: { name: 'SKCK Mabes Polri (2-6 Hari)', price: 800000 }
};

export function calculateLeadCost(
  langKey: string,
  type: 'sworn' | 'non-sworn',
  category: 'Reguler' | 'Non Reguler',
  speed: 'Normal' | 'Super Speed' | 'Same Day' | 'Speed Jadi Besok',
  pages: number,
  addonsSelected: {
    apostille?: 'Express' | 'Reguler' | null;
    legalisation?: string[] | null;
    skck?: boolean;
    otherEmbassy?: string | null;
  }
): { costPerPage: number; translationCost: number; addonCost: number; grandTotal: number } {
  let costPerPage = 0;

  if (type === 'sworn') {
    const pricing = SWORN_PRICING[langKey];
    if (pricing) {
      const p = pricing.prices;
      const isReg = category === 'Reguler';
      
      if (speed === 'Normal') {
        costPerPage = isReg ? p.normalReguler : p.normalNonReguler;
      } else if (speed === 'Super Speed') {
        costPerPage = isReg 
          ? (p.superSpeedReguler ?? p.kilatGeneral ?? p.normalReguler * 2)
          : (p.superSpeedNonReguler ?? p.kilatGeneral ?? p.normalNonReguler * 2);
      } else if (speed === 'Same Day') {
        costPerPage = isReg
          ? (p.sameDayReguler ?? p.kilatGeneral ?? p.normalReguler * 1.8)
          : (p.sameDayNonReguler ?? p.kilatGeneral ?? p.normalNonReguler * 1.8);
      } else if (speed === 'Speed Jadi Besok') {
        costPerPage = isReg
          ? (p.nextDayReguler ?? p.kilatGeneral ?? p.normalReguler * 1.5)
          : (p.nextDayNonReguler ?? p.kilatGeneral ?? p.normalNonReguler * 1.5);
      }
    } else {
      // Fallback
      costPerPage = category === 'Reguler' ? 75000 : 90000;
    }
  } else {
    // Non-sworn
    const pricing = NON_SWORN_PRICING[langKey];
    costPerPage = pricing ? pricing.price : 30000;
  }

  const translationCost = costPerPage * pages;

  // Addon costs
  let addonCost = 0;
  if (addonsSelected.apostille) {
    addonCost += APOSTILLE_PRICING[addonsSelected.apostille].price;
  }
  if (addonsSelected.legalisation) {
    addonsSelected.legalisation.forEach((key) => {
      const item = LEGALISATION_PRICING[key];
      if (item) {
        addonCost += item.price;
      }
    });
  }
  if (addonsSelected.skck) {
    const item = LEGALISATION_PRICING['SKCKMabesPolri'];
    if (item) {
      addonCost += item.price;
    }
  }

  const grandTotal = translationCost + addonCost;

  return {
    costPerPage,
    translationCost,
    addonCost,
    grandTotal
  };
}
