import React, { useState, useEffect } from 'react';
import { X, Download, Star, MessageSquare, Calendar, User, FileText, Send, Loader2, Lock } from 'lucide-react';
import { getDocumentBlob, addCommentCloud, rateDocumentCloud, incrementDownloadsCloud } from '../services/firebase';

export default function DocumentDetail({ doc, onClose, currentUser, onUpdateDoc, addToast, openAuthModal }) {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState('');
  const [loadingBlob, setLoadingBlob] = useState(true);
  
  // Rating and Comment States
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [ratingHover, setRatingHover] = useState(0);

  // Load the actual file blob when modal opens
  useEffect(() => {
    let active = true;
    async function loadFile() {
      if (!currentUser) {
        setLoadingBlob(false);
        return;
      }
      try {
        setLoadingBlob(true);
        const blob = await getDocumentBlob(doc.id, doc.downloadUrl);
        if (active && blob) {
          setPdfBlob(blob);
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        console.error("Failed to load PDF file:", err);
      } finally {
        if (active) setLoadingBlob(false);
      }
    }

    loadFile();

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [doc.id, currentUser]);

  const handleDownload = async () => {
    if (!currentUser) {
      addToast("You must be logged in to download documents.", "error");
      onClose();
      openAuthModal();
      return;
    }
    if (!pdfBlob) {
      addToast("PDF file is not loaded yet.", "error");
      return;
    }

    try {
      // Trigger browser file download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count in database
      await incrementDownloadsCloud(doc.id);
      
      const updatedDoc = {
        ...doc,
        downloadsCount: doc.downloadsCount + 1
      };
      onUpdateDoc(updatedDoc);
      addToast("Download started!", "success");
    } catch (err) {
      console.error(err);
      addToast("Download error", "error");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      addToast("You must be logged in to comment.", "error");
      return;
    }
    if (!commentText.trim()) return;

    const newComment = {
      id: 'c-' + Date.now(),
      commenterName: currentUser.name,
      commentText: commentText.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await addCommentCloud(doc.id, newComment);
      const updatedDoc = {
        ...doc,
        comments: [newComment, ...doc.comments]
      };
      onUpdateDoc(updatedDoc);
      setCommentText('');
      addToast("Comment posted!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to post comment", "error");
    }
  };

  const handleRate = async (ratingValue) => {
    if (!currentUser) {
      addToast("You must be logged in to rate.", "error");
      return;
    }

    try {
      await rateDocumentCloud(doc.id, ratingValue);
      const newTotalStars = doc.totalStars + ratingValue;
      const newRatingsCount = doc.ratingsCount + 1;
      const newAverageRating = parseFloat((newTotalStars / newRatingsCount).toFixed(1));

      const updatedDoc = {
        ...doc,
        totalStars: newTotalStars,
        ratingsCount: newRatingsCount,
        rating: newAverageRating
      };
      onUpdateDoc(updatedDoc);
      setUserRating(ratingValue);
      addToast(`You rated this document ${ratingValue} stars!`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to post rating", "error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="modal-title" style={{ fontSize: '1.15rem', maxWidth: '700px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.title}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="doc-detail-layout">
          {/* Left Column: PDF Preview Area */}
          <div className="doc-preview-pane">
            <div className="preview-header">
              <span>File Preview ({doc.fileName})</span>
              <span>Size: {doc.fileSize}</span>
            </div>
            
            <div className="preview-container">
              {!currentUser ? (
                <div className="pdf-preview-fallback">
                  <Lock className="fallback-icon" />
                  <h3>Preview Locked</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    Please log in or register an account to view and download this resource.
                  </p>
                  <button className="btn btn-primary" onClick={() => { onClose(); openAuthModal(); }}>
                    <span>Login / Register</span>
                  </button>
                </div>
              ) : loadingBlob ? (
                <div style={{ textAlign: 'center' }}>
                  <Loader2 size={36} className="fallback-icon" style={{ animation: 'spin 1.5s linear infinite' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading document preview...</p>
                </div>
              ) : blobUrl ? (
                <iframe src={`${blobUrl}#toolbar=0&navpanes=0`} title={doc.title} />
              ) : (
                <div className="pdf-preview-fallback">
                  <FileText className="fallback-icon" />
                  <h3>Preview Unavailable</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Your browser does not support inline PDF viewing or the PDF is corrupted. Please download the file to view it offline.
                  </p>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    <Download size={16} />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info & Interactivity Pane */}
          <div className="doc-info-pane">
            {/* Metadata Info */}
            <div className="doc-info-section">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Subject Code</span>
                  <span className="info-value">{doc.subjectCode}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Semester</span>
                  <span className="info-value">{doc.semester}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Academic Year</span>
                  <span className="info-value">{doc.year}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Category</span>
                  <span className="info-value">{doc.category}</span>
                </div>
                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="info-label">Department</span>
                  <span className="info-value">{doc.department}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="doc-info-section">
              <span className="info-label">Description</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: '1.5' }}>
                {doc.description}
              </p>
            </div>

            {/* Actions: Download, Rating */}
            <div className="doc-info-section">
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {currentUser ? (
                  <button className="btn btn-primary" onClick={handleDownload} style={{ flexGrow: 1, justifyContent: 'center' }}>
                    <Download size={16} />
                    <span>Download Document</span>
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => { onClose(); openAuthModal(); }} style={{ flexGrow: 1, justifyContent: 'center' }}>
                    <Lock size={16} />
                    <span>Login to Download</span>
                  </button>
                )}
              </div>

              {/* Star Rating Input */}
              <div className="rating-action-container" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1rem' }}>
                <span className="rating-prompt">
                  {userRating > 0 ? "Thank you for rating!" : "Rate this resource:"}
                </span>
                <div className="star-rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${(ratingHover || userRating) >= star ? 'active' : ''}`}
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      disabled={userRating > 0}
                    >
                      <Star size={20} fill={(ratingHover || userRating) >= star ? '#eab308' : 'none'} />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center', marginLeft: '0.5rem' }}>
                    ({doc.ratingsCount} ratings)
                  </span>
                </div>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="doc-info-section" style={{ borderBottom: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
              <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MessageSquare size={14} />
                <span>Discussion ({doc.comments.length})</span>
              </span>

              {/* Post Comment Input */}
              <form onSubmit={handleAddComment} className="comment-input-area">
                <textarea
                  placeholder={currentUser ? "Write a comment..." : "Log in to join the discussion."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser}
                />
                <button 
                  type="submit" 
                  className="btn btn-secondary" 
                  style={{ alignSelf: 'flex-end', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  disabled={!currentUser || !commentText.trim()}
                >
                  <Send size={12} />
                  <span>Send</span>
                </button>
              </form>

              {/* Comments Scrollable List */}
              <div className="comments-list">
                {doc.comments.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '1rem' }}>
                    No comments yet. Be the first to start the discussion!
                  </p>
                ) : (
                  doc.comments.map((comment) => (
                    <div className="comment-card" key={comment.id}>
                      <div className="comment-header">
                        <span className="commenter-name">{comment.commenterName}</span>
                        <span className="comment-date">{comment.date}</span>
                      </div>
                      <p className="comment-text">{comment.commentText}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
