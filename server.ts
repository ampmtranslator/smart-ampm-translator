/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for JSON so clients can upload base64 images/PDFs directly
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Paths for persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CANVASSING_FILE = path.join(DATA_DIR, 'canvasing.json');

// Ensure directories and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(CONFIG_FILE)) {
  const initialConfig = {
    googleSpreadsheetId: '',
    googleDirectSyncEnabled: false,
    kategoriPerusahaan: [
      "Teknologi & IT",
      "Hukum & Advokasi",
      "Migas & Pertambangan",
      "Keuangan & Perbankan",
      "Manufaktur & Pabrik",
      "Farmasi & Medis",
      "Pariwisata & Hotel",
      "Lain-lain"
    ],
    kategoriProduk: [
      { id: "cat-1", nama: "Sworn Translation" },
      { id: "cat-2", nama: "Non-Sworn Translation" },
      { id: "cat-3", nama: "Legalisasi & Apostille" }
    ],
    produk: [
      { id: "prod-1", nama: "Sworn Inggris-Indonesia (Reguler)", harga: 75000, kategoriId: "cat-1" },
      { id: "prod-2", nama: "Sworn Inggris-Indonesia (Non-Reguler)", harga: 90000, kategoriId: "cat-1" },
      { id: "prod-3", nama: "Non-Sworn Inggris (Non-Teknik)", harga: 30000, kategoriId: "cat-2" },
      { id: "prod-4", nama: "Non-Sworn Inggris (Dokumen Teknik)", harga: 35000, kategoriId: "cat-2" },
      { id: "prod-5", nama: "Apostille Kemenkumham & Kemenlu", harga: 700000, kategoriId: "cat-3" }
    ]
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2));
}

if (!fs.existsSync(CANVASSING_FILE)) {
  const initialCanvasing = [
    {
      id: "CAN-001",
      nomorSurat: "012/AMPM/SP/V/2026",
      namaPerusahaan: "PT Solusi Teknologi Indonesia",
      namaPic: "Andi Wijaya",
      noTelp: "+6281234567890",
      noEmail: "info@solusiteknologi.co.id",
      kategoriPerusahaan: "Teknologi & IT",
      suratPenawaran: "Penawaran Jasa Terjemah Dokumen Audit & Hukum",
      respon: "Follow Up"
    },
    {
      id: "CAN-002",
      nomorSurat: "013/AMPM/SP/V/2026",
      namaPerusahaan: "CV Agro Mandiri Nusantara",
      namaPic: "Dewi Sartika",
      noTelp: "+6287766554433",
      noEmail: "contact@agromandiri.com",
      kategoriPerusahaan: "Pertanian & Ekspor",
      suratPenawaran: "Penawaran Terjemah Sertifikasi Halal & Fitofarmaka",
      respon: "Tidak Respon"
    },
    {
      id: "CAN-003",
      nomorSurat: "014/AMPM/SP/V/2026",
      namaPerusahaan: "PT Samudra Energi Pratama",
      namaPic: "Irwan Hakim",
      noTelp: "+6281122334455",
      noEmail: "corsec@samudraenergi.com",
      kategoriPerusahaan: "Energi & Pertambangan",
      suratPenawaran: "Proposal Jasa Penerjemah Sworn Kontrak Kerja Sama",
      respon: "Closing"
    },
    {
      id: "CAN-004",
      nomorSurat: "015/AMPM/SP/V/2026",
      namaPerusahaan: "PT Global Logistik Indonesia",
      namaPic: "Siti Rahma",
      noTelp: "+6281987654321",
      noEmail: "procurement@globallogistik.co.id",
      kategoriPerusahaan: "Transportasi & Logistik",
      suratPenawaran: "Penawaran Retainer Jasa Dokumen Kepabeanan",
      respon: "Follow Up"
    }
  ];
  fs.writeFileSync(CANVASSING_FILE, JSON.stringify(initialCanvasing, null, 2));
}

// Lazy loaded Gemini API client
let _aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!_aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined. Please add it to your secrets or .env file');
    }
    _aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return _aiClient;
}

// 1. API: Analyze Document using Gemini API
app.post('/api/analyze-document', async (req, res) => {
  try {
    const { fileBase64, fileName, mimeType, targetLanguage } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: 'File data and mimeType are required' });
    }

    const ai = getGeminiClient();

    // Prompt for analyzing the document
    const prompt = `
      Anda adalah asisten AI ahli penerjemah untuk layanan "AMPM Sworn Translator".
      Lakukan analisis dan OCR terhadap dokumen terlampir (bisa gambar surat/identitas atau dokumen PDF).

      Aturan Klasifikasi Kategori Dokumen ("Reguler" vs "Non Reguler"):
      - Dokumen REGULER adala dokumen identitas pribadi standar berikut: KTP, Kartu Keluarga (KK), Akta Kelahiran, Akta Kematian, Paspor, Buku Nikah, atau Akta Nikah.
      - Dokumen NON REGULER adalah seluruh dokumen selain daftar di atas (misalnya: Ijazah, Rapor, Transkrip Nilai, Surat Perjanjian Kerja, Dokumen Perusahaan, MoU, dll).

      Simulasi Halaman Penerjemahan Standar (KRITIS):
      Format target hasil terjemahan disimulasikan ketat di atas standar akademis/hukum fisik berikut:
      - Paper Size: A4
      - Font Family: Times New Roman
      - Font Size: 12pt (Body text)
      - Line Spacing: 1.5 lines
      - Margins: Standard 1 inch (2.54 cm) on all sides.
      - Aturan konversi fisik metrik: 1 Halaman Hasil Terjemahan = Maksimum 380 Kata (1 Page = Max 380 Words).

      Langkah Penghitungan Halaman Hasil Terjemahan Standar:
      1. Hitung total jumlah kata (Word Count) dan karakter dengan spasi (Character Count) di dalam seluruh teks asli dokumen.
      2. Bagikan total jumlah kata tersebut dengan angka 380 (total_kata / 380) untuk mengestimasi exact page count hasil terjemahan standard (contoh: 1,450 kata / 380 = 3.8 halaman).
      3. Jika hasilnya pecahan atau desimal (misalnya 1.1, 1.3, 3.8, dll), maka HAKIKATNYA Anda HARUS SELALU membulatkan desimal tersebut ke atas (CEILING) ke bilangan bulat terdekat (contoh: 3.1 halaman menjadi tepat 4 halaman standar; minimal adalah 1 halaman). Masukkan hasil pembulatan ke atas ini ke dalam variabel "simulatedPagesCount".

      Ekstrak ringkasan isi dokumen sebanyak 300-500 karakter sebagai tinjauan teks (text snippet).

      Kembalikan data analisis Anda secara ketat dalam format JSON yang valid menggunakan skema berikut:
      {
        "documentTypeDetected": "Nama spesifik jenis dokumen yang terdeteksi (seperti KTP, Ijazah, Akta Kelahiran, dll)",
        "category": "Kategori dokumen, harus bernilai 'Reguler' atau 'Non Reguler'",
        "textSnippet": "Ringkasan isi dokumen atau potongan teks 300-500 karakter",
        "wordCount": nilai_angka_jumlah_kata_dalam_dokumen,
        "charCount": nilai_angka_jumlah_karakter_dengan_spasi_dalam_dokumen,
        "simulatedPagesCount": nilai_angka_jumlah_halaman_hasil_simulasi_terjemahan_standar,
        "explanation": "Penjelasan singkat dari mana kesimpulan kategori dan rincian langkah kalkulasi halaman diperoleh (seperti: total kata / 380 = ... dibulatkan ke atas menjadi ... halaman)"
      }
    `;

    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentTypeDetected: { type: Type.STRING },
            category: { type: Type.STRING },
            textSnippet: { type: Type.STRING },
            wordCount: { type: Type.INTEGER },
            charCount: { type: Type.INTEGER },
            simulatedPagesCount: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
          },
          required: ['documentTypeDetected', 'category', 'textSnippet', 'wordCount', 'charCount', 'simulatedPagesCount', 'explanation']
        }
      }
    });

    const resultText = response.text || '{}';
    const analysis = JSON.parse(resultText);

    res.json(analysis);

  } catch (error: any) {
    console.error('Error analyzing document:', error);
    res.status(500).json({ error: error.message || 'Gagal menganalisis dokumen' });
  }
});

// 2. API: Submit Customer Lead
app.post('/api/leads', async (req, res) => {
  try {
    const leadData = req.body;
    
    if (!leadData.customerName || !leadData.customerWhatsapp) {
      return res.status(400).json({ error: 'Nama pelanggan dan Nomor Whatsapp wajib diisi' });
    }

    // Read existing leads
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      try {
        leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
      } catch (e) {
        leads = [];
      }
    }

    const newLead = {
      id: `LEAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...leadData
    };

    leads.unshift(newLead); // Add new lead to the beginning of the list
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

    res.json({
      success: true,
      lead: newLead
    });

  } catch (error: any) {
    console.error('Error submitting lead:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan data lead' });
  }
});

// 2.5 API: Generate 20 Dummy Leads
app.post('/api/leads/generate-dummy', (req, res) => {
  try {
    const dummyLeads = [
      {
        id: "LEAD-MOCK-001",
        customerName: "Andi Hermawan",
        customerWhatsapp: "081234567890",
        customerEmail: "andi.hermawan@gmail.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "KTP_Andi.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "KTP",
        wordCount: 180,
        charCount: 1100,
        calculatedStandardPages: 1,
        speedTier: "Normal",
        costPerPage: 75000,
        totalTranslationCost: 75000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 75000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 75000,
        createdAt: "2026-05-03T09:15:00.000Z"
      },
      {
        id: "LEAD-MOCK-002",
        customerName: "Reza Mahendra",
        customerWhatsapp: "081987654321",
        customerEmail: "reza.mahe@yahoo.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Ijazah_S1_Reza.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Ijazah",
        wordCount: 420,
        charCount: 2900,
        calculatedStandardPages: 2,
        speedTier: "Super Speed",
        costPerPage: 120000,
        totalTranslationCost: 240000,
        addons: { apostille: "Reguler", legalisation: ["Kemenkumham"], skck: false },
        addonCost: 550000,
        grandTotalCost: 790000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 790000,
        createdAt: "2026-05-04T11:20:00.000Z"
      },
      {
        id: "LEAD-MOCK-003",
        customerName: "Kartika Sari",
        customerWhatsapp: "082155443322",
        customerEmail: "kartika.sari@outlook.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Jepang",
        translationType: "sworn",
        fileName: "Akta_Lahir_Kartika.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "Akta Kelahiran",
        wordCount: 210,
        charCount: 1450,
        calculatedStandardPages: 1,
        speedTier: "Normal",
        costPerPage: 150000,
        totalTranslationCost: 150000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 150000,
        status: "Dihubungi",
        isDealed: false,
        createdAt: "2026-05-06T14:35:00.000Z"
      },
      {
        id: "LEAD-MOCK-004",
        customerName: "Yusuf Mansur",
        customerWhatsapp: "085699887766",
        customerEmail: "yusuf.mansur@domain.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Arab",
        translationType: "non-sworn",
        fileName: "Transkrip_Akademik_Yusuf.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Transkrip Nilai",
        wordCount: 650,
        charCount: 4100,
        calculatedStandardPages: 3,
        speedTier: "Normal",
        costPerPage: 50000,
        totalTranslationCost: 150000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 150000,
        status: "Pending",
        isDealed: false,
        createdAt: "2026-05-08T08:05:00.000Z"
      },
      {
        id: "LEAD-MOCK-005",
        customerName: "Farhan Azis",
        customerWhatsapp: "081388776655",
        customerEmail: "farhan.azis@holding.id",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "non-sworn",
        fileName: "Sewa_Jasa_MoU.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Perjanjian Kerja",
        wordCount: 2400,
        charCount: 16800,
        calculatedStandardPages: 10,
        speedTier: "Normal",
        costPerPage: 50000,
        totalTranslationCost: 500000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 500000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 500000,
        createdAt: "2026-05-10T11:45:00.000Z"
      },
      {
        id: "LEAD-MOCK-006",
        customerName: "Siti Rahma",
        customerWhatsapp: "081277665544",
        customerEmail: "siti.rahma@gmail.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Arab",
        translationType: "sworn",
        fileName: "Buku_Nikah_Siti.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "Buku Nikah",
        wordCount: 380,
        charCount: 2500,
        calculatedStandardPages: 2,
        speedTier: "Normal",
        costPerPage: 100000,
        totalTranslationCost: 200000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 200000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Penyegelan Tersumpah",
        dealFinalPrice: 200000,
        createdAt: "2026-05-11T16:10:00.000Z"
      },
      {
        id: "LEAD-MOCK-007",
        customerName: "Diana Putri",
        customerWhatsapp: "081822334455",
        customerEmail: "diana.putri@live.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Mandarin",
        translationType: "sworn",
        fileName: "Paspor_Diana.jpg",
        documentCategory: "Reguler",
        documentTypeDetected: "Paspor",
        wordCount: 190,
        charCount: 1200,
        calculatedStandardPages: 1,
        speedTier: "Same Day",
        costPerPage: 200000,
        totalTranslationCost: 200000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 200000,
        status: "Dihubungi",
        isDealed: true,
        dealStatus: "Dalam Antrean",
        dealFinalPrice: 200000,
        createdAt: "2026-05-12T10:00:00.000Z"
      },
      {
        id: "LEAD-MOCK-008",
        customerName: "Christian Hadi",
        customerWhatsapp: "081199008811",
        customerEmail: "c.hadi@hadi-law.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "non-sworn",
        fileName: "Akta_Pendirian_PT.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Akta Perusahaan",
        wordCount: 3200,
        charCount: 22400,
        calculatedStandardPages: 14,
        speedTier: "Normal",
        costPerPage: 50000,
        totalTranslationCost: 700000,
        addons: { apostille: null, legalisation: ["Kemenkumham", "Kemenlu"], skck: false },
        addonCost: 700000,
        grandTotalCost: 1400000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 1400000,
        createdAt: "2026-05-13T15:30:00.000Z"
      },
      {
        id: "LEAD-MOCK-009",
        customerName: "Amalia Siregar",
        customerWhatsapp: "081266554433",
        customerEmail: "amalia.siregar@yahoo.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Prancis",
        translationType: "sworn",
        fileName: "Kartu_Keluarga_Amalia.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "Kartu Keluarga",
        wordCount: 350,
        charCount: 2200,
        calculatedStandardPages: 2,
        speedTier: "Normal",
        costPerPage: 150000,
        totalTranslationCost: 300000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 300000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 300000,
        createdAt: "2026-05-14T09:20:00.000Z"
      },
      {
        id: "LEAD-MOCK-010",
        customerName: "Bambang Utomo",
        customerWhatsapp: "085522113344",
        customerEmail: "bambang.utomo@gmail.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Jerman",
        translationType: "sworn",
        fileName: "Rapor_SMA_Bambang.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Rapor Nilai",
        wordCount: 1100,
        charCount: 7800,
        calculatedStandardPages: 5,
        speedTier: "Normal",
        costPerPage: 150000,
        totalTranslationCost: 750000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 750000,
        status: "Pending",
        isDealed: false,
        createdAt: "2026-05-15T11:50:00.000Z"
      },
      {
        id: "LEAD-MOCK-011",
        customerName: "Rendra Pratama",
        customerWhatsapp: "081299887711",
        customerEmail: "rendra.pratama@gmail.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Surat_Kuasa_Waris.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Surat Kuasa",
        wordCount: 850,
        charCount: 5800,
        calculatedStandardPages: 4,
        speedTier: "Normal",
        costPerPage: 75000,
        totalTranslationCost: 300000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 300000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 300000,
        createdAt: "2026-05-16T13:40:00.000Z"
      },
      {
        id: "LEAD-MOCK-012",
        customerName: "Nadia Fitriani",
        customerWhatsapp: "081122334499",
        customerEmail: "nadia.fit@live.co.id",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Akta_Cerai_Nadia.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "Akta Cerai",
        wordCount: 450,
        charCount: 3100,
        calculatedStandardPages: 2,
        speedTier: "Same Day",
        costPerPage: 120000,
        totalTranslationCost: 240000,
        addons: { apostille: "Reguler", legalisation: null, skck: false },
        addonCost: 350000,
        grandTotalCost: 590000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 590000,
        createdAt: "2026-05-17T15:10:00.000Z"
      },
      {
        id: "LEAD-MOCK-013",
        customerName: "Ferry Wijaya",
        customerWhatsapp: "081833445566",
        customerEmail: "ferry.w@techfinance.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Mandarin",
        translationType: "non-sworn",
        fileName: "Laporan_Keuangan_Audit.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Laporan Keuangan",
        wordCount: 4400,
        charCount: 31000,
        calculatedStandardPages: 20,
        speedTier: "Normal",
        costPerPage: 100000,
        totalTranslationCost: 2000000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 2000000,
        status: "Pending",
        isDealed: false,
        createdAt: "2026-05-18T10:00:00.000Z"
      },
      {
        id: "LEAD-MOCK-014",
        customerName: "Gita Gutawa",
        customerWhatsapp: "081288990011",
        customerEmail: "gita.gut@music.id",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Sertifikat_Halal_MUI.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Sertifikat",
        wordCount: 190,
        charCount: 1300,
        calculatedStandardPages: 1,
        speedTier: "Normal",
        costPerPage: 75000,
        totalTranslationCost: 75000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 75000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 75000,
        createdAt: "2026-05-19T14:45:00.000Z"
      },
      {
        id: "LEAD-MOCK-015",
        customerName: "Indra Bekti",
        customerWhatsapp: "081377889922",
        customerEmail: "indra.bekti@ent.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Surat_Domisili.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "Surat Domisili",
        wordCount: 220,
        charCount: 1510,
        calculatedStandardPages: 1,
        speedTier: "Normal",
        costPerPage: 75000,
        totalTranslationCost: 75000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 75000,
        status: "Dihubungi",
        isDealed: false,
        createdAt: "2026-05-20T08:30:00.000Z"
      },
      {
        id: "LEAD-MOCK-016",
        customerName: "Hendra Setiawan",
        customerWhatsapp: "081255447788",
        customerEmail: "hendra.setiawan@badminton.id",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Anggaran_Dasar_PT_Hendra.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Akta Perusahaan",
        wordCount: 2300,
        charCount: 16000,
        calculatedStandardPages: 10,
        speedTier: "Super Speed",
        costPerPage: 120000,
        totalTranslationCost: 1200000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 1200000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Proses Proofreading",
        dealFinalPrice: 1200000,
        createdAt: "2026-05-20T16:55:00.000Z"
      },
      {
        id: "LEAD-MOCK-017",
        customerName: "Lani Aprilia",
        customerWhatsapp: "081977661122",
        customerEmail: "lani.aprilia@gmail.com",
        sourceLanguage: "Indonesia",
        targetLanguage: "Belanda",
        translationType: "sworn",
        fileName: "Akta_Kematian_Kakek.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "Akta Kematian",
        wordCount: 170,
        charCount: 1050,
        calculatedStandardPages: 1,
        speedTier: "Same Day",
        costPerPage: 200000,
        totalTranslationCost: 200000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 200000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 200000,
        createdAt: "2026-05-21T10:15:00.000Z"
      },
      {
        id: "LEAD-MOCK-018",
        customerName: "Taufik Hidayat",
        customerWhatsapp: "081155667788",
        customerEmail: "taufik.h@indonesia-sport.go.id",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Putusan_Pengadilan.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Putusan Pengadilan",
        wordCount: 8200,
        charCount: 57000,
        calculatedStandardPages: 35,
        speedTier: "Normal",
        costPerPage: 75000,
        totalTranslationCost: 2625000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 2625000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 2625000,
        createdAt: "2026-05-21T14:00:00.000Z"
      },
      {
        id: "LEAD-MOCK-019",
        customerName: "Jessica Mila",
        customerWhatsapp: "081211223344",
        customerEmail: "jessica.mila@actress.id",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Prenup_Agreement.pdf",
        documentCategory: "Non Reguler",
        documentTypeDetected: "Perjanjian Pranikah",
        wordCount: 2605,
        charCount: 18200,
        calculatedStandardPages: 12,
        speedTier: "Normal",
        costPerPage: 75000,
        totalTranslationCost: 900000,
        addons: { apostille: null, legalisation: null, skck: false },
        addonCost: 0,
        grandTotalCost: 900000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 900000,
        createdAt: "2026-05-22T11:20:00.000Z"
      },
      {
        id: "LEAD-MOCK-020",
        customerName: "Kevin Sanjaya",
        customerWhatsapp: "081399001122",
        customerEmail: "kevin.sanjaya@badminton.id",
        sourceLanguage: "Indonesia",
        targetLanguage: "Inggris",
        translationType: "sworn",
        fileName: "Surat_Sehat.pdf",
        documentCategory: "Reguler",
        documentTypeDetected: "Surat Keterangan Sehat",
        wordCount: 160,
        charCount: 980,
        calculatedStandardPages: 1,
        speedTier: "Normal",
        costPerPage: 75000,
        totalTranslationCost: 75000,
        addons: { apostille: null, legalisation: null, skck: true },
        addonCost: 150000,
        grandTotalCost: 225000,
        status: "Selesai",
        isDealed: true,
        dealStatus: "Selesai",
        dealFinalPrice: 225000,
        createdAt: "2026-05-22T16:45:00.000Z"
      }
    ];

    // Read current leads
    let currentLeads = [];
    if (fs.existsSync(LEADS_FILE)) {
      try {
        currentLeads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
      } catch (e) {
        currentLeads = [];
      }
    }

    // Filter out previously generated mock leads to prevent direct duplicates
    currentLeads = currentLeads.filter((l: any) => !l.id.startsWith("LEAD-MOCK-"));

    const finalLeads = [...dummyLeads, ...currentLeads];
    fs.writeFileSync(LEADS_FILE, JSON.stringify(finalLeads, null, 2));

    res.json({ success: true, count: dummyLeads.length, leads: dummyLeads });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal membuat data dummy' });
  }
});

// 3. API: List Leads (Admin dashboard)
app.get('/api/leads', (req, res) => {
  try {
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    }
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengambil data leads' });
  }
});

// 4. API: Update Lead Status / Order Fields
app.patch('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!fs.existsSync(LEADS_FILE)) {
      return res.status(404).json({ error: 'Data leads tidak ditemukan' });
    }

    const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    const index = leads.findIndex((l: any) => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Lead tidak ditemukan' });
    }

    // Merge everything in req.body to index
    leads[index] = { ...leads[index], ...req.body };
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

    res.json({ success: true, lead: leads[index] });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui data lead/order' });
  }
});

// 5. API: Remove Lead
app.delete('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!fs.existsSync(LEADS_FILE)) {
      return res.status(404).json({ error: 'Data leads tidak ditemukan' });
    }

    let leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    leads = leads.filter((l: any) => l.id !== id);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus lead' });
  }
});

// 6. API: Get Google Sheets & App Configuration (including products & corporate config)
app.get('/api/sheet-config', (req, res) => {
  try {
    let config: any = { googleSpreadsheetId: '', googleDirectSyncEnabled: false };
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    
    let updated = false;
    if (!config.kategoriPerusahaan) {
      config.kategoriPerusahaan = [
        "Teknologi & IT",
        "Hukum & Advokasi",
        "Migas & Pertambangan",
        "Keuangan & Perbankan",
        "Manufaktur & Pabrik",
        "Farmasi & Medis",
        "Pariwisata & Hotel",
        "Lain-lain"
      ];
      updated = true;
    }
    if (!config.kategoriProduk) {
      config.kategoriProduk = [
        { id: "cat-1", nama: "Sworn Translation" },
        { id: "cat-2", nama: "Non-Sworn Translation" },
        { id: "cat-3", nama: "Legalisasi & Apostille" }
      ];
      updated = true;
    }
    if (!config.produk) {
      config.produk = [
        { id: "prod-1", nama: "Sworn Inggris-Indonesia (Reguler)", harga: 75000, kategoriId: "cat-1" },
        { id: "prod-2", nama: "Sworn Inggris-Indonesia (Non-Reguler)", harga: 90000, kategoriId: "cat-1" },
        { id: "prod-3", nama: "Non-Sworn Inggris (Non-Teknik)", harga: 30000, kategoriId: "cat-2" },
        { id: "prod-4", nama: "Non-Sworn Inggris (Dokumen Teknik)", harga: 35000, kategoriId: "cat-2" },
        { id: "prod-5", nama: "Apostille Kemenkumham & Kemenlu", harga: 700000, kategoriId: "cat-3" }
      ];
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat konfigurasi aplikasi' });
  }
});

// 7. API: Save Google Sheets & App Configuration
app.post('/api/sheet-config', (req, res) => {
  try {
    let existingConfig: any = {};
    if (fs.existsSync(CONFIG_FILE)) {
      existingConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }

    const { 
      googleSpreadsheetId, 
      googleDirectSyncEnabled, 
      kategoriPerusahaan, 
      produk, 
      kategoriProduk 
    } = req.body;

    const config = { 
      googleSpreadsheetId: googleSpreadsheetId !== undefined ? googleSpreadsheetId : (existingConfig.googleSpreadsheetId || ''), 
      googleDirectSyncEnabled: googleDirectSyncEnabled !== undefined ? !!googleDirectSyncEnabled : !!(existingConfig.googleDirectSyncEnabled || false),
      kategoriPerusahaan: kategoriPerusahaan || existingConfig.kategoriPerusahaan || [
        "Teknologi & IT",
        "Hukum & Advokasi",
        "Migas & Pertambangan",
        "Keuangan & Perbankan",
        "Manufaktur & Pabrik",
        "Farmasi & Medis",
        "Pariwisata & Hotel",
        "Lain-lain"
      ],
      kategoriProduk: kategoriProduk || existingConfig.kategoriProduk || [
        { id: "cat-1", nama: "Sworn Translation" },
        { id: "cat-2", nama: "Non-Sworn Translation" },
        { id: "cat-3", nama: "Legalisasi & Apostille" }
      ],
      produk: produk || existingConfig.produk || [
        { id: "prod-1", nama: "Sworn Inggris-Indonesia (Reguler)", harga: 75000, kategoriId: "cat-1" },
        { id: "prod-2", nama: "Sworn Inggris-Indonesia (Non-Reguler)", harga: 90000, kategoriId: "cat-1" },
        { id: "prod-3", nama: "Non-Sworn Inggris (Non-Teknik)", harga: 30000, kategoriId: "cat-2" },
        { id: "prod-4", nama: "Non-Sworn Inggris (Dokumen Teknik)", harga: 35000, kategoriId: "cat-2" },
        { id: "prod-5", nama: "Apostille Kemenkumham & Kemenlu", harga: 700000, kategoriId: "cat-3" }
      ]
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengatur konfigurasi' });
  }
});

// Helper to normalize canvasing status
const mapStatus = (status: string) => {
  if (status === 'Tidak ada jawaban') return 'Tidak Respon';
  if (status === 'Perlu Follow Up') return 'Follow Up';
  return status || 'Tidak Respon';
};

// 8. API: List Canvasing contacts
app.get('/api/canvasing', (req, res) => {
  try {
    let contacts = [];
    if (fs.existsSync(CANVASSING_FILE)) {
      contacts = JSON.parse(fs.readFileSync(CANVASSING_FILE, 'utf8'));
    }
    // Map existing old statuses if any
    contacts = contacts.map((c: any) => ({
      ...c,
      respon: mapStatus(c.respon)
    }));
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat data kontak Canvasing' });
  }
});

// 9. API: Create Canvasing contact
app.post('/api/canvasing', (req, res) => {
  try {
    const { nomorSurat, namaPerusahaan, namaPic, noTelp, noEmail, kategoriPerusahaan, suratPenawaran, respon } = req.body;
    
    let contacts = [];
    if (fs.existsSync(CANVASSING_FILE)) {
      contacts = JSON.parse(fs.readFileSync(CANVASSING_FILE, 'utf8'));
    }

    // Generate CAN-XXX ID
    const nextNum = contacts.length > 0 ? Math.max(...contacts.map((c: any) => {
      const match = c.id.match(/CAN-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    })) + 1 : 1;
    const id = `CAN-${String(nextNum).padStart(3, '0')}`;

    const newContact = {
      id,
      nomorSurat: nomorSurat || `${String(nextNum).padStart(3, '0')}/AMPM/SP/V/2026`,
      namaPerusahaan,
      namaPic: namaPic || '',
      noTelp,
      noEmail: noEmail || '',
      kategoriPerusahaan,
      suratPenawaran: suratPenawaran || 'Penawaran Jasa Penerjemah Sworn Resmi',
      respon: mapStatus(respon)
    };

    contacts.unshift(newContact);
    fs.writeFileSync(CANVASSING_FILE, JSON.stringify(contacts, null, 2));

    res.json({ success: true, contact: newContact });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menambahkan kontak Canvasing' });
  }
});

// 10. API: Patch / Update Canvasing contact
app.patch('/api/canvasing/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!fs.existsSync(CANVASSING_FILE)) {
      return res.status(404).json({ error: 'File data canvasing tidak ditemukan' });
    }

    const contacts = JSON.parse(fs.readFileSync(CANVASSING_FILE, 'utf8'));
    const index = contacts.findIndex((c: any) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Kontak Canvasing tidak ditemukan' });
    }

    const updatedData = { ...req.body };
    if (updatedData.respon) {
      updatedData.respon = mapStatus(updatedData.respon);
    }

    contacts[index] = { ...contacts[index], ...updatedData };
    fs.writeFileSync(CANVASSING_FILE, JSON.stringify(contacts, null, 2));

    res.json({ success: true, contact: contacts[index] });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal membarui status respon kontak Canvasing' });
  }
});

// 11. API: Remove Canvasing contact
app.delete('/api/canvasing/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!fs.existsSync(CANVASSING_FILE)) {
      return res.status(404).json({ error: 'File data canvasing tidak ditemukan' });
    }

    let contacts = JSON.parse(fs.readFileSync(CANVASSING_FILE, 'utf8'));
    contacts = contacts.filter((c: any) => c.id !== id);
    fs.writeFileSync(CANVASSING_FILE, JSON.stringify(contacts, null, 2));

    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus kontak Canvasing' });
  }
});

// Integrate Vite middleware for development or Static Asset serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for all frontend routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AMPM Sworn Translator] Backend running on port ${PORT}`);
  });
}

startServer();
