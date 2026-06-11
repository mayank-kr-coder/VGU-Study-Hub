import React from 'react';
import { X, Trash2, Download, FileText, BarChart } from 'lucide-react';
import { deleteDocumentCloud } from '../services/firebase';

export default function DashboardModal({ isOpen, onClose, currentUser, documents, onDeleteDoc, addToast }) {
  if (!isOpen || !currentUser) return null;

  // Filter documents uploaded by the current user
  const userDocs = documents.filter(doc => doc.uploaderId === currentUser.id);

  // Compute stats
  const totalDownloadsReceived = userDocs.reduce((acc, doc) => acc + doc.downloadsCount, 0);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        // Find document storage path to delete it from Storage
        const docObj = documents.find(d => d.id === id);
        const storagePath = docObj ? docObj.storagePath : null;

        await deleteDocumentCloud(id, storagePath);
        onDeleteDoc(id);
        addToast("Document deleted successfully.", "success");
      } catch (err) {
        console.error(err);
        addToast("Failed to delete document.", "error");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Student Dashboard</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Profile overview card */}
          <div className="user-profile-info">
            <div className="profile-avatar-lg">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-email">{currentUser.email}</span>
            </div>
          </div>

          <div className="dashboard-sections">
            {/* Quick stats */}
            <div>
              <h3 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart size={16} />
                <span>Your Stats</span>
              </h3>
              <div className="hero-stats" style={{ gap: '1.5rem', margin: '0.5rem 0', justifyContent: 'flex-start' }}>
                <div className="stat-item" style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem 1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', minWidth: '120px' }}>
                  <span className="stat-number" style={{ fontSize: '1.5rem' }}>{userDocs.length}</span>
                  <span className="stat-label" style={{ fontSize: '0.65rem' }}>Shared Files</span>
                </div>
                <div className="stat-item" style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem 1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', minWidth: '120px' }}>
                  <span className="stat-number" style={{ fontSize: '1.5rem' }}>{totalDownloadsReceived}</span>
                  <span className="stat-label" style={{ fontSize: '0.65rem' }}>Total Downloads</span>
                </div>
              </div>
            </div>

            {/* List of uploaded documents */}
            <div>
              <h3 className="dashboard-title">My Uploaded Documents</h3>
              <div className="uploaded-docs-list" style={{ marginTop: '0.75rem' }}>
                {userDocs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '1rem 0' }}>
                    You haven't uploaded any documents yet. Share notes or PYQs to help your peers!
                  </p>
                ) : (
                  userDocs.map((doc) => (
                    <div className="uploaded-doc-item" key={doc.id}>
                      <div className="uploaded-doc-meta" style={{ maxWidth: '80%' }}>
                        <span className="uploaded-doc-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title}
                        </span>
                        <div className="uploaded-doc-stats" style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                          <span>Category: {doc.category}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Download size={11} /> {doc.downloadsCount}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDelete(doc.id, doc.title)}
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
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
