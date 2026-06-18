import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { 
  getMessages, 
  sendMessage, 
  shareDocument, 
  listAnalyses 
} from "@/lib/api";
import { 
  Send, 
  FileText, 
  Share2, 
  MessageSquare, 
  User, 
  Lock, 
  ArrowLeft,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  HelpCircle
} from "lucide-react";

export default function MessagingPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const [shareError, setShareError] = useState("");
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch documents list
  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await listAnalyses();
      setDocuments(data.analyses || []);
      
      // If we have a documentId in URL, set active
      if (documentId && data.analyses) {
        const found = data.analyses.find(d => d.document_id === documentId);
        if (found) setActiveDoc(found);
      }
    } catch (err) {
      console.error("Failed to load documents for messaging:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Fetch messages for active document
  const fetchMessages = async (docId) => {
    if (!docId) return;
    setLoadingMessages(true);
    try {
      const data = await getMessages(docId);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [documentId]);

  useEffect(() => {
    if (activeDoc) {
      fetchMessages(activeDoc.document_id);
    } else {
      setMessages([]);
    }
  }, [activeDoc]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Periodic polling for new messages (simulates real-time)
  useEffect(() => {
    if (!activeDoc) return;
    const interval = setInterval(() => {
      getMessages(activeDoc.document_id).then(data => {
        if (data && data.length !== messages.length) {
          setMessages(data);
        }
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeDoc, messages.length]);

  const handleSelectDoc = (doc) => {
    setActiveDoc(doc);
    navigate(`/messages/${doc.document_id}`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeDoc) return;

    const senderName = user?.user_metadata?.name || user?.email?.split('@')[0] || "User";
    const tempText = newMessage;
    setNewMessage("");

    try {
      await sendMessage(activeDoc.document_id, tempText, userRole, senderName);
      // Refresh messages
      const updated = await getMessages(activeDoc.document_id);
      setMessages(updated);
    } catch (err) {
      console.error("Failed to send message:", err);
      setNewMessage(tempText); // Restore input on error
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim() || !activeDoc) return;
    
    setSharing(true);
    setShareSuccess("");
    setShareError("");
    
    try {
      await shareDocument(activeDoc.document_id, shareEmail);
      setShareSuccess(`Document shared successfully with ${shareEmail}!`);
      setShareEmail("");
      setTimeout(() => {
        setShowShareModal(false);
        setShareSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Failed to share document:", err);
      setShareError(err.response?.data?.detail || "Failed to share document. Make sure the client has registered first.");
    } finally {
      setSharing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Shell>
      <div className="flex h-[calc(100vh-120px)] border border-border bg-white rounded-lg overflow-hidden shadow-sm">
        
        {/* Left Pane - Document Threads */}
        <div className="w-80 border-r border-border flex flex-col bg-background/10 shrink-0">
          <div className="p-4 border-b border-border bg-white flex items-center justify-between">
            <h3 className="font-semibold text-primary text-[14px] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Matter Chats</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loadingDocs ? (
              <div className="p-8 text-center text-[12px] text-text-secondary">
                Loading matters...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-text-muted" />
                <span className="text-[12px] text-text-secondary">No active contracts.</span>
              </div>
            ) : (
              documents.map((doc) => {
                const isActive = activeDoc?.document_id === doc.document_id;
                return (
                  <div
                    key={doc.document_id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`p-4 cursor-pointer hover:bg-primary-50 transition-colors flex items-start gap-3 ${
                      isActive ? "bg-primary-50 border-l-2 border-primary" : ""
                    }`}
                  >
                    <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-[13px] text-primary truncate">
                        {doc.filename}
                      </h4>
                      <p className="text-[10px] text-text-secondary truncate mt-0.5">
                        {doc.document_type || "NDA"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane - Chat Window */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {activeDoc ? (
            <>
              {/* Active Doc Header */}
              <div className="p-4 border-b border-border bg-white flex items-center justify-between shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[13px] text-primary truncate">
                      {activeDoc.filename}
                    </h3>
                    <p className="text-[10px] text-text-secondary">
                      {activeDoc.document_type || "Legal Document"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/analysis/${activeDoc.document_id}`)}
                    className="px-2.5 py-1.5 border border-border rounded text-[11px] font-semibold text-text-secondary hover:text-primary hover:border-primary transition-colors"
                  >
                    Analysis
                  </button>
                  {userRole === "lawyer" && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="px-2.5 py-1.5 bg-primary text-white rounded text-[11px] font-semibold hover:bg-primary-light transition-colors flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share with Client</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {loadingMessages ? (
                  <div className="text-center text-[12px] text-text-secondary pt-8">
                    Loading discussion...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary max-w-md mx-auto gap-3">
                    <MessageSquare className="w-8 h-8 text-primary/40" />
                    <div>
                      <h4 className="font-semibold text-primary text-[13px]">Start the Discussion</h4>
                      <p className="text-[11px] mt-1 leading-relaxed">
                        Send the first message to coordinate adjustments, clarify points, or request client reviews on this document.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === user?.id;
                    const roleBadgeColor = msg.sender_role === "lawyer" 
                      ? "bg-primary-100 text-primary border-primary/10" 
                      : "bg-teal-100 text-teal-800 border-teal-200";
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 shadow-sm border ${
                          isOwnMessage 
                            ? "bg-primary text-white border-primary/10" 
                            : "bg-white text-text-primary border-border"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              isOwnMessage ? "bg-white/20 text-white border-white/10" : roleBadgeColor
                            }`}>
                              {msg.sender_role}
                            </span>
                            <span className={`text-[10px] font-semibold truncate ${isOwnMessage ? "text-white/80" : "text-primary"}`}>
                              {msg.sender_name}
                            </span>
                          </div>
                          <p className="text-[13px] whitespace-pre-line leading-relaxed">{msg.content}</p>
                          <div className={`text-[9px] mt-1 text-right ${isOwnMessage ? "text-white/60" : "text-text-secondary"}`}>
                            {formatDate(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-white flex gap-3 shrink-0">
                <input
                  type="text"
                  placeholder="Type a message or ask your client/lawyer about this contract..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-primary text-white rounded font-semibold text-[13px] hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
              <MessageSquare className="w-12 h-12 text-primary/30 mb-3" />
              <h3 className="font-semibold text-primary text-[15px] mb-1">No Matter Selected</h3>
              <p className="text-[12px] text-text-secondary max-w-sm">
                Select a document from the sidebar to open its collaboration chat and discuss terms.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Document Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-semibold text-primary text-[14px] flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-primary" />
                <span>Share Legal Document</span>
              </h3>
              <button 
                onClick={() => { setShowShareModal(false); setShareError(""); setShareSuccess(""); }}
                className="text-text-muted hover:text-primary transition-colors text-xs"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleShareSubmit} className="p-5 space-y-4">
              <p className="text-[12px] text-text-secondary leading-relaxed">
                Enter your client's registered email. Once shared, the client will see this analysis in their read-only portal and can chat with you.
              </p>
              
              {shareSuccess && (
                <div className="p-3 bg-risk-green-light border border-risk-green/20 rounded flex items-center gap-2 text-[12px] text-risk-green">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{shareSuccess}</span>
                </div>
              )}
              {shareError && (
                <div className="p-3 bg-risk-red-light border border-risk-red/20 rounded flex items-center gap-2 text-[12px] text-risk-red">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{shareError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary uppercase">
                  Client Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] bg-background focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowShareModal(false); setShareError(""); setShareSuccess(""); }}
                  className="px-3 py-2 border border-border rounded text-[12px] text-text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing || !shareEmail.trim()}
                  className="px-4 py-2 bg-primary text-white rounded text-[12px] font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {sharing ? "Sharing..." : "Share Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
