-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS canvasing;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS config;

-- 1. Admins Table
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Leads Table
CREATE TABLE leads (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_whatsapp VARCHAR(30) NOT NULL,
  customer_email VARCHAR(100),
  source_language VARCHAR(50) NOT NULL,
  target_language VARCHAR(50) NOT NULL,
  translation_type VARCHAR(20) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size VARCHAR(50),
  text_extracted_snippet TEXT,
  document_category VARCHAR(50),
  document_type_detected VARCHAR(100),
  word_count INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0,
  calculated_standard_pages NUMERIC DEFAULT 0,
  speed_tier VARCHAR(50),
  cost_per_page NUMERIC DEFAULT 0,
  total_translation_cost NUMERIC DEFAULT 0,
  addons JSONB DEFAULT '{}'::jsonb,
  addon_cost NUMERIC DEFAULT 0,
  grand_total_cost NUMERIC DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_dealed BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  deal_deadline VARCHAR(50),
  deal_status VARCHAR(50),
  deal_final_price NUMERIC DEFAULT 0,
  order_notes TEXT,
  invoice_items JSONB DEFAULT '[]'::jsonb,
  vendor VARCHAR(100),
  process TEXT,
  agent_id VARCHAR(50)
);

-- 3. Canvasing Table
CREATE TABLE canvasing (
  id VARCHAR(50) PRIMARY KEY,
  nomor_surat VARCHAR(100) NOT NULL,
  nama_perusahaan VARCHAR(150) NOT NULL,
  nama_pic VARCHAR(100),
  no_telp VARCHAR(30) NOT NULL,
  no_email VARCHAR(100),
  kategori_perusahaan VARCHAR(100) NOT NULL,
  surat_penawaran VARCHAR(255) NOT NULL,
  respon VARCHAR(20) NOT NULL
);

-- 4. Vendors Table
CREATE TABLE vendors (
  id VARCHAR(50) PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  alamat TEXT,
  no_wa VARCHAR(30) NOT NULL,
  pricelist JSONB DEFAULT '[]'::jsonb
);

-- 5. Agents Table
CREATE TABLE agents (
  id VARCHAR(50) PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  tipe VARCHAR(50) NOT NULL, -- 'personal' or 'perusahaan'
  no_wa VARCHAR(30) NOT NULL,
  email VARCHAR(100),
  diskon_persen NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Config Table
CREATE TABLE config (
  id SERIAL PRIMARY KEY,
  google_spreadsheet_id VARCHAR(255),
  google_direct_sync_enabled BOOLEAN DEFAULT FALSE,
  kategori_perusahaan JSONB,
  kategori_produk JSONB,
  produk JSONB
);

-- Insert Admin User
INSERT INTO admins (username, password) VALUES 
('admin', 'ampmadmin2026');

-- Insert Config
INSERT INTO config (google_spreadsheet_id, google_direct_sync_enabled, kategori_perusahaan, kategori_produk, produk) VALUES 
('', false, 
 '["Teknologi & IT", "Hukum & Advokasi", "Migas & Pertambangan", "Keuangan & Perbankan", "Manufaktur & Pabrik", "Farmasi & Medis", "Pariwisata & Hotel", "Lain-lain"]'::jsonb, 
 '[{"id": "cat-1", "nama": "Sworn Translation"}, {"id": "cat-2", "nama": "Non-Sworn Translation"}, {"id": "cat-3", "nama": "Legalisasi & Apostille"}]'::jsonb, 
 '[{"id": "prod-1", "nama": "Sworn Inggris-Indonesia (Reguler)", "harga": 75000, "kategoriId": "cat-1"}, {"id": "prod-2", "nama": "Sworn Inggris-Indonesia (Non-Reguler)", "harga": 90000, "kategoriId": "cat-1"}, {"id": "prod-3", "nama": "Non-Sworn Inggris (Non-Teknik)", "harga": 30000, "kategoriId": "cat-2"}, {"id": "prod-4", "nama": "Non-Sworn Inggris (Dokumen Teknik)", "harga": 35000, "kategoriId": "cat-2"}, {"id": "prod-5", "nama": "Apostille Kemenkumham & Kemenlu", "harga": 700000, "kategoriId": "cat-3"}]'::jsonb
);

-- Insert Vendors
INSERT INTO vendors (id, nama, alamat, no_wa, pricelist) VALUES
('VND-001', 'Anisa Rahmawati, M.Hum. (Sworn)', 'Jl. Margonda Raya No. 12, Depok, Jawa Barat', '+6281299887766', '[{"id": "vprod-1", "namaProduk": "Sworn English-Indonesian (Legal)", "hargaVendor": 45000}, {"id": "vprod-2", "namaProduk": "Sworn Indonesian-English (Legal)", "hargaVendor": 50000}, {"id": "vprod-3", "namaProduk": "Proofreading & Editing (English)", "hargaVendor": 20000}]'::jsonb),
('VND-002', 'Syihabuddin, S.S. (Sworn Mandarin)', 'Ruko Inkopal Blok B-18, Kelapa Gading, Jakarta Utara', '+6281311223344', '[{"id": "vprod-4", "namaProduk": "Sworn Mandarin-Indonesian", "hargaVendor": 120000}, {"id": "vprod-5", "namaProduk": "Sworn Indonesian-Mandarin", "hargaVendor": 135000}]'::jsonb),
('VND-003', 'Rudi Hartono (Penerjemah Dokumen Teknik)', 'Griya Shanta Blok L-405, Lowokwaru, Malang', '+6285644332211', '[{"id": "vprod-6", "namaProduk": "Translate Dokumen Manual Teknik (Inggris-Indo)", "hargaVendor": 18000}, {"id": "vprod-7", "namaProduk": "Translate Kontrak & Kerja Sama (Inggris-Indo)", "hargaVendor": 22000}]'::jsonb);

-- Insert Agents
INSERT INTO agents (id, nama, tipe, no_wa, email, diskon_persen) VALUES
('AGT-001', 'Budi Pratama (Agent Personal)', 'personal', '+6281234567001', 'budi.pratama@agent.com', 10),
('AGT-002', 'PT Sinar Sejahtera (Agent Perusahaan)', 'perusahaan', '+6281122330022', 'partnership@sinarsejahtera.co.id', 15);

-- Insert Canvasing
INSERT INTO canvasing (id, nomor_surat, nama_perusahaan, nama_pic, no_telp, no_email, kategori_perusahaan, surat_penawaran, respon) VALUES
('CAN-001', '012/AMPM/SP/V/2026', 'PT Solusi Teknologi Indonesia', 'Andi Wijaya', '+6281234567890', 'info@solusiteknologi.co.id', 'Teknologi & IT', 'Penawaran Jasa Terjemah Dokumen Audit & Hukum', 'Follow Up'),
('CAN-002', '013/AMPM/SP/V/2026', 'CV Agro Mandiri Nusantara', 'Dewi Sartika', '+6287766554433', 'contact@agromandiri.com', 'Pertanian & Ekspor', 'Penawaran Terjemah Sertifikasi Halal & Fitofarmaka', 'Tidak Respon'),
('CAN-003', '014/AMPM/SP/V/2026', 'PT Samudra Energi Pratama', 'Irwan Hakim', '+6281122334455', 'corsec@samudraenergi.com', 'Energi & Pertambangan', 'Proposal Jasa Penerjemah Sworn Kontrak Kerja Sama', 'Closing'),
('CAN-004', '015/AMPM/SP/V/2026', 'PT Global Logistik Indonesia', 'Siti Rahma', '+6281987654321', 'procurement@globallogistik.co.id', 'Transportasi & Logistik', 'Penawaran Retainer Jasa Dokumen Kepabeanan', 'Follow Up');

-- Insert Leads
INSERT INTO leads (
  id, customer_name, customer_whatsapp, customer_email, source_language, target_language,
  translation_type, file_name, file_size, text_extracted_snippet, document_category,
  document_type_detected, word_count, char_count, calculated_standard_pages, speed_tier,
  cost_per_page, total_translation_cost, addons, addon_cost, grand_total_cost, status,
  created_at, is_dealed, is_paid, deal_deadline, deal_status, deal_final_price, order_notes,
  invoice_items, vendor, process, agent_id
) VALUES
('lead-1001', 'Budi Hermawan', '+628123456789', 'budi.hermawan@gmail.com', 'Bahasa Indonesia', 'Inggris', 'sworn', 'Akte_Kelahiran_Budi.pdf', '1.2 MB', 'KEMENTERIAN DALAM NEGERI... KUTIPAN AKTA KELAHIRAN...', 'Reguler', 'Akta Kelahiran / Lahir', 150, 950, 1.0, 'Normal', 75000, 75000, '{"apostille": null, "legalisation": [], "skck": false, "otherEmbassy": null}'::jsonb, 0, 75000, 'Pending', NOW() - INTERVAL '2 days', false, false, null, null, 0, 'Customer butuh cepat untuk keperluan apply visa studi ke Inggris.', '[]'::jsonb, null, null, null),
('lead-1002', 'PT Mega Finansial Indonesia', '+628561122334', 'legal@megafinansial.co.id', 'Inggris', 'Bahasa Indonesia', 'non-sworn', 'Financial_Audit_Report_2025.docx', '4.5 MB', 'INDEPENDENT AUDITOR''S REPORT TO THE SHAREHOLDERS...', 'Non Reguler', 'Laporan Keuangan / Audit', 12500, 81000, 50.0, 'Super Speed', 35000, 1750000, '{"apostille": null, "legalisation": [], "skck": false, "otherEmbassy": null}'::jsonb, 0, 1750000, 'Dihubungi', NOW() - INTERVAL '1 day', true, false, '2026-07-02T17:00:00.000Z', 'Pengerjaan Terjemah', 1750000, 'Dokumen sensitif, harap ditugaskan ke penerjemah tepercaya dengan NDA.', '[]'::jsonb, 'Rudi Hartono (Penerjemah Dokumen Teknik)', 'Penerjemahan awal sedang berlangsung oleh Pak Rudi.', 'AGT-001'),
('lead-1003', 'Siti Aminah', '+628998877665', 'siti.aminah@yahoo.com', 'Bahasa Indonesia', 'Mandarin', 'sworn', 'Ijazah_S1_Siti.pdf', '850 KB', 'UNIVERSITAS INDONESIA... IJAZAH SARJANA...', 'Reguler', 'Ijazah / Diploma', 220, 1400, 1.0, 'Same Day', 120000, 120000, '{"apostille": "Reguler", "legalisation": ["Kemenkumham"], "skck": false, "otherEmbassy": null}'::jsonb, 700000, 820000, 'Selesai', NOW() - INTERVAL '5 hours', true, true, '2026-06-28T12:00:00.000Z', 'Selesai', 820000, 'Legalisasi di Kemenkumham sudah selesai ditempel stiker.', '[]'::jsonb, 'Syihabuddin, S.S. (Sworn Mandarin)', 'Semua berkas fisik telah dikirim via GrabExpress ke domisili customer.', null);
