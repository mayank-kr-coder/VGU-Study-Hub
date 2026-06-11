import React from 'react';
import { Star, Download, FileText, Calendar, BookOpen } from 'lucide-react';

export default function DocumentCard({ doc, onClick }) {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Previous Year Question':
        return <span className="badge badge-pyq">PYQ</span>;
      case 'Lecture Note':
        return <span className="badge badge-note">Notes</span>;
      case 'Lab Manual':
        return <span className="badge badge-manual">Lab Manual</span>;
      default:
        return <span className="badge badge-guide">Study Guide</span>;
    }
  };

  return (
    <div className="document-card" onClick={onClick}>
      <div className="card-header">
        {getCategoryBadge(doc.category)}
        <div className="rating-stars" title={`Rating: ${doc.rating} / 5`}>
          <Star size={13} fill="#eab308" color="#eab308" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '0.15rem' }}>
            {doc.rating > 0 ? doc.rating.toFixed(1) : 'New'}
          </span>
        </div>
      </div>

      <h3 className="card-title" title={doc.title}>{doc.title}</h3>

      <div className="card-meta-line" style={{ marginTop: 'auto' }}>
        <BookOpen size={13} />
        <span>{doc.subjectCode} • {doc.semester}</span>
      </div>

      <div className="card-meta-line">
        <Calendar size={13} />
        <span>Year: {doc.year} • {doc.department}</span>
      </div>

      <p className="card-desc" title={doc.description}>{doc.description}</p>

      <div className="card-footer">
        <div className="uploader-info">
          <div className="avatar" style={{ width: '18px', height: '18px', fontSize: '0.65rem' }}>
            {doc.uploaderName.charAt(0).toUpperCase()}
          </div>
          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.uploaderName}
          </span>
        </div>

        <div className="card-interactions">
          <div className="interaction-item">
            <Download size={13} />
            <span>{doc.downloadsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
