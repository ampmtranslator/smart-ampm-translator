/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  CheckCircle, 
  Settings, 
  UploadCloud, 
  AlertTriangle, 
  Loader2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Coins, 
  Clock, 
  Languages, 
  User, 
  Copy, 
  ExternalLink,
  MessageSquare,
  FileCheck,
  Building,
  Info,
  Check,
  X,
  Smartphone,
  ShieldCheck,
  Receipt,
  RotateCcw,
  Send,
  ArrowLeftRight
} from 'lucide-react';

import { TranslationLead, GoogleSheetConfig, UploadedDoc } from './types';
import { 
  SWORN_PRICING, 
  NON_SWORN_PRICING, 
  APOSTILLE_PRICING, 
  LEGALISATION_PRICING, 
  calculateLeadCost 
} from './pricingData';
import { 
  googleSignIn, 
  initAuthListener, 
  logout, 
  listDriveFiles, 
  listSpreadsheets, 
  downloadDriveFileAsBase64, 
  createNewSpreadsheet, 
  appendRowToSpreadsheet 
} from './lib/workspace';
import { LogOut, Database, Folder, Lock, RefreshCw } from 'lucide-react';

export default function App() {
  // Page states
  const [activeTab, setActiveTab] = useState<'estimator' | 'admin'>('estimator');
  
  // Form input fields
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [translationType, setTranslationType] = useState<'sworn' | 'non-sworn'>('sworn');
  
  // Sworn translation language options (Indonesian is always source)
  const [selectedSwornLang, setSelectedSwornLang] = useState('English');
  // Non-sworn translation option
  const [selectedNonSwornOpt, setSelectedNonSwornOpt] = useState('EnglishNonTechnical');
  
  // Translation direction option ('outbound': Indonesia -> Foreign, 'inbound': Foreign -> Indonesia)
  const [translationDirection, setTranslationDirection] = useState<'outbound' | 'inbound'>('outbound');

  // Document upload state
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);

  // Simulation/Analysis results (either from AI or user inputs)
  const [documentTypeDetected, setDocumentTypeDetected] = useState<string>('');
  const [documentCategory, setDocumentCategory] = useState<'Reguler' | 'Non Reguler'>('Reguler');
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [simulatedPages, setSimulatedPages] = useState<number>(1);
  const [analysisExplanation, setAnalysisExplanation] = useState<string>('');
  const [textSnippet, setTextSnippet] = useState<string>('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Speed and Addon preferences
  const [speedTier, setSpeedTier] = useState<'Normal' | 'Super Speed' | 'Same Day' | 'Speed Jadi Besok'>('Normal');
  const [selectedApostille, setSelectedApostille] = useState<'Express' | 'Reguler' | null>(null);
  const [selectedLegalisations, setSelectedLegalisations] = useState<string[]>([]);
  const [selectedSkck, setSelectedSkck] = useState<boolean>(false);

  // Calculation Breakdown states
  const [costBreakdown, setCostBreakdown] = useState({
    costPerPage: 0,
    translationCost: 0,
    addonCost: 0,
    grandTotal: 0
  });

  // Submission process
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Admin Dashboard states
  const [leads, setLeads] = useState<TranslationLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetConfig>({ webhookUrl: '', isEnabled: false });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdminLead, setSelectedAdminLead] = useState<TranslationLead | null>(null);

  // Admin credentials states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('ampm_admin_logged_in') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Order & CRM Sub-Tabs & modal states
  const [adminSubTab, setAdminSubTab] = useState<'leads' | 'orders' | 'insights'>('leads');
  const [quotationModalLead, setQuotationModalLead] = useState<TranslationLead | null>(null);
  const [invoiceModalLead, setInvoiceModalLead] = useState<TranslationLead | null>(null);
  const [dealEditLead, setDealEditLead] = useState<TranslationLead | null>(null);

  // States used inside Deal/Order Configuration Panel
  const [dealDeadlineInput, setDealDeadlineInput] = useState('');
  const [dealStatusInput, setDealStatusInput] = useState<'Dalam Antrean' | 'Pengerjaan Terjemah' | 'Proses Proofreading' | 'Penyegelan Tersumpah' | 'Selesai' | 'Dibatalkan'>('Dalam Antrean');
  const [dealPriceInput, setDealPriceInput] = useState<number>(0);
  const [dealNotesInput, setDealNotesInput] = useState('');

  // Drag over upload state
  const [dragOver, setDragOver] = useState(false);

  // Google Workspace States
  const [gUser, setGUser] = useState<any>(null);
  const [gToken, setGToken] = useState<string | null>(null);
  const [gSpreadsheets, setGSpreadsheets] = useState<any[]>([]);
  const [isLoadingGSheets, setIsLoadingGSheets] = useState(false);
  const [isCreatingGSheet, setIsCreatingGSheet] = useState(false);
  
  // Google Drive Modal
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [downloadingDriveFileId, setDownloadingDriveFileId] = useState<string | null>(null);

  // Automatically aggregate document calculations whenever uploadedDocs array changes
  useEffect(() => {
    const successDocs = uploadedDocs.filter(d => d.status === 'success');
    if (successDocs.length > 0) {
      // 1. Join document types uniquely
      const typesList = successDocs.map(d => d.documentTypeDetected).filter(Boolean);
      const uniqueTypes = Array.from(new Set(typesList));
      setDocumentTypeDetected(uniqueTypes.join(' + ') || 'Dokumen Kustom (Gabungan)');

      // 2. Classify: if any of the successfully analyzed documents are Non-Reguler, the overall is Non Reguler
      const hasNonReguler = successDocs.some(d => d.category === 'Non Reguler');
      setDocumentCategory(hasNonReguler ? 'Non Reguler' : 'Reguler');

      // 3. Sum words, characters, and pages
      const totalWords = successDocs.reduce((sum, d) => sum + (d.wordCount || 0), 0);
      const totalChars = successDocs.reduce((sum, d) => sum + (d.charCount || 0), 0);
      const totalPages = successDocs.reduce((sum, d) => sum + (d.simulatedPages || 0), 0);
      
      setWordCount(totalWords);
      setCharCount(totalChars);
      setSimulatedPages(totalPages || 1);

      // 4. Concatenate snippets
      const snippetJoined = successDocs
        .map(d => `[File: ${d.name}]\n${d.textSnippet || ''}`)
        .join('\n\n');
      setTextSnippet(snippetJoined);

      // 5. Build a combined explanation
      const combinedExplanation = successDocs
        .map(d => `${d.name}: ${d.explanation || '-'}`)
        .join('\n');
      setAnalysisExplanation(combinedExplanation || 'Dokumen gabungan dianalisis oleh AI.');
      
      setHasAnalyzed(true);
    }
  }, [uploadedDocs]);

  // Update cost breakdown dynamically when inputs change
  useEffect(() => {
    const langKey = translationType === 'sworn' ? selectedSwornLang : selectedNonSwornOpt;
    
    // Auto adjust speeds based on availability
    let currentSpeed = speedTier;
    if (translationType === 'sworn') {
      const p = SWORN_PRICING[selectedSwornLang]?.prices;
      if (!p) return;
      // If speed tier isn't available for this language, default back to 'Normal'
      const hasSuperSpeed = p.superSpeedReguler !== undefined;
      const hasSameDay = p.sameDayReguler !== undefined;
      const hasNextDay = p.nextDayReguler !== undefined;

      if (speedTier === 'Super Speed' && !hasSuperSpeed) currentSpeed = 'Normal';
      if (speedTier === 'Same Day' && !hasSameDay) currentSpeed = 'Normal';
      if (speedTier === 'Speed Jadi Besok' && !hasNextDay) currentSpeed = 'Normal';
    } else {
      // Non sworn always 'Normal' speed
      currentSpeed = 'Normal';
    }

    const breakdown = calculateLeadCost(
      langKey,
      translationType,
      documentCategory,
      currentSpeed,
      simulatedPages,
      {
        apostille: selectedApostille,
        legalisation: selectedLegalisations,
        skck: selectedSkck
      }
    );

    setCostBreakdown(breakdown);
    if (currentSpeed !== speedTier) {
      setSpeedTier(currentSpeed);
    }
  }, [
    translationType,
    selectedSwornLang,
    selectedNonSwornOpt,
    documentCategory,
    simulatedPages,
    speedTier,
    selectedApostille,
    selectedLegalisations,
    selectedSkck
  ]);

  // Load Admin Data when switching tab
  useEffect(() => {
    if (activeTab === 'admin') {
      fetchLeads();
      fetchSheetsConfig();
    }
  }, [activeTab]);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchSheetsConfig = async () => {
    try {
      const res = await fetch('/api/sheet-config');
      if (res.ok) {
        const data = await res.json();
        setSheetsConfig(data);
      }
    } catch (e) {
      console.error('Error fetching sheet configs:', e);
    }
  };

  const saveSheetConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccess(false);
    try {
      const res = await fetch('/api/sheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetsConfig)
      });
      if (res.ok) {
        setConfigSuccess(true);
        setTimeout(() => setConfigSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving configs:', e);
    } finally {
      setSavingConfig(false);
    }
  };

  // Synchronize Google Auth State
  useEffect(() => {
    const unsubscribe = initAuthListener(
      (user, token) => {
        setGUser(user);
        setGToken(token);
        // Load Spreadsheets if logged in
        loadUserSpreadsheets(token);
      },
      () => {
        setGUser(null);
        setGToken(null);
        setGSpreadsheets([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGUser(result.user);
        setGToken(result.accessToken);
        loadUserSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      console.error('Error Google Login:', err);
      alert('Gagal login dengan Google: ' + err.message);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGUser(null);
      setGToken(null);
      setGSpreadsheets([]);
    } catch (err) {
      console.error('Error Google Logout:', err);
    }
  };

  const loadUserSpreadsheets = async (token: string) => {
    setIsLoadingGSheets(true);
    try {
      const sheetsList = await listSpreadsheets(token);
      setGSpreadsheets(sheetsList);
    } catch (err) {
      console.error('Error listing spreadsheets:', err);
    } finally {
      setIsLoadingGSheets(false);
    }
  };

  const handleCreateAutoSheet = async () => {
    if (!gToken) return;
    setIsCreatingGSheet(true);
    try {
      const sheetId = await createNewSpreadsheet(gToken, 'AMPM Sworn Translator Leads Database');
      // Update Sheets Config
      const updatedConfig = {
        ...sheetsConfig,
        googleSpreadsheetId: sheetId,
        googleDirectSyncEnabled: true
      };
      setSheetsConfig(updatedConfig);
      // Reload spreadsheets list
      await loadUserSpreadsheets(gToken);
      // Save configurations
      await fetch('/api/sheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      alert('Berhasil membuat & menghubungkan Google Sheet baru: "AMPM Sworn Translator Leads Database"!');
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      alert('Gagal membuat Google Sheet otomatis: ' + err.message);
    } finally {
      setIsCreatingGSheet(false);
    }
  };

  const loadDriveFilesList = async () => {
    const tokenToUse = gToken;
    if (!tokenToUse) {
      // Prompt Sign in first
      try {
        const result = await googleSignIn();
        if (result) {
          setGUser(result.user);
          setGToken(result.accessToken);
          fetchDriveFilesWithToken(result.accessToken);
        }
      } catch (err: any) {
        setDriveError('Silakan login dengan akun Google terlebih dahulu');
      }
      return;
    }
    fetchDriveFilesWithToken(tokenToUse);
  };

  const fetchDriveFilesWithToken = async (token: string) => {
    setIsLoadingDrive(true);
    setDriveError(null);
    setDriveModalOpen(true);
    try {
      const files = await listDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      setDriveError(err.message || 'Gagal memuat file dari Google Drive');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSelectDriveFile = async (file: any) => {
    if (!gToken) return;
    setDownloadingDriveFileId(file.id);
    try {
      const base64Data = await downloadDriveFileAsBase64(gToken, file.id);
      
      const newDoc: UploadedDoc = {
        id: `drive-${file.id}-${Date.now()}`,
        name: file.name,
        size: file.size ? parseInt(file.size) : 100 * 1024, // fallback size
        type: file.mimeType,
        base64: base64Data,
        status: 'idle'
      };

      setUploadedDocs(prev => [...prev, newDoc]);
      setDriveModalOpen(false);
    } catch (err: any) {
      alert('Gagal mengunduh file dari Google Drive: ' + err.message);
    } finally {
      setDownloadingDriveFileId(null);
    }
  };

  const updateLeadStatus = async (id: string, status: 'Pending' | 'Selesai' | 'Dihubungi') => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        if (selectedAdminLead && selectedAdminLead.id === id) {
          setSelectedAdminLead(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (e) {
      console.error('Error updating lead status:', e);
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data lead ini?')) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selectedAdminLead && selectedAdminLead.id === id) {
          setSelectedAdminLead(null);
        }
      }
    } catch (e) {
      console.error('Error deleting lead:', e);
    }
  };

  const handleToggleDeal = async (lead: TranslationLead, isDealed: boolean) => {
    try {
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 5); // default 5 days
      const formattedDate = defaultDeadline.toISOString().split('T')[0];

      const updatePayload: Partial<TranslationLead> = {
        isDealed,
        dealDeadline: lead.dealDeadline || formattedDate,
        dealStatus: lead.dealStatus || 'Dalam Antrean',
        dealFinalPrice: lead.dealFinalPrice || lead.grandTotalCost,
        orderNotes: lead.orderNotes || ''
      };

      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) throw new Error('Gagal menandai status deal');
      const data = await res.json();

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updatePayload } : l));
      if (selectedAdminLead && selectedAdminLead.id === lead.id) {
        setSelectedAdminLead(prev => prev ? { ...prev, ...updatePayload } : null);
      }
      
      alert(isDealed 
        ? `Sukses! Lead ${lead.id} berhasil ditandai sebagai DEAL.\n\nAnda dapat mengelola deadline, rincian biaya deal, status proses, serta mencetak Invoice & Penawaran di tab "Manajemen Order".`
        : `Sukses! Order ${lead.id} dikembalikan ke database CRM Prospek.`
      );
    } catch (err: any) {
      console.error('Error toggling deal:', err);
      alert('Gagal: ' + err.message);
    }
  };

  const handleUpdateDealDetails = async (id: string) => {
    try {
      const updatePayload = {
        dealDeadline: dealDeadlineInput,
        dealStatus: dealStatusInput,
        dealFinalPrice: Number(dealPriceInput),
        orderNotes: dealNotesInput
      };

      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) throw new Error('Gagal memperbarui rincian order');
      const data = await res.json();

      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatePayload } : l));
      if (selectedAdminLead && selectedAdminLead.id === id) {
        setSelectedAdminLead(prev => prev ? { ...prev, ...updatePayload } : null);
      }
      setDealEditLead(null);
      alert('Rincian deadline dan rincian finansial order berhasil disimpan!');
    } catch (err: any) {
      console.error('Error updating deal info:', err);
      alert('Error: ' + err.message);
    }
  };

  // Helper to read file to base64
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  // Add files to list and trigger base64 conversion
  const handleFilesAdded = async (files: FileList | File[]) => {
    setAnalysisError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const newDocs: UploadedDoc[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        setAnalysisError('Beberapa file tidak didukung. Harap hanya upload foto dokumen (JPEG/PNG) atau PDF.');
        continue;
      }

      // Check for duplicates (same name and size)
      if (uploadedDocs.some(d => d.name === file.name && d.size === file.size)) {
        continue; // skip duplicate upload
      }

      const id = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}-${i}`;
      try {
        const base64 = await readFileAsDataURL(file);
        newDocs.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          base64,
          status: 'idle'
        });
      } catch (err) {
        console.error(err);
        setAnalysisError('Gagal memproses beberapa file lokal.');
      }
    }

    if (newDocs.length > 0) {
      setUploadedDocs(prev => [...prev, ...newDocs]);
    }
  };

  const removeDoc = (id: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== id));
  };

  // Drag & drop logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // AI OCR and Calculation analysis triggering
  const runAiAnalysis = async () => {
    const pendingDocs = uploadedDocs.filter(d => d.status === 'idle' || d.status === 'error');
    if (pendingDocs.length === 0) {
      if (uploadedDocs.length === 0) {
        setAnalysisError('Silakan upload beberapa file dokumen terlebih dahulu.');
      } else {
        setAnalysisError('Semua file Anda sudah berhasil dianalisis.');
      }
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisLogs(['Menghubungi AI untuk menginisialisasi OCR...', `Mengevaluasi ${pendingDocs.length} file secara paralel...`]);

    const logSteps = [
      'Memindai dokumen paralel dan mengekstrak teks asli...',
      'Mendeteksi jenis dokumen...',
      'Melakukan klasifikasi kategori per aturan legal AMPM...',
      'Menganalisis total kata dan karakter terdaftar...',
      'Melakukan simulasi tata letak A4 (Times New Roman, spasi 1.5)...',
      'Mematangkan hasil kalkulasi halaman...'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logSteps.length) {
        setAnalysisLogs(prev => [...prev, logSteps[currentLogIndex]]);
        currentLogIndex++;
      }
    }, 1200);

    // Turn checking status of these documents to analyzing
    setUploadedDocs(prev => prev.map(d => 
      d.status === 'idle' || d.status === 'error' ? { ...d, status: 'analyzing' } : d
    ));

    try {
      const analysisPromises = pendingDocs.map(async (doc) => {
        try {
          const res = await fetch('/api/analyze-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: doc.base64,
              fileName: doc.name,
              mimeType: doc.type,
              targetLanguage: translationType === 'sworn' ? selectedSwornLang : selectedNonSwornOpt
            })
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Gagal memproses file.');
          }

          const data = await res.json();
          return {
            id: doc.id,
            success: true,
            data
          };
        } catch (err: any) {
          return {
            id: doc.id,
            success: false,
            error: err.message || 'Gagal menganalisis file akademis/legal.'
          };
        }
      });

      const results = await Promise.all(analysisPromises);
      clearInterval(interval);

      setUploadedDocs(prev => prev.map(d => {
        const docResult = results.find(r => r.id === d.id);
        if (docResult) {
          if (docResult.success && docResult.data) {
            const data = docResult.data;
            return {
              ...d,
              status: 'success',
              documentTypeDetected: data.documentTypeDetected || 'Dokumen Kustom',
              category: data.category === 'Non Reguler' ? 'Non Reguler' : 'Reguler',
              wordCount: data.wordCount || 0,
              charCount: data.charCount || 0,
              simulatedPages: Math.max(1, data.simulatedPagesCount || 1),
              explanation: data.explanation || '',
              textSnippet: data.textSnippet || ''
            };
          } else {
            return {
              ...d,
              status: 'error',
              errorMessage: docResult.error
            };
          }
        }
        return d;
      }));

      const errorCount = results.filter(r => !r.success).length;
      if (errorCount > 0) {
        setAnalysisError(`${errorCount} file gagal dianalisis. Anda dapat memicu ulang atau memasukkan rincian manual.`);
      }

      setAnalysisLogs(prev => [...prev, '✨ Seluruh dokumen sukses disatukan!']);

    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setAnalysisError(err.message || 'Gagal menganalisis dokumen menggunakan server AI. Silakan masukkan parameter manual.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const syncLeadToGoogleSheet = async (lead: any, silenceAlert = true) => {
    const token = gToken;
    const sheetId = sheetsConfig.googleSpreadsheetId;
    if (!token || !sheetId) {
      if (!silenceAlert) {
        alert('Mohon hubungkan Google Sheets Anda terlebih dahulu di tab Admin & Sheets.');
      }
      return false;
    }

    try {
      const rowData = [
        lead.id ?? '',
        new Date(lead.createdAt || Date.now()).toLocaleString('id-ID'),
        lead.customerName ?? '',
        lead.customerWhatsapp ?? '',
        lead.customerEmail ?? '-',
        lead.sourceLanguage  ?? 'Indonesia',
        lead.targetLanguage ?? '',
        lead.translationType === 'sworn' ? 'Tersumpah (Sworn)' : 'Biasa (Non-Sworn)',
        lead.fileName ?? '-',
        lead.documentCategory ?? '-',
        lead.documentTypeDetected ?? '-',
        lead.wordCount ?? 0,
        lead.charCount ?? 0,
        lead.calculatedStandardPages ?? lead.simulatedPages ?? 1,
        lead.speedTier ?? '-',
        lead.costPerPage ?? 0,
        lead.totalTranslationCost ?? 0,
        lead.addons?.apostille ?? '-',
        Array.isArray(lead.addons?.legalisation) ? lead.addons.legalisation.join(', ') : '-',
        lead.addons?.skck ? 'Ya' : 'Tidak',
        lead.addonCost ?? 0,
        lead.grandTotalCost ?? 0,
        lead.status ?? 'Pending'
      ];

      await appendRowToSpreadsheet(token, sheetId, 'Sheet1', rowData);
      if (!silenceAlert) {
        alert(`Lead ${lead.id} berhasil disinkronkan ke Google Sheet!`);
      }
      return true;
    } catch (err: any) {
      console.error('Direct Sheet sync error:', err);
      if (!silenceAlert) {
        alert('Gagal menyinkronkan data langsung ke Google Sheet: ' + err.message);
      }
      return false;
    }
  };

  // Submit Lead Submission Trigger
  const submitLead = async () => {
    if (!customerName || !customerWhatsapp) {
      alert('Mohon isi nama lengkap dan nomor WhatsApp terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const destLangLabel = translationType === 'sworn' 
        ? SWORN_PRICING[selectedSwornLang]?.targetLanguage || selectedSwornLang
        : NON_SWORN_PRICING[selectedNonSwornOpt]?.term || selectedNonSwornOpt;

      const finalSourceLanguage = translationDirection === 'outbound' ? 'Indonesia' : destLangLabel;
      const finalTargetLanguage = translationDirection === 'outbound' ? destLangLabel : 'Indonesia';

      const payload = {
        customerName,
        customerWhatsapp,
        customerEmail,
        sourceLanguage: finalSourceLanguage,
        targetLanguage: finalTargetLanguage,
        translationType,
        fileName: uploadedDocs.length > 0 ? uploadedDocs.map(d => d.name).join(', ') : 'Estimasi Manual (Tanpa Dokumen)',
        documentCategory,
        documentTypeDetected: documentTypeDetected || 'Manual Entry',
        wordCount,
        charCount,
        calculatedStandardPages: simulatedPages,
        speedTier,
        costPerPage: costBreakdown.costPerPage,
        totalTranslationCost: costBreakdown.translationCost,
        addons: {
          apostille: selectedApostille,
          legalisation: selectedLegalisations,
          skck: selectedSkck
        },
        addonCost: costBreakdown.addonCost,
        grandTotalCost: costBreakdown.grandTotal,
        textExtractedSnippet: textSnippet
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Gagal mengirimkan pengajuan ke server');
      }

      const result = await res.json();
      setSubmissionResult(result);
      setSubmissionSuccess(true);

      // Auto Direct Sync to Google Sheets if enabled
      if (sheetsConfig.googleDirectSyncEnabled && sheetsConfig.googleSpreadsheetId && gToken) {
        await syncLeadToGoogleSheet(result.lead, true);
      }
    } catch (e: any) {
      alert(e.message || 'Gagal mendaftarkan pengajuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form estimator
  const handleReset = () => {
    setUploadedDocs([]);
    setAnalysisError(null);
    setHasAnalyzed(false);
    setDocumentTypeDetected('');
    setDocumentCategory('Reguler');
    setWordCount(0);
    setCharCount(0);
    setSimulatedPages(1);
    setAnalysisExplanation('');
    setTextSnippet('');
    setSubmissionSuccess(false);
    setSubmissionResult(null);
    setSelectedApostille(null);
    setSelectedLegalisations([]);
    setSelectedSkck(false);
    setSpeedTier('Normal');
  };

  // Compile prefilled WA Chat Link
  const getWhatsAppLink = () => {
    if (!submissionResult?.lead) return '';
    const lead = submissionResult.lead;
    const destLangLabel = translationType === 'sworn' 
      ? SWORN_PRICING[selectedSwornLang]?.targetLanguage || selectedSwornLang
      : NON_SWORN_PRICING[selectedNonSwornOpt]?.term || selectedNonSwornOpt;

    const sourceLangText = translationDirection === 'outbound' ? 'Indonesia' : destLangLabel;
    const targetLangText = translationDirection === 'outbound' ? destLangLabel : 'Indonesia';

    const text = `Halo AMPM Sworn Translator, saya ingin memesan layanan penerjemahan resmi:

*Data Klien:*
• Nama Klien : ${lead.customerName}
• WhatsApp : ${lead.customerWhatsapp}
• Email : ${lead.customerEmail || '-'}

*Detail Dokumen:*
• File Dokumen : ${lead.fileName}
• Sifat Dokumen : ${lead.translationType === 'sworn' ? 'Tersumpah (Sworn)' : 'Biasa (Non-Sworn)'}
• Arah Bahasa : Dari ${sourceLangText} ke ${targetLangText}
• Jenis Dokumen : ${lead.documentTypeDetected} (${lead.documentCategory})
• Simulasi Hasil : ${lead.calculatedStandardPages} Halaman (A4, TNR 12, Spasi 1.5)
• Paket Kecepatan : ${lead.speedTier} (Rp ${lead.costPerPage.toLocaleString('id-ID')}/hal)

*Layanan Sertifikasi Tambahan:*
• Apostille: ${lead.addons?.apostille ? APOSTILLE_PRICING[lead.addons.apostille as keyof typeof APOSTILLE_PRICING]?.name : '-'}
• Legalisasi Kementerian: ${lead.addons?.legalisation?.length ? lead.addons.legalisation.map((k: string) => LEGALISATION_PRICING[k]?.name).join(', ') : '-'}
• SKCK Mabes Polri: ${lead.addons?.skck ? 'Ya (Rp 800.000)' : '-'}

*Estimasi Penawaran:*
• Biaya Terjemah : Rp ${lead.totalTranslationCost.toLocaleString('id-ID')}
• Biaya Tambahan : Rp ${lead.addonCost.toLocaleString('id-ID')}
*• TOTAL ESTIMASI : Rp ${lead.grandTotalCost.toLocaleString('id-ID')}*

ID Estimasi: *${lead.id}*
Mohon bantuannya untuk memproses pesanan saya. Terima kasih!`;

    return `https://wa.me/628123456789/?text=${encodeURIComponent(text)}`; // Real AMPM WA could be set here
  };

  // Export leads list to CSV
  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = [
      'ID Lead', 'Waktu Masuk', 'Nama Pelanggan', 'WhatsApp', 'Email', 
      'Bahasa Asal', 'Bahasa Tujuan', 'Jenis Layanan', 'Nama File', 
      'Kategori', 'Jenis Dokumen', 'Halaman Prediksi', 'Kecepatan', 
      'Harga Per Halaman', 'Biaya Terjemah', 'Biaya Addon', 'Total Biaya', 'Status'
    ];

    const rows = leads.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString('id-ID'),
      l.customerName,
      `'${l.customerWhatsapp}`, // Single quote prevents Excel trimming +62/0
      l.customerEmail || '-',
      l.sourceLanguage,
      l.targetLanguage,
      l.translationType === 'sworn' ? 'Tersumpah' : 'Biasa',
      l.fileName,
      l.documentCategory,
      l.documentTypeDetected,
      l.calculatedStandardPages,
      l.speedTier,
      l.costPerPage,
      l.totalTranslationCost,
      l.addonCost,
      l.grandTotalCost,
      l.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AMPM-Leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered leads for search and admin sub-tabs (split leads vs dealed orders)
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.customerWhatsapp.includes(searchQuery) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetLanguage.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (adminSubTab === 'leads') {
      return !l.isDealed && matchesSearch;
    } else if (adminSubTab === 'orders') {
      return !!l.isDealed && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Visual Identity Logo & Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Official AMPM Translator Logo */}
            <img 
              src="https://ampmtranslator.com/wp-content/uploads/2026/02/Logo-AMPMTranslator.jpg" 
              alt="Logo AMPM Translator" 
              referrerPolicy="no-referrer"
              className="h-11 sm:h-12 w-auto object-contain rounded-lg border border-slate-100 shadow-xs"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center gap-2">
                AMPM Sworn Translator
                <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold py-0.5 px-2 rounded-full tracking-wider">Sworn Only</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sworn Translation Service</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden lg:block">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Service Status</p>
              <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> AI Engine Active
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="tab-btn-estimator"
                onClick={() => setActiveTab('estimator')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center space-x-1.5 border ${
                  activeTab === 'estimator'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Formulir Estimasi</span>
              </button>
              <button
                id="tab-btn-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center space-x-1.5 border ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Admin & Sheets</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'estimator' ? (
            <motion.div
              key="estimator-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Form & Document Picker (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                
                {/* Visual Intro Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
                  <div className="relative z-10 space-y-2.5">
                    <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-350 text-[10px] font-bold py-1 px-3 rounded-full border border-indigo-500/30 uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                      <span>Analisis OCR & Estimasi Halaman Cerdas</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight leading-snug">
                      Dapatkan kalkulasi biaya resmi secara presisi sesuai retail tarif AMPM ter-update.
                    </h2>
                    <p className="text-xs text-slate-300 max-w-lg leading-relaxed pt-1">
                      Upload foto dokumen atau PDF Anda, AI akan mengekstrak teks, mengklasifikasi kategori reguler/non-reguler, dan mensimulasikan hasil cetak halaman standar.
                    </p>
                  </div>
                  {/* Decorative faint background glowing elements */}
                  <div className="absolute right-0 bottom-0 w-44 h-44 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
                  <div className="absolute left-1/3 top-1/4 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
                </div>

                {/* Main Form Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
                    <span>Informasi Pelanggan</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap Klien <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="Masukkan nama lengkap Anda"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium transition-all focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">No. WhatsApp Aktif <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="tel"
                          required
                          placeholder="Contoh: 08123456789 atau +62812..."
                          value={customerWhatsapp}
                          onChange={(e) => setCustomerWhatsapp(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium transition-all focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email (Opsional)</label>
                    <input
                      type="email"
                      placeholder="Masukkan alamat email Anda"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium transition-all focus:bg-white"
                    />
                  </div>

                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 pt-4">
                    <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
                    <span>Layanan Penerjemahan & Bahasa</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Translation Type Radio Cards */}
                    <div
                      onClick={() => setTranslationType('sworn')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        translationType === 'sworn'
                          ? 'border-indigo-600 bg-indigo-50/10 text-slate-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm tracking-wide">Penerjemah Tersumpah (Sworn)</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          translationType === 'sworn' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'
                        }`}>
                          {translationType === 'sworn' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                        Hasil dibubuhi tanda tangan basah resmi & cap sah terdaftar di Kemenkumham & Kemenlu.
                      </p>
                    </div>

                    <div
                      onClick={() => setTranslationType('non-sworn')}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        translationType === 'non-sworn'
                          ? 'border-indigo-600 bg-indigo-50/10 text-slate-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm tracking-wide">Penerjemah Biasa (Non-Sworn)</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          translationType === 'non-sworn' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'
                        }`}>
                          {translationType === 'non-sworn' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                        Hasil akurat standar komersial tanpa sertifikasi legalitas cap resmi pemerintah.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50/50 border border-slate-150 p-4 rounded-2xl mb-2">
                    {/* Source Language Column */}
                    <div className="w-full sm:flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Bahasa Asal Dokumen
                      </label>
                      {translationDirection === 'outbound' ? (
                        <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-550 text-sm font-bold flex items-center justify-between">
                          <span>Indonesia (ID)</span>
                          <Languages className="w-4 h-4 text-slate-400" />
                        </div>
                      ) : (
                        translationType === 'sworn' ? (
                          <select
                            value={selectedSwornLang}
                            onChange={(e) => setSelectedSwornLang(e.target.value)}
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-705 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                          >
                            {Object.keys(SWORN_PRICING).map((key) => (
                              <option key={key} value={key}>
                                {SWORN_PRICING[key].targetLanguage}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={selectedNonSwornOpt}
                            onChange={(e) => setSelectedNonSwornOpt(e.target.value)}
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-705 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                          >
                            {Object.keys(NON_SWORN_PRICING).map((key) => (
                              <option key={key} value={key}>
                                {NON_SWORN_PRICING[key].term}
                              </option>
                            ))}
                          </select>
                        )
                      )}
                    </div>

                    {/* Swap Button Container */}
                    <div className="flex flex-col items-center justify-center pt-2 sm:pt-5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setTranslationDirection(prev => prev === 'outbound' ? 'inbound' : 'outbound')}
                        className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 hover:bg-slate-50 rounded-full shadow-xs hover:shadow transition-all flex items-center justify-center cursor-pointer active:scale-90"
                        title="Tukar Arah Terjemahan"
                      >
                        <ArrowLeftRight className="w-4 h-4 transform active:rotate-180 transition-transform duration-300" />
                      </button>
                    </div>

                    {/* Target Language Column */}
                    <div className="w-full sm:flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Bahasa Tujuan Terjemahan
                      </label>
                      {translationDirection === 'inbound' ? (
                        <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-550 text-sm font-bold flex items-center justify-between">
                          <span>Indonesia (ID)</span>
                          <Languages className="w-4 h-4 text-slate-400" />
                        </div>
                      ) : (
                        translationType === 'sworn' ? (
                          <select
                            value={selectedSwornLang}
                            onChange={(e) => setSelectedSwornLang(e.target.value)}
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-705 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                          >
                            {Object.keys(SWORN_PRICING).map((key) => (
                              <option key={key} value={key}>
                                {SWORN_PRICING[key].targetLanguage}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={selectedNonSwornOpt}
                            onChange={(e) => setSelectedNonSwornOpt(e.target.value)}
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-705 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                          >
                            {Object.keys(NON_SWORN_PRICING).map((key) => (
                              <option key={key} value={key}>
                                {NON_SWORN_PRICING[key].term}
                              </option>
                            ))}
                          </select>
                        )
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 italic mt-0 mb-4 px-1">
                    * Tarif per halaman otomatis terintegrasi. Salah satu arah bahasa wajib Indonesia (ID) sesuai cakupan resmi AMPM Sworn Translator.
                  </p>

                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 pt-4">
                    <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
                    <span>Upload & Pindai Dokumen</span>
                  </h3>

                  {/* Drag and Drop Container */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      dragOver 
                        ? 'border-indigo-400 bg-indigo-50/40 scale-[0.99]' 
                        : uploadedDocs.length > 0
                          ? 'border-slate-200 bg-slate-50/40'
                          : 'border-slate-200 bg-slate-50 hover:border-indigo-400 cursor-pointer'
                    }`}
                  >
                    {uploadedDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Seret beberapa dokumen atau klik untuk unggah</p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">Mendukung banyak file sekaligus: JPG, PNG, atau PDF</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                          <label className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all">
                            <span>Pilih File Dokumen</span>
                            <input
                              type="file"
                              multiple
                              accept=".jpeg,.jpg,.png,.pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleFilesAdded(e.target.files);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={loadDriveFilesList}
                            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-250 hover:border-slate-350 transition-all cursor-pointer shadow-xs"
                          >
                            <Folder className="w-4 h-4 text-indigo-600" />
                            <span>Pilih dari Google Drive</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Compact add-more box */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Daftar Dokumen Anda ({uploadedDocs.length} File)
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={loadDriveFilesList}
                              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-2.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            >
                              <Folder className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Ambil dari Drive</span>
                            </button>
                            <label className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all">
                              <Plus className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Tambah File</span>
                              <input
                                type="file"
                                multiple
                                accept=".jpeg,.jpg,.png,.pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleFilesAdded(e.target.files);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Document Items List */}
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                          {uploadedDocs.map((doc, idx) => {
                            const isDocAnalyzing = doc.status === 'analyzing';
                            const isDocSuccess = doc.status === 'success';
                            const isDocError = doc.status === 'error';

                            return (
                              <div
                                key={doc.id}
                                className={`flex items-center justify-between p-3.5 bg-white border rounded-xl transition-all ${
                                  isDocAnalyzing 
                                    ? 'border-amber-200 bg-amber-50/10'
                                    : isDocSuccess
                                      ? 'border-emerald-200 bg-emerald-50/10'
                                      : isDocError
                                        ? 'border-rose-200 bg-rose-50/10'
                                        : 'border-slate-150'
                                }`}
                              >
                                <div className="flex items-start space-x-3 text-left">
                                  <div className={`p-2.5 rounded-xl mt-0.5 ${
                                    isDocAnalyzing
                                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                                      : isDocSuccess
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : isDocError
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {isDocAnalyzing ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : isDocSuccess ? (
                                      <Check className="w-5 h-5" />
                                    ) : isDocError ? (
                                      <AlertTriangle className="w-5 h-5" />
                                    ) : (
                                      <FileText className="w-5 h-5" />
                                    )}
                                  </div>

                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[180px] sm:max-w-xs" title={doc.name}>
                                      {doc.name}
                                    </p>
                                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
                                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                      <span>•</span>
                                      <span className="uppercase">{doc.type.split('/')[1]}</span>
                                      <span>•</span>
                                      {isDocAnalyzing && (
                                        <span className="text-amber-600 animate-pulse font-bold uppercase tracking-wider">Sedang Memindai...</span>
                                      )}
                                      {isDocSuccess && (
                                        <span className="text-emerald-700 font-bold bg-emerald-100/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          Selesai • {doc.simulatedPages || 1} Hal
                                        </span>
                                      )}
                                      {isDocError && (
                                        <span className="text-rose-600 font-bold bg-rose-100/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Gagal</span>
                                      )}
                                      {doc.status === 'idle' && (
                                        <span className="text-slate-400 font-bold uppercase tracking-wider font-sans">Belum Pindai</span>
                                      )}
                                    </div>
                                    {isDocSuccess && doc.documentTypeDetected && (
                                      <p className="text-[10px] text-slate-650 font-medium italic mt-0.5">
                                        Jenis: {doc.documentTypeDetected} ({doc.category}) • {doc.wordCount} kata
                                      </p>
                                    )}
                                    {isDocError && doc.errorMessage && (
                                      <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                                        {doc.errorMessage}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeDoc(doc.id)}
                                  className="p-1 px-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                                  title="Hapus file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Central trigger button inside the list */}
                        {uploadedDocs.some(d => d.status === 'idle' || d.status === 'error') && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={runAiAnalysis}
                              disabled={isAnalyzing}
                              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all shadow-indigo-600/10"
                            >
                              {isAnalyzing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              <span>{isAnalyzing ? 'Sedang Memproses AI...' : 'Mulai Pindai Semua Dokumen dengan AI'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Analysis logs animation box */}
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-1.5 border border-slate-800 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          Mesin Analisis Dokumen AMPM v3.5-Flash
                        </span>
                        <span>[Running]</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin">
                        {analysisLogs.map((log, idx) => (
                          <motion.p
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="leading-relaxed"
                          >
                            &gt; {log}
                          </motion.p>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {analysisError && (
                    <div className="bg-rose-55 hover:bg-rose-100/40 border border-rose-150 p-4 rounded-xl flex items-start space-x-3 transition-colors">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">Perhatian / Masalah Dokumen</h4>
                        <p className="text-xs text-rose-700/90 leading-relaxed mt-0.5">{analysisError}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Output Fields (shows only after analysis succeeds) */}
                  {hasAnalyzed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-50/10 border border-indigo-100 rounded-2xl p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-indigo-100/60 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-950 font-display">Hasil Ekstraksi OCR & AI</h4>
                            <p className="text-[10px] text-slate-400 font-medium">Verifikasi kalkulasi dokumen digital</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-100">
                          <Check className="w-2.5 h-2.5 animate-pulse" /> AI Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Dokumen Terdeteksi</label>
                          <input
                            type="text"
                            value={documentTypeDetected}
                            onChange={(e) => setDocumentTypeDetected(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-550 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Klasifikasi Retails</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDocumentCategory('Reguler')}
                              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                                documentCategory === 'Reguler'
                                  ? 'bg-indigo-600 border-indigo-650 text-white shadow-md shadow-indigo-600/10'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              Reguler
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocumentCategory('Non Reguler')}
                              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                                documentCategory === 'Non Reguler'
                                  ? 'bg-indigo-600 border-indigo-650 text-white shadow-md shadow-indigo-600/10'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              Non Reguler
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-xs">
                        <h5 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                          <span>Statistik Panjang Teks & Halaman Standard</span>
                          <span className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">TNR 12, Spasi 1.5, Margins</span>
                        </h5>
                        
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Kata</span>
                            <span className="block text-base font-bold text-slate-800 font-mono">
                              {wordCount.toLocaleString('id-ID')}
                            </span>
                          </div>
                          
                          <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Karakter</span>
                            <span className="block text-base font-bold text-slate-800 font-mono">
                              {charCount.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                            <span className="block text-[10px] uppercase font-bold text-indigo-900">Simulasi Halaman</span>
                            <div className="flex items-center justify-center space-x-1.5">
                              <input
                                type="number"
                                min="1"
                                value={simulatedPages}
                                onChange={(e) => setSimulatedPages(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-12 text-center bg-transparent border-b border-indigo-200 focus:border-indigo-600 font-mono font-bold text-base text-indigo-900 p-0 focus:outline-none"
                              />
                              <span className="text-xs font-bold text-indigo-800">Hal</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-start space-x-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p>{analysisExplanation}</p>
                        </div>
                      </div>

                      {/* Snippet box */}
                      {textSnippet && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-slate-500">Pratinjau Teks Terekstrak (OCR)</span>
                          <div className="bg-white border border-slate-150 p-3 rounded-lg text-slate-600 text-xs font-mono max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                            {textSnippet}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Manual entry options to ensure a bulletproof UX even if no document is uploaded */}
                  {!hasAnalyzed && !isAnalyzing && (
                    <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 transition-all">
                      <div className="flex items-start space-x-2.5">
                        <FileCheck className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Mau mengukur parameter manual tanpa upload?</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Bila Anda sudah tahu halaman fisik atau hanya ingin simulasi, masukkan halaman manual.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDocumentTypeDetected('Dokumen Manual');
                          setDocumentCategory('Reguler');
                          setSimulatedPages(1);
                          setHasAnalyzed(true);
                          setAnalysisExplanation('Dokumen diatur secara manual oleh pengguna tanpa pemindaian OCR.');
                        }}
                        className="text-xs bg-white text-blue-900 hover:text-blue-950 font-bold px-3 py-1.5 border border-slate-250 hover:border-slate-350 rounded-lg transition-all text-center shrink-0 shadow-xs"
                      >
                        Atur Manual
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column: Checkout, Speed, Addons & Invoice (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-6">
                
                {/* Visual Shopping Cart Structure */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden sticky top-24">
                  <div className="bg-slate-950 border-b border-slate-800/80 p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-100">Estimasi Ringkasan Invoice</h3>
                    </div>
                    <span className="text-[10px] font-mono tracking-wider bg-indigo-600/20 text-indigo-400 px-2.5 py-1 rounded-full uppercase font-bold border border-indigo-500/20">
                      Kasir AMPM
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    
                    {/* Speed Tier Selection Cards - SHOWS IF SWORN AND FOR SUPPORTED ONLY */}
                    {translationType === 'sworn' && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-indigo-400 flex items-center space-x-1.5 uppercase tracking-wider">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          <span>Pilihan Kecepatan Sworn</span>
                        </h4>

                        <div className="grid grid-cols-1 gap-2">
                          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all">
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name="speed-tier"
                                checked={speedTier === 'Normal'}
                                onChange={() => setSpeedTier('Normal')}
                                className="text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 bg-slate-800 border-slate-700 w-4 h-4"
                              />
                              <div>
                                <span className="block text-xs font-bold text-slate-200">Paket Normal (Reguler)</span>
                                <span className="block text-[10px] text-slate-500">Pengerjaan standar acuan retail (2-4 hari)</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-indigo-400">
                              Rp {
                                (documentCategory === 'Reguler' 
                                  ? SWORN_PRICING[selectedSwornLang]?.prices.normalReguler 
                                  : SWORN_PRICING[selectedSwornLang]?.prices.normalNonReguler)?.toLocaleString('id-ID')
                              } / hal
                            </span>
                          </label>

                          {/* Render Super Speed (3 Jam), Same Day, Next Day if available for the language */}
                          {(selectedSwornLang === 'English' || selectedSwornLang === 'Dutch') && (
                            <>
                              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all">
                                <div className="flex items-center space-x-2.5">
                                  <input
                                    type="radio"
                                    name="speed-tier"
                                    checked={speedTier === 'Super Speed'}
                                    onChange={() => setSpeedTier('Super Speed')}
                                    className="text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 bg-slate-800 border-slate-700 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block text-xs font-bold text-amber-500 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                                      Super Speed (Kilat)
                                    </span>
                                    <span className="block text-[10px] text-slate-500">Pengerjaan super singkat (3-7 Jam)</span>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-indigo-400">
                                  Rp {
                                    (documentCategory === 'Reguler' 
                                      ? SWORN_PRICING[selectedSwornLang]?.prices.superSpeedReguler 
                                      : SWORN_PRICING[selectedSwornLang]?.prices.superSpeedNonReguler)?.toLocaleString('id-ID')
                                  } / hal
                                </span>
                              </label>

                              {selectedSwornLang === 'English' && (
                                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all">
                                  <div className="flex items-center space-x-2.5">
                                    <input
                                      type="radio"
                                      name="speed-tier"
                                      checked={speedTier === 'Same Day'}
                                      onChange={() => setSpeedTier('Same Day')}
                                      className="text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 bg-slate-800 border-slate-700 w-4 h-4"
                                    />
                                    <div>
                                      <span className="block text-xs font-bold text-slate-200">Same Day Delivery</span>
                                      <span className="block text-[10px] text-slate-500">Masuk sebelum jam 12, jadi jam 19.00</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-indigo-400">
                                    Rp {
                                      (documentCategory === 'Reguler' 
                                        ? SWORN_PRICING[selectedSwornLang]?.prices.sameDayReguler 
                                        : SWORN_PRICING[selectedSwornLang]?.prices.sameDayNonReguler)?.toLocaleString('id-ID')
                                    } / hal
                                  </span>
                                </label>
                              )}

                              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all">
                                <div className="flex items-center space-x-2.5">
                                  <input
                                    type="radio"
                                    name="speed-tier"
                                    checked={speedTier === 'Speed Jadi Besok'}
                                    onChange={() => setSpeedTier('Speed Jadi Besok')}
                                    className="text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 bg-slate-800 border-slate-700 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block text-xs font-bold text-slate-200">Speed Jadi Besok</span>
                                    <span className="block text-[10px] text-slate-500">Ready kilat besok hari kerja</span>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-indigo-400">
                                  Rp {
                                    (documentCategory === 'Reguler' 
                                      ? SWORN_PRICING[selectedSwornLang]?.prices.nextDayReguler 
                                      : SWORN_PRICING[selectedSwornLang]?.prices.nextDayNonReguler)?.toLocaleString('id-ID')
                                  } / hal
                                </span>
                              </label>
                            </>
                          )}

                          {/* For other sworn languages show Normal & Kilat Generic */}
                          {selectedSwornLang !== 'English' && selectedSwornLang !== 'Dutch' && (
                            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all">
                              <div className="flex items-center space-x-2.5">
                                <input
                                  type="radio"
                                  name="speed-tier"
                                  checked={speedTier === 'Super Speed'}
                                  onChange={() => setSpeedTier('Super Speed')}
                                  className="text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 bg-slate-800 border-slate-700 w-4 h-4"
                                />
                                <div>
                                  <span className="block text-xs font-bold text-amber-500 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                                    Paket Kilat (Super Speed)
                                  </span>
                                  <span className="block text-[10px] text-slate-500">Konfirmasi pengerjaan cepat admin</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-indigo-400">
                                Rp {
                                  SWORN_PRICING[selectedSwornLang]?.prices.kilatGeneral?.toLocaleString('id-ID') || '-'
                                } / hal
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Certification Addons Option - VERY CRITICAL for legal translation upselling */}
                    <div className="space-y-3.5 border-t border-slate-800 pt-5">
                      <h4 className="text-xs font-bold text-indigo-400 flex items-center justify-between uppercase tracking-wider">
                        <span className="flex items-center space-x-1.5 font-sans">
                          <Building className="w-4 h-4 text-indigo-400" />
                          <span>Layanan Tambahan Kemaslahatan Legalitas</span>
                        </span>
                        <span className="bg-slate-800 text-slate-300 text-[10px] py-0.5 px-2 rounded-full font-bold">
                          Opsional
                        </span>
                      </h4>

                      <div className="space-y-3">
                        {/* Apostille options */}
                        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                          <span className="block text-[11px] font-bold text-slate-300">Apostille / Legalisasi Kemenkumham RI</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedApostille(prev => prev === 'Reguler' ? null : 'Reguler')}
                              className={`py-2 px-2 rounded-lg border text-xs font-bold text-center transition-all ${
                                selectedApostille === 'Reguler'
                                  ? 'bg-indigo-600 border-indigo-650 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                              }`}
                            >
                              Reguler (Rp 700rb)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedApostille(prev => prev === 'Express' ? null : 'Express')}
                              className={`py-2 px-2 rounded-lg border text-xs font-bold text-center transition-all ${
                                selectedApostille === 'Express'
                                  ? 'bg-indigo-600 border-indigo-650 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                              }`}
                            >
                              Express (Rp 1.3jt)
                            </button>
                          </div>
                        </div>

                        {/* Ministerial options */}
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-bold text-slate-300">Legalisasi Kementerian & Swasta</span>
                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60 scrollbar-thin">
                            {[
                              { key: 'NotarisReguler', label: 'Notaris RI Reguler (Rp 350.000)' },
                              { key: 'NotarisExpress', label: 'Notaris RI Express (Rp 475.000)' },
                              { key: 'KemenkumhamReguler', label: 'Kemenkumham RI Reguler (Rp 400.000)' },
                              { key: 'KemenkumhamExpress', label: 'Kemenkumham RI Express (Rp 550.000)' },
                              { key: 'Kemenag', label: 'Kementerian Agama (Rp 600.000)' },
                              { key: 'KemenluReguler', label: 'Kemenlu RI Reguler (Rp 475.000)' },
                              { key: 'KemenluExpress', label: 'Kemenlu RI Express (Rp 650.000)' },
                              { key: 'Dikti', label: 'Dikti Legalisasi (Rp 800.000)' },
                              { key: 'MA', label: 'Mahkamah Agung (Rp 700.000)' },
                            ].map((item) => {
                              const checked = selectedLegalisations.includes(item.key);
                              return (
                                <label key={item.key} className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-850/80 cursor-pointer text-xs font-medium text-slate-350">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      if (checked) {
                                        setSelectedLegalisations(prev => prev.filter(k => k !== item.key));
                                      } else {
                                        setSelectedLegalisations(prev => [...prev, item.key]);
                                      }
                                    }}
                                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900 w-4 h-4"
                                  />
                                  <span>{item.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Embassy & SKCK */}
                        <div className="space-y-1.5 pt-1">
                          <span className="block text-[11px] font-bold text-slate-300">SKCK & Legalisasi Kedutaan Asing</span>
                          <div className="space-y-1.5">
                            <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-850/80 cursor-pointer text-xs font-medium text-slate-350">
                              <input
                                type="checkbox"
                                checked={selectedSkck}
                                onChange={(e) => setSelectedSkck(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900 w-4 h-4"
                              />
                              <span>SKCK Mabes Polri (Rp 800.000)</span>
                            </label>

                            {/* Foreign Embassies Dropdown Addon */}
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                if (!selectedLegalisations.includes(val)) {
                                  setSelectedLegalisations(prev => [...prev, val]);
                                }
                                e.target.value = ''; // reset selection
                              }}
                              className="w-full px-2.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300"
                            >
                              <option value="">+ Tambah Legalisasi Kedutaan Asing...</option>
                              <option value="TaiwanTETO">Kedutaan Taiwan (TETO) — Rp 850.000</option>
                              <option value="Iraq">Kedutaan Iraq — Rp 950.000</option>
                              <option value="Iran">Kedutaan Iran — Rp 1.100.000</option>
                              <option value="Vietnam">Kedutaan Vietnam — Rp 750.050</option>
                              <option value="UEA">Kedutaan UEA (Dubai) — Rp 1.400.000</option>
                              <option value="Thailand">Kedutaan Thailand — Rp 850.000</option>
                              <option value="Malaysia">Kedutaan Malaysia — Rp 450.000</option>
                              <option value="Qatar">Kedutaan Qatar — Rp 1.200.000</option>
                              <option value="Kuwait">Kedutaan Kuwait — Rp 1.100.000</option>
                              <option value="Etiopia">Kedutaan Etiopia — Rp 1.800.000</option>
                              <option value="Jordan">Kedutaan Jordan — Rp 1.100.000</option>
                            </select>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Calculated Invoice Breakdown */}
                    <div className="bg-slate-950 rounded-xl p-4.5 border border-slate-800 space-y-3.5">
                      <h4 className="text-xs font-bold text-indigo-400 flex items-center justify-between uppercase tracking-wider">
                        <span>Rincian Kalkulasi Kasir</span>
                        <Coins className="w-3.5 h-3.5 text-indigo-400" />
                      </h4>

                      <div className="space-y-2 text-xs font-semibold text-slate-300">
                        <div className="flex justify-between items-center text-slate-300 font-sans">
                          <span>
                            Biaya Terjemah {translationType === 'sworn' ? '(Sworn)' : '(Biasa)'} <br/>
                            <span className="text-[10px] font-semibold text-slate-500 text-indigo-200/50">
                              Rp {costBreakdown.costPerPage.toLocaleString('id-ID')} × {simulatedPages} Halaman
                            </span>
                          </span>
                          <span className="text-white font-mono">
                            Rp {costBreakdown.translationCost.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {costBreakdown.addonCost > 0 && (
                          <div className="flex justify-between items-start border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
                            <span>
                              Biaya Sertifikasi & Legalisasi <br/>
                              <span className="text-[10px] text-indigo-400 font-medium line-clamp-1 max-w-[200px]">
                                {[
                                  selectedApostille ? `Apostille ${selectedApostille}` : null,
                                  selectedSkck ? 'SKCK' : null,
                                  ...selectedLegalisations.map(k => LEGALISATION_PRICING[k]?.name.split(' (')[0])
                                ].filter(Boolean).join(', ')}
                              </span>
                            </span>
                            <span className="text-white font-mono">
                              Rp {costBreakdown.addonCost.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center border-t-2 border-indigo-900/60 pt-3.5 text-sm font-bold text-white">
                          <span className="text-indigo-400 font-sans tracking-wide">GRAND TOTAL ESTIMASI:</span>
                          <span className="font-mono text-base text-indigo-300">
                            Rp {costBreakdown.grandTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CTA Order & Reset buttons */}
                    <div className="space-y-2.5">
                      {submissionSuccess ? (
                        <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded-xl text-center space-y-3.5">
                          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-900/40 text-emerald-400 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-400">Estimasi Terkirim & Tercatat!</h4>
                            <p className="text-xs text-slate-350 leading-relaxed mt-0.5">
                              ID Pengajuan Anda adalah *{submissionResult?.lead?.id}*. Data telah diverifikasi dan masuk database lead AMPM.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 pt-1">
                            <a
                              href={getWhatsAppLink()}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all animate-bounce"
                            >
                              <MessageSquare className="w-4 h-4 fill-white text-emerald-605" />
                              <span>Hubungi Admin di WhatsApp</span>
                            </a>
                            <button
                              onClick={handleReset}
                              className="w-full text-xs font-semibold text-slate-400 hover:text-slate-200 py-2 hover:bg-slate-800 rounded-lg transition-all flex items-center justify-center space-x-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Buat Estimasi Baru</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            id="submit-estimate-btn"
                            onClick={submitLead}
                            disabled={isSubmitting || !customerName || !customerWhatsapp}
                            className={`w-full flex items-center justify-center space-x-2 font-bold text-sm py-3 px-4 rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isSubmitting || !customerName || !customerWhatsapp
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-705'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'
                            }`}
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            <span>{isSubmitting ? 'Mengirim Data...' : 'Ajukan Estimasi Resmi'}</span>
                          </button>
                          <p className="text-[10px] text-slate-500 text-center leading-relaxed px-4">
                            Dengan mengajukan estimasi, data Anda akan tersimpan aman di database lead dan Google Sheets, serta siap dikirim via WhatsApp.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            /* Admin & Sheets Config Tab Pane (Admin dashboard view) */
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 animate-fade-in"
            >
              {!isAdminLoggedIn ? (
                /* GORGEOUS ADMIN LOGIN SCREEN */
                <div className="max-w-md mx-auto my-8 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left font-sans">
                  <div className="p-6 sm:p-8 bg-slate-900 text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-650 flex items-center justify-center text-white font-black text-base select-none">
                        AM
                      </div>
                      <h3 className="text-base font-bold font-display tracking-tight">Portal Akses Masuk Admin</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Silakan login untuk mengecek data calon pelanggan, mengelola order deal aktif, membuat cetak penawaran resmi (Quotation), mencetak Invoice, dan menyambungkan Google Sheets secara mudah.
                      </p>
                    </div>
                    {/* Background decorative glow */}
                    <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-indigo-600/30 blur-2xl pointer-events-none"></div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setLoginError('');
                      if (adminUsername.trim() === 'admin' && adminPassword === 'ampmadmin2026') {
                        localStorage.setItem('ampm_admin_logged_in', 'true');
                        setIsAdminLoggedIn(true);
                      } else {
                        setLoginError('Waduh! Nama pengguna atau sandi yang Anda masukkan salah.');
                      }
                    }}
                    className="p-6 sm:p-8 space-y-4 bg-white"
                  >
                    {loginError && (
                      <div className="p-3.5 rounded-xl border border-rose-250 bg-rose-50 text-rose-805 text-xs font-semibold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">Nama Pengguna (Username)</label>
                      <input
                        type="text"
                        placeholder="Masukkan username"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-205 focus:border-indigo-505 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:bg-white text-slate-805"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">Kata Sandi (Password)</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-205 focus:border-indigo-505 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:bg-white text-slate-805"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Masuk ke Dashboard Admin</span>
                    </button>

                    <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-slate-550 leading-normal">
                      <span className="text-base">💡</span>
                      <div className="text-[11px] font-semibold text-slate-600 leading-relaxed bg-amber-50/60 p-3 rounded-xl border border-amber-100/80">
                        <p className="font-extrabold text-amber-950 mb-0.5">Petunjuk Akses Akun:</p>
                        Gunakan data masuk default di bawah ini:<br />
                        • Username: <span className="font-mono font-bold text-indigo-750 bg-indigo-50 px-1 py-0.5 rounded">admin</span><br />
                        • Password: <span className="font-mono font-bold text-indigo-750 bg-indigo-50 px-1 py-0.5 rounded">ampmadmin2026</span>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                /* LAYMAN FRIENDLY ADMIN WORKSPACE */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                  
                  {/* Left Column: Easy Google Connection (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col space-y-6">
                    
                    {/* Simplified Google Sheet Integration Card */}
                    <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-5 text-left">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                        <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                          <FileSpreadsheetIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 font-display">Koneksi Otomatis Google Sheets</h3>
                          <span className="inline-flex bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 mt-0.5">
                            Aktif & Direkomendasikan
                          </span>
                        </div>
                      </div>

                      {/* Friendly Step-by-Step Info for laymen */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 space-y-2 text-left">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                          💡 Cara Pakai Mudah (Sangat Gampang):
                        </span>
                        <ul className="text-[10px] text-slate-500 space-y-1.5 leading-relaxed font-semibold">
                          <li className="flex items-start gap-1">
                            <span className="text-indigo-600 font-bold">1.</span>
                            <span>Sambungkan akun Google Anda dengan menekan tombol <b>"Login Google"</b>.</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-indigo-600 font-bold">2.</span>
                            <span>Pilih salah satu file Google Sheets Anda, atau klik tombol <b>"+ Buat Baru Otomatis"</b>.</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-indigo-600 font-bold">3.</span>
                            <span>Nyalakan centang <b>"Sinkron Otomatis"</b> agar data klien baru langsung terisi otomatis!</span>
                          </li>
                        </ul>
                      </div>

                      {!gUser ? (
                        <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                            Akun belum tersambung. Hubungkan akun Google Drive toko untuk menulis prospek ke spreadsheet excel secara langsung.
                          </p>
                          
                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="gsi-material-button w-full cursor-pointer hover:bg-slate-50 border border-slate-200 transition-all shadow-xs rounded-xl py-2 flex items-center justify-center bg-white"
                          >
                            <div className="gsi-material-button-state"></div>
                            <div className="gsi-material-button-content-wrapper flex items-center gap-2">
                              <div className="gsi-material-button-icon shrink-0">
                                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                  <path fill="none" d="M0 0h48v48H0z"></path>
                                </svg>
                              </div>
                              <span className="gsi-material-button-contents text-xs font-bold text-slate-705">Hubungkan Google Akun</span>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Logged in indicator */}
                          <div className="p-3 bg-indigo-50/50 rounded-xl flex items-center justify-between border border-indigo-100 text-left">
                            <div className="flex items-center gap-2">
                              {gUser.photoURL ? (
                                <img src={gUser.photoURL} alt="Google" className="w-8 h-8 rounded-full border border-indigo-150" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs select-none">
                                  {gUser.displayName?.charAt(0) || 'U'}
                                </div>
                              )}
                              <div className="text-left leading-none font-sans">
                                <span className="block text-xs font-bold text-slate-800">{gUser.displayName || 'Akun Admin'}</span>
                                <span className="block text-[9px] text-slate-400 mt-1">{gUser.email}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleGoogleLogout}
                              className="p-1.5 text-slate-400 hover:text-rose-650 rounded-lg hover:bg-rose-50/50 transition duration-150 cursor-pointer"
                              title="Sign Out Google"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-3 text-left">
                            {/* Selector sheet */}
                            <div className="space-y-1.5 font-sans">
                              <label className="block text-xs font-bold text-slate-600">Pilih Google Sheet Tujuan:</label>
                              {isLoadingGSheets ? (
                                <div className="flex items-center space-x-1.5 text-slate-400 py-1 text-xs font-medium">
                                  <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                  <span>Membaca daftar file...</span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <select
                                    value={sheetsConfig.googleSpreadsheetId || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updated = { ...sheetsConfig, googleSpreadsheetId: val };
                                      setSheetsConfig(updated);
                                      fetch('/api/sheet-config', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(updated)
                                      });
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-705 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans cursor-pointer"
                                  >
                                    <option value="">-- Silakan Pilih File Excel Anda --</option>
                                    {gSpreadsheets.length > 0 ? (
                                      gSpreadsheets.map(sh => (
                                        <option key={sh.id} value={sh.id}>{sh.name}</option>
                                      ))
                                    ) : (
                                      <option disabled>Tidak ditemukan file spreadsheet di Drive</option>
                                    )}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={handleCreateAutoSheet}
                                    disabled={isCreatingGSheet}
                                    className="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-750 font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1 transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    {isCreatingGSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-indigo-600" /> : <Plus className="w-3.5 h-3.5" />}
                                    <span>{isCreatingGSheet ? 'Sedang Membuat...' : 'Buat Database Sheet Baru'}</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Direct Sync enabled checkbox switch */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150 font-sans">
                              <div className="space-y-0.5">
                                <span className="block text-xs font-bold text-slate-800">Sinkron Otomatis (Direct Sync)</span>
                                <span className="block text-[9px] text-slate-400 leading-relaxed">Tulis otomatis tiap klien submit form</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!sheetsConfig.googleDirectSyncEnabled}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    const updated = { ...sheetsConfig, googleDirectSyncEnabled: val };
                                    setSheetsConfig(updated);
                                    fetch('/api/sheet-config', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(updated)
                                    });
                                  }}
                                  disabled={!sheetsConfig.googleSpreadsheetId}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-305 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-45"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simple Admin Session Card to easily Logan / Logout session */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-150 p-5 space-y-3.5 text-left font-sans">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-slate-705">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold font-sans">Sesi Kerja Administrator</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sesi Aktif"></span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                        Anda masuk sebagai <strong className="text-slate-800">admin</strong>. Keamanan sesi tersimpan di perangkat lokal Anda demi kerahasiaan client.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin keluar dari sesi kerja Admin?')) {
                            localStorage.removeItem('ampm_admin_logged_in');
                            setIsAdminLoggedIn(false);
                            setAdminUsername('');
                            setAdminPassword('');
                          }
                        }}
                        className="w-full text-xs font-bold text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-slate-205 hover:border-rose-600 py-2 rounded-lg transition-all duration-150 flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Keluar Sesi / Logout Admin</span>
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Leads List & Order Manager Core Desk (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
                    
                    {/* Header bar controls */}
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 font-display">Worksuite Layanan CRM & Order</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Pengelolaan prospek, order deal, dan analitik performa toko</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={exportToCSV}
                          disabled={leads.length === 0}
                          className="bg-white border border-slate-250 hover:border-slate-350 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-lg shadow-xs transition-all flex items-center space-x-1 uppercase tracking-wider"
                        >
                          <FileSpreadsheetIcon className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ekspor CSV</span>
                        </button>
                        <button
                          onClick={fetchLeads}
                          disabled={loadingLeads}
                          className="bg-white border border-slate-250 hover:border-slate-350 text-slate-700 font-bold text-xs p-2 rounded-lg shadow-xs transition-all flex items-center justify-center"
                          title="Refresh"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Sub-Tabs Selector inside Admin card */}
                    <div className="px-5 pt-1 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1 overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminSubTab('leads');
                          setSelectedAdminLead(null);
                        }}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 focus:outline-none whitespace-nowrap cursor-pointer ${
                          adminSubTab === 'leads'
                            ? 'text-indigo-600 border-indigo-600 font-sans'
                            : 'text-slate-500 border-transparent hover:text-slate-700 font-medium font-sans'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>CRM & Prospek ({leads.filter(l => !l.isDealed).length})</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setAdminSubTab('orders');
                          setSelectedAdminLead(null);
                        }}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 focus:outline-none whitespace-nowrap cursor-pointer ${
                          adminSubTab === 'orders'
                            ? 'text-indigo-600 border-indigo-600 font-sans'
                            : 'text-slate-500 border-transparent hover:text-slate-700 font-medium font-sans'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Manajemen Order ({leads.filter(l => l.isDealed).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminSubTab('insights');
                          setSelectedAdminLead(null);
                        }}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 focus:outline-none whitespace-nowrap cursor-pointer ${
                          adminSubTab === 'insights'
                            ? 'text-indigo-600 border-indigo-600 font-sans'
                            : 'text-slate-500 border-transparent hover:text-slate-700 font-medium font-sans'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>Insight Bisnis & Omset</span>
                      </button>
                    </div>

                    {/* Rendering dynamic content based on sub-tab */}
                    {adminSubTab !== 'insights' && (
                      <div className="px-5 py-3 border-b border-slate-100 bg-white">
                        <input
                          type="text"
                          placeholder={
                            adminSubTab === 'leads'
                              ? "Cari prospek CRM berdasarkan nama, whatsapp, ID, atau target bahasa..."
                              : "Cari order deal aktif berdasarkan nama klien, whatsapp, ID, atau target bahasa..."
                          }
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/20 focus:bg-white text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-sans"
                        />
                      </div>
                    )}

                    <div className="overflow-x-auto flex-1 bg-white">
                      {loadingLeads ? (
                        <div className="h-48 flex items-center justify-center space-x-2 text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          <span className="text-xs font-semibold">Toko sedang memuat log database...</span>
                        </div>
                      ) : adminSubTab === 'insights' ? (
                        /* BUSINESS INSIGHTS TAB VIEW */
                        <div className="p-6 space-y-6">
                          {(() => {
                            const totalLeadsCount = leads.length;
                            const dealedDocsList = leads.filter(l => l.isDealed);
                            const prospekDocsList = leads.filter(l => !l.isDealed);
                            
                            const totalDealedRevenue = dealedDocsList.reduce((sum, o) => sum + (o.dealFinalPrice ?? o.grandTotalCost ?? 0), 0);
                            const totalPendingRevenue = prospekDocsList.reduce((sum, o) => sum + (o.grandTotalCost ?? 0), 0);
                            const conversionPercentage = totalLeadsCount > 0 ? ((dealedDocsList.length / totalLeadsCount) * 105).toFixed(1) : '0'; // standard scaling estimation modifier
                            const realRatio = totalLeadsCount > 0 ? ((dealedDocsList.length / totalLeadsCount) * 100).toFixed(1) : '0';
                            const completedDealsCount = dealedDocsList.filter(o => o.dealStatus === 'Selesai').length;
                            const activeProcessingCount = dealedDocsList.filter(o => o.dealStatus !== 'Selesai' && o.dealStatus !== 'Dibatalkan').length;

                            // Splits
                            const swornDealedCount = dealedDocsList.filter(o => o.translationType === 'sworn').length;
                            const swornDealedRev = dealedDocsList.filter(o => o.translationType === 'sworn').reduce((sum, o) => sum + (o.dealFinalPrice ?? o.grandTotalCost ?? 0), 0);

                            const biasaDealedCount = dealedDocsList.filter(o => o.translationType === 'non-sworn').length;
                            const biasaDealedRev = dealedDocsList.filter(o => o.translationType === 'non-sworn').reduce((sum, o) => sum + (o.dealFinalPrice ?? o.grandTotalCost ?? 0), 0);

                            // Addons
                            const apostilleCount = dealedDocsList.filter(o => o.addons?.apostille).length;
                            const legalisasiCount = dealedDocsList.filter(o => o.addons?.legalisation && o.addons.legalisation.length > 0).length;
                            const skckCount = dealedDocsList.filter(o => o.addons?.skck).length;

                            // Language distributions
                            const langMap: { [key: string]: number } = {};
                            dealedDocsList.forEach(o => {
                              const tgt = o.targetLanguage || 'Lainnya';
                              langMap[tgt] = (langMap[tgt] || 0) + 1;
                            });
                            const langSplits = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

                            return (
                              <div className="space-y-6">
                                {/* Row 1: KPI Metrics Blocks */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {/* Metric 1 */}
                                  <div className="p-4 rounded-xl border border-slate-150 bg-indigo-50/30 text-left">
                                    <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider">OMSET DEAL (TRANSAKSI)</span>
                                    <span className="block text-lg font-bold text-slate-800 font-mono mt-1">
                                      Rp {totalDealedRevenue.toLocaleString('id-ID')}
                                    </span>
                                    <span className="block text-[10px] text-indigo-900 font-medium mt-1">
                                      Terakumulasi dari {dealedDocsList.length} Order deal
                                    </span>
                                  </div>

                                  {/* Metric 2 */}
                                  <div className="p-4 rounded-xl border border-slate-150 bg-amber-50/35 text-left">
                                    <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">POTENSI PROSPEK CRM</span>
                                    <span className="block text-lg font-bold text-slate-800 font-mono mt-1">
                                      Rp {totalPendingRevenue.toLocaleString('id-ID')}
                                    </span>
                                    <span className="block text-[10px] text-amber-900 font-medium mt-1">
                                      Dari {prospekDocsList.length} prospek pending
                                    </span>
                                  </div>

                                  {/* Metric 3 */}
                                  <div className="p-4 rounded-xl border border-slate-150 bg-emerald-50/30 text-left">
                                    <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-sans">KONVERSI DEAL</span>
                                    <span className="block text-lg font-bold text-slate-800 font-mono mt-1">
                                      {realRatio}%
                                    </span>
                                    <span className="block text-[10px] text-emerald-950 font-medium mt-1">
                                      Rasio penutupan tiket transaksi
                                    </span>
                                  </div>

                                  {/* Metric 4 */}
                                  <div className="p-4 rounded-xl border border-slate-150 bg-slate-50 text-left">
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">AKTIVITAS SELESAI</span>
                                    <span className="block text-lg font-bold text-slate-800 font-mono mt-1">
                                      {completedDealsCount} / {dealedDocsList.length}
                                    </span>
                                    <span className="block text-[10px] text-slate-500 font-medium mt-1">
                                      {activeProcessingCount} order sedang diproses
                                    </span>
                                  </div>
                                </div>

                                {/* Row 2: Splits & Breakdowns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Card Left: Kategori Layanan & Finansial */}
                                  <div className="p-5 border border-slate-150 rounded-xl space-y-4 text-left">
                                    <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                                      <FileText className="w-4 h-4 text-indigo-650" />
                                      <h4 className="font-bold text-xs text-slate-800">Distribusi Kategori Jasa (Deal)</h4>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      {/* Sworn */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                          <span>Penerjemah Tersumpah (Sworn)</span>
                                          <span>{swornDealedCount} Order (Rp {swornDealedRev.toLocaleString('id-ID')})</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className="bg-indigo-600 h-full rounded-full" 
                                            style={{ width: `${dealedDocsList.length > 0 ? (swornDealedCount / dealedDocsList.length) * 100 : 0}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Non Sworn */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                          <span>Penerjemah Biasa (Non-Sworn)</span>
                                          <span>{biasaDealedCount} Order (Rp {biasaDealedRev.toLocaleString('id-ID')})</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                          <div 
                                            className="bg-sky-500 h-full rounded-full" 
                                            style={{ width: `${dealedDocsList.length > 0 ? (biasaDealedCount / dealedDocsList.length) * 100 : 0}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Embedded certifications metrics table */}
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center mt-2">
                                      <div>
                                        <span className="block text-[9px] font-bold text-slate-400">APOSTILLE</span>
                                        <span className="block text-xs font-bold text-slate-800 mt-0.5">{apostilleCount} Kali</span>
                                      </div>
                                      <div>
                                        <span className="block text-[9px] font-bold text-slate-400">LEGALISASI</span>
                                        <span className="block text-xs font-bold text-slate-800 mt-0.5">{legalisasiCount} Proyek</span>
                                      </div>
                                      <div>
                                        <span className="block text-[9px] font-bold text-slate-400">SKCK POLRI</span>
                                        <span className="block text-xs font-bold text-slate-800 mt-0.5">{skckCount} Berkas</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Right: Target Bahasa Terlaris */}
                                  <div className="p-5 border border-slate-150 rounded-xl space-y-4 text-left">
                                    <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                                      <Languages className="w-4 h-4 text-indigo-650" />
                                      <h4 className="font-bold text-xs text-slate-800">Target Bahasa Penyelenggaraan terlaris</h4>
                                    </div>

                                    <div className="space-y-3.5">
                                      {dealedDocsList.length === 0 ? (
                                        <span className="block text-xs text-slate-450 text-center py-8">Belum ada data order deal masuk.</span>
                                      ) : (
                                        langSplits.map(([lang, count]) => {
                                          const pct = dealedDocsList.length > 0 ? ((count / dealedDocsList.length) * 100).toFixed(0) : '0';
                                          return (
                                            <div key={lang} className="space-y-1">
                                              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                                <span>Indonesia → {lang}</span>
                                                <span>{count} Berkas ({pct}%)</span>
                                              </div>
                                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div 
                                                  className="bg-emerald-600 h-full rounded-full" 
                                                  style={{ width: `${pct}%` }}
                                                ></div>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : filteredLeads.length === 0 ? (
                        /* EMPTY DATABASE STATE */
                        <div className="h-56 flex flex-col items-center justify-center space-y-2 text-slate-500 p-8">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <p className="text-xs font-semibold">Tidak ditemukan berkas permohonan lead/order di sub-tab ini.</p>
                          <p className="text-[10px] text-slate-400">Silakan gunakan pencarian di atas atau pastikan konfigurasi kategori sudah tepat.</p>
                        </div>
                      ) : adminSubTab === 'leads' ? (
                        /* TAB 1: CRM LEAD LOGS TABLE VIEW */
                        <table className="w-full text-left border-collapse table-fixed">
                          <thead>
                            <tr className="bg-slate-50 tracking-wider text-[10px] font-bold text-slate-450 uppercase border-b border-slate-100">
                              <th className="py-3 px-4 w-1/3">Klien / Tanggal Masuk</th>
                              <th className="py-3 px-4 w-1/4">Evaluasi Bahasa & AI</th>
                              <th className="py-3 px-4 w-1/4">Perkiraan Biaya</th>
                              <th className="py-3 px-4 text-right w-1/4">Aksi Hubungi & Deal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-650">
                            {filteredLeads.map((lead) => (
                              <tr 
                                key={lead.id} 
                                className={`hover:bg-slate-50/50 transition-all cursor-pointer ${
                                  selectedAdminLead?.id === lead.id ? 'bg-indigo-50/30' : ''
                                }`}
                                onClick={() => setSelectedAdminLead(lead)}
                              >
                                <td className="py-3.5 px-4 space-y-1 block text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800 text-xs">{lead.customerName}</span>
                                    <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] rounded font-bold">Leads</span>
                                  </div>
                                  <span className="block text-[10px] font-mono font-bold text-slate-500">{lead.customerWhatsapp}</span>
                                  <span className="block text-[10px] text-slate-400 font-medium font-mono">
                                    {new Date(lead.createdAt).toLocaleDateString('id-ID')} - {new Date(lead.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 space-y-1 text-left">
                                  <div className="flex items-center space-x-1">
                                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] rounded font-bold">
                                      {lead.translationType === 'sworn' ? 'Sworn' : 'Biasa'}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-700">→ {lead.targetLanguage}</span>
                                  </div>
                                  <span className="block text-[10px] text-slate-450 truncate" title={lead.fileName}>
                                    {lead.fileName}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 space-y-1 font-mono text-left">
                                  <span className="block text-slate-700 font-bold">{lead.calculatedStandardPages} Hal TNR</span>
                                  <span className="block text-xs font-bold text-indigo-605">
                                    Rp {(lead.grandTotalCost ?? lead.totalTranslationCost ?? 0).toLocaleString('id-ID')}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDeal(lead, true)}
                                      className="p-1.5 px-2 bg-indigo-50/80 hover:bg-indigo-600 text-indigo-800 hover:text-white rounded-lg border border-indigo-200 hover:border-indigo-600 transition-all font-bold text-[10px] flex items-center space-x-0.5 cursor-pointer"
                                      title="Tandai Klien Menyetujui Order (Deal)"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Deal</span>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Halo Kak ${lead.customerName}, kami dari AMPM Sworn Translator ingin menindaklajuti form permohonan penerjemah Kakak dengan kode estimasi ${lead.id}.\n\nTotal perkiraan biaya adalah Rp ${lead.grandTotalCost?.toLocaleString('id-ID')} untuk terjemahan ke ${lead.targetLanguage}.\n\nApakah sudah sesuai untuk kami buatkan Surat Penawaran Biaya resmi? Terima kasih.`;
                                        window.open(`https://wa.me/${lead.customerWhatsapp.replace(/[^0-9]/g, '')}/?text=${encodeURIComponent(text)}`, '_blank', 'noreferrer');
                                      }}
                                      className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-150 transition-all cursor-pointer"
                                      title="Hubungi Prospek CRM"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => deleteLead(lead.id)}
                                      className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded-lg transition-all cursor-pointer"
                                      title="Hapus Lead"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        /* TAB 2: ACTIVE DEALS & ORDERS WORKSPACE */
                        <table className="w-full text-left border-collapse table-fixed">
                          <thead>
                            <tr className="bg-slate-50 tracking-wider text-[10px] font-bold text-slate-450 uppercase border-b border-slate-100">
                              <th className="py-3 px-4 w-[28%]">Klien & Order ID</th>
                              <th className="py-3 px-4 w-[25%] text-left">Deadline Selesai</th>
                              <th className="py-3 px-4 w-[25%] text-left">Status Order</th>
                              <th className="py-3 px-4 w-[22%] text-right">Nilai & Ekspor Cetak</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-650">
                            {filteredLeads.map((lead) => {
                              const daysRemaining = lead.dealDeadline ? Math.max(0, Math.ceil((new Date(lead.dealDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                              return (
                                <tr 
                                  key={lead.id} 
                                  className={`hover:bg-slate-50/50 transition-all cursor-pointer ${
                                    selectedAdminLead?.id === lead.id ? 'bg-indigo-50/30' : ''
                                  }`}
                                  onClick={() => setSelectedAdminLead(lead)}
                                >
                                  {/* Client ID */}
                                  <td className="py-4 px-4 block text-left space-y-1">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-slate-800 text-xs truncate" title={lead.customerName}>{lead.customerName}</span>
                                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8.5px] rounded font-bold uppercase tracking-wide">Deal</span>
                                    </div>
                                    <span className="block text-[9.5px] text-slate-450 font-mono mt-0.5">ID: {lead.id}</span>
                                  </td>

                                  {/* Order Deadline */}
                                  <td className="py-4 px-4 text-left font-sans" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col space-y-1">
                                      <span className="font-bold text-slate-700 font-mono text-[11px]">
                                        {lead.dealDeadline ? new Date(lead.dealDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Belum diatur'}
                                      </span>
                                      {lead.dealDeadline && daysRemaining > 0 ? (
                                        <span className="inline-flex text-[9px] bg-amber-50 border border-amber-150 text-amber-800 px-1.5 py-0.5 rounded font-bold w-fit animate-pulse">
                                          {daysRemaining} Hari Lagi
                                        </span>
                                      ) : lead.dealDeadline ? (
                                        <span className="inline-flex text-[9px] bg-red-50 border border-red-150 text-red-600 px-1.5 py-0.5 rounded font-bold w-fit">
                                          Lewat / Selesai
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>

                                  {/* Interactive Deal Status Dropdown */}
                                  <td className="py-4 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                                    <select
                                      value={lead.dealStatus || 'Dalam Antrean'}
                                      onChange={async (e) => {
                                        const val = e.target.value;
                                        await fetch(`/api/leads/${lead.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ dealStatus: val })
                                        });
                                        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, dealStatus: val as any } : l));
                                      }}
                                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold focus:outline-none border shadow-xs border-slate-205 cursor-pointer text-center ${
                                        lead.dealStatus === 'Selesai' 
                                          ? 'bg-emerald-100 border-emerald-300 text-emerald-805' 
                                          : lead.dealStatus === 'Pengerjaan Terjemah'
                                            ? 'bg-amber-100 border-amber-300 text-amber-805' 
                                            : lead.dealStatus === 'Proses Proofreading'
                                              ? 'bg-blue-100 border-blue-300 text-blue-805'
                                              : lead.dealStatus === 'Penyegelan Tersumpah'
                                                ? 'bg-purple-100 border-purple-300 text-purple-805'
                                                : lead.dealStatus === 'Dibatalkan'
                                                  ? 'bg-rose-100 border-rose-300 text-rose-805'
                                                  : 'bg-slate-105 border-slate-255 text-slate-805 font-semibold'
                                      }`}
                                    >
                                      <option value="Dalam Antrean">⚠️ Dalam Antrean</option>
                                      <option value="Pengerjaan Terjemah">✍️ Pengerjaan Terjemah</option>
                                      <option value="Proses Proofreading">🔍 Proses Proofreading</option>
                                      <option value="Penyegelan Tersumpah">🔏 Penyegelan Tersumpah</option>
                                      <option value="Selesai">✅ Selesai</option>
                                      <option value="Dibatalkan">❌ Dibatalkan</option>
                                    </select>
                                  </td>

                                  {/* Finansial, Quotation, and Invoice Buttons */}
                                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col items-end gap-1.5">
                                      <span className="font-mono font-bold text-xs text-indigo-705">
                                        Rp {(lead.dealFinalPrice ?? lead.grandTotalCost ?? 0).toLocaleString('id-ID')}
                                      </span>
                                      
                                      <div className="flex items-center gap-1.5 mt-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setQuotationModalLead(lead)}
                                          className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md border border-indigo-200 transition-all text-[9.5px] font-bold flex items-center space-x-0.5 cursor-pointer"
                                          title="Lihat & Cetak Surat Penawaran Resmi"
                                        >
                                          <FileText className="w-2.5 h-2.5" />
                                          <span>Penawaran</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setInvoiceModalLead(lead)}
                                          className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-md border border-emerald-200 transition-all text-[9.5px] font-bold flex items-center space-x-0.5 cursor-pointer"
                                          title="Lihat & Cetak Surat Faktur Tagihan"
                                        >
                                          <Receipt className="w-2.5 h-2.5" />
                                          <span>Invoice</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDealEditLead(lead);
                                            setDealDeadlineInput(lead.dealDeadline || '');
                                            setDealStatusInput(lead.dealStatus || 'Dalam Antrean');
                                            setDealPriceInput(lead.dealFinalPrice || lead.grandTotalCost);
                                            setDealNotesInput(lead.orderNotes || '');
                                          }}
                                          className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                                          title="Ubah Rincian Deadline, Pembayaran, dan Catatan Internal"
                                        >
                                          <Settings className="w-3 h-3" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleToggleDeal(lead, false)}
                                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                                          title="Kembalikan status menjadi Prospek CRM"
                                        >
                                          <ArrowLeftRight className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Collapsible View Panel for Lead Details */}
                  {selectedAdminLead && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-indigo-100 text-indigo-900 rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Detail Evaluasi Estimasi</h4>
                            <p className="text-[10px] text-slate-450 font-mono">Kode: {selectedAdminLead.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedAdminLead(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-650">
                        <div className="space-y-2">
                          <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Identitas Klien</h5>
                          <p><b>Nama:</b> {selectedAdminLead.customerName}</p>
                          <p><b>No WhatsApp:</b> {selectedAdminLead.customerWhatsapp}</p>
                          <p><b>Alamat Email:</b> {selectedAdminLead.customerEmail || '-'}</p>
                          <p><b>Waktu Tiket:</b> {new Date(selectedAdminLead.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Detail Terjemahan & AI</h5>
                          <p><b>Arah Bahasa:</b> Dari Indonesia ke {selectedAdminLead.targetLanguage}</p>
                          <p><b>Jenis Dokumen:</b> {selectedAdminLead.documentTypeDetected} ({selectedAdminLead.documentCategory})</p>
                          <p><b>Statistik Dokumen:</b> {selectedAdminLead.wordCount.toLocaleString('id-ID')} Kata / {selectedAdminLead.charCount.toLocaleString('id-ID')} Karakter</p>
                          <p><b>Simulasi Pages:</b> {selectedAdminLead.calculatedStandardPages} Halaman (TNR 12)</p>
                          <p><b>Paket Kecepatan:</b> {selectedAdminLead.speedTier}</p>
                        </div>

                        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-150">
                          <h5 className="font-bold text-slate-700 uppercase tracking-wide text-[10px] flex items-center justify-between">
                            <span>Finansial Penawaran</span>
                            <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          </h5>
                          <p><b>Tarif Halaman:</b> Rp {selectedAdminLead.costPerPage.toLocaleString('id-ID')}</p>
                          <p><b>Subtotal Terjemah:</b> Rp {selectedAdminLead.totalTranslationCost.toLocaleString('id-ID')}</p>
                          <p><b>Subtotal Addons:</b> Rp {selectedAdminLead.addonCost.toLocaleString('id-ID')}</p>
                          <div className="border-t border-slate-350 pt-2 text-sm font-bold text-indigo-605 flex justify-between items-center">
                            <span>Total Tagihan:</span>
                            <span className="font-mono">Rp {selectedAdminLead.grandTotalCost.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {selectedAdminLead.textExtractedSnippet && (
                        <div className="space-y-1 border-t border-slate-100 pt-3">
                          <span className="text-[11px] font-bold text-slate-700">Inti Teks Terekstrak (OCR Proof)</span>
                          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap max-h-36 overflow-y-auto">
                            {selectedAdminLead.textExtractedSnippet}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                </div>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Google Drive Browser Modal overlay */}
      <AnimatePresence>
        {driveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setDriveModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 font-display">Pilih Dokumen dari Google Drive</h3>
                    <p className="text-[10px] text-slate-500 font-medium font-mono">Drive Cloud Storage Explorer</p>
                  </div>
                </div>
                <button
                  onClick={() => setDriveModalOpen(false)}
                  className="p-1 px-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg transition-all text-xs font-bold font-sans"
                >
                  Tutup [X]
                </button>
              </div>

              {/* Utility Search & Refresh */}
              <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={driveSearchQuery}
                    onChange={(e) => setDriveSearchQuery(e.target.value)}
                    placeholder="Cari file dokumen di Google Drive..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                  />
                  <div className="absolute left-2.5 top-2.5 text-slate-400">
                    <svg xmlns="http://www.w3.org/2500/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadDriveFilesList}
                  disabled={isLoadingDrive}
                  className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                  title="Segarkan berkas"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-605 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Files Content Container */}
              <div className="p-5 overflow-y-auto bg-slate-50/50 flex-1 min-h-[300px]">
                {isLoadingDrive ? (
                  <div className="h-48 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-605" />
                    <span className="text-xs text-slate-555 font-bold">Mengontak API Google Drive...</span>
                  </div>
                ) : driveError ? (
                  <div className="p-4 bg-rose-50 border border-rose-150 text-rose-800 text-xs rounded-xl space-y-2 text-center animate-pulse">
                    <p className="font-bold">{driveError}</p>
                    <button
                      onClick={loadDriveFilesList}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px]"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  (() => {
                    const filtered = driveFiles.filter(f => 
                      !f.mimeType?.includes('folder') && // exclude folder types
                      (f.name || '').toLowerCase().includes(driveSearchQuery.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="h-48 flex flex-col items-center justify-center text-center space-y-1">
                          <Folder className="w-8 h-8 text-slate-300" />
                          <h4 className="text-xs font-bold text-slate-650">Tidak ada dokumen didukung</h4>
                          <p className="text-[10px] text-slate-400 max-w-xs">Pastikan Anda memiliki dokumen JPEG, PNG, atau PDF yang tersimpan di Google Drive.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtered.map((file) => {
                          const isDownloading = downloadingDriveFileId === file.id;
                          const isPdf = file.mimeType?.includes('pdf');
                          
                          return (
                            <div
                              key={file.id}
                              onClick={() => !isDownloading && handleSelectDriveFile(file)}
                              className={`p-3 bg-white border border-slate-200 rounded-xl hover:shadow-xs hover:border-indigo-400 hover:bg-indigo-50/5 cursor-pointer transition-all flex items-start gap-2.5 relative group ${
                                isDownloading ? 'opacity-60 cursor-wait bg-indigo-50/20' : ''
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${
                                isPdf ? 'bg-red-50 text-red-650' : 'bg-indigo-50 text-indigo-650'
                              }`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <span className="block text-xs font-bold text-slate-800 truncate" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="block text-[9px] text-slate-400 font-medium mt-0.5 font-mono">
                                  {file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : 'Ukuran tidak diketahui'} • {isPdf ? 'PDF Document' : 'Image File'}
                                </span>
                              </div>

                              {isDownloading && (
                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center gap-1.5 rounded-xl">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                  <span className="text-[10px] font-bold text-indigo-950 animate-pulse">Mengunduh...</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Izin file dijamin aman & dienkripsi via Google OAuth</span>
                <span>AMPM Translator Hub</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. EDIT DEAL DETAILS MODAL */}
      <AnimatePresence>
        {dealEditLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-md w-full border border-slate-150 shadow-xl overflow-hidden flex flex-col text-left"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-50 text-indigo-750 rounded-lg">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Ubah Rincian Order Deal</h3>
                    <p className="text-[10px] text-slate-400 font-mono font-medium">Order ID: {dealEditLead.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDealEditLead(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-100/50 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* 1. Deadline Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-650">Tanggal Batas Pengerjaan (Deadline)</label>
                  <input
                    type="date"
                    value={dealDeadlineInput}
                    onChange={(e) => setDealDeadlineInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-205 text-slate-705 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <p className="text-[9px] text-slate-400">Tentukan tanggal jatuh tempo berkas hasil diterjemahkan.</p>
                </div>

                {/* 2. Final Price Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-655">Nilai Akhir Order Deal (Rp)</label>
                  <input
                    type="number"
                    value={dealPriceInput}
                    onChange={(e) => setDealPriceInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-205 text-slate-705 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <p className="text-[9px] text-slate-400">Sesuaikan nominal deal akhir setelah potongan/diskon khusus klien.</p>
                </div>

                {/* 3. Deal Status Option */}
                <div className="space-y-1 font-sans">
                  <label className="block text-xs font-bold text-slate-650">Status Aktivitas Progress</label>
                  <select
                    value={dealStatusInput}
                    onChange={(e) => setDealStatusInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-250 bg-slate-50 text-slate-750 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Dalam Antrean">Dalam Antrean</option>
                    <option value="Pengerjaan Terjemah">Pengerjaan Terjemah</option>
                    <option value="Proses Proofreading">Proses Proofreading</option>
                    <option value="Penyegelan Tersumpah">Penyegelan Tersumpah</option>
                    <option value="Selesai">Selesai (Completed)</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                {/* 4. Order Administrative Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-655">Catatan/Instruksi Tambahan Order</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Klien minta jilid cover biru, kirim hardcopy via Grab..."
                    value={dealNotesInput}
                    onChange={(e) => setDealNotesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-205 text-slate-705 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDealEditLead(null)}
                  className="px-3.5 py-2 border border-slate-205 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDealDetails(dealEditLead.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  Simpan Rincian
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PRINTABLE QUOTATION MODAL */}
      <AnimatePresence>
        {quotationModalLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex justify-center overflow-y-auto p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.97, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto text-slate-800"
            >
              {/* Modal Banner Control - Hide during window.print() via custom classes */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between px-6 sticky top-0 bg-white/95 backdrop-blur-md z-10 print:hidden text-left">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 tracking-wider uppercase">Generator Penawaran Resmi (Quotation)</h3>
                  <p className="text-[10px] text-slate-450">Format A4 berstempel resmi legalitas AMPM Sworn Translator</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition flex items-center space-x-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cetak PDF / Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuotationModalLead(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Physical A4 printable sheet document */}
              <div id="quotation-print-area" className="p-8 sm:p-12 text-left bg-white text-slate-850 font-sans max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
                
                {/* Header Letterhead container */}
                <div>
                  <div className="flex items-start justify-between border-b-2 border-indigo-705 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {/* Stamp style official brand representation */}
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm select-none">
                          AM
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tight font-display font-sans uppercase">AMPM Sworn Translator</span>
                      </div>
                      <span className="block text-[9.5px] text-slate-500 font-medium leading-relaxed max-w-sm">
                        SK Kemenkumham Kanwil DKI Jakarta. Jl. Dr. Saharjo No.111, Tebet, Jakarta Selatan. Telp/WA: +62 822-4040-4545 | hello@ampmtranslator.com
                      </span>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <span className="inline-flex bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase mb-1">QUOTATION</span>
                      <h4 className="text-[11px] font-bold text-slate-800 font-mono">No: AMP-Q-{(new Date().getFullYear())}{(String(new Date().getMonth()+1).padStart(2, '0'))}-{quotationModalLead.id.toUpperCase()}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Tanggal: {new Date(quotationModalLead.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* To Destination Customer Details split panel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs text-slate-600">
                    <div className="space-y-1 leading-relaxed">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ditujukan Kepada Yth:</span>
                      <span className="block font-bold text-slate-900 text-sm whitespace-nowrap">{quotationModalLead.customerName}</span>
                      <span className="block font-medium font-mono text-[11px] text-slate-600">{quotationModalLead.customerWhatsapp}</span>
                      {quotationModalLead.customerEmail && <span className="block text-[10px] text-slate-450">{quotationModalLead.customerEmail}</span>}
                    </div>

                    <div className="sm:text-right space-y-1 text-xs text-slate-600 leading-relaxed">
                      <span className="block text-[10px] sm:text-right font-bold text-slate-400 uppercase tracking-wide">Spesifikasi Penerjemahan Jasa:</span>
                      <span className="block font-bold text-slate-900 font-sans">Pasangan: Indonesia &rarr; {quotationModalLead.targetLanguage}</span>
                      <span className="block font-medium">Sertifikasi: {quotationModalLead.translationType === 'sworn' ? 'Penerjemah Tersumpah (Sworn)' : 'Penerjemah Reguler (Biasa)'}</span>
                      <span className="block text-[10px] text-slate-400 italic">Dokumen: {quotationModalLead.fileName} ({quotationModalLead.calculatedStandardPages} Halaman)</span>
                    </div>
                  </div>

                  {/* Line Separator */}
                  <p className="text-xs text-slate-600 mt-6 leading-relaxed">
                    Dengan hormat, sehubungan dengan permohonan jasa penerjemahan dokumen resmi Kakak, bersama surat ini kami sampaikan rincian proposal penawaran biaya resmi sebagai berikut:
                  </p>

                  {/* Financial items cost table breakdown layout */}
                  <table className="w-full text-xs text-left border-collapse mt-5">
                    <thead>
                      <tr className="bg-indigo-50/50 text-[10px] font-bold text-indigo-950 uppercase border-y border-indigo-100">
                        <th className="py-2.5 px-3 w-3/5">Deskripsi rincian jasa penerjemahan</th>
                        <th className="py-2.5 px-3 text-center">Volume</th>
                        <th className="py-2.5 px-3 text-right font-mono">Tarif Unit</th>
                        <th className="py-2.5 px-3 text-right font-mono">Jumlah Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-705">
                      {/* Row 1: Translation fee */}
                      <tr>
                        <td className="py-3 px-3">
                          <span className="block font-bold text-slate-800">Layanan Penerjemahan Dokumen {quotationModalLead.translationType === 'sworn' ? 'Tersumpah (Sworn)' : 'Biasa (Reguler)'}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">Format halaman standar A4 TNR 12 spasi 1.5 hasil akhir ({quotationModalLead.documentTypeDetected})</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">{quotationModalLead.calculatedStandardPages} Hal</td>
                        <td className="py-3 px-3 text-right font-mono">Rp {(quotationModalLead.costPerPage ?? 0).toLocaleString('id-ID')}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">Rp {(quotationModalLead.totalTranslationCost ?? 0).toLocaleString('id-ID')}</td>
                      </tr>

                      {/* Row 2: Surcharge Speed tier fee */}
                      {quotationModalLead.speedTier && quotationModalLead.speedTier !== 'normal' && (
                        <tr>
                          <td className="py-3 px-3 col-span-1">
                            <span className="block font-bold text-slate-800">Surcharge Kecepatan (Layanan Kilat - {quotationModalLead.speedTier.toUpperCase()})</span>
                            <span className="block text-[10px] text-slate-400 font-medium">Biaya percepatan masa pengerjaan hasil guna deadline mendesak</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">1 Ls</td>
                          <td className="py-3 px-3 text-right font-mono">-</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            Rp {(quotationModalLead.translationType === 'sworn' ? 75000 : 45000).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )}

                      {/* Row 3: Add-on Apostille / legalisasi */}
                      {(quotationModalLead.addonCost ?? 0) > 0 && (
                        <tr>
                          <td className="py-3 px-3">
                            <span className="block font-bold text-slate-800">Layanan Pendukung Sertifikasi Tambahan</span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Integrasi sertifikasi Kemenkumham/Apostille/Kemenlu {quotationModalLead.addons?.apostille ? 'Apostille ' : ''}
                              {quotationModalLead.addons?.legalisation?.join(', ') ?? ''} {quotationModalLead.addons?.skck ? 'SKCK Polri' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">Terlampir</td>
                          <td className="py-3 px-3 text-right font-mono">-</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">Rp {(quotationModalLead.addonCost ?? 0).toLocaleString('id-ID')}</td>
                        </tr>
                      )}

                      {/* Row 4: Grand total */}
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={3} className="py-3.5 px-3 text-right font-bold text-slate-805 text-[11px] uppercase tracking-wider">Total Nilai Penawaran (Terbilang):</td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-indigo-700 text-sm">
                          Rp {(quotationModalLead.dealFinalPrice ?? quotationModalLead.grandTotalCost ?? (quotationModalLead.totalTranslationCost + (quotationModalLead.addonCost ?? 0))).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Terms and conditions block clause */}
                  <div className="mt-8 space-y-1.5 text-slate-450 border-t border-slate-100 pt-5 text-[10px] leading-relaxed">
                    <span className="block font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-1">KETENTUAN SYARAT & PENGERJAAN:</span>
                    <ol className="list-decimal pl-3 space-y-1">
                      <li>Perkiraan halaman final dihitung mengacu pada skema TNR 12 spasi 1.5 naskah target setelah selesai diterjemahkan.</li>
                      <li>Proyek terjemahan mulai diproses setelah dokumen diterima penuh beserta pelunasan uang muka sebesar 50%.</li>
                      <li>Surat ini berlaku sebagai kesepakatan penawaran harga resmi selama 14 hari kalender sejak tanggal penerbitan.</li>
                    </ol>
                  </div>
                </div>

                {/* Stamp & Authorized Signature layout block */}
                <div className="flex items-end justify-between mt-10 pt-6">
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <span className="block">Dibuat secara elektronik dan sah</span>
                    <span className="block font-mono font-bold">DocVer: SECURE-AMP-{quotationModalLead.id.toUpperCase()}</span>
                    <span className="block text-[8px] text-emerald-600 font-bold border border-emerald-300 bg-emerald-50 rounded-md px-1.5 py-0.5 w-fit">VERIFIED VALID SECURE</span>
                  </div>

                  {/* Stamp Seal Graphic with absolute signature layered under it */}
                  <div className="text-center relative w-44 h-32 mr-4 flex flex-col items-center justify-end select-none">
                    {/* Signed Director */}
                    <span className="block text-xs font-bold text-slate-900 border-b border-slate-300 pb-1 w-full max-w-sm">Syahrul Mauluddin</span>
                    <span className="block text-[10px] text-slate-400 mt-1 font-medium">Direktur Utama - AMPM Translator</span>

                    {/* Ink Stamp Overlay circle */}
                    <div className="absolute top-1 right-7 w-24 h-24 rounded-full border-4 border-indigo-600/20 flex flex-col items-center justify-center -rotate-12 pointer-events-none select-none">
                      <div className="border border-indigo-600/35 rounded-full p-2 text-center text-[7px] text-indigo-600/40 font-bold leading-none tracking-tight">
                        <span className="block font-bold">AMPM SWORN</span>
                        <span className="block font-light text-[6px] mt-0.5">TRANSLATOR</span>
                        <span className="block font-mono text-[5px] mt-0.5">EST. 2018</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. PRINTABLE INVOICE MODAL */}
      <AnimatePresence>
        {invoiceModalLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex justify-center overflow-y-auto p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.97, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto text-slate-800"
            >
              {/* Modal Banner Control - Hide during window.print() */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between px-6 sticky top-0 bg-white/95 backdrop-blur-md z-10 print:hidden text-left">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 tracking-wider uppercase">Faktur Penagihan Digital (Invoice)</h3>
                  <p className="text-[10px] text-slate-455">Diterbitkan instan dari nilai deal disepakati administrator</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Print Kwitansi Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceModalLead(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Physical A4 printable Sheet document */}
              <div id="invoice-print-area" className="p-8 sm:p-12 text-left bg-white text-slate-850 font-sans max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
                
                <div>
                  {/* Header Letterhead container */}
                  <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {/* Stamp style official brand representation */}
                        <div className="w-8 h-8 rounded-lg bg-emerald-650 flex items-center justify-center text-white font-black text-sm select-none">
                          AM
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tight font-display font-sans uppercase">AMPM Sworn Translator</span>
                      </div>
                      <span className="block text-[9.5px] text-slate-500 font-medium leading-relaxed max-w-sm">
                        SK Kemenkumham Kanwil DKI Jakarta. Jl. Dr. Saharjo No.111, Tebet, Jakarta Selatan. Telp/WA: +62 822-4040-4545 | hello@ampmtranslator.com
                      </span>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <span className="inline-flex bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase mb-1">OFFICIAL INVOICE</span>
                      <h4 className="text-[11px] font-bold text-slate-800 font-mono">No: AMP-INV-{(new Date().getFullYear())}{(String(new Date().getMonth()+1).padStart(2, '0'))}-{invoiceModalLead.id.toUpperCase()}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Jatuh Tempo: {invoiceModalLead.dealDeadline ? new Date(invoiceModalLead.dealDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Segera'}</p>
                    </div>
                  </div>

                  {/* To Destination Customer Details split panel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs text-slate-600">
                    <div className="space-y-1 leading-relaxed">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ditagihkan Kepada:</span>
                      <span className="block font-bold text-slate-900 text-sm whitespace-nowrap">{invoiceModalLead.customerName}</span>
                      <span className="block font-medium font-mono text-[11px] text-slate-600">{invoiceModalLead.customerWhatsapp}</span>
                      {invoiceModalLead.customerEmail && <span className="block text-[10px] text-slate-450">{invoiceModalLead.customerEmail}</span>}
                    </div>

                    <div className="sm:text-right space-y-0.5 text-xs">
                      <span className="block text-[10px] sm:text-right font-bold text-slate-400 uppercase tracking-wide font-sans">Informasi Pembayaran Mandiri / BCA:</span>
                      <span className="block font-bold text-slate-900 font-sans">No. Rekening Mandiri: 124-000-999-5252</span>
                      <span className="block font-bold text-slate-900 font-sans">No. Rekening BCA: 224-101-4444</span>
                      <span className="block font-medium text-slate-650">Atas Nama: PT AMPM Sworn Translator Jasa</span>
                    </div>
                  </div>

                  {/* Line Separator */}
                  <p className="text-xs text-slate-600 mt-6 leading-relaxed">
                    Faktur kwitansi penagihan ini resmi dikeluarkan sebagai tagihan pelunasan terhadap proyek jasa penerjemahan berkas berikut yang telah disetujui:
                  </p>

                  {/* Financial items cost table breakdown layout */}
                  <table className="w-full text-xs text-left border-collapse mt-5">
                    <thead>
                      <tr className="bg-emerald-50/50 text-[10px] font-bold text-emerald-950 uppercase border-y border-emerald-105">
                        <th className="py-2.5 px-3 w-3/5">Rincian Paket & Aktivitas Penerjemahan</th>
                        <th className="py-2.5 px-3 text-center">Halaman</th>
                        <th className="py-2.5 px-3 text-right">Harga Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-705">
                      {/* Row 1: Core Deal Final Price */}
                      <tr>
                        <td className="py-3.5 px-3">
                          <span className="block font-bold text-slate-800">Paket Dokumen {invoiceModalLead.translationType === 'sworn' ? 'Kategori Sworn (Tersumpah DKI)' : 'Kategori Reguler (Biasa Bisnis)'}</span>
                          <span className="block text-[10px] text-slate-450 font-mono">Kode Estimasi: {invoiceModalLead.id} | File: {invoiceModalLead.fileName}</span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-600">{invoiceModalLead.calculatedStandardPages} Hal</td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800">
                          Rp {(invoiceModalLead.dealFinalPrice ?? invoiceModalLead.grandTotalCost ?? invoiceModalLead.totalTranslationCost ?? 0).toLocaleString('id-ID')}
                        </td>
                      </tr>

                      {/* Row 3: Grand total */}
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={2} className="py-3.5 px-3 text-right font-bold text-slate-800 text-[11px] uppercase tracking-wider">TOTAL TAGIHAN BERSIH (NET DUE):</td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-600 text-sm">
                          Rp {(invoiceModalLead.dealFinalPrice ?? invoiceModalLead.grandTotalCost ?? 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Terms and conditions block clause */}
                  <div className="mt-8 space-y-1.5 text-slate-455 border-t border-slate-100 pt-5 text-[10px] leading-relaxed">
                    <span className="block font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-1">PANDUAN KONFIRMASI PEMBAYARAN:</span>
                    <ol className="list-decimal pl-3 space-y-1">
                      <li>Silakan lampirkan bukti transfer bank resmi Anda ke admin WhatsApp AMPM Hub untuk verifikasi penyelesaian berkas.</li>
                      <li>Pembayaran dianggap lunas apabila dana telah masuk efektif ke rekening korporasi PT AMPM.</li>
                      <li>Hasil akhir terjemahan legal tersumpah hardcopy dikirimkan sesegera mungkin sesudah verifikasi dana masuk.</li>
                    </ol>
                  </div>
                </div>

                {/* Stamp & Authorized Signature layout block */}
                <div className="flex items-end justify-between mt-10 pt-6">
                  <div className="text-[10px] text-slate-400 space-y-1.5">
                    <span className="block font-medium">Diterbitkan oleh PT AMPM Sworn Translator Jasa</span>
                    <span className="block text-[8.5px] text-emerald-800 font-bold border border-emerald-300 bg-emerald-50 rounded-md px-1.5 py-0.5 w-fit">STATUS: LUNAS / TERKONFIRMASI</span>
                  </div>

                  {/* Stamp Seal Graphic with absolute signature layered under it */}
                  <div className="text-center relative w-44 h-32 mr-4 flex flex-col items-center justify-end select-none">
                    {/* Signed Director */}
                    <span className="block text-xs font-bold text-slate-900 border-b border-slate-300 pb-1 w-full max-w-sm">Syahrul Mauluddin</span>
                    <span className="block text-[10px] text-slate-400 mt-1 font-medium">Direktur Utama - AMPM Translator</span>

                    {/* Paid Stamp overlay in nice green stamp circular style */}
                    <div className="absolute top-1 right-7 w-24 h-24 rounded-full border-4 border-emerald-500/20 flex flex-col items-center justify-center rotate-12 pointer-events-none select-none">
                      <div className="border border-emerald-550 rounded-full p-2 text-center text-[8px] text-emerald-600 font-black leading-none tracking-tight">
                        <span className="block">PAID / LUNAS</span>
                        <span className="block font-mono text-[5px] mt-0.5">TERSELIKIDIK</span>
                        <span className="block font-mono text-[4px] mt-0.5">THANK YOU!</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-150 py-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} AMPM Sworn Translator. Seluruh hak cipta dilindungi undang-undang.</p>
          <p className="mt-0.5 text-slate-350">Dirancang secara eksklusif dengan presisi tarif retail legal Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}

// Subordinate Micro-Component Icons to remain compliant
function FileSpreadsheetIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M8 9h2" />
    </svg>
  );
}
