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
  Users,
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
  ArrowLeftRight,
  Download,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

import { TranslationLead, GoogleSheetConfig, UploadedDoc, CanvasingContact, Vendor, VendorPricelistItem, Agent } from './types';
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
import { LogOut, Database, Folder, Lock, RefreshCw, UserCheck, Percent, Briefcase } from 'lucide-react';

export default function App() {
  // Simple SPA Router for routing to separate pages
  const [currentRoute, setCurrentRoute] = useState<'public' | 'admin'>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('admin') || hash.includes('admin')) {
      return 'admin';
    }
    return 'public';
  });

  // Page states
  const [activeTab, setActiveTab] = useState<'estimator' | 'promos' | 'admin'>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('admin') || hash.includes('admin')) {
      return 'admin';
    }
    return 'estimator';
  });

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('admin') || hash.includes('admin')) {
        setCurrentRoute('admin');
        setActiveTab('admin');
      } else {
        setCurrentRoute('public');
        setActiveTab((prev) => (prev === 'admin' ? 'estimator' : prev));
      }
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const navigateTo = (route: 'public' | 'admin') => {
    if (route === 'admin') {
      window.location.hash = '#/admin';
      setCurrentRoute('admin');
      setActiveTab('admin');
    } else {
      window.location.hash = '#/';
      setCurrentRoute('public');
      setActiveTab('estimator');
    }
  };
  
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

  // Logo image loading error fallback flag
  const [logoError, setLogoError] = useState(false);

  // Flash Sale Promo active state status
  const [flashSaleActive, setFlashSaleActive] = useState(true);

  // Submission process
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Admin Dashboard states
  const [leads, setLeads] = useState<TranslationLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false);
  const [dummySyncProgress, setDummySyncProgress] = useState<string | null>(null);
  const [isSheetsSettingsOpen, setIsSheetsSettingsOpen] = useState(false);
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
  const [adminSubTab, setAdminSubTab] = useState<'leads' | 'orders' | 'canvasing' | 'insights' | 'invoices' | 'vendors' | 'agents'>('leads');
  const [canvasingContacts, setCanvasingContacts] = useState<CanvasingContact[]>([]);
  const [loadingCanvasing, setLoadingCanvasing] = useState(false);
  const [isAddingCanvasing, setIsAddingCanvasing] = useState(false);

  // Agent Management States
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [clientSelectedAgentId, setClientSelectedAgentId] = useState<number | null>(null);

  // New Agent Form States
  const [agentNamaInput, setAgentNamaInput] = useState('');
  const [agentTipeInput, setAgentTipeInput] = useState<'personal' | 'perusahaan'>('personal');
  const [agentNoWaInput, setAgentNoWaInput] = useState('');
  const [agentEmailInput, setAgentEmailInput] = useState('');
  const [agentDiskonPersenInput, setAgentDiskonPersenInput] = useState<number>(0);

  // Vendor Management States
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // New Vendor Form States
  const [vendorNamaInput, setVendorNamaInput] = useState('');
  const [vendorAlamatInput, setVendorAlamatInput] = useState('');
  const [vendorNoWaInput, setVendorNoWaInput] = useState('');
  const [vendorPricelistInput, setVendorPricelistInput] = useState<{ id: string; namaProduk: string; hargaVendor: number }[]>([]);
  const [newProdNamaInput, setNewProdNamaInput] = useState('');
  const [newProdHargaInput, setNewProdHargaInput] = useState<number>(0);

  // Fix Order / Work Order Modal states
  const [fixOrderModalLead, setFixOrderModalLead] = useState<TranslationLead | null>(null);
  const [selectedWorkOrderVendorId, setSelectedWorkOrderVendorId] = useState<string>('');
  const [workOrderCustomNote, setWorkOrderCustomNote] = useState<string>('');

  // Canvasing Quick Form States
  const [canvasingNomorSuratInput, setCanvasingNomorSuratInput] = useState('');
  const [canvasingNamaPerusahaanInput, setCanvasingNamaPerusahaanInput] = useState('');
  const [canvasingNamaPicInput, setCanvasingNamaPicInput] = useState('');
  const [canvasingNoTelpInput, setCanvasingNoTelpInput] = useState('');
  const [canvasingNoEmailInput, setCanvasingNoEmailInput] = useState('');
  const [canvasingKategoriInput, setCanvasingKategoriInput] = useState('Teknologi & IT');
  const [canvasingSuratPenawaranInput, setCanvasingSuratPenawaranInput] = useState('');
  const [canvasingResponInput, setCanvasingResponInput] = useState<'Tidak Respon' | 'Follow Up' | 'Closing'>('Tidak Respon');

  const [quotationModalLead, setQuotationModalLead] = useState<TranslationLead | null>(null);
  const [invoiceModalLead, setInvoiceModalLead] = useState<TranslationLead | null>(null);
  const [dealEditLead, setDealEditLead] = useState<TranslationLead | null>(null);

  // States used inside Deal/Order Configuration Panel & Customizable Invoice Items
  const [selectedInvoiceTemplate, setSelectedInvoiceTemplate] = useState<'emerald' | 'slate' | 'royal' | 'minimal'>('emerald');
  const [invoiceTaxRate, setInvoiceTaxRate] = useState<number>(0);
  const [invoiceDiscountRate, setInvoiceDiscountRate] = useState<number>(0);
  const [invoiceCustomNote, setInvoiceCustomNote] = useState<string>('');
  
  const [dealDeadlineInput, setDealDeadlineInput] = useState('');
  const [dealStatusInput, setDealStatusInput] = useState<'Dalam Antrean' | 'Pengerjaan Terjemah' | 'Proses Proofreading' | 'Penyegelan Tersumpah' | 'Selesai' | 'Dibatalkan'>('Dalam Antrean');
  const [dealPriceInput, setDealPriceInput] = useState<number>(0);
  const [dealNotesInput, setDealNotesInput] = useState('');
  const [dealInvoiceItems, setDealInvoiceItems] = useState<any[]>([]);

  // Instant creation overlay states B2B / Invoice
  const [instantCompanyCategoryInput, setInstantCompanyCategoryInput] = useState('');
  const [isCreatingCompanyCategoryInstantly, setIsCreatingCompanyCategoryInstantly] = useState(false);

  const [instantProductInputName, setInstantProductInputName] = useState('');
  const [instantProductInputPrice, setInstantProductInputPrice] = useState<number>(0);
  const [instantProductInputCatId, setInstantProductInputCatId] = useState('');
  const [isAddingProductInstantly, setIsAddingProductInstantly] = useState(false);

  const [instantProductCategoryName, setInstantProductCategoryName] = useState('');
  const [isAddingProductCategoryInstantly, setIsAddingProductCategoryInstantly] = useState(false);

  // Settings internal page tabs switcher
  const [settingsSubTab, setSettingsSubTab] = useState<'sync' | 'kategoriPerusahaan' | 'kategoriProduk' | 'produk'>('sync');

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
      fetchCanvasing();
      fetchSheetsConfig();
      fetchVendors();
      fetchAgents();
    }
  }, [activeTab]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (e) {
      console.error('Error fetching agents:', e);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentNamaInput) {
      alert('Nama agen wajib diisi!');
      return;
    }
    try {
      const url = editingAgent ? `/api/agents/${editingAgent.id}` : '/api/agents';
      const method = editingAgent ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: agentNamaInput,
          tipe: agentTipeInput,
          noWa: agentNoWaInput,
          email: agentEmailInput,
          diskonPersen: agentDiskonPersenInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (editingAgent) {
          setAgents(prev => prev.map(a => a.id === editingAgent.id ? data.agent : a));
        } else {
          setAgents(prev => [data.agent, ...prev]);
        }
        // reset form
        setAgentNamaInput('');
        setAgentTipeInput('personal');
        setAgentNoWaInput('');
        setAgentEmailInput('');
        setAgentDiskonPersenInput(0);
        setEditingAgent(null);
        setIsAddingAgent(false);
      }
    } catch (err) {
      console.error('Error saving agent:', err);
    }
  };

  const handleEditAgentClick = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentNamaInput(agent.nama);
    setAgentTipeInput(agent.tipe);
    setAgentNoWaInput(agent.noWa);
    setAgentEmailInput(agent.email || '');
    setAgentDiskonPersenInput(agent.diskonPersen);
    setIsAddingAgent(true);
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus agen ini?')) return;
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAgents(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Error deleting agent:', err);
    }
  };

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await fetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (e) {
      console.error('Error fetching vendors:', e);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorNamaInput) {
      alert('Nama vendor wajib diisi!');
      return;
    }
    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
      const method = editingVendor ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: vendorNamaInput,
          alamat: vendorAlamatInput,
          noWa: vendorNoWaInput,
          pricelist: vendorPricelistInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (editingVendor) {
          setVendors(prev => prev.map(v => v.id === editingVendor.id ? data.vendor : v));
        } else {
          setVendors(prev => [data.vendor, ...prev]);
        }
        // reset form
        setVendorNamaInput('');
        setVendorAlamatInput('');
        setVendorNoWaInput('');
        setVendorPricelistInput([]);
        setEditingVendor(null);
        setIsAddingVendor(false);
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
    }
  };

  const handleEditVendorClick = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorNamaInput(vendor.nama);
    setVendorAlamatInput(vendor.alamat);
    setVendorNoWaInput(vendor.noWa);
    setVendorPricelistInput(vendor.pricelist || []);
    setIsAddingVendor(true);
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus vendor ini?')) return;
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setVendors(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
    }
  };

  const addPricelistItem = () => {
    if (!newProdNamaInput || newProdHargaInput <= 0) {
      alert('Isi nama produk & harga vendor!');
      return;
    }
    const newItem = {
      id: `vitem-${Date.now()}`,
      namaProduk: newProdNamaInput,
      hargaVendor: newProdHargaInput
    };
    setVendorPricelistInput(prev => [...prev, newItem]);
    setNewProdNamaInput('');
    setNewProdHargaInput(0);
  };

  const removePricelistItem = (id: string) => {
    setVendorPricelistInput(prev => prev.filter(item => item.id !== id));
  };

  const fetchCanvasing = async () => {
    setLoadingCanvasing(true);
    try {
      const res = await fetch('/api/canvasing');
      if (res.ok) {
        const data = await res.json();
        setCanvasingContacts(data);
      }
    } catch (e) {
      console.error('Error fetching canvasing contacts:', e);
    } finally {
      setLoadingCanvasing(false);
    }
  };

  const addCanvasingContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canvasingNamaPerusahaanInput || !canvasingNoTelpInput) {
      alert('Nama Perusahaan & No. Telepon wajib diisi!');
      return;
    }
    setIsAddingCanvasing(true);
    try {
      const payload = {
        nomorSurat: canvasingNomorSuratInput,
        namaPerusahaan: canvasingNamaPerusahaanInput,
        namaPic: canvasingNamaPicInput,
        noTelp: canvasingNoTelpInput,
        noEmail: canvasingNoEmailInput,
        kategoriPerusahaan: canvasingKategoriInput,
        suratPenawaran: canvasingSuratPenawaranInput,
        respon: canvasingResponInput
      };
      const res = await fetch('/api/canvasing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const { contact } = await res.json();
        setCanvasingContacts(prev => [contact, ...prev]);
        // Reset form
        setCanvasingNomorSuratInput('');
        setCanvasingNamaPerusahaanInput('');
        setCanvasingNamaPicInput('');
        setCanvasingNoTelpInput('');
        setCanvasingNoEmailInput('');
        setCanvasingSuratPenawaranInput('');
        setCanvasingResponInput('Tidak Respon');
        alert('Sukses menambahkan prospek partner Canvasing B2B baru!');
      } else {
        throw new Error('Gagal menyimpan kontak canvasing');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingCanvasing(false);
    }
  };

  const updateCanvasingRespon = async (id: string, newRespon: 'Tidak Respon' | 'Follow Up' | 'Closing') => {
    try {
      const res = await fetch(`/api/canvasing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respon: newRespon })
      });
      if (res.ok) {
        setCanvasingContacts(prev => prev.map(c => c.id === id ? { ...c, respon: newRespon } : c));
      } else {
        throw new Error('Gagal merubah respon');
      }
    } catch (err: any) {
      alert('Error updating response: ' + err.message);
    }
  };

  const deleteCanvasingContact = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kontak canvasing ini?')) return;
    try {
      const res = await fetch(`/api/canvasing/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCanvasingContacts(prev => prev.filter(c => c.id !== id));
      } else {
        throw new Error('Gagal menghapus');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

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

  const saveUpdatedAppConfig = async (newConfig: GoogleSheetConfig) => {
    try {
      const res = await fetch('/api/sheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsConfig(data.config || data);
        return data.config || data;
      }
    } catch (e) {
      console.error('Error saving updated app config:', e);
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
        ? `Sukses! Lead ${lead.id} berhasil ditandai sebagai DEAL.\n\nSilakan cetak Penawaran & Invoice di tab "CRM & Prospek", lalu klik "Tandai Lunas" untuk memindahkannya ke tab "Manajemen Order" setelah pembayaran diterima.`
        : `Sukses! Order ${lead.id} dikembalikan ke database CRM Prospek.`
      );
    } catch (err: any) {
      console.error('Error toggling deal:', err);
      alert('Gagal: ' + err.message);
    }
  };

  const handleMarkasPaid = async (lead: TranslationLead, isPaid: boolean) => {
    try {
      const updatePayload: Partial<TranslationLead> = {
        isPaid,
        dealStatus: isPaid ? 'Pengerjaan Terjemah' : 'Dalam Antrean'
      };

      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) throw new Error('Gagal menandai status pembayaran');

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updatePayload } : l));
      if (selectedAdminLead && selectedAdminLead.id === lead.id) {
        setSelectedAdminLead(prev => prev ? { ...prev, ...updatePayload } : null);
      }

      alert(isPaid 
        ? `Sukses! Pembayaran untuk ${lead.id} telah berhasil diverifikasi.\n\nData klien telah digeser ke tab "Manajemen Order" untuk proses pengerjaan juru bahasa.`
        : `Sukses! Status pembayaran untuk ${lead.id} diset belum bayar.`
      );
    } catch (err: any) {
      console.error('Error marking as paid:', err);
      alert('Gagal: ' + err.message);
    }
  };

  const handleUpdateDealDetails = async (id: string) => {
    try {
      const updatePayload = {
        dealDeadline: dealDeadlineInput,
        dealStatus: dealStatusInput,
        dealFinalPrice: Number(dealPriceInput),
        orderNotes: dealNotesInput,
        invoiceItems: dealInvoiceItems
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

          let data: any;
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            try {
              data = await res.json();
            } catch (jsonErr) {
              throw new Error('Gagal membaca data JSON balasan dari server.');
            }
          } else {
            const htmlOrText = await res.text();
            if (res.status === 404) {
              throw new Error('Endpoint API /api/analyze-document tidak ditemukan (404). Karena Anda men-deploy di Netlify (Hosting Statis), Netlify default hanya meng-host frontend React Anda tanpa menjalankan Server Backend (server.ts). AI dan database membutuhkan Server Full-Stack. Silakan deploy backend Anda ke Render, Railway, Cloud Run atau aktifkan Netlify Functions.');
            }
            throw new Error(`Server tidak mengembalikan JSON (Status ${res.status}): ${htmlOrText.slice(0, 100)}...`);
          }

          if (!res.ok) {
            throw new Error(data?.error || 'Gagal memproses file.');
          }
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
              simulatedPages: Math.max(1, Math.ceil((data.wordCount || 0) / 380) || data.simulatedPagesCount || 1),
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

      // Find B2B Agent and calculate custom discount if any
      const matchedAgent = clientSelectedAgentId ? agents.find(a => a.id === clientSelectedAgentId) : null;
      const baseTotal = costBreakdown.grandTotal;
      const flashSaleDiscount = flashSaleActive ? Math.round(baseTotal * 0.10) : 0;
      const agentDiscount = matchedAgent ? Math.round((baseTotal - flashSaleDiscount) * (matchedAgent.diskonPersen / 100)) : 0;
      const finalGrandTotal = baseTotal - flashSaleDiscount - agentDiscount;

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
        grandTotalCost: finalGrandTotal,
        agentId: clientSelectedAgentId,
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

    const originalTotal = lead.grandTotalCost || 0;
    const discAmt = flashSaleActive ? Math.round(originalTotal * 0.10) : 0;
    const finalTotal = originalTotal - discAmt;

    const text = `Halo AMPM Sworn Translator, saya ingin memesan layanan alih bahasa resmi & klaim kupon Flash Sale:

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
• Harga Normal : Rp ${originalTotal.toLocaleString('id-ID')}
${flashSaleActive ? `*• Diskon Flash Sale (10%) : -Rp ${discAmt.toLocaleString('id-ID')}* (Kupon: AMPM10FLASH)\n*• TOTAL FINAL ESTIMASI : Rp ${finalTotal.toLocaleString('id-ID')}*` : `*• TOTAL ESTIMASI : Rp ${originalTotal.toLocaleString('id-ID')}*`}

ID Estimasi: *${lead.id}*
Saya ingin segera memproses pesanan saya dan klaim promo diskon 10% Flash Sale via WhatsApp ini! Terima kasih!`;

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

  // Generate 20 high-quality dummy leads on the server with optional automatic Google Sheets direct synchronization
  const handleGenerateDummyLeads = async () => {
    if (isGeneratingDummy) return;
    setIsGeneratingDummy(true);
    setDummySyncProgress("Membuat 20 data dummy di server...");
    
    try {
      const response = await fetch('/api/leads/generate-dummy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi server untuk membuat data dummy');
      }

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Gagal menyimpan data dummy');
      }

      setDummySyncProgress("20 Data dummy berhasil dibuat lokal!");
      
      // Instantly load the new records in our local client-side state
      await fetchLeads();

      // Detect if Google Sheets config and authorization exists
      const isGoogleSheetsSyncActive = sheetsConfig.googleSpreadsheetId && gToken;
      if (isGoogleSheetsSyncActive) {
        const wantsSheetSync = confirm(
          "Berhasil membuat 20 data dummy CRM baru secara lokal!\n\nKami mendeteksi Anda saat ini terhubung ke Google Sheets.\nApakah Anda juga ingin mengunggah ke-20 data dummy ini ke Google Sheet Anda?"
        );

        if (wantsSheetSync) {
          let syncedCount = 0;
          for (let i = 0; i < resData.leads.length; i++) {
            const lead = resData.leads[i];
            setDummySyncProgress(`Sinkronisasi Sheet (${i+1}/20): ${lead.customerName}...`);
            const ok = await syncLeadToGoogleSheet(lead, true);
            if (ok) syncedCount++;
          }
          alert(`Selesai! ${syncedCount} dari 20 data dummy berhasil disinkronkan ke Google Sheet Anda.`);
        }
      } else {
        alert("Sukses membuat 20 data dummy CRM baru secara lokal! Anda dapat langsung meninjau analitik di tab 'Insight Bisnis' dan menguji alur kerja order.");
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghasilkan data dummy: ' + err.message);
    } finally {
      setIsGeneratingDummy(false);
      setDummySyncProgress(null);
    }
  };

  // Filtered leads for search and admin sub-tabs (split leads vs dealed orders)
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.customerWhatsapp.includes(searchQuery) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetLanguage.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (adminSubTab === 'leads') {
      return !l.isPaid && matchesSearch;
    } else if (adminSubTab === 'orders') {
      return !!l.isPaid && matchesSearch;
    } else if (adminSubTab === 'invoices') {
      return (!!l.isDealed || !!l.isPaid) && matchesSearch;
    }
    return matchesSearch;
  });

  // Filtered canvasing contacts B2B
  const filteredCanvasing = canvasingContacts.filter(c => {
    const s = searchQuery.toLowerCase();
    return (
      c.namaPerusahaan.toLowerCase().includes(s) ||
      (c.namaPic && c.namaPic.toLowerCase().includes(s)) ||
      c.nomorSurat.toLowerCase().includes(s) ||
      c.kategoriPerusahaan.toLowerCase().includes(s) ||
      c.suratPenawaran.toLowerCase().includes(s) ||
      c.noTelp.includes(s) ||
      (c.noEmail && c.noEmail.toLowerCase().includes(s))
    );
  });

  // Filtered vendors
  const filteredVendors = vendors.filter(v => {
    const s = searchQuery.toLowerCase();
    return (
      v.nama.toLowerCase().includes(s) ||
      v.alamat.toLowerCase().includes(s) ||
      v.noWa.includes(s) ||
      (v.pricelist && v.pricelist.some(p => p.namaProduk.toLowerCase().includes(s)))
    );
  });

  // Filtered agents
  const filteredAgents = agents.filter(a => {
    const s = searchQuery.toLowerCase();
    return (
      a.nama.toLowerCase().includes(s) ||
      a.tipe.toLowerCase().includes(s) ||
      a.noWa.includes(s) ||
      (a.email && a.email.toLowerCase().includes(s)) ||
      a.id.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Visual Identity Logo & Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shrink-0 shadow-xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Official AMPM Translator Logo with resilient fallback */}
            {!logoError ? (
              <img 
                src="https://i.ibb.co.com/TDq2jCcc/Logo-AMPMTranslator.webp" 
                alt="Logo AMPM Translator" 
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="h-11 sm:h-12 w-auto object-contain rounded-lg border border-slate-100 shadow-xs"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-800 to-indigo-950 flex flex-col items-center justify-center text-white font-black font-mono shadow-sm border border-indigo-500/20 tracking-tighter text-center leading-none select-none shrink-0">
                  <span className="text-[9px] uppercase font-sans font-extrabold tracking-wide opacity-80 leading-none">AMP</span>
                  <span className="text-xs font-black text-amber-400 mt-0.5 leading-none">M</span>
                </div>
                {/* Visual indicator for smaller screens when name heading is collapsed */}
                <div className="sm:hidden flex flex-col justify-center">
                  <span className="text-sm font-extrabold text-slate-850 tracking-tight leading-none">AMPM Sworn</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1 leading-none">Translation</span>
                </div>
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center gap-2">
                AMPM Sworn Translator
                <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold py-0.5 px-2 rounded-full tracking-wider">
                  {currentRoute === 'admin' ? 'Admin Portal' : 'Sworn Only'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {currentRoute === 'admin' ? 'Order Management & CRM System' : 'Sworn Translation Service'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden lg:block">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Service Status</p>
              <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {currentRoute === 'admin' ? 'Admin Session Secure' : 'AI Engine Active'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {currentRoute === 'admin' ? (
                <>
                  <button
                    onClick={() => navigateTo('public')}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-slate-500" />
                    <span>Halaman Depan</span>
                  </button>
                  {isAdminLoggedIn && (
                    <button
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin keluar dari sesi kerja Admin?')) {
                          localStorage.removeItem('ampm_admin_logged_in');
                          setIsAdminLoggedIn(false);
                          setAdminUsername('');
                          setAdminPassword('');
                          setIsSheetsSettingsOpen(false);
                        }
                      }}
                      className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center space-x-1.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    id="tab-btn-estimator"
                    onClick={() => setActiveTab('estimator')}
                    className={`px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center space-x-1.5 border cursor-pointer ${
                      activeTab === 'estimator'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-indigo-400" />
                    <span className="hidden xs:inline">Formulir Estimasi</span>
                    <span className="inline xs:hidden">Estimasi</span>
                  </button>
                  
                  <button
                    id="tab-btn-promos"
                    onClick={() => setActiveTab('promos')}
                    className={`px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center space-x-1.5 border relative cursor-pointer ${
                      activeTab === 'promos'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span className="hidden xs:inline">Brosur & Promo</span>
                    <span className="inline xs:hidden">Promo</span>
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black tracking-normal px-1.5 py-0.5 rounded-full animate-bounce">
                      -10%
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-12 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'estimator' ? (
            <motion.div
              key="estimator-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12"
            >
              {/* Left Column: Form & Document Picker (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                
                {/* Visual Intro Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                  <div className="relative z-10 space-y-2.5">
                    <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-350 text-[10px] font-bold py-1 px-3 rounded-full border border-indigo-500/10 uppercase tracking-widest">
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
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-left">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>Referensi Agen B2B (Opsional)</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-extrabold tracking-wide">DISKON KHUSUS</span>
                      </label>
                      <select
                        value={clientSelectedAgentId || ''}
                        onChange={(e) => setClientSelectedAgentId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium transition-all focus:bg-white cursor-pointer"
                      >
                        <option value="">— Tidak Ada Agen / Umum —</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.nama} ({a.tipe === 'perusahaan' ? '🏢 Korporat' : '👤 Personal'})</option>
                        ))}
                      </select>
                    </div>
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

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-6 rounded-3xl mb-2 border-0">
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
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Kata</span>
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                value={wordCount}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setWordCount(val);
                                  setSimulatedPages(Math.ceil(val / 380) || 1);
                                }}
                                className="w-16 text-center bg-transparent border-b border-slate-200 focus:border-indigo-600 font-mono font-bold text-sm text-slate-800 p-0 focus:outline-none focus:ring-0"
                              />
                            </div>
                          </div>
                          
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Karakter</span>
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                value={charCount}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setCharCount(val);
                                }}
                                className="w-16 text-center bg-transparent border-b border-slate-200 focus:border-indigo-600 font-mono font-bold text-sm text-slate-800 p-0 focus:outline-none focus:ring-0"
                              />
                            </div>
                          </div>

                          <div className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                            <span className="block text-[10px] uppercase font-bold text-indigo-900">Simulasi Halaman</span>
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                min="1"
                                value={simulatedPages}
                                onChange={(e) => setSimulatedPages(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-10 text-center bg-transparent border-b border-indigo-200 focus:border-indigo-600 font-mono font-bold text-base text-indigo-900 p-0 focus:outline-none focus:ring-0"
                              />
                              <span className="text-xs font-bold text-indigo-800">Hal</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex items-start space-x-2">
                            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <p className="font-sans leading-snug">{analysisExplanation || "Masukkan statistik teks di atas atau upload dokumen untuk mensimulasikan halaman otomatis."}</p>
                          </div>
                          <div className="border-t border-slate-200/80 pt-1.5 text-[10px] text-indigo-700/90 font-medium font-sans">
                            💡 **Ketentuan Cetak**: 1 Halaman Standard = Maksimum **380 Kata** (Kertas A4, Times New Roman 12pt, Spasi 1.5, Margin 1 inci). Sisa desimal langsung dibulatkan ke atas.
                          </div>
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
                <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-xl overflow-hidden sticky top-24 border-0">
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
                        <div className="bg-slate-950/40 p-4 rounded-xl border-0 space-y-2.5">
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
                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 bg-slate-950/50 p-3.5 rounded-xl border-0 scrollbar-thin">
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
                    <div className="bg-slate-950/80 rounded-2xl p-6 space-y-4 border-0">
                      <h4 className="text-xs font-bold text-indigo-400 flex items-center justify-between uppercase tracking-wider">
                        <span>Rincian Kalkulasi Kasir</span>
                        <Coins className="w-3.5 h-3.5 text-indigo-400" />
                      </h4>

                      {/* Active Flash Sale Promo Alert & Toggle */}
                      <div className="bg-gradient-to-r from-red-950/40 via-amber-950/30 to-red-950/40 border border-red-900/50 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="text-base">🔥</span>
                          <div>
                            <p className="font-extrabold text-amber-400 tracking-tight flex items-center gap-1.5 uppercase text-[10px] leading-none">
                              Kupon Flash Sale 10% Aktif!
                              <span className="bg-red-500 text-white font-black px-1.5 py-0.5 rounded-full text-[8.5px] animate-pulse">DISKON 10%</span>
                            </p>
                            <p className="text-slate-300 text-[10.5px] leading-relaxed mt-1 font-medium">
                              Khusus pemesanan via WhatsApp hari ini! Hemat biaya terjemahan resmi Anda.
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 scale-95">
                          <input 
                            type="checkbox" 
                            checked={flashSaleActive}
                            onChange={(e) => setFlashSaleActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <div className="space-y-2 text-xs font-semibold text-slate-300">
                        <div className="flex justify-between items-center text-slate-300 font-sans">
                          <span>
                            Biaya Terjemah {translationType === 'sworn' ? '(Sworn)' : '(Biasa)'} <br/>
                            <span className="text-[10px] font-semibold text-slate-500 text-indigo-400/70">
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

                        {flashSaleActive && (
                          <div className="flex justify-between items-center border-t border-dashed border-red-900/60 pt-2 text-xs text-red-400 font-bold">
                            <span className="flex items-center gap-1">
                              <span>Potongan Flash Sale (10%):</span>
                              <span className="bg-red-950/60 px-1 py-0.5 rounded text-[9px] uppercase tracking-wide border border-red-900">AMPM10FLASH</span>
                            </span>
                            <span className="font-mono">
                              -Rp {Math.round(costBreakdown.grandTotal * 0.10).toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col border-t-2 border-indigo-900/60 pt-3.5 space-y-1">
                          {flashSaleActive && (
                            <div className="flex justify-between items-center text-[11.5px] text-slate-400 line-through decoration-red-500 decoration-1.5">
                              <span>Harga Normal:</span>
                              <span className="font-mono">
                                Rp {costBreakdown.grandTotal.toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm font-bold text-white">
                            <span className="text-indigo-450 font-sans tracking-wide">
                              {flashSaleActive ? 'TOTAL BIAYA ESTIMASI PROMO:' : 'GRAND TOTAL ESTIMASI:'}
                            </span>
                            <span className={`font-mono text-base ${flashSaleActive ? 'text-amber-400 text-lg font-black' : 'text-indigo-350'}`}>
                              Rp {((flashSaleActive) ? (costBreakdown.grandTotal - Math.round(costBreakdown.grandTotal * 0.10)) : costBreakdown.grandTotal).toLocaleString('id-ID')}
                            </span>
                          </div>
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
                              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all animate-bounce"
                            >
                              <MessageSquare className="w-4 h-4 fill-white text-emerald-100" />
                              <span>
                                {flashSaleActive 
                                  ? 'Klaim Diskon 10% & Hubungi Admin di WhatsApp' 
                                  : 'Hubungi Admin di WhatsApp'
                                }
                              </span>
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
          ) : activeTab === 'promos' ? (
            <motion.div
              key="promos-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 text-left"
            >
              {/* Promo Flash Sale Hero Block */}
              <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-red-900/30 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-red-500 text-white text-[11px] font-black py-1 px-3.5 rounded-full uppercase tracking-wider animate-pulse">
                    <span>⚡ FLASH SALE EVENT</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight leading-tight">
                    Potongan Harga Spesial <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Diskon 10%</span> Tanpa Syarat!
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans mt-2">
                    Dapatkan potongan harga langsung 10% untuk semua layanan alih bahasa resmi tersumpah (Sworn) berbagai bahasa, Apostille, dan Legalisasi dokumen. Cukup klaim voucher Anda sekarang melalui WhatsApp resmi PT AMPM Sworn Translator Jasa!
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3.5 pt-2">
                    <a
                      href="https://wa.me/628123456789/?text=Halo%20AMPM%20Sworn%20Translator%2C%20saya%20ingin%20klaim%20Voucher%20Promo%20Diskon%2010%25%20Flash%20Sale%20%28KODE%3A%20AMPM10FLASH%29%20sekarang!%20Mohon%20bantuannya.%20Terima%20kasih!"
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer scale-100 hover:scale-[1.02]"
                    >
                      <MessageSquare className="w-4 h-4 fill-slate-950" />
                      <span>Klaim Voucher Diskon 10% Sekarang</span>
                    </a>
                    
                    <div className="text-xs text-slate-450 font-mono flex items-center gap-1.5 opacity-90">
                      <span>KODE KUPON:</span>
                      <span className="bg-slate-800 px-2 py-1 rounded text-amber-300 font-bold border border-slate-705">AMPM10FLASH</span>
                    </div>
                  </div>
                </div>
                {/* Decorative assets */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-red-650/15 to-transparent blur-3xl pointer-events-none"></div>
                <div className="absolute left-1/4 bottom-0 w-48 h-48 bg-indigo-650/10 rounded-full blur-3xl pointer-events-none"></div>
              </div>

              {/* Grid 2 Column for Sworn Language Pricing & Certification Services */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Official Sworn Translators Prices */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
                      <Languages className="w-5 h-5 text-indigo-650 animate-pulse" />
                      <span>Daftar Tarif Resmi Jasa Penerjemah Tersumpah</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Sifat dokumen tersumpah (sworn translation) resmi berstempel dan bertanda tangan basah terdaftar di Kedutaan dan Kemenkumham. Dihitung per halaman cetak standar hasil terjemahan.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-150 shadow-xs">
                    <table className="w-full text-xs text-left text-slate-700">
                      <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 border-b border-slate-150 font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-3.5">Bahasa Sasaran</th>
                          <th className="px-4 py-3.5 text-right">Reguler Klien</th>
                          <th className="px-4 py-3.5 text-right font-bold text-indigo-600">Flash Sale (-10%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium font-mono text-slate-800">
                        {Object.keys(SWORN_PRICING).map((key) => {
                          const item = SWORN_PRICING[key];
                          const normalReg = item.prices.normalReguler;
                          const discReg = Math.round(normalReg * 0.90);
                          const normalCorp = item.prices.normalNonReguler;
                          const discCorp = Math.round(normalCorp * 0.90);
                          return (
                            <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-sans font-semibold text-slate-800 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 hidden sm:inline-block"></span>
                                <span className="font-bold">{item.targetLanguage}</span>
                                <span className="text-[9px] uppercase font-bold text-slate-400">({key})</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <p className="text-slate-800 font-semibold">Rp {normalReg.toLocaleString('id-ID')}</p>
                                <p className="text-[9.5px] text-slate-400 font-normal">Korporat: Rp {normalCorp.toLocaleString('id-ID')}</p>
                              </td>
                              <td className="px-4 py-3 text-right bg-amber-500/5">
                                <p className="text-amber-600 font-black">Rp {discReg.toLocaleString('id-ID')}</p>
                                <p className="text-[9.5px] text-emerald-605 font-bold">Corp: Rp {discCorp.toLocaleString('id-ID')}</p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-150 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5 uppercase tracking-wide">
                      <Info className="w-3.5 h-3.5 text-indigo-650" />
                      <span>Aturan Standar Halaman Hasil Terjemahan (SK Gubernur DKI Jakarta)</span>
                    </h4>
                    <ul className="text-[10.5px] text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed font-sans">
                      <li>Kertas format: A4, margin 1 inci (2.54 cm) pada semua empat sisi.</li>
                      <li>Jenis Huruf: Times New Roman 12 point.</li>
                      <li>Double spacing (Jarak baris ganda / spasi 1.5 - 2).</li>
                      <li>Hasil cetak fisik akan berstempel basah legalitas PT AMPM Sworn Translator Jasa.</li>
                    </ul>
                  </div>
                </div>

                {/* Right Column: Non-Sworn and Legalisasi/Apostille Services */}
                <div className="space-y-8 text-left">
                  
                  {/* Non-Sworn Box */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <span>Tarif Alih Bahasa Biasa (Non-Sworn)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Layanan alih bahasa berkualitas untuk literatur umum, manual teknik, dan dokumentasi akademik non-resmi.
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-150">
                      <table className="w-full text-xs text-left text-slate-700">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-150 tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Jenis Alih Bahasa</th>
                            <th className="px-4 py-3 text-right">Tarif Normal</th>
                            <th className="px-4 py-3 text-right text-indigo-600 font-bold">Harga Promo (10%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium font-mono text-slate-800">
                          {Object.keys(NON_SWORN_PRICING).map((key) => {
                            const val = NON_SWORN_PRICING[key];
                            const normal = val.price;
                            const promo = Math.round(normal * 0.90);
                            return (
                              <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-sans text-slate-800 font-semibold">{val.term}</td>
                                <td className="px-4 py-3 text-right text-slate-500">Rp {normal.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right font-extrabold text-amber-600 bg-amber-500/5">Rp {promo.toLocaleString('id-ID')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Legalisasi / Apostille Box */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <span>Sertifikasi Apostille & Legalisasi Kementrian</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Sertifikasi dokumen resmi untuk visa studi, kerja, investasi, pernikahan luar negeri, & eksport-import.
                      </p>
                    </div>

                    <div className="space-y-3 font-sans text-slate-700">
                      <div className="border border-slate-150 rounded-xl p-3 bg-indigo-50/20 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-slate-850">Apostille Kemenkumham RI</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Sertifikasi kemudahan global untuk 120+ negara konvensi Hague.</p>
                        </div>
                        <div className="text-right font-mono text-[11px] font-black text-indigo-700 leading-none">
                          <p>Mulai Rp 700.000</p>
                          <p className="text-[8.5px] text-amber-500 font-extrabold uppercase mt-1">Garansi Diskon</p>
                        </div>
                      </div>

                      <div className="border border-slate-150 rounded-xl p-3 bg-indigo-50/20 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-slate-850">Legalisasi Kedutaan Besar Asing & Kemenlu</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Sertifikasi resmi untuk negara non-konvensi Apostille (Taiwan, Qatar, UEA, Vietnam, dll).</p>
                        </div>
                        <div className="text-right font-mono text-[11px] font-black text-indigo-700 leading-none">
                          <p>Mulai Rp 450.000</p>
                          <p className="text-[8.5px] text-amber-500 font-extrabold uppercase mt-1">Jaminan Valid</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call to Trust Panel */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-850 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2 font-sans text-left">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
                        <Check className="w-4 h-4 text-emerald-400 bg-emerald-950 rounded-full p-0.5" />
                        Layanan Resmi & Bergaransi PT AMPM
                      </h4>
                      <p className="text-xs text-slate-350 leading-relaxed mt-1">
                        Kami menjamin 100% bahwa penerjemah tersumpah kami terdaftar resmi di Kemenkumham RI, Kemenlu RI, dan Kedutaan Besar asing di Indonesia. File PDF berstempel basah resmi akan dikirim melalui email/WhatsApp, serta opsi kirim hardcopy via GoSend/Grab/JNE Express seketika setelah penyelesaian berkas terjemah.
                      </p>
                    </div>
                    <div className="flex gap-4 mt-4 text-[10.5px] border-t border-slate-850 pt-4 text-slate-400 font-medium">
                      <span>✓ 100% Legally Valid</span>
                      <span>✓ Garansi Revisi Gratis</span>
                      <span>✓ Kirim Cetak Fisik Global</span>
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
                <div className="max-w-md mx-auto my-8 bg-white rounded-3xl shadow-xl overflow-hidden text-left font-sans border-0">
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
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col gap-1 text-[11px] text-indigo-900 font-sans text-left">
                      <div className="font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Kredensial Akses Admin Resmi:</span>
                      </div>
                      <div className="flex gap-4 mt-0.5 font-mono">
                        <span>User: <strong className="text-indigo-950 font-sans">admin</strong></span>
                        <span>Sandi: <strong className="text-indigo-950 font-sans font-mono text-[11px]">ampmadmin2026</strong></span>
                      </div>
                    </div>

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
                /* LAYMAN FRIENDLY ADMIN WORKSPACE (FULL WIDTH ENGINE) */
                <div className="w-full text-left space-y-6 animate-fade-in">

                  {/* CRM & Order Manager Core Desk (100% Full Width) */}
                  <div className="w-full flex flex-col space-y-6">
                    <div className="bg-white rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[550px] border-0">
                    
                    {/* Header bar controls */}
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 font-display">Worksuite Layanan CRM & Order</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Pengelolaan prospek, order deal, dan analitik performa toko</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
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
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs py-2 px-3.5 rounded-lg shadow-xs transition-all flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer"
                          title="Keluar Sesi Administrator"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Keluar Sesi</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleGenerateDummyLeads}
                          disabled={isGeneratingDummy || loadingLeads}
                          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs py-2 px-3.5 rounded-lg shadow-xs transition-all flex items-center space-x-1.5 uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                          title="Generate 20 mock CRM entries dynamically matching target specs"
                        >
                          <Database className={`w-3.5 h-3.5 ${isGeneratingDummy ? 'animate-bounce' : ''}`} />
                          <span>{isGeneratingDummy ? 'Mendata...' : 'Buat 20 Data Dummy'}</span>
                        </button>
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

                    {/* Progress feedback for dummy generator with Google Spreadsheet sync state */}
                    {dummySyncProgress && (
                      <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-2.5 flex items-center justify-between text-xs text-indigo-700 font-semibold font-sans">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>{dummySyncProgress}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-widest bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-sm font-bold">Proses</span>
                      </div>
                    )}

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
                        <span>CRM & Prospek ({leads.filter(l => !l.isPaid).length})</span>
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
                        <span>Manajemen Order ({leads.filter(l => l.isPaid).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminSubTab('invoices');
                          setSelectedAdminLead(null);
                        }}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 focus:outline-none whitespace-nowrap cursor-pointer ${
                          adminSubTab === 'invoices'
                            ? 'text-indigo-600 border-indigo-600 font-sans'
                            : 'text-slate-500 border-transparent hover:text-slate-700 font-medium font-sans'
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Manajemen Invoice ({leads.filter(l => l.isDealed || l.isPaid).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminSubTab('canvasing');
                          setSelectedAdminLead(null);
                        }}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 focus:outline-none whitespace-nowrap cursor-pointer ${
                          adminSubTab === 'canvasing'
                            ? 'text-indigo-600 border-indigo-600 font-sans'
                            : 'text-slate-500 border-transparent hover:text-slate-700 font-medium font-sans'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 text-blue-500" />
                        <span>Canvasing B2B ({canvasingContacts.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminSubTab('vendors');
                          setSelectedAdminLead(null);
                        }}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 focus:outline-none whitespace-nowrap cursor-pointer ${
                          adminSubTab === 'vendors'
                            ? 'text-indigo-600 border-indigo-600 font-sans'
                            : 'text-slate-500 border-transparent hover:text-slate-700 font-medium font-sans'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-rose-500" />
                        <span>Manajemen Vendor ({vendors.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminSubTab('agents');
                          setSelectedAdminLead(null);
                        }}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 focus:outline-none whitespace-nowrap cursor-pointer ${
                          adminSubTab === 'agents'
                            ? 'text-indigo-600 border-indigo-600 font-sans'
                            : 'text-slate-500 border-transparent hover:text-slate-700 font-medium font-sans'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                        <span>Manajemen Agen B2B ({agents.length})</span>
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
                    {(adminSubTab === 'leads' || adminSubTab === 'orders' || adminSubTab === 'canvasing' || adminSubTab === 'invoices' || adminSubTab === 'vendors' || adminSubTab === 'agents') && (
                      <div className="px-5 py-3 border-b border-slate-100 bg-white">
                        <input
                          type="text"
                          placeholder={
                            adminSubTab === 'leads'
                              ? "Cari prospek CRM berdasarkan nama, whatsapp, ID, atau target bahasa..."
                              : adminSubTab === 'orders'
                                ? "Cari order deal aktif berdasarkan nama klien, whatsapp, ID, atau target bahasa..."
                                : adminSubTab === 'invoices'
                                  ? "Cari invoice berdasarkan nama klien, whatsapp, ID, atau target bahasa..."
                                  : adminSubTab === 'vendors'
                                    ? "Cari vendor berdasarkan nama, nomor WA, alamat..."
                                    : adminSubTab === 'agents'
                                      ? "Cari agen berdasarkan nama, nomor WA, email, tipe..."
                                      : "Cari kontak canvasing korporat berdasarkan nama perusahaan, nama PIC, nomor surat, atau kategori..."
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
                      ) : (adminSubTab !== 'canvasing' && adminSubTab !== 'insights' && filteredLeads.length === 0) ? (
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
                              <th className="py-3 px-4 w-[24%]">Klien / Tanggal Masuk</th>
                              <th className="py-3 px-4 w-[20%]">Evaluasi Bahasa & AI</th>
                              <th className="py-3 px-4 w-[18%]">Perkiraan Biaya</th>
                              <th className="py-3 px-4 text-right w-[38%]">Aksi Dokumen & Hubungi</th>
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
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-800 text-xs">{lead.customerName}</span>
                                    {lead.isDealed ? (
                                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8.5px] rounded font-extrabold uppercase tracking-wide">Dealed</span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[8.5px] rounded font-bold">Leads</span>
                                    )}
                                  </div>
                                  <span className="block text-[10px] font-mono font-bold text-slate-500">{lead.customerWhatsapp}</span>
                                  <span className="block text-[10px] text-slate-400 font-medium font-mono">
                                    {new Date(lead.createdAt).toLocaleDateString('id-ID')} - {new Date(lead.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {(() => {
                                    const matchedAgent = agents.find(a => a.id === lead.agentId);
                                    if (matchedAgent) {
                                      return (
                                        <div className="mt-1">
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-750 text-[9px] font-extrabold rounded border border-purple-200 uppercase tracking-wider">
                                            <UserCheck className="w-2.5 h-2.5 text-purple-650" />
                                            Agen: {matchedAgent.nama}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
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
                                    Rp {(lead.dealFinalPrice ?? lead.grandTotalCost ?? lead.totalTranslationCost ?? 0).toLocaleString('id-ID')}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1 flex-wrap">
                                    {/* Penawaran & Invoice Generator Actions */}
                                    <button
                                      type="button"
                                      onClick={() => setQuotationModalLead(lead)}
                                      className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded border border-indigo-200 transition-all text-[9.5px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-xs"
                                      title="Lihat & Cetak Surat Penawaran Resmi (Quotation)"
                                    >
                                      <FileText className="w-2.5 h-2.5" />
                                      <span>Penawaran</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setInvoiceModalLead(lead)}
                                      className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded border border-emerald-200 transition-all text-[9.5px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-xs"
                                      title="Lihat & Cetak Surat Faktur Tagihan (Invoice)"
                                    >
                                      <Receipt className="w-2.5 h-2.5" />
                                      <span>Invoice</span>
                                    </button>

                                    {/* Status Transition buttons */}
                                    {lead.isDealed ? (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkasPaid(lead, true)}
                                        className="p-1 px-1.5 bg-amber-100 hover:bg-emerald-650 text-amber-950 hover:text-white rounded border border-amber-300 transition-all font-bold text-[9.5px] flex items-center space-x-0.5 cursor-pointer"
                                        title="Konfirmasi pembayaran lunas diterima, geser ke Manajemen Order"
                                      >
                                        <CheckCircle className="w-2.5 h-2.5" />
                                        <span>Tandai Lunas</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleDeal(lead, true)}
                                        className="p-1 px-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-800 hover:text-white rounded border border-slate-300 hover:border-indigo-600 transition-all font-semibold text-[9.5px] flex items-center space-x-0.5 cursor-pointer"
                                        title="Tandai Klien Menyetujui Order (Deal)"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Deal</span>
                                      </button>
                                    )}
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Halo Kak ${lead.customerName}, kami dari AMPM Sworn Translator ingin menindaklajuti form permohonan penerjemah Kakak dengan kode estimasi ${lead.id}.\n\nTotal perkiraan biaya adalah Rp ${lead.grandTotalCost?.toLocaleString('id-ID')} untuk terjemahan ke ${lead.targetLanguage}.\n\nApakah sudah sesuai untuk kami buatkan Surat Penawaran Biaya resmi? Terima kasih.`;
                                        window.open(`https://wa.me/${lead.customerWhatsapp.replace(/[^0-9]/g, '')}/?text=${encodeURIComponent(text)}`, '_blank', 'noreferrer');
                                      }}
                                      className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-150 transition-all cursor-pointer"
                                      title="Hubungi Prospek CRM"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => deleteLead(lead.id)}
                                      className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded transition-all cursor-pointer"
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
                      ) : adminSubTab === 'orders' ? (
                        /* TAB 2: ACTIVE DEALS & ORDERS WORKSPACE - 11 COLUMNS ORDER MANAGEMENT */
                        <table className="w-full text-left border-collapse min-w-[1400px]">
                          <thead>
                            <tr className="bg-slate-50 tracking-wider text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                              <th className="py-3 px-4 text-left whitespace-nowrap">ORDER DATE</th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">ORDER DESCRIPTION</th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">CLIENT</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap font-bold text-purple-650">B2B REFERRAL AGEN</th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">No TLP</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap">INVOICE</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap font-bold text-indigo-650">VENDOR (TRANSLATOR)</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap font-bold text-indigo-650">PROCESS STATE</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap">NUMBER OF PAGES</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap">LANGUAGE DIRECTIONS</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap font-bold text-indigo-650">DEADLINE</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap">STATUS</th>
                              <th className="py-3 px-4 text-right whitespace-nowrap">AKSI</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-650 bg-white">
                            {filteredLeads.map((lead) => {
                              const daysRemaining = lead.dealDeadline ? Math.max(0, Math.ceil((new Date(lead.dealDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                              return (
                                <tr 
                                  key={lead.id} 
                                  className={`hover:bg-slate-50/55 transition-all cursor-pointer ${
                                    selectedAdminLead?.id === lead.id ? 'bg-indigo-50/20' : ''
                                  }`}
                                  onClick={() => setSelectedAdminLead(lead)}
                                >
                                  {/* 1. ORDER DATE */}
                                  <td className="py-4 px-4 font-mono text-[11px] text-slate-550 whitespace-nowrap">
                                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                  </td>

                                  {/* 2. ORDER DESCRIPTION */}
                                  <td className="py-4 px-4 text-left max-w-[200px]" title={lead.fileName}>
                                    <div className="flex flex-col space-y-0.5">
                                      <span className="font-extrabold text-slate-800 text-[11.5px] truncate">
                                        {lead.translationType === 'sworn' ? '🔑 Sworn (Tersumpah)' : '📄 Reguler (Biasa)'}
                                      </span>
                                      <span className="text-[10px] text-slate-450 font-medium truncate">
                                        {lead.fileName || 'Tanpa File'}
                                      </span>
                                    </div>
                                  </td>

                                  {/* 3. CLIENT */}
                                  <td className="py-4 px-4 font-bold text-slate-900 text-[11.5px] whitespace-nowrap">
                                    {lead.customerName}
                                  </td>

                                  {/* 3b. B2B REFERRAL AGEN */}
                                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <select
                                      value={lead.agentId || ''}
                                      onChange={async (e) => {
                                        const val = e.target.value ? Number(e.target.value) : null;
                                        try {
                                          await fetch(`/api/leads/${lead.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ agentId: val })
                                          });
                                          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, agentId: val } : l));
                                        } catch (err) {
                                          console.error('Error updating lead agent:', err);
                                        }
                                      }}
                                      className="px-1.5 py-1 bg-purple-50 hover:bg-white border border-purple-200 focus:border-purple-500 rounded text-[11px] font-bold text-purple-950 focus:bg-white focus:ring-1 focus:ring-purple-500 outline-none transition-all cursor-pointer text-center w-[130px] shadow-3xs"
                                    >
                                      <option value="">— Retail Standar —</option>
                                      {agents.map(a => (
                                        <option key={a.id} value={a.id}>{a.nama} ({a.diskonPersen}%)</option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* 4. No TLP */}
                                  <td className="py-4 px-4 text-left font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                                    <a
                                      href={`https://wa.me/${lead.customerWhatsapp.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      referrerPolicy="no-referrer"
                                      className="inline-flex items-center gap-1.5 text-slate-650 hover:text-emerald-700 font-bold bg-slate-50 hover:bg-emerald-50/50 px-2.5 py-1 rounded border border-slate-200 transition-all shadow-xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>{lead.customerWhatsapp}</span>
                                    </a>
                                  </td>

                                  {/* 5. INVOICE */}
                                  <td className="py-4 px-4 text-center font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="font-bold text-slate-500 text-[10.5px]">
                                        AMP-INV-{lead.id.split('-')[1] || lead.id.substring(5, 9).toUpperCase()}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setInvoiceModalLead(lead)}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-55 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded border border-emerald-200 hover:border-emerald-600 transition-all text-[9px] font-extrabold cursor-pointer shadow-xs"
                                        title="Generate & Lihat Invoice Resmi"
                                      >
                                        <Receipt className="w-2.5 h-2.5" />
                                        <span>Cetak Invoice</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* 6. VENDOR */}
                                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1 items-center">
                                      <select
                                        value={lead.vendor || ''}
                                        onChange={async (e) => {
                                          const val = e.target.value;
                                          try {
                                            await fetch(`/api/leads/${lead.id}`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ vendor: val })
                                            });
                                            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, vendor: val } : l));
                                          } catch (err) {
                                            console.error('Error updating vendor:', err);
                                          }
                                        }}
                                        className="px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 focus:bg-white focus:border-indigo-500 w-[125px] text-center shadow-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                      >
                                        <option value="">— Pilih Vendor —</option>
                                        {vendors.map(v => (
                                          <option key={v.id} value={v.nama}>{v.nama}</option>
                                        ))}
                                        {lead.vendor && !vendors.some(v => v.nama === lead.vendor) && (
                                          <option value={lead.vendor}>{lead.vendor}</option>
                                        )}
                                      </select>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const matched = vendors.find(v => v.nama === lead.vendor);
                                          setSelectedWorkOrderVendorId(matched?.id || '');
                                          setWorkOrderCustomNote('');
                                          setFixOrderModalLead(lead);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-[9.5px] font-bold rounded-md border border-rose-200 transition-all cursor-pointer shadow-3xs"
                                        title="Buat Surat Perintah Kerja (Fix Order/Work Order) Tanpa Harga Customer"
                                      >
                                        <FileCheck className="w-2.5 h-2.5" />
                                        <span>Fix Order</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* 7. PROCESS */}
                                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      defaultValue={lead.process || ''}
                                      placeholder="🔍 Tahap Proses..."
                                      onBlur={async (e) => {
                                        const val = e.target.value;
                                        if (val !== (lead.process || '')) {
                                          try {
                                            await fetch(`/api/leads/${lead.id}`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ process: val })
                                            });
                                            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, process: val } : l));
                                          } catch (err) {
                                            console.error('Error updating process:', err);
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                      className="px-2 py-1 bg-slate-50/50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 w-[120px] text-center shadow-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                  </td>

                                  {/* 8. NUMBER OF PAGES */}
                                  <td className="py-4 px-4 text-center font-mono text-[11.5px] font-bold text-slate-700 whitespace-nowrap">
                                    {lead.calculatedStandardPages || 1} Halaman
                                  </td>

                                  {/* 9. LANGUAGE DIRECTIONS */}
                                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50/50 rounded border border-indigo-100/60 text-[10px] font-bold text-indigo-950 whitespace-nowrap">
                                      <span>{lead.sourceLanguage}</span>
                                      <span className="text-indigo-400 text-[11px] font-black mx-0.5">➔</span>
                                      <span>{lead.targetLanguage}</span>
                                    </div>
                                  </td>

                                  {/* 10. DEADLINE */}
                                  <td className="py-4 px-4 text-center font-sans" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="date"
                                        value={lead.dealDeadline || ''}
                                        onChange={async (e) => {
                                          const val = e.target.value;
                                          try {
                                            await fetch(`/api/leads/${lead.id}`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ dealDeadline: val })
                                            });
                                            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, dealDeadline: val } : l));
                                          } catch (err) {
                                            console.error('Error updating deadline:', err);
                                          }
                                        }}
                                        className="px-2 py-0.5 bg-slate-50/50 border border-slate-200 rounded text-[10.5px] font-bold text-slate-700 focus:bg-white focus:border-indigo-500 w-[120px] text-center shadow-xs cursor-pointer focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      />
                                      {lead.dealDeadline && (
                                        <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase tracking-wide leading-none ${
                                          daysRemaining > 0 
                                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                            : 'bg-red-100 text-red-800 border border-red-200'
                                        }`}>
                                          {daysRemaining > 0 ? `${daysRemaining} Hari` : 'Lewat'}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* 11. STATUS */}
                                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
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

                                  {/* INTERACTIVE ACTIONS */}
                                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setQuotationModalLead(lead)}
                                        className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded border border-indigo-200 hover:border-indigo-600 transition-all text-[9.5px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-xs"
                                        title="Lihat & Cetak Surat Penawaran Resmi"
                                      >
                                        <FileText className="w-2.5 h-2.5" />
                                        <span>Penawaran</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDealEditLead(lead);
                                          setDealDeadlineInput(lead.dealDeadline || '');
                                          setDealStatusInput(lead.dealStatus || 'Dalam Antrean');
                                          setDealPriceInput(lead.dealFinalPrice || lead.grandTotalCost);
                                          setDealNotesInput(lead.orderNotes || ''); 
                                          setDealInvoiceItems(lead.invoiceItems || [{ id: 'trans-' + Date.now(), nama: 'Paket Dokumen ' + (lead.translationType === 'sworn' ? 'Kategori Sworn' : 'Kategori Reguler'), harga: lead.dealFinalPrice || lead.grandTotalCost, qty: 1 }]);
                                        }}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-slate-700 hover:text-slate-950 transition shadow-xs cursor-pointer"
                                        title="Ubah Rincian Deadline, Pembayaran, dan Catatan Internal"
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleDeal(lead, false)}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-150 cursor-pointer shadow-xs"
                                        title="Kembalikan status menjadi Prospek CRM"
                                      >
                                        <ArrowLeftRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : adminSubTab === 'invoices' ? (
                        /* TAB 4: COMPREHENSIVE INVOICE & TAX MANAGEMENT PANEL */
                        <div className="p-5 space-y-6 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                Manajemen Invoice & Keuangan Penagihan Profesional
                              </h3>
                              <p className="text-[11px] text-slate-450 mt-1 font-sans">
                                Atur template invoice, kalkulasi pajak (PPN) & diskon khusus, unduh kwitansi A4 PDF, serta ekspor pembukuan keuangan ke CSV secara real-time.
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const invoiceLeads = filteredLeads.filter(l => l.isDealed || l.isPaid);
                                  let csvContent = "data:text/csv;charset=utf-8,";
                                  csvContent += "ID INVOICE,TANGGAL,NAMA KLIEN,NO WHATSAPP,ARAH BAHASA,HALAMAN,SUBTOTAL,DISKON (%),PAJAK (%),TOTAL AKHIR,STATUS\n";
                                  
                                  invoiceLeads.forEach(lead => {
                                    const subtotal = lead.invoiceItems && lead.invoiceItems.length > 0
                                      ? lead.invoiceItems.reduce((acc: number, item: any) => acc + ((item.harga || 0) * (item.qty || 1)), 0)
                                      : (lead.dealFinalPrice ?? lead.grandTotalCost ?? lead.totalTranslationCost ?? 0);
                                    const disc = (subtotal * invoiceDiscountRate) / 100;
                                    const tax = ((subtotal - disc) * invoiceTaxRate) / 100;
                                    const total = subtotal - disc + tax;
                                    const status = lead.isPaid ? "LUNAS" : "MENUNGGU PEMBAYARAN";
                                    
                                    csvContent += `"${lead.id}","${new Date(lead.createdAt).toLocaleDateString('id-ID')}","${lead.customerName}","${lead.customerWhatsapp}","Indonesia - ${lead.targetLanguage}","${lead.calculatedStandardPages || 1}","${subtotal}","${invoiceDiscountRate}","${invoiceTaxRate}","${total}","${status}"\n`;
                                  });
                                  
                                  const encodedUri = encodeURI(csvContent);
                                  const link = document.createElement("a");
                                  link.setAttribute("href", encodedUri);
                                  link.setAttribute("download", `Laporan_Invoice_AMPM_${new Date().toISOString().slice(0, 10)}.csv`);
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Ekspor Data (CSV)</span>
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Financial Analytics (Statistics Cards) */}
                          {(() => {
                            const invoiceLeads = leads.filter(l => l.isDealed || l.isPaid);
                            const paidLeads = invoiceLeads.filter(l => l.isPaid);
                            const unpaidLeads = invoiceLeads.filter(l => !l.isPaid);

                            const calculateSum = (list: typeof leads) => {
                              return list.reduce((sum, lead) => {
                                const sub = lead.invoiceItems && lead.invoiceItems.length > 0
                                  ? lead.invoiceItems.reduce((acc: number, item: any) => acc + ((item.harga || 0) * (item.qty || 1)), 0)
                                  : (lead.dealFinalPrice ?? lead.grandTotalCost ?? lead.totalTranslationCost ?? 0);
                                const disc = (sub * invoiceDiscountRate) / 100;
                                const tax = ((sub - disc) * invoiceTaxRate) / 100;
                                return sum + (sub - disc + tax);
                              }, 0);
                            };

                            const totalRevenue = calculateSum(invoiceLeads);
                            const totalPaid = calculateSum(paidLeads);
                            const totalUnpaid = calculateSum(unpaidLeads);

                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 relative overflow-hidden text-left">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Nilai Tagihan</span>
                                  <span className="block text-lg font-black text-slate-800 font-mono mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</span>
                                  <span className="block text-[9.5px] text-slate-450 mt-1">{invoiceLeads.length} berkas invoice diterbitkan</span>
                                  <div className="absolute right-3 bottom-3 p-1.5 bg-slate-200/50 text-slate-500 rounded-lg">
                                    <Receipt className="w-4 h-4" />
                                  </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-150 relative overflow-hidden text-left">
                                  <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Sudah Terbayar</span>
                                  <span className="block text-lg font-black text-emerald-700 font-mono mt-1">Rp {totalPaid.toLocaleString('id-ID')}</span>
                                  <span className="block text-[9.5px] text-emerald-600 mt-1">{paidLeads.length} berkas lunas terkonfirmasi</span>
                                  <div className="absolute right-3 bottom-3 p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-150 relative overflow-hidden text-left">
                                  <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">Total Piutang Berjalan</span>
                                  <span className="block text-lg font-black text-amber-700 font-mono mt-1">Rp {totalUnpaid.toLocaleString('id-ID')}</span>
                                  <span className="block text-[9.5px] text-amber-600 mt-1">{unpaidLeads.length} berkas menunggu pelunasan</span>
                                  <div className="absolute right-3 bottom-3 p-1.5 bg-amber-100 text-amber-655 rounded-lg">
                                    <HelpCircle className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Template Settings & Customizer Block */}
                          <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Settings className="w-3.5 h-3.5 text-indigo-600" />
                              Konfigurasi Invoice Customizer & Global Tax
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Pilih Template Estetika</label>
                                <select
                                  value={selectedInvoiceTemplate}
                                  onChange={(e) => setSelectedInvoiceTemplate(e.target.value as any)}
                                  className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                                >
                                  <option value="emerald">💚 Emerald Professional (Standard)</option>
                                  <option value="slate">🖤 Midnight Slate (Modern Minimalist)</option>
                                  <option value="royal">💙 Royal Cobalt (Enterprise Premium)</option>
                                  <option value="minimal">❤️ Minimal Crimson (Editorial Style)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Tarif PPN / Pajak (%)</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={invoiceTaxRate}
                                    onChange={(e) => setInvoiceTaxRate(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 pr-8 border border-slate-250 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                                  />
                                  <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Diskon Global (%)</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={invoiceDiscountRate}
                                    onChange={(e) => setInvoiceDiscountRate(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 pr-8 border border-slate-250 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                                  />
                                  <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Catatan & Ketentuan Pembayaran Khusus (Terms & Bank Info)</label>
                                <button
                                  type="button"
                                  onClick={() => setInvoiceCustomNote('')}
                                  className="text-[9px] font-bold text-slate-400 hover:text-rose-600 transition"
                                >
                                  Reset ke Default
                                </button>
                              </div>
                              <textarea
                                value={invoiceCustomNote}
                                onChange={(e) => setInvoiceCustomNote(e.target.value)}
                                placeholder="Tulis instruksi rekening bank, terms, tenggat waktu denda keterlambatan dsb. Jika dikosongkan, instruksi PT AMPM standar akan digunakan."
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans leading-relaxed"
                              />
                            </div>
                          </div>

                          {/* Invoice Management Table */}
                          <div className="overflow-x-auto bg-white rounded-3xl">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100 tracking-wider">
                                  <th className="py-3 px-4 text-left">INVOICE ID / DATE</th>
                                  <th className="py-3 px-4 text-left">CLIENT DETAILS</th>
                                  <th className="py-3 px-4 text-left">DESCRIPTION & PAGES</th>
                                  <th className="py-3 px-4 text-right">SUBTOTAL</th>
                                  <th className="py-3 px-4 text-right">GRAND TOTAL</th>
                                  <th className="py-3 px-4 text-center">STATUS</th>
                                  <th className="py-3 px-4 text-right">AKSI KEUANGAN</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs text-slate-650">
                                {(() => {
                                  const list = filteredLeads.filter(l => l.isDealed || l.isPaid);
                                  if (list.length === 0) {
                                    return (
                                      <tr>
                                        <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                                          Tidak ada invoice yang sesuai pencarian atau kategori ini.
                                        </td>
                                      </tr>
                                    );
                                  }
                                  return list.map((lead) => {
                                    const subtotal = lead.invoiceItems && lead.invoiceItems.length > 0
                                      ? lead.invoiceItems.reduce((acc: number, item: any) => acc + ((item.harga || 0) * (item.qty || 1)), 0)
                                      : (lead.dealFinalPrice ?? lead.grandTotalCost ?? lead.totalTranslationCost ?? 0);
                                    
                                    const disc = (subtotal * invoiceDiscountRate) / 100;
                                    const tax = ((subtotal - disc) * invoiceTaxRate) / 100;
                                    const total = subtotal - disc + tax;

                                    // WA Reminder Link Helper
                                    const waMsg = `Halo Bapak/Ibu *${lead.customerName}*,\n\nKami mengirimkan lembaran tagihan resmi (Official Invoice) terkait proyek jasa penerjemahan berkas Anda dengan nomor permohonan *AMP-INV-${new Date().getFullYear()}-${lead.id.toUpperCase()}*.\n\n*Rincian Pembayaran:* \n- Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n- PPN (${invoiceTaxRate}%): Rp ${tax.toLocaleString('id-ID')}\n- Diskon: Rp ${disc.toLocaleString('id-ID')}\n-----------------------------\n*Total Tagihan Bersih: Rp ${total.toLocaleString('id-ID')}*\n\nStatus saat ini: *${lead.isPaid ? 'SUDAH LUNAS' : 'MENUNGGU PELUNASAN'}*\n\nMohon transfer ke rekening PT AMPM Sworn Translator Jasa:\n- BCA: 224-101-4444\n- Mandiri: 124-000-999-5252\n\nSilakan kirimkan bukti pembayaran kesini ya. Terima kasih!`;

                                    return (
                                      <tr key={lead.id} className="hover:bg-slate-50/30 transition-all">
                                        <td className="py-3.5 px-4 block text-left">
                                          <span className="block font-mono font-bold text-slate-800">#AMP-{lead.id.toUpperCase()}</span>
                                          <span className="block text-[10px] text-slate-400 mt-0.5">{new Date(lead.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-left">
                                          <span className="block font-bold text-slate-800">{lead.customerName}</span>
                                          <span className="block text-[10px] text-slate-450 font-mono mt-0.5">{lead.customerWhatsapp}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-left">
                                          <span className="block text-slate-700 truncate max-w-[200px]">{lead.fileName || "Berkas Terjemahan"}</span>
                                          <span className="block text-[10px] text-slate-400 mt-0.5">{lead.calculatedStandardPages || 1} Halaman • Indonesia to <span className="uppercase text-indigo-600 font-bold">{lead.targetLanguage}</span></span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-550">
                                          Rp {subtotal.toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-800">
                                          Rp {total.toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleMarkasPaid(lead, !lead.isPaid)}
                                            className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold border transition-all cursor-pointer ${
                                              lead.isPaid 
                                                ? 'bg-emerald-50 border-emerald-350 text-emerald-800' 
                                                : 'bg-rose-50 border-rose-350 text-rose-800 animate-pulse'
                                            }`}
                                            title="Ubah Status Pembayaran"
                                          >
                                            {lead.isPaid ? '✓ LUNAS' : '● MENUNGGU'}
                                          </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const matched = vendors.find(v => v.nama === lead.vendor);
                                                setSelectedWorkOrderVendorId(matched?.id || '');
                                                setWorkOrderCustomNote('');
                                                setFixOrderModalLead(lead);
                                              }}
                                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg border border-rose-250 transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                                              title="Pratinjau & Kirim Fix Order Penerjemah"
                                            >
                                              <FileCheck className="w-3.5 h-3.5" />
                                              <span className="text-[10px] font-bold">Fix Order</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setInvoiceModalLead(lead)}
                                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 hover:text-slate-950 rounded-lg border border-slate-250 transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                                              title="Pratinjau & Cetak Invoice PDF"
                                            >
                                              <Receipt className="w-3.5 h-3.5" />
                                              <span className="text-[10px] font-bold">Cetak A4</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => window.open(`https://wa.me/${lead.customerWhatsapp.replace(/[^0-9]/g, '')}/?text=${encodeURIComponent(waMsg)}`, '_blank', 'noreferrer')}
                                              className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-250 transition-all cursor-pointer shadow-xs"
                                              title="Kirim Link Tagihan & Reminder Lunas via WA"
                                            >
                                              <MessageSquare className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : adminSubTab === 'canvasing' ? (
                        /* TAB 3: B2B CANVASSING DIRECT SALES & PARTNERS DATABASE */
                        <div className="p-5 space-y-5">
                          {/* Header and Statistics summary */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 text-left">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                                <Building className="w-4 h-4 text-blue-600" />
                                Direktori Kontak Canvasing & Kemitraan Korporasi (B2B)
                              </h3>
                              <p className="text-[11px] text-slate-450 mt-1 font-sans">
                                Kelola direktori perusahaan target, lacak nomor surat penawaran keluar, serta percepat konversi prospek B2B via WhatsApp & Email satu-klik.
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                // Toggle form and prefill a brand new unique nomorSurat on-demand
                                const nextNum = canvasingContacts.length + 1;
                                const formattedNum = `${String(nextNum).padStart(3, '0')}/AMPM/SP/V/2026`;
                                setCanvasingNomorSuratInput(formattedNum);
                                setIsAddingCanvasing(!isAddingCanvasing);
                              }}
                              className="self-start sm:self-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAddingCanvasing ? 'Tutup Form' : 'Tambah Kontak Baru'}</span>
                            </button>
                          </div>

                          {/* Collapsible Form for Adding New Corporate Target */}
                          {isAddingCanvasing && (
                            <motion.form 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onSubmit={addCanvasingContact}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-left shadow-sm"
                            >
                              <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Perusahaan *</label>
                                <input
                                  type="text"
                                  required
                                  value={canvasingNamaPerusahaanInput}
                                  onChange={(e) => setCanvasingNamaPerusahaanInput(e.target.value)}
                                  placeholder="Contoh: PT Nusantara Energy Prima"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama PIC (Optional)</label>
                                <input
                                  type="text"
                                  value={canvasingNamaPicInput}
                                  onChange={(e) => setCanvasingNamaPicInput(e.target.value)}
                                  placeholder="Contoh: Bpk. Hermawan"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">No. Handphone / WhatsApp *</label>
                                <input
                                  type="text"
                                  required
                                  value={canvasingNoTelpInput}
                                  onChange={(e) => setCanvasingNoTelpInput(e.target.value)}
                                  placeholder="Contoh: +628123456789"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Email Perusahaan</label>
                                <input
                                  type="email"
                                  value={canvasingNoEmailInput}
                                  onChange={(e) => setCanvasingNoEmailInput(e.target.value)}
                                  placeholder="Contoh: procurement@perusahaan.com"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Kategori Perusahaan</label>
                                  <button
                                    type="button"
                                    onClick={() => setIsCreatingCompanyCategoryInstantly(!isCreatingCompanyCategoryInstantly)}
                                    className="text-[9.5px] font-bold text-blue-600 hover:underline cursor-pointer"
                                  >
                                    {isCreatingCompanyCategoryInstantly ? 'Pilih List' : '+ Buat Instan'}
                                  </button>
                                </div>
                                {isCreatingCompanyCategoryInstantly ? (
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      placeholder="Nama Kategori..."
                                      value={instantCompanyCategoryInput}
                                      onChange={(e) => setInstantCompanyCategoryInput(e.target.value)}
                                      className="flex-1 px-2 py-1 rounded-lg border border-blue-300 bg-white text-xs focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!instantCompanyCategoryInput.trim()) return;
                                        const currentCats = sheetsConfig?.kategoriPerusahaan || ["Teknologi & IT", "Hukum & Advokasi", "Migas & Pertambangan", "Keuangan & Perbankan", "Manufaktur & Pabrik", "Farmasi & Medis", "Pariwisata & Hotel", "Lain-lain"];
                                        if (!currentCats.includes(instantCompanyCategoryInput.trim())) {
                                          const updatedCats = [...currentCats, instantCompanyCategoryInput.trim()];
                                          const updatedConfig = { ...sheetsConfig, googleSpreadsheetId: sheetsConfig?.googleSpreadsheetId || '', googleDirectSyncEnabled: !!sheetsConfig?.googleDirectSyncEnabled, kategoriPerusahaan: updatedCats };
                                          await saveUpdatedAppConfig(updatedConfig);
                                        }
                                        setCanvasingKategoriInput(instantCompanyCategoryInput.trim());
                                        setInstantCompanyCategoryInput('');
                                        setIsCreatingCompanyCategoryInstantly(false);
                                      }}
                                      className="px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                                    >
                                      Ok
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={canvasingKategoriInput}
                                    onChange={(e) => setCanvasingKategoriInput(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  >
                                    {(sheetsConfig?.kategoriPerusahaan || ["Teknologi & IT", "Hukum & Advokasi", "Migas & Pertambangan", "Keuangan & Perbankan", "Manufaktur & Pabrik", "Farmasi & Medis", "Pariwisata & Hotel", "Lain-lain"]).map((catName: string) => (
                                      <option key={catName} value={catName}>🏢 {catName}</option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Nomor Surat Penawaran</label>
                                <input
                                  type="text"
                                  value={canvasingNomorSuratInput}
                                  onChange={(e) => setCanvasingNomorSuratInput(e.target.value)}
                                  placeholder="Contoh: 016/AMPM/SP/V/2026"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1 col-span-1 md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Deskripsi Proposal / Perihal Surat</label>
                                <input
                                  type="text"
                                  value={canvasingSuratPenawaranInput}
                                  onChange={(e) => setCanvasingSuratPenawaranInput(e.target.value)}
                                  placeholder="Contoh: Penawaran Retainer Khusus Terjemahan Kontrak Kerja Sama & Dokumen Audit"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Respon Awal</label>
                                <select
                                  value={canvasingResponInput}
                                  onChange={(e) => setCanvasingResponInput(e.target.value as any)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                >
                                  <option value="Tidak Respon">⚪ Tidak Respon</option>
                                  <option value="Follow Up">🟡 Follow Up</option>
                                  <option value="Closing">🟢 Closing</option>
                                </select>
                              </div>

                              <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-200 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setIsAddingCanvasing(false)}
                                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-1.5 bg-blue-650 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                                >
                                  Simpan Target Canvasing
                                </button>
                              </div>
                            </motion.form>
                          )}

                          {/* Target Database Info Panels */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                            <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-slate-450 leading-tight">Total Perusahaan</span>
                              <span className="text-sm font-bold text-slate-805 tracking-tight mt-1 inline-block">
                                {canvasingContacts.length} <span className="text-[10px] font-semibold text-slate-500">Corporate</span>
                              </span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-emerald-800/80 leading-tight">Prospek Closing</span>
                              <span className="text-sm font-bold text-emerald-805 tracking-tight mt-1 inline-block">
                                {canvasingContacts.filter(c => c.respon === 'Closing').length} <span className="text-[10px] font-semibold text-emerald-700">Dealed</span>
                              </span>
                            </div>
                            <div className="bg-amber-50 border border-amber-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-amber-800/80 leading-tight">Follow Up</span>
                              <span className="text-sm font-bold text-amber-805 tracking-tight mt-1 inline-block">
                                {canvasingContacts.filter(c => c.respon === 'Follow Up').length} <span className="text-[10px] font-semibold text-amber-700">Kontak</span>
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-slate-450 leading-tight">Tidak Ada Respon</span>
                              <span className="text-sm font-bold text-slate-605 tracking-tight mt-1 inline-block">
                                {canvasingContacts.filter(c => c.respon === 'Tidak Respon').length} <span className="text-[10px] font-semibold text-slate-500">Kontak</span>
                              </span>
                            </div>
                          </div>

                          {/* Canvasing Table representation */}
                          <div className="overflow-x-auto bg-white rounded-3xl">
                            {filteredCanvasing.length === 0 ? (
                              <div className="h-48 flex flex-col items-center justify-center space-y-1.5 p-6 text-slate-500 text-center">
                                <Building className="w-7 h-7 text-slate-305" />
                                <p className="text-xs font-semibold text-slate-700">Tidak ada kontak canvasing B2B ditemukan</p>
                                <p className="text-[10.5px] text-slate-400">Gunakan kolom cari diatas atau klik "+ Tambah Kontak Baru"</p>
                              </div>
                            ) : (
                              <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-mono text-slate-500 leading-tight">
                                    <th className="py-2.5 px-3 w-[5%] text-center">No</th>
                                    <th className="py-2.5 px-3 w-[15%]">Nomor Surat</th>
                                    <th className="py-2.5 px-3 w-[22%]">Perusahaan & PIC</th>
                                    <th className="py-2.5 px-3 w-[18%]">Kategori & Kontak</th>
                                    <th className="py-2.5 px-3 w-[23%]">Isi Surat Penawaran</th>
                                    <th className="py-2.5 px-3 w-[17%] text-right">Aksi & Respon</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                  {filteredCanvasing.map((contact, index) => {
                                    // Pre-fill text Whatsapp
                                    const textWA = `Halo Bapak/Ibu ${contact.namaPic || 'Direktur Perusahaan'} di ${contact.namaPerusahaan},\n\nKami dari AMPM Sworn Translator Specialist ingin menindaklanjuti Penawaran Resmi kami ${contact.nomorSurat} perihal: "${contact.suratPenawaran}".\n\nApakah ada kebutuhan penerjemahan dokumen tersumpah resmi demi kebutuhan audit, bisnis ekspor-impor, atau legalisasi kedutaan dalam waktu dekat?\n\nKami siap memberikan penawaran harga kemitraan korporasi terbaik. Terima kasih.`;
                                    
                                    // Prefill Email
                                    const emailSubject = `Penawaran Resmi Jasa Penerjemah Sworn Resmi - AMPM Sworn Translator (${contact.nomorSurat})`;
                                    const emailBody = `Yth. Bapak/Ibu ${contact.namaPic || 'Direktur Perusahaan'} di tempat,\n\nDengan hormat,\nBersama surat ini kami mengirimkan proposal Penawaran Resmi (${contact.nomorSurat}) perihal "${contact.suratPenawaran}" dari PT AMPM Sworn Translator.\n\nKami siap melayani kebutuhan alih bahasa tersumpah (Dokumen Notaris, Akta, Laporan Pajak/Audit) maupun legalisasi Kemenlu/Kemenkumham & Kedutaan asing untuk perusahaan Bapak/Ibu.\n\nApabila memerlukan informasi lebih lanjut, silakan hubungi kami di WhatsApp ini.\n\nHormat kami,\nLayanan Pelanggan AMPM Sworn Translator`;
                                    
                                    const mailtoUrl = `mailto:${contact.noEmail || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

                                    return (
                                      <tr key={contact.id} className="hover:bg-slate-50/50 transition duration-150">
                                        {/* No */}
                                        <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                                          {index + 1}
                                        </td>

                                        {/* Surat Number */}
                                        <td className="py-3 px-3 font-mono font-bold text-slate-600 text-[10px] text-left">
                                          {contact.nomorSurat}
                                        </td>

                                        {/* Company & PIC */}
                                        <td className="py-3 px-3 text-left space-y-0.5">
                                          <div className="font-bold text-slate-805 truncate" title={contact.namaPerusahaan}>
                                            {contact.namaPerusahaan}
                                          </div>
                                          {contact.namaPic && (
                                            <div className="text-[10px] text-slate-550 font-semibold flex items-center gap-1">
                                              <User className="w-2.5 h-2.5 text-blue-500" />
                                              <span>PIC: {contact.namaPic}</span>
                                            </div>
                                          )}
                                        </td>

                                        {/* Category & Phone */}
                                        <td className="py-3 px-3 text-left space-y-1 text-[10.5px]">
                                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-705 border border-slate-200 rounded text-[9.5px] font-extrabold uppercase scale-95 origin-left">
                                            {contact.kategoriPerusahaan}
                                          </span>
                                          <div className="font-mono text-slate-505 select-all" title={contact.noTelp}>
                                            {contact.noTelp}
                                          </div>
                                          {contact.noEmail && (
                                            <div className="text-slate-400 truncate text-[9.5px] font-semibold" title={contact.noEmail}>
                                              {contact.noEmail}
                                            </div>
                                          )}
                                        </td>

                                        {/* Quotation text */}
                                        <td className="py-3 px-3 text-left text-slate-505 leading-normal text-[10.5px] italic font-sans break-words pr-4">
                                          {contact.suratPenawaran}
                                        </td>

                                        {/* Actions / Buttons / Status */}
                                        <td className="py-3 px-3 text-right space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                          {/* Inline Status Dropdown selection */}
                                          <div className="flex justify-end">
                                            <select
                                              value={contact.respon}
                                              onChange={(e) => updateCanvasingRespon(contact.id, e.target.value as any)}
                                              className={`px-1.5 py-1 rounded-md text-[9.5px] font-bold focus:outline-none border shadow-xs cursor-pointer text-center ${
                                                contact.respon === 'Closing' 
                                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                                                  : contact.respon === 'Follow Up'
                                                    ? 'bg-amber-100 border-amber-305 text-amber-900' 
                                                    : 'bg-slate-100 border-slate-300 text-slate-700'
                                              }`}
                                            >
                                              <option value="Tidak Respon">⚪ Tidak Respon</option>
                                              <option value="Follow Up">🟡 Follow Up</option>
                                              <option value="Closing">🟢 Closing</option>
                                            </select>
                                          </div>

                                          {/* Direct follow-up messaging triggers */}
                                          <div className="flex items-center justify-end gap-1 flex-wrap">
                                            <button
                                              type="button"
                                              onClick={() => window.open(`https://wa.me/${contact.noTelp.replace(/[^0-9]/g, '')}/?text=${encodeURIComponent(textWA)}`, '_blank', 'noreferrer')}
                                              className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded border border-emerald-250 transition-all text-[9.5px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-xs"
                                              title="Kirim Surat Penawaran Resmi via WhatsApp"
                                            >
                                              <MessageSquare className="w-2.5 h-2.5" />
                                              <span>WA</span>
                                            </button>

                                            {contact.noEmail ? (
                                              <a
                                                href={mailtoUrl}
                                                className="p-1 px-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded border border-blue-250 transition-all text-[9.5px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-xs"
                                                title="Kirim Penawaran via Email"
                                              >
                                                <Send className="w-2.5 h-2.5" />
                                                <span>Email</span>
                                              </a>
                                            ) : (
                                              <button
                                                type="button"
                                                disabled
                                                className="p-1 px-1.5 bg-slate-50 text-slate-300 rounded border border-slate-200 text-[9.5px] font-bold flex items-center space-x-0.5 cursor-not-allowed"
                                                title="Email tidak dikonfigurasi"
                                              >
                                                <Send className="w-2.5 h-2.5" />
                                                <span>Email</span>
                                              </button>
                                            )}

                                            <button
                                              type="button"
                                              onClick={() => deleteCanvasingContact(contact.id)}
                                              className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded transition-all cursor-pointer"
                                              title="Hapus Kontak Target"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
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
                      ) : adminSubTab === 'vendors' ? (
                        /* TAB 5: COMPREHENSIVE VENDOR MANAGEMENT */
                        <div className="p-5 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 text-left">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                                <Users className="w-4 h-4 text-rose-600" />
                                Manajemen Basis Data Vendor & Pricelist Mitra
                              </h3>
                              <p className="text-[11px] text-slate-450 mt-1 font-sans">
                                Daftarkan vendor tepercaya Anda lengkap dengan alamat fisik, kontak darurat WhatsApp, serta daftar penawaran harga pengerjaan (pricelist) unik mereka.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingVendor(null);
                                setVendorNamaInput('');
                                setVendorAlamatInput('');
                                setVendorNoWaInput('');
                                setVendorPricelistInput([]);
                                setIsAddingVendor(!isAddingVendor);
                              }}
                              className="self-start sm:self-center bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAddingVendor ? 'Tutup Form' : 'Tambah Vendor Baru'}</span>
                            </button>
                          </div>

                          {/* Add / Edit Vendor Form */}
                          {isAddingVendor && (
                            <form onSubmit={handleAddVendor} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4 text-left animate-fade-in">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {editingVendor ? '📋 Ubah Detail Vendor' : '✨ Daftarkan Vendor Baru'}
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Nama Lengkap Vendor *</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Budi Santoso, S.S. (Penerjemah Inggris)"
                                    value={vendorNamaInput}
                                    onChange={(e) => setVendorNamaInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:border-rose-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all text-slate-805"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Kontak WhatsApp Vendor *</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: 08123456789 atau 628123456789"
                                    value={vendorNoWaInput}
                                    onChange={(e) => setVendorNoWaInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:border-rose-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all text-slate-805"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Alamat Fisik / Domisili</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Jl. Diponegoro No. 12, Jakarta Pusat"
                                    value={vendorAlamatInput}
                                    onChange={(e) => setVendorAlamatInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:border-rose-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all text-slate-805"
                                  />
                                </div>
                              </div>

                              {/* Pricelist Management inside form */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200/85 space-y-3">
                                <h5 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                  <Coins className="w-3.5 h-3.5 text-rose-500" />
                                  Pricelist Tarif Jasa Vendor
                                </h5>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                  <div className="space-y-1">
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nama Layanan / Target Bahasa</label>
                                    <input
                                      type="text"
                                      placeholder="Contoh: Inggris - Indonesia (Sumpah)"
                                      value={newProdNamaInput}
                                      onChange={(e) => setNewProdNamaInput(e.target.value)}
                                      className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Harga per Lembar / Kata (Rp)</label>
                                    <input
                                      type="number"
                                      placeholder="Contoh: 75000"
                                      value={newProdHargaInput || ''}
                                      onChange={(e) => setNewProdHargaInput(Number(e.target.value))}
                                      className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none text-slate-800"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={addPricelistItem}
                                    className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah Tarif</span>
                                  </button>
                                </div>

                                {/* Pricelist Items List inside form */}
                                {vendorPricelistInput.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">Belum ada item pricelist yang ditambahkan untuk vendor ini.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {vendorPricelistInput.map((item) => (
                                      <div key={item.id} className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full text-xs font-semibold text-rose-850">
                                        <span>{item.namaProduk}: <strong className="font-mono text-rose-700">Rp {item.hargaVendor.toLocaleString('id-ID')}</strong></span>
                                        <button
                                          type="button"
                                          onClick={() => removePricelistItem(item.id)}
                                          className="text-rose-500 hover:text-rose-700 focus:outline-none cursor-pointer"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingVendor(false);
                                    setEditingVendor(null);
                                  }}
                                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-750 rounded-xl cursor-pointer shadow-md flex items-center gap-1"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>{editingVendor ? 'Simpan Perubahan' : 'Simpan Vendor'}</span>
                                </button>
                              </div>
                            </form>
                          )}

                          {/* Vendors List representation */}
                          <div className="overflow-x-auto bg-white rounded-3xl">
                            {filteredVendors.length === 0 ? (
                              <div className="h-48 flex flex-col items-center justify-center space-y-1.5 p-6 text-slate-500 text-center">
                                <Users className="w-7 h-7 text-slate-305" />
                                <p className="text-xs font-semibold text-slate-700">Tidak ada vendor ditemukan</p>
                                <p className="text-[10.5px] text-slate-400">Gunakan kolom cari diatas atau klik "+ Tambah Vendor Baru"</p>
                              </div>
                            ) : (
                              <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-mono text-slate-500 leading-tight">
                                    <th className="py-2.5 px-3 w-[5%] text-center">No</th>
                                    <th className="py-2.5 px-3 w-[25%]">Detail Vendor / Alamat</th>
                                    <th className="py-2.5 px-3 w-[15%]">Kontak WA</th>
                                    <th className="py-2.5 px-3 w-[43%]">Pricelist Jasa Layanan Vendor</th>
                                    <th className="py-2.5 px-3 w-[12%] text-right">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                  {filteredVendors.map((vendor, index) => {
                                    const waNumber = vendor.noWa.replace(/[^0-9]/g, '');
                                    const textWA = `Halo Rekan ${vendor.nama},\n\nApakah sedang luang untuk menerima pesanan penerjemahan baru dari PT AMPM Sworn Translator?\n\nKami akan mengirimkan detail order sesaat lagi. Terima kasih!`;
                                    
                                    return (
                                      <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                                          {index + 1}
                                        </td>
                                        <td className="py-3 px-3 text-left space-y-1">
                                          <div className="font-bold text-slate-800">{vendor.nama}</div>
                                          {vendor.alamat && (
                                            <div className="text-[10px] text-slate-450 leading-relaxed flex items-start gap-1">
                                              <span className="text-[11px] leading-none shrink-0">📍</span>
                                              <span className="break-words select-all">{vendor.alamat}</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-left">
                                          <div className="font-mono font-bold text-slate-700">{vendor.noWa}</div>
                                          <button
                                            type="button"
                                            onClick={() => window.open(`https://wa.me/${waNumber}/?text=${encodeURIComponent(textWA)}`, '_blank', 'noreferrer')}
                                            className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-250 cursor-pointer shadow-2xs"
                                          >
                                            <MessageSquare className="w-2.5 h-2.5" />
                                            <span>WhatsApp</span>
                                          </button>
                                        </td>
                                        <td className="py-3 px-3 text-left">
                                          {vendor.pricelist && vendor.pricelist.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
                                              {vendor.pricelist.map((prod) => (
                                                <div key={prod.id} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                                                  <span className="text-slate-600 font-medium truncate" title={prod.namaProduk}>{prod.namaProduk}</span>
                                                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-1 py-0.5 rounded ml-1">Rp {prod.hargaVendor.toLocaleString('id-ID')}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 italic text-[10px]">Belum diatur</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleEditVendorClick(vendor)}
                                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-150 rounded transition-all cursor-pointer shadow-2xs"
                                              title="Ubah Detail Vendor"
                                            >
                                              <Settings className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteVendor(vendor.id)}
                                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded transition-all cursor-pointer shadow-2xs"
                                              title="Hapus Vendor"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
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
                      ) : (
                        /* TAB 6: COMPREHENSIVE B2B AGENT MANAGEMENT */
                        <div className="p-5 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 text-left">
                            <div>
                              <h3 className="text-sm font-bold text-slate-805 flex items-center gap-1.5 font-sans">
                                <UserCheck className="w-4 h-4 text-purple-600" />
                                Manajemen Agen B2B & Kemitraan (Diskon Khusus)
                              </h3>
                              <p className="text-[11px] text-slate-450 mt-1 font-sans">
                                Kelola data agen personal maupun perusahaan yang membawa klien untuk AMPM. Atur persentase harga khusus/diskon agen, dan pantau total pesanan yang mereka bawa.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingAgent(null);
                                setAgentNamaInput('');
                                setAgentTipeInput('personal');
                                setAgentNoWaInput('');
                                setAgentEmailInput('');
                                setAgentDiskonPersenInput(0);
                                setIsAddingAgent(!isAddingAgent);
                              }}
                              className="self-start sm:self-center bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAddingAgent ? 'Tutup Form' : 'Tambah Agen Baru'}</span>
                            </button>
                          </div>

                          {/* Add / Edit Agent Form */}
                          {isAddingAgent && (
                            <form onSubmit={handleAddAgent} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4 text-left animate-fade-in">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {editingAgent ? '📋 Detail Agen' : '✨ Daftarkan Agen Baru'}
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Nama Agen / Perusahaan *</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Surya Jaya Mulia"
                                    value={agentNamaInput}
                                    onChange={(e) => setAgentNamaInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:border-purple-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-slate-805"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Tipe Agen *</label>
                                  <select
                                    value={agentTipeInput}
                                    onChange={(e) => setAgentTipeInput(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:border-purple-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-slate-805 cursor-pointer"
                                    required
                                  >
                                    <option value="personal">Personal</option>
                                    <option value="perusahaan">Perusahaan / B2B Klien</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Kontak WhatsApp *</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: 08123456789"
                                    value={agentNoWaInput}
                                    onChange={(e) => setAgentNoWaInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:border-purple-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-slate-805"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Email (Optional)</label>
                                  <input
                                    type="email"
                                    placeholder="Contoh: agent@gloria.com"
                                    value={agentEmailInput}
                                    onChange={(e) => setAgentEmailInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-205 focus:border-purple-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-slate-805"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Diskon Khusus (%) *</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="15"
                                      value={agentDiskonPersenInput || ''}
                                      onChange={(e) => setAgentDiskonPersenInput(Number(e.target.value))}
                                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-205 focus:border-purple-505 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-slate-805"
                                      required
                                    />
                                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400 font-mono">%</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                  type="submit"
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  {editingAgent ? 'Simpan Perubahan' : 'Daftarkan Agen'}
                                </button>
                              </div>
                            </form>
                          )}

                          {/* Stat summary cards for agents */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                            <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-slate-450 leading-tight">Total Agen Terdaftar</span>
                              <span className="text-sm font-bold text-slate-605 tracking-tight mt-1 inline-block">
                                {agents.length} <span className="text-[10px] font-semibold text-slate-500">Agen</span>
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-slate-450 leading-tight">Agen Perusahaan / B2B</span>
                              <span className="text-sm font-bold text-slate-605 tracking-tight mt-1 inline-block">
                                {agents.filter(a => a.tipe === 'perusahaan').length} <span className="text-[10px] font-semibold text-slate-500">Korporat</span>
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-slate-450 leading-tight">Agen Personal</span>
                              <span className="text-sm font-bold text-slate-605 tracking-tight mt-1 inline-block">
                                {agents.filter(a => a.tipe === 'personal').length} <span className="text-[10px] font-semibold text-slate-500">Mitra</span>
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg">
                              <span className="block text-[10px] uppercase font-mono text-slate-450 leading-tight">Total Order via Agen</span>
                              <span className="text-sm font-bold text-slate-605 tracking-tight mt-1 inline-block">
                                {leads.filter(l => l.agentId).length} <span className="text-[10px] font-semibold text-slate-500">Order</span>
                              </span>
                            </div>
                          </div>

                          {/* Agents Table representation */}
                          <div className="overflow-x-auto bg-white rounded-3xl">
                            {filteredAgents.length === 0 ? (
                              <div className="h-48 flex flex-col items-center justify-center space-y-1.5 p-6 text-slate-505 text-center">
                                <UserCheck className="w-7 h-7 text-slate-305" />
                                <p className="text-xs font-semibold text-slate-700">Tidak ada data agen ditemukan</p>
                                <p className="text-[10.5px] text-slate-400">Gunakan kolom cari diatas atau klik "+ Tambah Agen Baru"</p>
                              </div>
                            ) : (
                              <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase font-mono text-slate-500 leading-tight">
                                    <th className="py-2.5 px-3 w-[10%] text-center">ID Agen</th>
                                    <th className="py-2.5 px-3 w-[25%]">Nama Agen / B2B Klien</th>
                                    <th className="py-2.5 px-3 w-[15%]">Tipe Kemitraan</th>
                                    <th className="py-2.5 px-3 w-[20%] font-mono uppercase">Kontak & Email</th>
                                    <th className="py-2.5 px-3 w-[12%] text-center">Diskon khusus</th>
                                    <th className="py-2.5 px-3 w-[10%] text-center">Order Bawaan</th>
                                    <th className="py-2.5 px-3 w-[10%] text-right">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                  {filteredAgents.map((agent) => {
                                    const agentOrders = leads.filter(l => l.agentId === agent.id);
                                    const totalRevenue = agentOrders.filter(o => o.isPaid).reduce((sum, o) => sum + (o.dealFinalPrice ?? o.grandTotalCost ?? 0), 0);

                                    return (
                                      <tr key={agent.id} className="hover:bg-slate-50/50 transition duration-150">
                                        <td className="py-3 px-3 text-center text-slate-500 font-mono font-bold text-[10.5px]">
                                          {agent.id}
                                        </td>
                                        <td className="py-3 px-3 text-left font-bold text-slate-800">
                                          {agent.nama}
                                        </td>
                                        <td className="py-3 px-3 text-left">
                                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase ${
                                            agent.tipe === 'perusahaan'
                                              ? 'bg-purple-105 text-purple-800 border border-purple-200'
                                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                          }`}>
                                            {agent.tipe === 'perusahaan' ? '🏢 Perusahaan' : '👤 Personal'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-left space-y-0.5 font-sans">
                                          <div className="font-mono text-slate-600 font-semibold">{agent.noWa}</div>
                                          {agent.email && (
                                            <div className="text-[10px] text-slate-400 font-medium truncate" title={agent.email}>{agent.email}</div>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 font-mono font-bold text-[11px]">
                                            <Percent className="w-3 h-3 text-amber-600" />
                                            {agent.diskonPersen}%
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center space-y-0.5">
                                          <div className="font-mono font-bold text-slate-700">{agentOrders.length} Pesanan</div>
                                          {totalRevenue > 0 && (
                                            <div className="text-[9.5px] text-emerald-600 font-bold font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</div>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleEditAgentClick(agent)}
                                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-150 rounded transition-all cursor-pointer shadow-2xs"
                                              title="Ubah Detail Agen"
                                            >
                                              <Settings className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteAgent(agent.id)}
                                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded transition-all cursor-pointer shadow-2xs"
                                              title="Hapus Agen"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-650">
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

                        <div className="space-y-2 bg-purple-50/50 p-3 rounded-lg border border-purple-150/80">
                          <h5 className="font-bold text-purple-750 uppercase tracking-wide text-[10px] flex items-center justify-between">
                            <span>Kemitraan B2B Agen</span>
                            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                          </h5>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Pilih Agen Referensi</label>
                            <select
                              value={selectedAdminLead.agentId || ''}
                              onChange={async (e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                try {
                                  await fetch(`/api/leads/${selectedAdminLead.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ agentId: val })
                                  });
                                  
                                  const updatedLead = { ...selectedAdminLead, agentId: val };
                                  setSelectedAdminLead(updatedLead);
                                  setLeads(prev => prev.map(l => l.id === selectedAdminLead.id ? updatedLead : l));
                                } catch (err) {
                                  console.error('Error updating lead agent:', err);
                                }
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-205 focus:border-purple-505 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-slate-805 cursor-pointer"
                            >
                              <option value="">— Retail Standar —</option>
                              {agents.map(a => (
                                <option key={a.id} value={a.id}>{a.nama}</option>
                              ))}
                            </select>
                          </div>
                          {(() => {
                            const matchedAgent = agents.find(a => a.id === selectedAdminLead.agentId);
                            if (matchedAgent) {
                              const discountAmount = Math.round(selectedAdminLead.grandTotalCost * (matchedAgent.diskonPersen / 100));
                              const specialPrice = selectedAdminLead.grandTotalCost - discountAmount;
                              return (
                                <div className="pt-2 border-t border-purple-200 text-[11px] space-y-1 text-slate-700">
                                  <p><b>Nama Agen:</b> {matchedAgent.nama}</p>
                                  <p><b>Tipe:</b> <span className="uppercase font-extrabold text-[9px] px-1 py-0.2 bg-purple-100 text-purple-800 rounded">{matchedAgent.tipe}</span></p>
                                  <p><b>Diskon Agen:</b> {matchedAgent.diskonPersen}%</p>
                                  <div className="font-bold text-purple-705 bg-purple-100/50 p-1.5 rounded border border-purple-200 mt-1">
                                    <div className="flex justify-between">
                                      <span>Harga Khusus:</span>
                                      <span className="font-mono text-purple-900">Rp {specialPrice.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="text-[9px] text-purple-600 font-medium">Potongan Rp {discountAmount.toLocaleString('id-ID')}</div>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <p className="text-[10px] text-slate-400 italic">Pesanan ini tidak dikaitkan dengan agen manapun (harga retail standar).</p>
                            );
                          })()}
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
                    onChange={(e) => setDealPriceInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-205 text-slate-705 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <p className="text-[9px] text-slate-400">Sesuaikan nominal deal akhir setelah potongan/diskon khusus klien.</p>
                </div>

                {/* Customizable Invoice Items Section */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-205 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                      Rincian Item Invoice / Tagihan
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingProductInstantly(!isAddingProductInstantly)}
                      className="text-[9.5px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      {isAddingProductInstantly ? 'Tutup Form' : '+ Buat Produk Instan'}
                    </button>
                  </div>

                  {/* Inline New Product Instantly Form */}
                  {isAddingProductInstantly && (
                    <div className="bg-white rounded-lg p-2.5 border border-indigo-150 space-y-2 text-[11px]">
                      <span className="block font-bold text-indigo-900 uppercase text-[9px] tracking-wide">📦 Buat Produk Baru Instan</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2 space-y-0.5">
                          <label className="text-[9px] font-semibold text-slate-505 uppercase">Nama Produk</label>
                          <input
                            type="text"
                            placeholder="Contoh: Jasa Legalisasi Kemenkumham"
                            value={instantProductInputName}
                            onChange={(e) => setInstantProductInputName(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-250 bg-slate-50 rounded text-xs focus:outline-none"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-semibold text-slate-505 uppercase">Harga Satuan (Rp)</label>
                          <input
                            type="number"
                            placeholder="75000"
                            value={instantProductInputPrice}
                            onChange={(e) => setInstantProductInputPrice(Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-250 bg-slate-50 rounded text-xs focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-semibold text-slate-505 uppercase">Kategori</label>
                            <button
                              type="button"
                              onClick={() => setIsAddingProductCategoryInstantly(!isAddingProductCategoryInstantly)}
                              className="text-[8px] font-bold text-indigo-600 hover:underline"
                            >
                              {isAddingProductCategoryInstantly ? 'Batal' : '+ Kategori'}
                            </button>
                          </div>
                          
                          {isAddingProductCategoryInstantly ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Nama Kategori..."
                                value={instantProductCategoryName}
                                onChange={(e) => setInstantProductCategoryName(e.target.value)}
                                className="flex-1 px-1.5 py-0.5 border border-blue-250 bg-white rounded text-[11px] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!instantProductCategoryName.trim()) return;
                                  const currentCats = sheetsConfig?.kategoriProduk || [
                                    { id: "cat-1", nama: "Sworn Translation" },
                                    { id: "cat-2", nama: "Non-Sworn Translation" },
                                    { id: "cat-3", nama: "Legalisasi & Apostille" }
                                  ];
                                  const newId = 'cat-' + Date.now();
                                  const updatedCats = [...currentCats, { id: newId, nama: instantProductCategoryName.trim() }];
                                  const updatedConfig = { 
                                    ...sheetsConfig, 
                                    googleSpreadsheetId: sheetsConfig?.googleSpreadsheetId || '', 
                                    googleDirectSyncEnabled: !!sheetsConfig?.googleDirectSyncEnabled,
                                    kategoriProduk: updatedCats 
                                  };
                                  await saveUpdatedAppConfig(updatedConfig);
                                  setInstantProductInputCatId(newId);
                                  setInstantProductCategoryName('');
                                  setIsAddingProductCategoryInstantly(false);
                                }}
                                className="px-1.5 bg-indigo-600 text-white rounded text-[9px] font-bold"
                              >
                                Ok
                              </button>
                            </div>
                          ) : (
                            <select
                              value={instantProductInputCatId}
                              onChange={(e) => setInstantProductInputCatId(e.target.value)}
                              className="w-full px-1.5 py-1 border border-slate-250 bg-slate-50 rounded text-xs focus:outline-none"
                            >
                              <option value="">-- Kategori --</option>
                              {(sheetsConfig?.kategoriProduk || [
                                { id: "cat-1", nama: "Sworn Translation" },
                                { id: "cat-2", nama: "Non-Sworn Translation" },
                                { id: "cat-3", nama: "Legalisasi & Apostille" }
                              ]).map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.nama}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsAddingProductInstantly(false)}
                          className="px-2 py-1 text-slate-500 rounded text-[10px] font-bold hover:bg-slate-100"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!instantProductInputName.trim()) {
                              alert('Nama produk wajib diisi.');
                              return;
                            }
                            const currentProds = sheetsConfig?.produk || [
                              { id: "prod-1", nama: "Sworn Inggris-Indonesia (Reguler)", harga: 75000, kategoriId: "cat-1" },
                              { id: "prod-2", nama: "Sworn Inggris-Indonesia (Non-Reguler)", harga: 90000, kategoriId: "cat-1" }
                            ];
                            const newProdId = 'prod-' + Date.now();
                            const newProd = {
                              id: newProdId,
                              nama: instantProductInputName.trim(),
                              harga: Number(instantProductInputPrice) || 0,
                              kategoriId: instantProductInputCatId || "cat-1"
                            };
                            const updatedProds = [...currentProds, newProd];
                            const updatedConfig = {
                              ...sheetsConfig,
                              googleSpreadsheetId: sheetsConfig?.googleSpreadsheetId || '',
                              googleDirectSyncEnabled: !!sheetsConfig?.googleDirectSyncEnabled,
                              produk: updatedProds
                            };
                            await saveUpdatedAppConfig(updatedConfig);

                            // Automatically add this newly created product to invoice items!
                            const updatedItems = [...dealInvoiceItems, { id: 'item-' + Date.now(), nama: newProd.nama, harga: newProd.harga, qty: 1 }];
                            setDealInvoiceItems(updatedItems);
                            const newTotal = updatedItems.reduce((acc, c) => acc + (c.harga * c.qty), 0);
                            setDealPriceInput(newTotal);

                            // Reset state
                            setInstantProductInputName('');
                            setInstantProductInputPrice(0);
                            setInstantProductInputCatId('');
                            setIsAddingProductInstantly(false);
                            alert(`Produk "${newProd.nama}" sukses dibuat dan ditambahkan ke Invoice!`);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold shadow-sm"
                        >
                          Simpan & Tambah
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of current Active Invoice Items in the editor */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {dealInvoiceItems.map((item, index) => (
                      <div key={item.id || index} className="flex flex-col gap-1.5 p-2 bg-white rounded-lg border border-slate-205">
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-0.5">
                            <select
                              className="w-full px-1.5 py-0.5 border border-slate-250 bg-slate-50 rounded text-[10.5px] font-semibold text-slate-805"
                              value={sheetsConfig?.produk?.find((p: any) => p.nama === item.nama)?.id || ''}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const prodObj = sheetsConfig?.produk?.find((p: any) => p.id === selectedId);
                                if (prodObj) {
                                  const updated = [...dealInvoiceItems];
                                  updated[index] = { ...updated[index], nama: prodObj.nama, harga: prodObj.harga };
                                  setDealInvoiceItems(updated);
                                  const newPrices = updated.reduce((sum, it) => sum + (it.harga * it.qty), 0);
                                  setDealPriceInput(newPrices);
                                }
                              }}
                            >
                              <option value="">-- Pilih Templat Produk --</option>
                              {(sheetsConfig?.produk || [
                                { id: "prod-1", nama: "Sworn Inggris-Indonesia (Reguler)", harga: 75000 },
                                { id: "prod-2", nama: "Sworn Inggris-Indonesia (Non-Reguler)", harga: 90000 }
                              ]).map((p: any) => (
                                <option key={p.id} value={p.id}>{p.nama} (Rp {p.harga.toLocaleString()})</option>
                              ))}
                            </select>
                            
                            <input
                              type="text"
                              value={item.nama}
                              onChange={(e) => {
                                const updated = [...dealInvoiceItems];
                                updated[index] = { ...updated[index], nama: e.target.value };
                                setDealInvoiceItems(updated);
                              }}
                              placeholder="Nama Item (Kustom)"
                              className="w-full px-2 py-0.5 border border-slate-205 rounded text-xs focus:outline-none"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const updated = dealInvoiceItems.filter((_, idx) => idx !== index);
                              setDealInvoiceItems(updated);
                              const newPrices = updated.reduce((sum, it) => sum + (it.harga * it.qty), 0);
                              setDealPriceInput(newPrices);
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 rounded p-1 h-fit self-center cursor-pointer border border-rose-105"
                            title="Hapus Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1 flex gap-1 items-center">
                            <span className="text-[10px] text-slate-500 font-mono">Harga (Rp):</span>
                            <input
                              type="number"
                              value={item.harga}
                              onChange={(e) => {
                                const updated = [...dealInvoiceItems];
                                updated[index] = { ...updated[index], harga: Number(e.target.value) || 0 };
                                setDealInvoiceItems(updated);
                                const newPrices = updated.reduce((sum, it) => sum + (it.harga * it.qty), 0);
                                setDealPriceInput(newPrices);
                              }}
                              className="w-full px-1.5 py-0.5 border border-slate-205 rounded text-xs select-all font-semibold font-mono"
                            />
                          </div>
                          
                          <div className="w-20 flex gap-1 items-center">
                            <span className="text-[10px] text-slate-505 font-mono">Qty:</span>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                const updated = [...dealInvoiceItems];
                                updated[index] = { ...updated[index], qty: Number(e.target.value) || 1 };
                                setDealInvoiceItems(updated);
                                const newPrices = updated.reduce((sum, it) => sum + (it.harga * it.qty), 0);
                                setDealPriceInput(newPrices);
                              }}
                              className="w-full px-1.5 py-0.5 border border-slate-205 rounded text-xs font-semibold font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...dealInvoiceItems, { id: 'item-' + Date.now(), nama: 'Item Kustom Baru', harga: 50000, qty: 1 }];
                        setDealInvoiceItems(updated);
                        const newPrices = updated.reduce((sum, it) => sum + (it.harga * it.qty), 0);
                        setDealPriceInput(newPrices);
                      }}
                      className="text-[10.5px] px-2.5 py-1 border border-slate-300 hover:bg-slate-100 font-bold rounded-lg text-slate-700 transition"
                    >
                      + Tambah Item Kustom
                    </button>
                  </div>
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
                    <div className="flex items-start gap-4">
                      <img 
                        src="https://i.ibb.co.com/TDq2jCcc/Logo-AMPMTranslator.webp" 
                        alt="Logo AMPM" 
                        referrerPolicy="no-referrer"
                        className="h-14 w-auto object-contain rounded-lg border border-slate-100 shadow-xs shrink-0"
                      />
                      <div className="space-y-1">
                        <span className="block text-sm font-black text-slate-900 tracking-tight font-display font-sans uppercase">AMPM Translator & Apostille</span>
                        <div className="text-[9.5px] text-slate-500 font-medium leading-relaxed max-w-sm">
                          <p className="font-bold text-slate-800">PT Mega Akses Antarbangsa</p>
                          <p>AXA Tower 45th Floor</p>
                          <p>Jl. Prof. Dr. Satrio Kav. 18</p>
                          <p>Kuningan, Setiabudi, Jakarta 12940</p>
                          <p className="mt-0.5">Telp/WA: +62 822-4040-4545 | hello@ampmtranslator.com</p>
                        </div>
                      </div>
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
                      {quotationModalLead.invoiceItems && quotationModalLead.invoiceItems.length > 0 ? (
                        quotationModalLead.invoiceItems.map((item: any, idx: number) => (
                          <tr key={item.id || idx}>
                            <td className="py-3 px-3">
                              <span className="block font-bold text-slate-805">{item.nama}</span>
                              <span className="block text-[8.5px] text-slate-400 font-mono">Item #{idx + 1}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-semibold text-slate-600">{item.qty || 1} Pcs</td>
                            <td className="py-3 px-3 text-right font-mono">Rp {(item.harga || 0).toLocaleString('id-ID')}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-805">
                              Rp {((item.harga || 0) * (item.qty || 1)).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <>
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
                        </>
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
                    <span className="block text-[10px] text-slate-400 mt-1 font-medium">Direktur Utama - AMPM Translator & Apostille</span>

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
        {invoiceModalLead && (() => {
          const styles = {
            emerald: {
              primaryBg: 'bg-emerald-600',
              hoverBg: 'hover:bg-emerald-700',
              primaryBorder: 'border-emerald-600',
              primaryText: 'text-emerald-700',
              primaryTextDark: 'text-emerald-950',
              tableHeaderBg: 'bg-emerald-50/50 border-emerald-100',
              brandBadge: 'bg-emerald-100 text-emerald-800',
              iconBg: 'bg-emerald-600',
              stampBorder: 'border-emerald-500/20',
              stampText: 'text-emerald-600 border-emerald-550',
              statusBadge: 'text-emerald-800 border-emerald-300 bg-emerald-50'
            },
            slate: {
              primaryBg: 'bg-slate-800',
              hoverBg: 'hover:bg-slate-900',
              primaryBorder: 'border-slate-800',
              primaryText: 'text-slate-800',
              primaryTextDark: 'text-slate-900',
              tableHeaderBg: 'bg-slate-50 border-slate-200',
              brandBadge: 'bg-slate-200 text-slate-800',
              iconBg: 'bg-slate-800',
              stampBorder: 'border-slate-500/20',
              stampText: 'text-slate-800 border-slate-700',
              statusBadge: 'text-slate-800 border-slate-300 bg-slate-100'
            },
            royal: {
              primaryBg: 'bg-indigo-600',
              hoverBg: 'hover:bg-indigo-750',
              primaryBorder: 'border-indigo-600',
              primaryText: 'text-indigo-700',
              primaryTextDark: 'text-indigo-950',
              tableHeaderBg: 'bg-indigo-50/50 border-indigo-100',
              brandBadge: 'bg-indigo-100 text-indigo-800',
              iconBg: 'bg-indigo-600',
              stampBorder: 'border-indigo-500/20',
              stampText: 'text-indigo-600 border-indigo-550',
              statusBadge: 'text-indigo-800 border-indigo-300 bg-indigo-50'
            },
            minimal: {
              primaryBg: 'bg-rose-600',
              hoverBg: 'hover:bg-rose-750',
              primaryBorder: 'border-rose-600',
              primaryText: 'text-rose-700',
              primaryTextDark: 'text-rose-950',
              tableHeaderBg: 'bg-rose-50/50 border-rose-100',
              brandBadge: 'bg-rose-100 text-rose-800',
              iconBg: 'bg-rose-600',
              stampBorder: 'border-rose-500/20',
              stampText: 'text-rose-600 border-rose-550',
              statusBadge: 'text-rose-800 border-rose-300 bg-rose-50'
            }
          }[selectedInvoiceTemplate] || {
            primaryBg: 'bg-emerald-600',
            hoverBg: 'hover:bg-emerald-700',
            primaryBorder: 'border-emerald-600',
            primaryText: 'text-emerald-700',
            primaryTextDark: 'text-emerald-950',
            tableHeaderBg: 'bg-emerald-50/50 border-emerald-100',
            brandBadge: 'bg-emerald-100 text-emerald-800',
            iconBg: 'bg-emerald-600',
            stampBorder: 'border-emerald-500/20',
            stampText: 'text-emerald-600 border-emerald-550',
            statusBadge: 'text-emerald-800 border-emerald-300 bg-emerald-50'
          };

          const subtotal = invoiceModalLead.invoiceItems && invoiceModalLead.invoiceItems.length > 0
            ? invoiceModalLead.invoiceItems.reduce((acc: number, item: any) => acc + ((item.harga || 0) * (item.qty || 1)), 0)
            : (invoiceModalLead.dealFinalPrice ?? invoiceModalLead.grandTotalCost ?? invoiceModalLead.totalTranslationCost ?? 0);

          const discountAmount = (subtotal * invoiceDiscountRate) / 100;
          const taxAmount = ((subtotal - discountAmount) * invoiceTaxRate) / 100;
          const grandTotal = subtotal - discountAmount + taxAmount;

          return (
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
                    <p className="text-[10px] text-slate-455">Template Terpilih: <strong className="capitalize text-slate-700">{selectedInvoiceTemplate} Professional</strong></p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Inline Template Selection */}
                    <select
                      value={selectedInvoiceTemplate}
                      onChange={(e) => setSelectedInvoiceTemplate(e.target.value as any)}
                      className="text-xs bg-white border border-slate-250 py-1.5 px-2 rounded-lg font-bold focus:outline-none"
                    >
                      <option value="emerald">Emerald Theme (Default)</option>
                      <option value="slate">Midnight Slate Theme</option>
                      <option value="royal">Royal Cobalt Theme</option>
                      <option value="minimal">Minimal Crimson Theme</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className={`${styles.primaryBg} ${styles.hoverBg} text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition flex items-center space-x-1 cursor-pointer`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Print / Simpan PDF</span>
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
                    <div className={`flex items-start justify-between border-b-2 ${styles.primaryBorder} pb-5`}>
                      <div className="flex items-start gap-4">
                        <img 
                          src="https://i.ibb.co.com/TDq2jCcc/Logo-AMPMTranslator.webp" 
                          alt="Logo AMPM" 
                          referrerPolicy="no-referrer"
                          className="h-14 w-auto object-contain rounded-lg border border-slate-100 shadow-xs shrink-0"
                        />
                        <div className="space-y-1">
                          <span className="block text-sm font-black text-slate-900 tracking-tight font-display font-sans uppercase">AMPM Translator & Apostille</span>
                          <div className="text-[9.5px] text-slate-500 font-medium leading-relaxed max-w-sm">
                            <p className="font-bold text-slate-800">PT Mega Akses Antarbangsa</p>
                            <p>AXA Tower 45th Floor</p>
                            <p>Jl. Prof. Dr. Satrio Kav. 18</p>
                            <p>Kuningan, Setiabudi, Jakarta 12940</p>
                            <p className="mt-0.5">Telp/WA: +62 822-4040-4545 | hello@ampmtranslator.com</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <span className={`inline-flex ${styles.brandBadge} text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase mb-1`}>OFFICIAL INVOICE</span>
                        <h4 className="text-[11px] font-bold text-slate-800 font-mono">No: AMP-INV-{(new Date().getFullYear())}{(String(new Date().getMonth()+1).padStart(2, '0'))}-{invoiceModalLead.id.toUpperCase()}</h4>
                        <p className="text-[10px] text-slate-400 font-medium font-sans">Jatuh Tempo: {invoiceModalLead.dealDeadline ? new Date(invoiceModalLead.dealDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Segera'}</p>
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
                        <span className="block font-bold text-slate-900 font-sans font-sans">No. Rekening Mandiri: 124-000-999-5252</span>
                        <span className="block font-bold text-slate-900 font-sans font-sans">No. Rekening BCA: 224-101-4444</span>
                        <span className="block font-medium text-slate-650">Atas Nama: PT Mega Akses Antarbangsa</span>
                      </div>
                    </div>

                    {/* Line Separator */}
                    <p className="text-xs text-slate-600 mt-6 leading-relaxed">
                      Faktur kwitansi penagihan ini resmi dikeluarkan sebagai tagihan pelunasan terhadap proyek jasa penerjemahan berkas berikut yang telah disetujui:
                    </p>

                    {/* Financial items cost table breakdown layout */}
                    <table className="w-full text-xs text-left border-collapse mt-5">
                      <thead>
                        <tr className={`${styles.tableHeaderBg} text-[10px] font-bold ${styles.primaryTextDark} uppercase border-y`}>
                          <th className="py-2.5 px-3 w-3/5">Rincian Paket & Aktivitas Penerjemahan</th>
                          <th className="py-2.5 px-3 text-center">Halaman</th>
                          <th className="py-2.5 px-3 text-right">Harga Final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-705">
                        {invoiceModalLead.invoiceItems && invoiceModalLead.invoiceItems.length > 0 ? (
                          invoiceModalLead.invoiceItems.map((item: any, idx: number) => (
                            <tr key={item.id || idx}>
                              <td className="py-3 px-3 col-span-1">
                                <span className="block font-bold text-slate-805">{item.nama}</span>
                                <span className="block text-[8.5px] text-slate-400 font-mono">Item #{idx + 1}</span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-semibold text-slate-600">{item.qty || 1} x Rp {(item.harga || 0).toLocaleString('id-ID')}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-805">
                                Rp {((item.harga || 0) * (item.qty || 1)).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))
                        ) : (
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
                        )}

                        {/* Subtotal Row */}
                        <tr className="border-t border-slate-200">
                          <td colSpan={2} className="py-2 px-3 text-right font-bold text-slate-550 text-[10px]">SUBTOTAL:</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 text-xs">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>

                        {/* Optional Discount row */}
                        {invoiceDiscountRate > 0 && (
                          <tr className="text-emerald-700">
                            <td colSpan={2} className="py-1 px-3 text-right font-bold text-[10px]">DISKON ({invoiceDiscountRate}%):</td>
                            <td className="py-1 px-3 text-right font-mono font-bold text-xs">
                              - Rp {discountAmount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        )}

                        {/* Optional Tax row */}
                        {invoiceTaxRate > 0 && (
                          <tr className="text-slate-600">
                            <td colSpan={2} className="py-1 px-3 text-right font-bold text-[10px]">PPN ({invoiceTaxRate}%):</td>
                            <td className="py-1 px-3 text-right font-mono font-bold text-xs">
                              + Rp {taxAmount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        )}

                        {/* Grand total */}
                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                          <td colSpan={2} className="py-3.5 px-3 text-right font-bold text-slate-800 text-[11px] uppercase tracking-wider">TOTAL TAGIHAN BERSIH (NET DUE):</td>
                          <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-600 text-sm">
                            Rp {grandTotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms and conditions block clause */}
                    <div className="mt-8 space-y-1.5 text-slate-455 border-t border-slate-100 pt-5 text-[10px] leading-relaxed">
                      <span className="block font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-1">PANDUAN KONFIRMASI PEMBAYARAN:</span>
                      {invoiceCustomNote ? (
                        <div className="whitespace-pre-line text-slate-600 leading-relaxed font-sans">{invoiceCustomNote}</div>
                      ) : (
                        <ol className="list-decimal pl-3 space-y-1">
                          <li>Silakan lampirkan bukti transfer bank resmi Anda ke admin WhatsApp AMPM Hub untuk verifikasi penyelesaian berkas.</li>
                          <li>Pembayaran dianggap lunas apabila dana telah masuk efektif ke rekening korporasi PT AMPM.</li>
                          <li>Hasil akhir terjemahan legal tersumpah hardcopy dikirimkan sesegera mungkin sesudah verifikasi dana masuk.</li>
                        </ol>
                      )}
                    </div>
                  </div>

                  {/* Stamp & Authorized Signature layout block */}
                  <div className="flex items-end justify-between mt-10 pt-6">
                    <div className="text-[10px] text-slate-400 space-y-1.5">
                      <span className="block font-medium">Diterbitkan oleh PT Mega Akses Antarbangsa</span>
                      <span className={`block text-[8.5px] font-bold border rounded-md px-1.5 py-0.5 w-fit ${styles.statusBadge}`}>STATUS: {invoiceModalLead.isPaid ? 'LUNAS / TERKONFIRMASI' : 'MENUNGGU PEMBAYARAN'}</span>
                    </div>

                    {/* Stamp Seal Graphic with absolute signature layered under it */}
                    <div className="text-center relative w-44 h-32 mr-4 flex flex-col items-center justify-end select-none">
                      {/* Signed Director */}
                      <span className="block text-xs font-bold text-slate-900 border-b border-slate-300 pb-1 w-full max-w-sm">Syahrul Mauluddin</span>
                      <span className="block text-[10px] text-slate-400 mt-1 font-medium">Direktur Utama - AMPM Translator & Apostille</span>

                      {/* Paid Stamp overlay in nice green stamp circular style */}
                      {invoiceModalLead.isPaid && (
                        <div className={`absolute top-1 right-7 w-24 h-24 rounded-full border-4 ${styles.stampBorder} flex flex-col items-center justify-center rotate-12 pointer-events-none select-none`}>
                          <div className={`border ${styles.stampText} rounded-full p-2 text-center text-[8px] font-black leading-none tracking-tight`}>
                            <span className="block">PAID / LUNAS</span>
                            <span className="block font-mono text-[5px] mt-0.5">TERSELIKIDIK</span>
                            <span className="block font-mono text-[4px] mt-0.5">THANK YOU!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-150 py-6 text-center text-xs text-slate-400 font-medium">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          <p>© {new Date().getFullYear()} AMPM Sworn Translator. Seluruh hak cipta dilindungi undang-undang.</p>
          <p className="mt-0.5 text-slate-350">Dirancang secara eksklusif dengan presisi tarif retail legal Indonesia.</p>
          <div className="mt-3.5 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => navigateTo('public')}
              className="hover:text-indigo-600 transition font-bold uppercase tracking-wider text-[10px] cursor-pointer"
            >
              Kalkulator Estimasi
            </button>
            <span className="text-slate-200">•</span>
            <button
              onClick={() => navigateTo('admin')}
              className="hover:text-indigo-600 transition font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-indigo-500/85" />
              <span>Portal Admin & CRM</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 4. FIX ORDER / WORK ORDER MODAL FOR VENDORS */}
      <AnimatePresence>
        {fixOrderModalLead && (() => {
          const matchedVendor = vendors.find(v => v.id === selectedWorkOrderVendorId);
          
          // Try to automatically find matched rate/price from the vendor's pricelist
          let estimatedRate: number | null = null;
          if (matchedVendor && matchedVendor.pricelist) {
            const lowerLangs = fixOrderModalLead.targetLanguage.toLowerCase();
            const foundItem = matchedVendor.pricelist.find(p => 
              lowerLangs.includes(p.namaProduk.toLowerCase()) || 
              p.namaProduk.toLowerCase().includes(lowerLangs)
            );
            if (foundItem) {
              estimatedRate = foundItem.hargaVendor;
            }
          }

          const totalVol = fixOrderModalLead.wordCount 
            ? `${fixOrderModalLead.wordCount.toLocaleString('id-ID')} kata` 
            : `${fixOrderModalLead.calculatedStandardPages} halaman`;
            
          const deadlineText = fixOrderModalLead.dealDeadline 
            ? new Date(fixOrderModalLead.dealDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
            : 'ASAP / Segera';

          const waWorkOrderMsg = `*SURAT PERINTAH KERJA (FIX ORDER) - PT AMPM SWORN TRANSLATOR*\n\n` +
            `Yth. Rekan Vendor: *${matchedVendor ? matchedVendor.nama : fixOrderModalLead.vendor || 'Penerjemah'}*\n` +
            `Kami ingin menugaskan dokumen berikut untuk diterjemahkan:\n\n` +
            `• *ID Order*: AMP-WO-${fixOrderModalLead.id.toUpperCase().split('-')[1] || fixOrderModalLead.id.substring(5, 9).toUpperCase()}\n` +
            `• *Jenis Dokumen*: ${fixOrderModalLead.documentTypeDetected || 'Dokumen Tersumpah'}\n` +
            `• *Kombinasi Bahasa*: ${fixOrderModalLead.sourceLanguage} ➔ ${fixOrderModalLead.targetLanguage}\n` +
            `• *Estimasi Volume*: ${totalVol}\n` +
            `• *Batas Waktu (Deadline)*: ${deadlineText}\n` +
            `• *Sifat Pengerjaan*: ${fixOrderModalLead.speedTier === 'express' ? 'EXPRESS / CEPAT' : 'REGULER / STANDAR'}\n` +
            `• *Catatan Tambahan*: ${workOrderCustomNote || fixOrderModalLead.dealNotes || 'Mohon diselesaikan sesuai standar kualitas AMPM Sworn Translator.'}\n\n` +
            `*Informasi Tarif Penugasan*:\n` +
            `• *Tarif*: ${estimatedRate ? `Rp ${estimatedRate.toLocaleString('id-ID')}` : 'Tarif Ternegosiasi / Menunggu Konfirmasi'}\n\n` +
            `Mohon konfirmasi kesediaan rekan dengan membalas pesan ini. Terima kasih! 🙏`;

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden font-sans text-left border border-slate-100 flex flex-col my-8"
              >
                {/* Header */}
                <div className="bg-rose-950 text-white p-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-rose-300" />
                    <div>
                      <h4 className="text-sm font-bold font-display">Surat Perintah Kerja (Fix Order Penerjemah)</h4>
                      <p className="text-[10px] text-rose-200 font-medium">Data invoice tanpa harga customer end-user AMPM</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFixOrderModalLead(null)}
                    className="text-white hover:text-rose-100 p-1 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content body */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                  {/* Select Vendor and Rate Preview */}
                  <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-3.5">
                    <p className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">⚙️ Hubungkan & Lacak Tarif Vendor</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Penerjemah (Vendor)</label>
                        <select
                          value={selectedWorkOrderVendorId}
                          onChange={(e) => setSelectedWorkOrderVendorId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-rose-500 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all text-slate-850"
                        >
                          <option value="">— Pilih Vendor Terdaftar —</option>
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.nama}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tarif Terdeteksi Otomatis</label>
                        <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 flex items-center justify-between">
                          <span>{estimatedRate ? `Rp ${estimatedRate.toLocaleString('id-ID')}` : 'Tidak Terdeteksi'}</span>
                          {estimatedRate && <span className="text-[9px] bg-emerald-100 text-emerald-800 font-sans px-1.5 py-0.5 rounded uppercase">Cocok</span>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan untuk Vendor</label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Mohon gunakan glosarium hukum AMPM. Sumpah DKI Jakarta wajib stampel basah..."
                        value={workOrderCustomNote}
                        onChange={(e) => setWorkOrderCustomNote(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-rose-500 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all text-slate-855"
                      />
                    </div>
                  </div>

                  {/* Document details box */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                      <span>AMP-WO-{fixOrderModalLead.id.toUpperCase().split('-')[1] || fixOrderModalLead.id.substring(5, 9).toUpperCase()}</span>
                      <span className="text-[10px] font-mono text-slate-505">Dibuat: {new Date().toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Target Vendor:</span>
                          <span className="block font-bold text-slate-800 text-sm mt-0.5">{matchedVendor ? matchedVendor.nama : fixOrderModalLead.vendor || 'Belum ditunjuk'}</span>
                          {matchedVendor && <span className="block text-[10px] font-mono text-slate-500">{matchedVendor.noWa}</span>}
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">BATAS WAKTU (DEADLINE):</span>
                          <span className="block font-bold text-rose-705 text-xs mt-0.5">{deadlineText}</span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">Kombinasi Bahasa:</span>
                          <span className="font-bold text-slate-900">{fixOrderModalLead.sourceLanguage} ➔ {fixOrderModalLead.targetLanguage}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">Jenis Layanan / Tipe:</span>
                          <span className="font-bold text-slate-900 uppercase text-[10.5px]">{fixOrderModalLead.translationType === 'sworn' ? 'Tersumpah (Sworn)' : 'Non-Tersumpah (Regular)'}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">Sifat Urgensi:</span>
                          <span className="font-bold text-slate-900 uppercase text-[10.5px]">{fixOrderModalLead.speedTier === 'express' ? 'Express / Cepat' : 'Regular'}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">Total Volume Dokumen:</span>
                          <span className="font-mono font-bold text-slate-900">{totalVol}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-semibold">Catatan Administrasi:</span>
                          <span className="font-medium text-slate-700 break-words max-w-[300px] text-right">{fixOrderModalLead.dealNotes || 'Tidak ada catatan admin'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview text of the job description */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pratinjau Teks Penugasan (Work Order Text)</label>
                    <div className="w-full p-3 bg-slate-55 border border-slate-200 rounded-xl text-xs font-mono text-slate-705 whitespace-pre-wrap select-all max-h-48 overflow-y-auto">
                      {waWorkOrderMsg}
                    </div>
                  </div>
                </div>

                {/* Footer action triggers */}
                <div className="bg-slate-55 p-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md uppercase font-bold tracking-wide">Penerjemah End-User</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFixOrderModalLead(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer transition-all animate-none"
                    >
                      Tutup
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(waWorkOrderMsg);
                        alert('Teks Fix Order berhasil disalin ke clipboard!');
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all flex items-center gap-1 border border-slate-250 animate-none"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Salin Teks</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetWA = matchedVendor ? matchedVendor.noWa : (fixOrderModalLead.customerWhatsapp || '');
                        const cleanWA = targetWA.replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${cleanWA}/?text=${encodeURIComponent(waWorkOrderMsg)}`, '_blank', 'noreferrer');
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md animate-none"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp ke Vendor</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
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
