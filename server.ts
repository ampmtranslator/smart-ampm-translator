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

// Ensure directories and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ googleSpreadsheetId: '', googleDirectSyncEnabled: false }, null, 2));
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

      Simulasi Halaman Penerjemahan Standar:
      Format target hasil terjemahan adalah kertas A4, font Times New Roman ukuran 12 point, dengan spasi baris 1,5.
      - Aturan konversi: Setiap 200 hingga 250 kata, atau sekitar 1500 karakter dengan spasi, dihitung sebagai 1 Halaman Hasil Terjemahan.
      - Hitung total kata dan karakter teks asli dalam dokumen.
      - Berdasarkan panjang teks tersebut, simulasikan dan tentukan jumlah HANYA berupa bilangan bulat (bulatkan ke atas jika bersisa, minimal 1 halaman) dari jumlah halaman terjemahan standar yang akan dihasilkan.

      Ekstrak ringkasan isi dokumen sebanyak 300-500 karakter sebagai tinjauan teks (text snippet).

      Kembalikan data analisis Anda secara ketat dalam format JSON yang valid menggunakan skema berikut:
      {
        "documentTypeDetected": "Nama spesifik jenis dokumen yang terdeteksi (seperti KTP, Ijazah, Akta Kelahiran, dll)",
        "category": "Kategori dokumen, harus bernilai 'Reguler' atau 'Non Reguler'",
        "textSnippet": "Ringkasan isi dokumen atau potongan teks 300-500 karakter",
        "wordCount": nilai_angka_jumlah_kata_dalam_dokumen,
        "charCount": nilai_angka_jumlah_karakter_dengan_spasi_dalam_dokumen,
        "simulatedPagesCount": nilai_angka_jumlah_halaman_hasil_simulasi_terjemahan_standar,
        "explanation": "Penjelasan singkat dari mana kesimpulan kategori dan jumlah halaman simulasi tersebut diperoleh"
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

// 6. API: Get Google Sheets Configuration
app.get('/api/sheet-config', (req, res) => {
  try {
    let config = { googleSpreadsheetId: '', googleDirectSyncEnabled: false };
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memuat konfigurasi Google Sheet' });
  }
});

// 7. API: Save Google Sheets Configuration
app.post('/api/sheet-config', (req, res) => {
  try {
    const { googleSpreadsheetId, googleDirectSyncEnabled } = req.body;
    const config = { 
      googleSpreadsheetId: googleSpreadsheetId || '', 
      googleDirectSyncEnabled: !!googleDirectSyncEnabled 
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengatur konfigurasi Google Sheet' });
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
