import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 min timeout for LLM analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject User Session data from Supabase Auth
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
      config.headers['X-User-Id'] = session.user.id;
      config.headers['X-User-Role'] = session.user.user_metadata?.role || 'lawyer';
      config.headers['X-User-Name'] = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
    }
  } catch (err) {
    console.error("Auth token extraction failed", err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ─── Document Upload & Analysis ─────────────────────────────────────────────

/**
 * Upload a PDF file for analysis.
 * @param {File} file - The PDF file to upload.
 * @param {Function} onProgress - Optional progress callback (0-100).
 * @returns {Promise<Object>} FinalAnalysisResponse from backend.
 */
export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(pct);
      }
    },
  });
  return response.data;
}

/**
 * Upload multiple PDF files for analysis.
 * @param {File[]} files - The PDF files to upload.
 * @param {Function} onProgress - Optional progress callback (0-100).
 * @returns {Promise<Object[]>} Array of FinalAnalysisResponse from backend.
 */
export async function uploadMultipleDocuments(files, onProgress) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await api.post('/upload-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(pct);
      }
    },
  });
  return response.data;
}

/**
 * Analyze raw text content.
 * @param {string} content - The contract text to analyze.
 * @returns {Promise<Object>} FinalAnalysisResponse from backend.
 */
export async function analyzeText(content) {
  const response = await api.post('/analyze', {
    input_type: 'text',
    content,
  });
  return response.data;
}

// ─── Document Comparison ───────────────────────────────────────────────────

/**
 * Compare multiple analyzed documents.
 * @param {string[]} documentIds
 * @returns {Promise<Object>} Comparison results from backend.
 */
export async function compareDocuments(documentIds) {
  const response = await api.post('/compare', {
    document_ids: documentIds,
  });
  return response.data;
}

// ─── Retrieval ──────────────────────────────────────────────────────────────

/**
 * Fetch a cached analysis by document ID.
 * @param {string} documentId
 * @returns {Promise<Object>} FinalAnalysisResponse.
 */
export async function getAnalysis(documentId) {
  const response = await api.get(`/analyses/${documentId}`);
  return response.data;
}

/**
 * Fetch the raw extracted text of a document.
 * @param {string} documentId
 * @returns {Promise<string>} The extracted document text.
 */
export async function getAnalysisText(documentId) {
  const response = await api.get(`/analyses/${documentId}/text`);
  return response.data.text;
}

/**
 * List all analyses (for dashboard/history/library).
 * @param {Object} params - Optional { user_id, limit }.
 * @returns {Promise<Object>} { analyses: [...], total: number }
 */
export async function listAnalyses(params = {}) {
  const response = await api.get('/analyses', { params });
  return response.data;
}

// ─── AI Chat ────────────────────────────────────────────────────────────────

/**
 * Send a chat question about a document.
 * @param {string} documentId
 * @param {string} question
 * @returns {Promise<Object>} { answer: string, sources: string[] }
 */
export async function chatWithDocument(documentId, question) {
  const response = await api.post('/chat', {
    document_id: documentId,
    question,
  });
  return response.data;
}

// ─── Notes System ───────────────────────────────────────────────────────────

export async function getNotes(documentId) {
  const response = await api.get(`/notes/${documentId}`);
  return response.data;
}

export async function saveNote(documentId, content) {
  const response = await api.post(`/notes/${documentId}`, { content });
  return response.data;
}

export async function updateNote(noteId, content) {
  const response = await api.put(`/notes/${noteId}`, { content });
  return response.data;
}

export async function deleteNote(noteId) {
  const response = await api.delete(`/notes/${noteId}`);
  return response.data;
}

export async function listAllNotes() {
  const response = await api.get('/notes');
  return response.data;
}

// ─── Collaboration & Messaging ──────────────────────────────────────────────

export async function getMessages(documentId) {
  const response = await api.get(`/messages/${documentId}`);
  return response.data;
}

export async function sendMessage(documentId, content, senderRole, senderName) {
  const response = await api.post(`/messages/${documentId}`, {
    content,
    sender_role: senderRole,
    sender_name: senderName
  });
  return response.data;
}

export async function shareDocument(documentId, clientEmail) {
  const response = await api.post(`/share/${documentId}`, {
    client_email: clientEmail
  });
  return response.data;
}

// ─── Reports ────────────────────────────────────────────────────────────────

/**
 * Download the PDF report for a completed analysis.
 * @param {string} documentId
 */
export async function downloadReport(documentId) {
  const response = await api.get(`/report/${documentId}`, {
    responseType: 'blob',
  });
  // Trigger file download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `lexicon_analysis_${documentId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// ─── Health Check ───────────────────────────────────────────────────────────

export async function healthCheck() {
  const response = await api.get('/health');
  return response.data;
}

// ─── Auth / Profile Completion ──────────────────────────────────────────────

export async function completeProfile(name, role) {
  const response = await api.post('/auth/complete-profile', { name, role });
  return response.data;
}

// ─── Lawyers & Appointments ──────────────────────────────────────────────────

export async function getLawyers() {
  const response = await api.get('/lawyers');
  return response.data;
}

export async function getAppointments() {
  const response = await api.get('/appointments');
  return response.data;
}

export async function createAppointment(appointmentData) {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
}

export async function updateAppointment(appointmentId, status) {
  const response = await api.put(`/appointments/${appointmentId}`, { status });
  return response.data;
}

export async function shareAnalysisByEmail(documentId, recipientEmail) {
  const response = await api.post(`/share-email/${documentId}`, { recipient_email: recipientEmail });
  return response.data;
}

// ─── Contacts & Direct Messaging ────────────────────────────────────────────

/**
 * Get contacts for the current user based on appointment relationships.
 * @returns {Promise<Object[]>} Array of contact objects.
 */
export async function getContacts() {
  const response = await api.get('/contacts');
  return response.data;
}

/**
 * Get direct messages between the current user and a contact.
 * @param {string} contactId - The contact's user ID.
 * @returns {Promise<Object[]>} Array of message objects.
 */
export async function getDirectMessages(contactId) {
  const response = await api.get(`/direct-messages/${contactId}`);
  return response.data;
}

/**
 * Send a direct message to a contact.
 * @param {string} contactId - The recipient's user ID.
 * @param {string} content - The message content.
 * @returns {Promise<Object>} The created message.
 */
export async function sendDirectMessage(contactId, content) {
  const response = await api.post(`/direct-messages/${contactId}`, { content });
  return response.data;
}

// ─── Predefined Slots & Profile Phone updates ───────────────────────────────

export async function createGeneralNote(content, documentId = null) {
  const response = await api.post('/notes', { content, document_id: documentId });
  return response.data;
}

export async function updateLawyerSlots(slots) {
  const response = await api.put('/lawyers/slots', { slots });
  return response.data;
}

export async function updateProfilePhone(phone) {
  const response = await api.put('/auth/profile-phone', { phone });
  return response.data;
}

export default api;
