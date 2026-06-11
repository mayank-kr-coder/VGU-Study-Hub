import React, { useState, useRef } from 'react';
import { X, FileText, Upload, AlertCircle, AlertTriangle } from 'lucide-react';
import { uploadDocumentCloud } from '../services/firebase';

export default function UploadModal({ isOpen, onClose, currentUser, openAuthModal, onUploadSuccess, addToast }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [subjectCode, setSubjectCode] = useState('');
  const [semester, setSemester] = useState('1st Semester');
  const [category, setCategory] = useState('Lecture Note');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    if (file && file.type === "application/pdf") {
      if (file.size > 15 * 1024 * 1024) {
        addToast("File is too large! Maximum limit is 15MB.", "error");
        return;
      }
      setSelectedFile(file);
    } else {
      addToast("Invalid file type! Please upload a PDF.", "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      addToast("You must be logged in to upload files", "error");
      return;
    }
    if (!selectedFile) {
      addToast("Please select a PDF file first", "error");
      return;
    }
    if (!title.trim() || !subjectCode.trim() || !description.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    setUploading(true);

    try {
      // Create document metadata
      const newDoc = {
        id: 'doc-' + Date.now(),
        title: title.trim(),
        department,
        subjectCode: subjectCode.trim().toUpperCase(),
        semester,
        category,
        year,
        description: description.trim(),
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + ' KB',
        uploadDate: new Date().toISOString().split('T')[0],
        uploaderName: currentUser.name,
        uploaderId: currentUser.id,
        rating: 0,
        ratingsCount: 0,
        totalStars: 0,
        downloadsCount: 0,
        comments: []
      };

      // Save metadata and file blob into Firebase/IndexedDB
      const uploadedDoc = await uploadDocumentCloud(newDoc, selectedFile);
      
      addToast("Document shared successfully!", "success");
      setUploading(false);
      onUploadSuccess(uploadedDoc);
      resetForm();
      onClose();

    } catch (err) {
      console.error(err);
      addToast("Failed to upload document", "error");
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setSubjectCode('');
    setDescription('');
    setDepartment('Computer Science & Engineering');
    setSemester('1st Semester');
    setCategory('Lecture Note');
    setYear(new Date().getFullYear().toString());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Share Study Material</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {!currentUser ? (
            <div className="empty-state" style={{ padding: '2rem 1.5rem', border: '1px solid var(--border-color)' }}>
              <AlertTriangle className="empty-state-icon" style={{ color: '#eab308' }} size={40} />
              <h3>Authentication Required</h3>
              <p style={{ maxWidth: '300px', margin: '0 auto', fontSize: '0.85rem' }}>
                You need to log in to upload study notes or exam papers. Anyone can create a free account!
              </p>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                style={{ marginTop: '0.5rem' }}
              >
                Login / Register
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* File Dropzone */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInputChange} 
                style={{ display: 'none' }} 
                accept="application/pdf"
              />

              {!selectedFile ? (
                <div 
                  className={`file-dropzone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <div className="file-dropzone-icon">
                    <Upload size={24} />
                  </div>
                  <h3>Drag & Drop your PDF here</h3>
                  <p className="dropzone-label">or click to browse from files (Max 15MB)</p>
                </div>
              ) : (
                <div className="selected-file-banner" style={{ marginBottom: '1.5rem' }}>
                  <div className="selected-file-details">
                    <FileText size={20} />
                    <div>
                      <div className="uploaded-doc-title" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-icon" 
                    onClick={() => setSelectedFile(null)} 
                    style={{ width: '28px', height: '28px' }}
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Form Metadata */}
              <div className="form-group">
                <label>Document Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Data Structures Mid Term Solved PYQ" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={uploading}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Department</label>
                  <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={uploading}
                  >
                    <option>Computer Science & Engineering</option>
                    <option>Information Technology</option>
                    <option>Electrical Engineering</option>
                    <option>Mechanical Engineering</option>
                    <option>Civil Engineering</option>
                    <option>Management (MBA/BBA)</option>
                    <option>Computer Applications (BCA/MCA)</option>
                    <option>Basic Sciences</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject Code *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., CSE-302" 
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    required
                    disabled={uploading}
                  />
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <select 
                    value={semester} 
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={uploading}
                  >
                    <option>1st Semester</option>
                    <option>2nd Semester</option>
                    <option>3rd Semester</option>
                    <option>4th Semester</option>
                    <option>5th Semester</option>
                    <option>6th Semester</option>
                    <option>7th Semester</option>
                    <option>8th Semester</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={uploading}
                  >
                    <option>Previous Year Question</option>
                    <option>Lecture Note</option>
                    <option>Lab Manual</option>
                    <option>Study Guide</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Academic Year</label>
                  <input 
                    type="number" 
                    min="2010" 
                    max="2035"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={uploading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  placeholder="Provide a brief summary of what this document covers (topics, chapters, solutions etc.)" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={uploading}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? "Sharing..." : "Share Now"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
