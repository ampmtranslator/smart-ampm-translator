# Product Requirement Document (PRD)
## Aplikasi AMPM Sworn Translator & CRM System

---

## 1. Pendahuluan
### 1.1 Latar Belakang
**AMPM Sworn Translator** adalah layanan penerjemahan tersumpah profesional yang membutuhkan sistem manajemen hubungan pelanggan (CRM) dan estimasi harga otomatis yang cepat, akurat, dan transparan. Saat ini, proses penerimaan dokumen, estimasi jumlah halaman standar hasil terjemahan, penghitungan biaya, serta penugasan ke vendor/penerjemah eksternal sering kali dilakukan secara manual. Hal ini berpotensi memperlambat respons terhadap pelanggan dan mengurangi efisiensi operasional.

### 1.2 Tujuan Produk
Membangun platform full-stack berbasis web yang mengintegrasikan:
1. **Sisi Pelanggan (Frontend):** Estimasi harga instan bertenaga AI (Gemini) dengan fitur OCR dokumen, deteksi jenis dokumen, kategorisasi otomatis (Reguler vs. Non-Reguler), dan formulir pengajuan penawaran langsung ke WhatsApp dan database.
2. **Sisi Admin (CRM Dashboard):** Manajemen prospek (leads), status transaksi, penugasan vendor penerjemah, pelacakan proses pengerjaan, manajemen agen, pencetakan invoice, serta sinkronisasi langsung ke Google Sheets.
3. **Infrastruktur Backend:** Menggunakan **InsForge BaaS** (PostgreSQL) untuk penyimpanan data persisten, autentikasi, serta aturan keamanan yang kuat.

---

## 2. Arsitektur Sistem & Integrasi Teknologi
Aplikasi ini dirancang menggunakan arsitektur modern full-stack yang ringan dan efisien:

*   **Frontend:** React 19 dengan TypeScript, Vite, dan Tailwind CSS untuk antarmuka yang responsif dan sangat cepat. Visualisasi dan transisi animasi menggunakan `motion` (`motion/react`).
*   **Backend Server:** Express.js yang disajikan sebagai serverless functions di Vercel atau standalone di Cloud Run (menggunakan file `dev.ts` untuk server pengembangan lokal).
*   **Database (BaaS):** **InsForge (PostgreSQL)** sebagai pusat penyimpanan data terstruktur. Terhubung menggunakan `@insforge/sdk` dengan instansasi client admin yang aman di server-side.
*   **AI Engine (OCR & Analisis):** **Gemini 2.5 Flash** SDK (`@google/genai`) digunakan untuk menganalisis dokumen (PDF/gambar), menghitung jumlah kata asli secara otomatis, dan melakukan simulasi jumlah halaman hasil terjemahan.

---

## 3. Fitur Utama & Kebutuhan Fungsional

### 3.1 AI Document Analyzer (OCR & Estimasi Otomatis)
Fitur utama di sisi depan untuk calon pelanggan atau admin saat mengunggah dokumen:
*   **Input:** Drag-and-drop atau pemilihan berkas (PDF, PNG, JPEG, JPG).
*   **Pemrosesan AI:**
    *   Membaca dan melakukan OCR terhadap dokumen menggunakan Gemini 2.5 Flash.
    *   Mengklasifikasikan kategori dokumen secara ketat:
        *   **REGULER:** Dokumen identitas standar (KTP, Kartu Keluarga, Akta Lahir, Akta Kematian, Paspor, Buku Nikah, Akta Nikah).
        *   **NON REGULER:** Dokumen selain daftar di atas (Ijazah, Transkrip, Raport, Kontrak Kerja, Akta Perusahaan, MoU, dll).
    *   Menghitung jumlah kata asli secara presisi.
    *   Melakukan simulasi ketat halaman hasil terjemahan sesuai standar hukum fisik:
        *   Ukuran kertas: A4, Margin: 1 inci, Line Spacing: 1.5, Font: Times New Roman 12pt.
        *   Rumus konversi: `Total Kata / 380 = Hasil Halaman`.
        *   Hasil desimal selalu dibulatkan ke atas (**Ceiling**) ke bilangan bulat terdekat (misal: 1.1 halaman dihitung sebagai 2 halaman).
*   **Output:** Menampilkan jenis dokumen yang terdeteksi, kategori, potongan teks (snippet), estimasi halaman terjemahan, dan rincian langkah kalkulasi bertenaga AI.

### 3.2 CRM Dashboard (Admin Area)
Dashboard internal bagi tim AMPM untuk mengelola operasional:
*   **Leads Management:** Daftar seluruh calon pelanggan yang masuk melalui web, lengkap dengan rincian biaya, dokumen, dan tombol aksi cepat untuk tindak lanjut ke WhatsApp.
*   **Pipeline Status:** Pelacakan siklus transaksi mulai dari `Pending`, `Dealing`, `Paid`, `In Process`, hingga `Completed`.
*   **Vendor Assignment & Cost Tracking:** Memilih penerjemah/vendor dari database vendor untuk setiap prospek, melacak biaya vendor, dan menghitung laba bersih secara otomatis.
*   **Agent Management:** Mengelola database agen pemasaran, tipe agen (personal/corporate), dan diskon khusus mereka yang memotong total biaya penerjemahan secara dinamis.
*   **Invoice Generator:** Membuat rincian item invoice, menambah biaya tambahan (add-ons) seperti legalisasi kementerian, kurir fisik, atau biaya cetak, serta mencetak invoice secara profesional.

### 3.3 Canvassing & Cold Outreach Tracking
Fitur untuk tim penjualan melacak aktivitas pengiriman surat penawaran:
*   Mencatat data perusahaan target, nama PIC, kontak (WhatsApp/Email), kategori industri, nomor surat penawaran yang dikirim, dan status respon saat ini.

### 3.4 Live Google Sheets Synchronization
*   Sinkronisasi otomatis dua arah (atau satu arah langsung dari web) untuk mengirimkan seluruh data prospek baru atau perubahan status langsung ke Google Spreadsheet yang dikonfigurasi melalui menu Pengaturan CRM.

---

## 4. Skema Database (InsForge PostgreSQL)

Sistem ini menggunakan tabel PostgreSQL yang di-host di platform InsForge:

### 4.1 Tabel: `leads`
Menyimpan data calon transaksi dan dokumen hasil analisis AI.
```sql
CREATE TABLE leads (
  id VARCHAR(255) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_whatsapp VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  source_language VARCHAR(100),
  target_language VARCHAR(100),
  translation_type VARCHAR(100), -- 'sworn' atau 'non-sworn'
  file_name VARCHAR(255),
  file_size VARCHAR(100),
  text_extracted_snippet TEXT,
  document_category VARCHAR(100), -- 'Reguler' atau 'Non Reguler'
  document_type_detected VARCHAR(255),
  word_count INT DEFAULT 0,
  char_count INT DEFAULT 0,
  calculated_standard_pages DECIMAL(10, 2) DEFAULT 0,
  speed_tier VARCHAR(100), -- 'Normal', 'Express', 'Same Day'
  cost_per_page DECIMAL(12, 2) DEFAULT 0,
  total_translation_cost DECIMAL(12, 2) DEFAULT 0,
  addons JSONB DEFAULT '{}', -- rincian biaya tambahan
  addon_cost DECIMAL(12, 2) DEFAULT 0,
  grand_total_cost DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(100) DEFAULT 'Pending', -- 'Pending', 'Dealing', 'Paid', 'In Process', 'Completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_dealed BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  deal_deadline TIMESTAMP WITH TIME ZONE,
  deal_status VARCHAR(100),
  deal_final_price DECIMAL(12, 2) DEFAULT 0,
  order_notes TEXT,
  invoice_items JSONB DEFAULT '[]',
  vendor JSONB DEFAULT NULL, -- vendor yang ditugaskan
  process JSONB DEFAULT NULL, -- riwayat pengerjaan dokumen
  agent_id VARCHAR(255)
);
```

### 4.2 Tabel: `canvasing`
Melacak penawaran pemasaran ke korporasi.
```sql
CREATE TABLE canvasing (
  id VARCHAR(255) PRIMARY KEY,
  nomor_surat VARCHAR(255),
  nama_perusahaan VARCHAR(255) NOT NULL,
  nama_pic VARCHAR(255),
  no_telp VARCHAR(255),
  no_email VARCHAR(255),
  kategori_perusahaan VARCHAR(255),
  surat_penawaran VARCHAR(255),
  respon TEXT
);
```

### 4.3 Tabel: `vendors`
Menyimpan database penerjemah/penerbit bersertifikat.
```sql
CREATE TABLE vendors (
  id VARCHAR(255) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT,
  no_wa VARCHAR(255),
  pricelist JSONB DEFAULT '[]' -- daftar harga jasa vendor per halaman
);
```

### 4.4 Tabel: `agents`
Mengelola akun mitra agen pemasaran.
```sql
CREATE TABLE agents (
  id VARCHAR(255) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  tipe VARCHAR(100) DEFAULT 'personal', -- 'personal' atau 'corporate'
  no_wa VARCHAR(255),
  email VARCHAR(255),
  diskon_persen DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 Tabel: `config`
Menyimpan konfigurasi sistem CRM secara global.
```sql
CREATE TABLE config (
  id SERIAL PRIMARY KEY,
  google_spreadsheet_id VARCHAR(255),
  google_direct_sync_enabled BOOLEAN DEFAULT FALSE,
  kategori_perusahaan JSONB,
  kategori_produk JSONB,
  produk JSONB
);
```

---

## 5. Batasan Teknis & Panduan Pemecahan Masalah (Vercel deployment)

### 5.1 Masalah Terkenal: `FUNCTION_INVOCATION_FAILED` (Status 500) di Vercel
Saat aplikasi di-deploy di Vercel, semua rute `/api/*` terkadang menghasilkan error 500 mentah karena fungsi cold-start crash. Berikut adalah analisis penyebab dan perbaikan yang telah diterapkan:

1.  **Penyebab Utama (Depedensi Dev Toolchain):** Vercel menggunakan pelacak aset otomatis (`@vercel/nft`) untuk membungkus serverless function. Sebelum perbaikan, file `server.ts` berisi pemanggilan `await import('vite')` untuk menjalankan dev server di lokal. Meskipun secara logika kode tersebut dilewati saat produksi (`NODE_ENV === 'production'`), bundler Vercel tetap mendeteksi string `'vite'` lalu ikut membundel paket Vite, esbuild, dan `fsevents` (binary asli macOS). Saat dijalankan di kontainer Linux Vercel, binary macOS tersebut gagal dimuat sehingga memicu crash di cold-start.
    *   **Solusi:** Memisahkan pemanggilan Vite dev server sepenuhnya dari `server.ts` ke berkas terpisah baru bernama `dev.ts`. File `server.ts` kini murni bebas dari string import `vite`. Pemanggilan lokal diarahkan ke `dev.ts` via `npm run dev`.
2.  **Model Gemini Tidak Valid:** Kode sebelumnya mencoba memanggil model `gemini-3.5-flash` yang tidak terdaftar di SDK resmi.
    *   **Solusi:** Memperbarui kode model menjadi `gemini-2.5-flash` yang stabil dan didukung penuh.
3.  **Batas Waktu Eksekusi (Timeout):** Pada akun Vercel gratis (Hobby), batas durasi eksekusi serverless function adalah **10 detik**. Proses unggahan file berukuran sedang yang dikombinasikan dengan OCR AI Gemini sering kali memakan waktu 4-12 detik. Jika melebihi 10 detik, Vercel akan langsung menghentikan fungsi dan mengembalikan kode `FUNCTION_INVOCATION_FAILED`.
    *   **Solusi:** Pengguna disarankan mempercepat waktu pemrosesan dokumen dengan mengompres gambar sebelum diunggah di sisi klien, atau meningkatkan akun Vercel jika membutuhkan batas waktu eksekusi yang lebih lama (hingga 60 detik).
4.  **Variabel Lingkungan (Environment Variables):** Ketiadaan atau kesalahan pengisian kunci API seperti `GEMINI_API_KEY` dan kredensial database `INSFORGE_API_KEY` di Dashboard Vercel akan memicu kegagalan eksekusi.
    *   **Solusi:** Pengguna wajib memasukkan kunci rahasia tersebut melalui menu **Vercel -> Project Settings -> Environment Variables** kemudian melakukan **Redeploy** (membangun ulang) proyek agar nilainya diterapkan di serverless function.

---

## 6. Penutup
Aplikasi AMPM Sworn Translator & CRM System adalah alat operasional yang sangat andal dan mengoptimalkan proses bisnis jasa penerjemahan secara menyeluruh. Dengan integrasi kecerdasan buatan Gemini, basis data PostgreSQL yang aman di InsForge, dan dashboard CRM yang kaya fitur, tim operasional dapat menghemat waktu hingga 80% dalam melakukan estimasi harga dan mengelola siklus transaksi pelanggan.
