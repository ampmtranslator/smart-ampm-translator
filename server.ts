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
import { createAdminClient } from '@insforge/sdk';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize InsForge Admin SDK client
const insforge = createAdminClient({
  baseUrl: process.env.INSFORGE_URL || "https://4tukju5j.ap-southeast.insforge.app",
  apiKey: process.env.INSFORGE_API_KEY || "ik_d729001667346d2992abbf044484f74c",
});

// Mapper helpers for Leads
function mapLeadToDB(lead: any): any {
  if (!lead) return null;
  return {
    id: lead.id,
    customer_name: lead.customerName,
    customer_whatsapp: lead.customerWhatsapp,
    customer_email: lead.customerEmail,
    source_language: lead.sourceLanguage,
    target_language: lead.targetLanguage,
    translation_type: lead.translationType,
    file_name: lead.fileName,
    file_size: lead.fileSize,
    text_extracted_snippet: lead.textExtractedSnippet,
    document_category: lead.documentCategory,
    document_type_detected: lead.documentTypeDetected,
    word_count: lead.wordCount || 0,
    char_count: lead.charCount || 0,
    calculated_standard_pages: lead.calculatedStandardPages || 0,
    speed_tier: lead.speedTier,
    cost_per_page: lead.costPerPage || 0,
    total_translation_cost: lead.totalTranslationCost || 0,
    addons: lead.addons || {},
    addon_cost: lead.addonCost || 0,
    grand_total_cost: lead.grandTotalCost || 0,
    status: lead.status || 'Pending',
    created_at: lead.createdAt || new Date().toISOString(),
    is_dealed: lead.isDealed || false,
    is_paid: lead.isPaid || false,
    deal_deadline: lead.dealDeadline,
    deal_status: lead.dealStatus,
    deal_final_price: lead.dealFinalPrice || 0,
    order_notes: lead.orderNotes,
    invoice_items: lead.invoiceItems || [],
    vendor: lead.vendor,
    process: lead.process,
    agent_id: lead.agentId
  };
}

function mapLeadFromDB(dbLead: any): any {
  if (!dbLead) return null;
  return {
    id: dbLead.id,
    customerName: dbLead.customer_name,
    customerWhatsapp: dbLead.customer_whatsapp,
    customerEmail: dbLead.customer_email,
    sourceLanguage: dbLead.source_language,
    targetLanguage: dbLead.target_language,
    translationType: dbLead.translation_type,
    fileName: dbLead.file_name,
    fileSize: dbLead.file_size,
    textExtractedSnippet: dbLead.text_extracted_snippet,
    documentCategory: dbLead.document_category,
    documentTypeDetected: dbLead.document_type_detected,
    wordCount: dbLead.word_count,
    charCount: dbLead.char_count,
    calculatedStandardPages: dbLead.calculated_standard_pages ? parseFloat(dbLead.calculated_standard_pages) : 0,
    speedTier: dbLead.speed_tier,
    costPerPage: dbLead.cost_per_page ? parseFloat(dbLead.cost_per_page) : 0,
    totalTranslationCost: dbLead.total_translation_cost ? parseFloat(dbLead.total_translation_cost) : 0,
    addons: dbLead.addons,
    addonCost: dbLead.addon_cost ? parseFloat(dbLead.addon_cost) : 0,
    grandTotalCost: dbLead.grand_total_cost ? parseFloat(dbLead.grand_total_cost) : 0,
    status: dbLead.status,
    createdAt: dbLead.created_at,
    isDealed: dbLead.is_dealed,
    isPaid: dbLead.is_paid,
    dealDeadline: dbLead.deal_deadline,
    dealStatus: dbLead.deal_status,
    dealFinalPrice: dbLead.deal_final_price ? parseFloat(dbLead.deal_final_price) : 0,
    orderNotes: dbLead.order_notes,
    invoiceItems: dbLead.invoice_items,
    vendor: dbLead.vendor,
    process: dbLead.process,
    agentId: dbLead.agent_id
  };
}

// Mapper helpers for Canvasing
function mapCanvasingToDB(contact: any): any {
  if (!contact) return null;
  return {
    id: contact.id,
    nomor_surat: contact.nomorSurat,
    nama_perusahaan: contact.namaPerusahaan,
    nama_pic: contact.namaPic,
    no_telp: contact.noTelp,
    no_email: contact.noEmail,
    kategori_perusahaan: contact.kategoriPerusahaan,
    surat_penawaran: contact.suratPenawaran,
    respon: contact.respon
  };
}

function mapCanvasingFromDB(dbContact: any): any {
  if (!dbContact) return null;
  return {
    id: dbContact.id,
    nomorSurat: dbContact.nomor_surat,
    namaPerusahaan: dbContact.nama_perusahaan,
    namaPic: dbContact.nama_pic,
    noTelp: dbContact.no_telp,
    noEmail: dbContact.no_email,
    kategoriPerusahaan: dbContact.kategori_perusahaan,
    suratPenawaran: dbContact.surat_penawaran,
    respon: dbContact.respon
  };
}

// Mapper helpers for Vendors
function mapVendorToDB(vendor: any): any {
  if (!vendor) return null;
  return {
    id: vendor.id,
    nama: vendor.nama,
    alamat: vendor.alamat,
    no_wa: vendor.noWa,
    pricelist: vendor.pricelist || []
  };
}

function mapVendorFromDB(dbVendor: any): any {
  if (!dbVendor) return null;
  return {
    id: dbVendor.id,
    nama: dbVendor.nama,
    alamat: dbVendor.alamat,
    noWa: dbVendor.no_wa,
    pricelist: dbVendor.pricelist || []
  };
}

// Mapper helpers for Agents
function mapAgentToDB(agent: any): any {
  if (!agent) return null;
  return {
    id: agent.id,
    nama: agent.nama,
    tipe: agent.tipe || 'personal',
    no_wa: agent.noWa,
    email: agent.email,
    diskon_persen: agent.diskonPersen || 0,
    created_at: agent.createdAt || new Date().toISOString()
  };
}

function mapAgentFromDB(dbAgent: any): any {
  if (!dbAgent) return null;
  return {
    id: dbAgent.id,
    nama: dbAgent.nama,
    tipe: dbAgent.tipe,
    noWa: dbAgent.no_wa,
    email: dbAgent.email,
    diskonPersen: dbAgent.diskon_persen ? parseFloat(dbAgent.diskon_persen) : 0,
    createdAt: dbAgent.created_at
  };
}

// Mapper helpers for Config
function mapConfigToDB(configToSave: any): any {
  if (!configToSave) return null;
  return {
    google_spreadsheet_id: configToSave.googleSpreadsheetId || '',
    google_direct_sync_enabled: !!configToSave.googleDirectSyncEnabled,
    kategori_perusahaan: configToSave.kategoriPerusahaan || [],
    kategori_produk: configToSave.kategoriProduk || [],
    produk: configToSave.produk || []
  };
}

function mapConfigFromDB(dbConfig: any): any {
  if (!dbConfig) return null;
  return {
    googleSpreadsheetId: dbConfig.google_spreadsheet_id,
    googleDirectSyncEnabled: dbConfig.google_direct_sync_enabled,
    kategoriPerusahaan: dbConfig.kategori_perusahaan,
    kategoriProduk: dbConfig.kategori_produk,
    produk: dbConfig.produk
  };
}

// Set high limits for JSON so clients can upload base64 images/PDFs directly
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Paths for persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CANVASSING_FILE = path.join(DATA_DIR, 'canvasing.json');
const VENDORS_FILE = path.join(DATA_DIR, 'vendors.json');

// Ensure directories and files exist
if (!process.env.VERCEL) {
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

  if (!fs.existsSync(VENDORS_FILE)) {
    const initialVendors = [
      {
        id: "VND-001",
        nama: "Anisa Rahmawati, M.Hum. (Sworn)",
        alamat: "Jl. Margonda Raya No. 12, Depok, Jawa Barat",
        noWa: "+6281299887766",
        pricelist: [
          { id: "vprod-1", namaProduk: "Sworn English-Indonesian (Legal)", hargaVendor: 45000 },
          { id: "vprod-2", namaProduk: "Sworn Indonesian-English (Legal)", hargaVendor: 50000 },
          { id: "vprod-3", namaProduk: "Proofreading & Editing (English)", hargaVendor: 20000 }
        ]
      },
      {
        id: "VND-002",
        nama: "Syihabuddin, S.S. (Sworn Mandarin)",
        alamat: "Ruko Inkopal Blok B-18, Kelapa Gading, Jakarta Utara",
        noWa: "+6281311223344",
        pricelist: [
          { id: "vprod-4", namaProduk: "Sworn Mandarin-Indonesian", hargaVendor: 120000 },
          { id: "vprod-5", namaProduk: "Sworn Indonesian-Mandarin", hargaVendor: 135000 }
        ]
      },
      {
        id: "VND-003",
        nama: "Rudi Hartono (Penerjemah Dokumen Teknik)",
        alamat: "Griya Shanta Blok L-405, Lowokwaru, Malang",
        noWa: "+6285644332211",
        pricelist: [
          { id: "vprod-6", namaProduk: "Translate Dokumen Manual Teknik (Inggris-Indo)", hargaVendor: 18000 },
          { id: "vprod-7", namaProduk: "Translate Kontrak & Kerja Sama (Inggris-Indo)", hargaVendor: 22000 }
        ]
      }
    ];
    fs.writeFileSync(VENDORS_FILE, JSON.stringify(initialVendors, null, 2));
  }
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

    const newLead = {
      id: `LEAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...leadData
    };

    const dbLead = mapLeadToDB(newLead);
    const { data, error } = await insforge.database
      .from('leads')
      .insert([dbLead])
      .select();

    if (error) {
      console.error('Error creating lead:', error);
      return res.status(500).json({ error: error.message || 'Gagal menyimpan data lead ke database' });
    }

    res.json({
      success: true,
      lead: mapLeadFromDB(data?.[0]) || newLead
    });

  } catch (error: any) {
    console.error('Error submitting lead:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan data lead' });
  }
});

// 2.5 API: Generate 20 Dummy Leads
app.post('/api/leads/generate-dummy', async (req, res) => {
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

    // Delete existing dummy leads first to avoid duplicates
    await insforge.database
      .from('leads')
      .delete()
      .like('id', 'LEAD-MOCK-%');

    // Insert new ones
    const dbLeads = dummyLeads.map(mapLeadToDB);
    const { error: insertError } = await insforge.database
      .from('leads')
      .insert(dbLeads);

    if (insertError) {
      console.error('Error inserting dummy leads:', insertError);
      return res.status(500).json({ error: insertError.message || 'Gagal menyimpan data dummy ke database' });
    }

    res.json({ success: true, count: dummyLeads.length, leads: dummyLeads });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gagal membuat data dummy' });
  }
});

// 3. API: List Leads (Admin dashboard)
app.get('/api/leads', async (req, res) => {
  try {
    const { data, error } = await insforge.database
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return res.status(500).json({ error: error.message || 'Gagal mengambil data leads dari database' });
    }

    const mappedLeads = (data || []).map(mapLeadFromDB);
    res.json(mappedLeads);
  } catch (error: any) {
    console.error('Error listing leads:', error);
    res.status(500).json({ error: 'Gagal mengambil data leads' });
  }
});

// 4. API: Update Lead Status / Order Fields
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const dbLeadUpdate = mapLeadToDB({ id, ...req.body });
    
    // We shouldn't overwrite the id, and only include non-undefined fields
    const filteredUpdate: any = {};
    for (const [key, val] of Object.entries(dbLeadUpdate)) {
      if (val !== undefined && key !== 'id') {
        filteredUpdate[key] = val;
      }
    }

    const { data, error } = await insforge.database
      .from('leads')
      .update(filteredUpdate)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating lead:', error);
      return res.status(500).json({ error: error.message || 'Gagal memperbarui data lead/order di database' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Lead tidak ditemukan' });
    }

    res.json({ success: true, lead: mapLeadFromDB(data[0]) });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Gagal memperbarui data lead/order' });
  }
});

// 5. API: Remove Lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await insforge.database
      .from('leads')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting lead:', error);
      return res.status(500).json({ error: error.message || 'Gagal menghapus lead di database' });
    }

    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Gagal menghapus lead' });
  }
});

// 6. API: Get Google Sheets & App Configuration (including products & corporate config)
// 6. API: Get Google Sheets & App Configuration (including products & corporate config)
app.get('/api/sheet-config', async (req, res) => {
  try {
    const { data, error } = await insforge.database
      .from('config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching config:', error);
      return res.status(500).json({ error: error.message || 'Gagal memuat konfigurasi aplikasi' });
    }

    if (!data) {
      // Create default config if none exists
      const defaultConfig = {
        googleSpreadsheetId: '',
        googleDirectSyncEnabled: false,
        kategoriPerusahaan: [
          "Teknologi & IT", "Hukum & Advokasi", "Migas & Pertambangan", "Keuangan & Perbankan",
          "Manufaktur & Pabrik", "Farmasi & Medis", "Pariwisata & Hotel", "Lain-lain"
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
      const dbConfig = mapConfigToDB(defaultConfig);
      const { data: insertedData, error: insertError } = await insforge.database
        .from('config')
        .insert([dbConfig])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting default config:', insertError);
        return res.status(500).json({ error: insertError.message || 'Gagal menginisialisasi konfigurasi default' });
      }

      return res.json(mapConfigFromDB(insertedData));
    }

    res.json(mapConfigFromDB(data));
  } catch (error: any) {
    console.error('Error in GET /api/sheet-config:', error);
    res.status(500).json({ error: 'Gagal memuat konfigurasi aplikasi' });
  }
});

// 7. API: Save Google Sheets & App Configuration
app.post('/api/sheet-config', async (req, res) => {
  try {
    const { 
      googleSpreadsheetId, 
      googleDirectSyncEnabled, 
      kategoriPerusahaan, 
      produk, 
      kategoriProduk 
    } = req.body;

    const { data: existing, error: getError } = await insforge.database
      .from('config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (getError) {
      console.error('Error fetching config for update:', getError);
      return res.status(500).json({ error: getError.message || 'Gagal membaca konfigurasi' });
    }

    const configToSave = {
      googleSpreadsheetId: googleSpreadsheetId !== undefined ? googleSpreadsheetId : (existing?.google_spreadsheet_id || ''),
      googleDirectSyncEnabled: googleDirectSyncEnabled !== undefined ? !!googleDirectSyncEnabled : !!(existing?.google_direct_sync_enabled || false),
      kategoriPerusahaan: kategoriPerusahaan || existing?.kategori_perusahaan || [],
      kategoriProduk: kategoriProduk || existing?.kategori_produk || [],
      produk: produk || existing?.produk || []
    };

    const dbConfig = mapConfigToDB(configToSave);
    let resultData;

    if (existing) {
      const { data, error } = await insforge.database
        .from('config')
        .update(dbConfig)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating config:', error);
        return res.status(500).json({ error: error.message || 'Gagal menyimpan konfigurasi' });
      }
      resultData = data;
    } else {
      const { data, error } = await insforge.database
        .from('config')
        .insert([dbConfig])
        .select()
        .single();

      if (error) {
        console.error('Error inserting config:', error);
        return res.status(500).json({ error: error.message || 'Gagal menyimpan konfigurasi' });
      }
      resultData = data;
    }

    res.json({ success: true, config: mapConfigFromDB(resultData) });
  } catch (error: any) {
    console.error('Error saving config:', error);
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
app.get('/api/canvasing', async (req, res) => {
  try {
    const { data, error } = await insforge.database
      .from('canvasing')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching canvasing:', error);
      return res.status(500).json({ error: error.message || 'Gagal memuat data kontak Canvasing dari database' });
    }

    const contacts = (data || []).map(mapCanvasingFromDB).map((c: any) => ({
      ...c,
      respon: mapStatus(c.respon)
    }));
    res.json(contacts);
  } catch (error: any) {
    console.error('Error in GET /api/canvasing:', error);
    res.status(500).json({ error: 'Gagal memuat data kontak Canvasing' });
  }
});

// 9. API: Create Canvasing contact
app.post('/api/canvasing', async (req, res) => {
  try {
    const { nomorSurat, namaPerusahaan, namaPic, noTelp, noEmail, kategoriPerusahaan, suratPenawaran, respon } = req.body;
    
    // Get existing to find next Num
    const { data: contacts, error: getError } = await insforge.database
      .from('canvasing')
      .select('id');

    if (getError) {
      console.error('Error getting canvasing count:', getError);
      return res.status(500).json({ error: getError.message || 'Gagal membaca data canvasing dari database' });
    }

    const nextNum = (contacts || []).length > 0 ? Math.max(...(contacts || []).map((c: any) => {
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

    const dbContact = mapCanvasingToDB(newContact);
    const { data, error } = await insforge.database
      .from('canvasing')
      .insert([dbContact])
      .select()
      .single();

    if (error) {
      console.error('Error creating canvasing contact:', error);
      return res.status(500).json({ error: error.message || 'Gagal menambahkan kontak Canvasing ke database' });
    }

    res.json({ success: true, contact: mapCanvasingFromDB(data) });
  } catch (error: any) {
    console.error('Error in POST /api/canvasing:', error);
    res.status(500).json({ error: 'Gagal menambahkan kontak Canvasing' });
  }
});

// 10. API: Patch / Update Canvasing contact
app.patch('/api/canvasing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };
    if (updatedData.respon) {
      updatedData.respon = mapStatus(updatedData.respon);
    }

    const dbContactUpdate = mapCanvasingToDB({ id, ...updatedData });
    const filteredUpdate: any = {};
    for (const [key, val] of Object.entries(dbContactUpdate)) {
      if (val !== undefined && key !== 'id') {
        filteredUpdate[key] = val;
      }
    }

    const { data, error } = await insforge.database
      .from('canvasing')
      .update(filteredUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating canvasing contact:', error);
      return res.status(500).json({ error: error.message || 'Gagal memperbarui kontak Canvasing di database' });
    }

    res.json({ success: true, contact: mapCanvasingFromDB(data) });
  } catch (error: any) {
    console.error('Error in PATCH /api/canvasing/:id:', error);
    res.status(500).json({ error: 'Gagal membarui status respon kontak Canvasing' });
  }
});

// 11. API: Remove Canvasing contact
app.delete('/api/canvasing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await insforge.database
      .from('canvasing')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting canvasing contact:', error);
      return res.status(500).json({ error: error.message || 'Gagal menghapus kontak Canvasing dari database' });
    }

    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error in DELETE /api/canvasing/:id:', error);
    res.status(500).json({ error: 'Gagal menghapus kontak Canvasing' });
  }
});

// 12. API: List Vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const { data, error } = await insforge.database
      .from('vendors')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching vendors:', error);
      return res.status(500).json({ error: error.message || 'Gagal memuat data vendor dari database' });
    }

    const mappedVendors = (data || []).map(mapVendorFromDB);
    res.json(mappedVendors);
  } catch (error: any) {
    console.error('Error in GET /api/vendors:', error);
    res.status(500).json({ error: 'Gagal memuat data vendor' });
  }
});

// 13. API: Create Vendor
app.post('/api/vendors', async (req, res) => {
  try {
    const { nama, alamat, noWa, pricelist } = req.body;
    
    const { data: vendors, error: getError } = await insforge.database
      .from('vendors')
      .select('id');

    if (getError) {
      console.error('Error fetching vendors count:', getError);
      return res.status(500).json({ error: getError.message || 'Gagal membaca data vendor dari database' });
    }

    const nextNum = (vendors || []).length > 0 ? Math.max(...(vendors || []).map((v: any) => {
      const match = v.id ? v.id.match(/VND-(\d+)/) : null;
      return match ? parseInt(match[1]) : 0;
    })) + 1 : 1;
    const id = `VND-${String(nextNum).padStart(3, '0')}`;

    const newVendor = {
      id,
      nama: nama || '',
      alamat: alamat || '',
      noWa: noWa || '',
      pricelist: pricelist || []
    };

    const dbVendor = mapVendorToDB(newVendor);
    const { data, error } = await insforge.database
      .from('vendors')
      .insert([dbVendor])
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      return res.status(500).json({ error: error.message || 'Gagal menambahkan vendor ke database' });
    }

    res.json({ success: true, vendor: mapVendorFromDB(data) });
  } catch (error: any) {
    console.error('Error in POST /api/vendors:', error);
    res.status(500).json({ error: 'Gagal menambahkan vendor' });
  }
});

// 14. API: Update Vendor
app.patch('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbVendorUpdate = mapVendorToDB({ id, ...req.body });

    const filteredUpdate: any = {};
    for (const [key, val] of Object.entries(dbVendorUpdate)) {
      if (val !== undefined && key !== 'id') {
        filteredUpdate[key] = val;
      }
    }

    const { data, error } = await insforge.database
      .from('vendors')
      .update(filteredUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vendor:', error);
      return res.status(500).json({ error: error.message || 'Gagal memperbarui vendor di database' });
    }

    res.json({ success: true, vendor: mapVendorFromDB(data) });
  } catch (error: any) {
    console.error('Error in PATCH /api/vendors/:id:', error);
    res.status(500).json({ error: 'Gagal memperbarui vendor' });
  }
});

// 15. API: Delete Vendor
app.delete('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await insforge.database
      .from('vendors')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting vendor:', error);
      return res.status(500).json({ error: error.message || 'Gagal menghapus vendor dari database' });
    }

    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error in DELETE /api/vendors/:id:', error);
    res.status(500).json({ error: 'Gagal menghapus vendor' });
  }
});

// 16. API: List Agents
app.get('/api/agents', async (req, res) => {
  try {
    const { data, error } = await insforge.database
      .from('agents')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return res.status(500).json({ error: error.message || 'Gagal memuat data agen dari database' });
    }

    const mappedAgents = (data || []).map(mapAgentFromDB);
    res.json(mappedAgents);
  } catch (error: any) {
    console.error('Error in GET /api/agents:', error);
    res.status(500).json({ error: 'Gagal memuat data agen' });
  }
});

// 17. API: Create Agent
app.post('/api/agents', async (req, res) => {
  try {
    const { nama, tipe, noWa, email, diskonPersen } = req.body;

    const { data: agents, error: getError } = await insforge.database
      .from('agents')
      .select('id');

    if (getError) {
      console.error('Error fetching agents count:', getError);
      return res.status(500).json({ error: getError.message || 'Gagal membaca data agen dari database' });
    }

    const nextNum = (agents || []).length > 0 ? Math.max(...(agents || []).map((a: any) => {
      const match = a.id ? a.id.match(/AGT-(\d+)/) : null;
      return match ? parseInt(match[1]) : 0;
    })) + 1 : 1;
    const id = `AGT-${String(nextNum).padStart(3, '0')}`;

    const newAgent = {
      id,
      nama: nama || '',
      tipe: tipe || 'personal',
      noWa: noWa || '',
      email: email || '',
      diskonPersen: diskonPersen || 0
    };

    const dbAgent = mapAgentToDB(newAgent);
    const { data, error } = await insforge.database
      .from('agents')
      .insert([dbAgent])
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return res.status(500).json({ error: error.message || 'Gagal menambahkan agen ke database' });
    }

    res.json({ success: true, agent: mapAgentFromDB(data) });
  } catch (error: any) {
    console.error('Error in POST /api/agents:', error);
    res.status(500).json({ error: 'Gagal menambahkan agen' });
  }
});

// 18. API: Update Agent
app.patch('/api/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbAgentUpdate = mapAgentToDB({ id, ...req.body });

    const filteredUpdate: any = {};
    for (const [key, val] of Object.entries(dbAgentUpdate)) {
      if (val !== undefined && key !== 'id') {
        filteredUpdate[key] = val;
      }
    }

    const { data, error } = await insforge.database
      .from('agents')
      .update(filteredUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return res.status(500).json({ error: error.message || 'Gagal memperbarui agen di database' });
    }

    res.json({ success: true, agent: mapAgentFromDB(data) });
  } catch (error: any) {
    console.error('Error in PATCH /api/agents/:id:', error);
    res.status(500).json({ error: 'Gagal memperbarui agen' });
  }
});

// 19. API: Delete Agent
app.delete('/api/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await insforge.database
      .from('agents')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting agent:', error);
      return res.status(500).json({ error: error.message || 'Gagal menghapus agen dari database' });
    }

    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error in DELETE /api/agents/:id:', error);
    res.status(500).json({ error: 'Gagal menghapus agen' });
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

if (!process.env.VERCEL) {
  startServer();
}

export default app;
