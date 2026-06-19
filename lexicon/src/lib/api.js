import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 min timeout for LLM analysis
  headers: {
    'Content-Type': 'application/json',
  },
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

export default api;
