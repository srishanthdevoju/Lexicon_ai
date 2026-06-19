import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { listAllNotes, updateNote, deleteNote, createGeneralNote } from "@/lib/api";
import { 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  Calendar, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileEdit,
  X,
  Plus
} from "lucide-react";

export default function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setCreatingNote(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await createGeneralNote(newNoteContent);
      setSuccessMsg("General note created successfully.");
      setNewNoteContent("");
      setShowAddModal(false);
      fetchNotes();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to create note:", err);
      setErrorMsg("Failed to create general note.");
      setTimeout(() => setErrorMsg(""), 3000);
    } finally {
      setCreatingNote(false);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await listAllNotes();
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to load notes:", err);
      setErrorMsg("Failed to load notes. Please verify your database connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleEditStart = (note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleEditCancel = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  const handleEditSave = async (noteId) => {
    if (!editContent.trim()) return;
    try {
      await updateNote(noteId, editContent);
      setSuccessMsg("Note updated successfully.");
      setEditingNoteId(null);
      fetchNotes();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to update note:", err);
      setErrorMsg("Failed to update note.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(noteId);
      setSuccessMsg("Note deleted successfully.");
      fetchNotes();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to delete note:", err);
      setErrorMsg("Failed to delete note.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  // Filter notes by search query
  const filteredNotes = notes.filter(note => {
    const contentMatch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const docName = note.document_id ? (note.analyses?.filename || "Untitled PDF") : "General Legal Note";
    const docMatch = docName.toLowerCase().includes(searchQuery.toLowerCase());
    return contentMatch || docMatch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Central Legal Notes</h1>
            <p className="text-[13px] text-text-secondary">
              Review and manage your notes across all contract analyses.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors shadow-xs shrink-0 self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add General Note</span>
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-risk-green-light border border-risk-green/20 rounded text-[13px] text-risk-green">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-risk-red-light border border-risk-red/20 rounded text-[13px] text-risk-red">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Toolbar */}
        <div className="flex items-center gap-3 bg-white p-4 border border-border rounded shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search notes by content or document name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 bg-white border border-border rounded">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-[13px] text-text-secondary font-medium">Fetching notes...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-border rounded">
            <FileText className="w-10 h-10 text-text-muted mb-3" />
            <h3 className="font-semibold text-primary mb-1">No Notes Found</h3>
            <p className="text-[13px] text-text-secondary max-w-sm">
              {searchQuery ? "No notes matched your search criteria." : "Create notes inline while reviewing documents in the Analysis tab."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredNotes.map((note) => {
              const docName = note.document_id ? (note.analyses?.filename || "Untitled Document") : "General Legal Note";
              const isEditing = editingNoteId === note.id;

              return (
                <div 
                  key={note.id} 
                  className="bg-white border border-border rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-[12px] font-semibold text-primary truncate">
                        {docName}
                      </span>
                    </div>
                    {note.document_id && (
                      <button 
                        onClick={() => navigate(`/analysis/${note.document_id}`)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-light transition-colors shrink-0 pl-2"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="w-full p-3 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleEditCancel}
                            className="px-2.5 py-1.5 border border-border rounded text-[11px] text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={() => handleEditSave(note.id)}
                            className="px-2.5 py-1.5 bg-primary text-white rounded text-[11px] font-semibold hover:bg-primary-light transition-colors flex items-center gap-1"
                          >
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] text-text-primary whitespace-pre-line leading-relaxed">
                        {note.content}
                      </p>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3.5 bg-background/20 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      <span>{formatDate(note.created_at || note.updated_at)}</span>
                    </div>
                    
                    {!isEditing && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditStart(note)}
                          className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="hover:text-risk-red transition-colors flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for adding a general note */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-border rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-[15px] text-primary">Add General Legal Note</h3>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setNewNoteContent("");
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-text-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNote} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Note Content</label>
                  <textarea
                    required
                    placeholder="Write your general legal note here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary resize-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewNoteContent("");
                    }}
                    className="px-3 py-2 border border-border rounded text-[11px] font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={creatingNote || !newNoteContent.trim()}
                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {creatingNote ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Create Note</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
