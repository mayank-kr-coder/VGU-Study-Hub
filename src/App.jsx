import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, FolderOpen, Award, Filter, RefreshCw, PlusCircle, AlertTriangle, Info, Phone, Newspaper, Shield, FileText } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DocumentCard from './components/DocumentCard';
import DocumentDetail from './components/DocumentDetail';
import UploadModal from './components/UploadModal';
import AuthModal from './components/AuthModal';
import DashboardModal from './components/DashboardModal';
import InfoPages from './components/InfoPages';
import { isFirebaseConfigured, subscribeToAuth, subscribeToDocuments, logoutUser } from './services/firebase';

function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vgu_theme') || 'dark';
  });

  // DB Document state
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSem, setSelectedSem] = useState('All');

  // Navigation View state
  const [currentView, setCurrentView] = useState('home');

  // Modal toggle states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Active Session User state
  const [currentUser, setCurrentUser] = useState(null);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Set Theme Class on Body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    localStorage.setItem('vgu_theme', theme);
  }, [theme]);

  // Listen to Auth Session
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Seed and Load documents
  useEffect(() => {
    setLoading(true);
    // Pre-create initial student uploader accounts in local storage if running in fallback mode
    if (!isFirebaseConfigured && !localStorage.getItem('vgu_users')) {
      const defaultUsers = [
        { id: 'user-amit', name: 'Amit Sharma', email: 'amit.sharma@vgu.ac.in', password: 'password123' },
        { id: 'user-roy', name: 'Dr. K. C. Roy', email: 'kc.roy@vgu.ac.in', password: 'password123' },
        { id: 'user-sneha', name: 'Sneha Reddy', email: 'sneha.reddy@vgu.ac.in', password: 'password123' },
        { id: 'user-manish', name: 'Prof. Manish Sen', email: 'manish.sen@vgu.ac.in', password: 'password123' }
      ];
      localStorage.setItem('vgu_users', JSON.stringify(defaultUsers));
    }

    const unsubscribe = subscribeToDocuments(
      (docs) => {
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Subscription error:", err);
        addToast("Error syncing with database", "error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('vgu_current_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      localStorage.removeItem('vgu_current_user');
      addToast("Logged out successfully", "success");
      setIsDashboardOpen(false);
    } catch (err) {
      console.error(err);
      addToast("Error during logout", "error");
    }
  };

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleUpdateDoc = (updatedDoc) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc)));
    // If the active viewed doc was updated, update details
    if (selectedDoc && selectedDoc.id === updatedDoc.id) {
      setSelectedDoc(updatedDoc);
    }
  };

  const handleDeleteDoc = (deletedId) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== deletedId));
    if (selectedDoc && selectedDoc.id === deletedId) {
      setSelectedDoc(null);
    }
  };

  // Compute Platform Stats
  const platformStats = useMemo(() => {
    const totalNotes = documents.filter(d => d.category !== 'Previous Year Question').length;
    const totalPyqs = documents.filter(d => d.category === 'Previous Year Question').length;
    const totalDownloads = documents.reduce((acc, d) => acc + d.downloadsCount, 0);
    return { totalNotes, totalPyqs, totalDownloads };
  }, [documents]);

  // Search & Filter computation
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchesSem = selectedSem === 'All' || doc.semester === selectedSem;

      return matchesSearch && matchesDept && matchesCategory && matchesSem;
    });
  }, [documents, searchQuery, selectedDept, selectedCategory, selectedSem]);

  const handleResetFilters = () => {
    setSelectedDept('All');
    setSelectedCategory('All');
    setSelectedSem('All');
    setSearchQuery('');
    addToast("Filters reset", "success");
  };

  return (
    <div className="app-container">
      {/* Navbar Component */}
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        theme={theme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        openAuthModal={() => setIsAuthOpen(true)}
        openUploadModal={() => setIsUploadOpen(true)}
        openDashboardModal={() => setIsDashboardOpen(true)}
        setCurrentView={setCurrentView}
      />

      <main className="main-content">
        {currentView === 'home' ? (
          <>
            {/* Welcome and Counter section */}
            <Hero stats={platformStats} />

            {/* Warning Alert if Firebase is not yet set up */}
            {!isFirebaseConfigured && (
              <div style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: 'var(--border-radius-md)',
                padding: '1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}>
                <AlertTriangle style={{ color: '#eab308', flexShrink: 0 }} size={24} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Local Sandbox Mode (Prototype)</strong>
                  <span>
                    VGU Study Hub is running in local offline-first mode. All PDFs and accounts persist within this browser session (IndexedDB).
                    To turn this into a live sharing app, configure your Firebase console credentials in the <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>.env</code> file.
                  </span>
                </div>
              </div>
            )}

            {/* Filters Dashboard Panel */}
            <section className="dashboard-filter-bar">
              <div className="filter-group">
                <label>Department</label>
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  <option>All</option>
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

              <div className="filter-group">
                <label>Resource Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option>All</option>
                  <option>Previous Year Question</option>
                  <option>Lecture Note</option>
                  <option>Lab Manual</option>
                  <option>Study Guide</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Semester</label>
                <select value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)}>
                  <option>All</option>
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

              <button className="btn btn-secondary reset-filters-btn" onClick={handleResetFilters}>
                <RefreshCw size={14} />
                <span>Reset</span>
              </button>
            </section>

            {/* Content Listing Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderOpen size={20} style={{ color: 'var(--accent-primary)' }} />
                <span>Available Study Materials ({filteredDocs.length})</span>
              </h2>
            </div>

            {/* Documents Grid / Loading / Empty states */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <RefreshCw className="fallback-icon" style={{ animation: 'spin 1.5s linear infinite' }} size={40} />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="empty-state">
                <Award className="empty-state-icon" size={44} />
                <h3>No Materials Found</h3>
                <p style={{ maxWidth: '360px', fontSize: '0.85rem' }}>
                  We couldn't find any documents matching your criteria. Try adjusting your search keywords or resetting filters.
                </p>
                <button className="btn btn-primary" onClick={handleResetFilters} style={{ marginTop: '0.5rem' }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="document-grid">
                {filteredDocs.map((doc) => (
                  <DocumentCard 
                    key={doc.id}
                    doc={doc}
                    onClick={() => setSelectedDoc(doc)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <InfoPages 
            view={currentView}
            setView={setCurrentView}
            addToast={addToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-column footer-brand-col">
            <div className="footer-logo">
              <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>VGU Study Hub</span>
            </div>
            <p className="footer-tagline">Created by Mayank Kumar. A collaborative sharing platform for Vivekananda Global University students.</p>
            <p className="footer-disclaimer-text">
              VGU Study Hub is a student academic resource portal. File uploads persist in the cloud when connected to Firebase.
            </p>
          </div>

          <div className="footer-column">
            <span className="footer-col-title">COMPANY</span>
            <ul className="footer-links">
              <li>
                <a href="#about" onClick={(e) => { e.preventDefault(); setCurrentView('about'); }}>
                  <Info size={14} />
                  <span>About Us</span>
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => { e.preventDefault(); setCurrentView('contact'); }}>
                  <Phone size={14} />
                  <span>Contact Us</span>
                </a>
              </li>
              <li>
                <a href="#blog" onClick={(e) => { e.preventDefault(); setCurrentView('blog'); }}>
                  <Newspaper size={14} />
                  <span>Blog</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <span className="footer-col-title">LEGAL</span>
            <ul className="footer-links">
              <li>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); setCurrentView('privacy'); }}>
                  <Shield size={14} />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => { e.preventDefault(); setCurrentView('terms'); }}>
                  <FileText size={14} />
                  <span>Terms & Conditions</span>
                </a>
              </li>
              <li>
                <a href="#disclaimer" onClick={(e) => { e.preventDefault(); setCurrentView('disclaimer'); }}>
                  <AlertTriangle size={14} />
                  <span>Disclaimer</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} VGU Study Hub. Created by Mayank Kumar. All Rights Reserved.</p>
        </div>
      </footer>

      {/* App Modals */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        addToast={addToast}
      />

      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentUser={currentUser}
        openAuthModal={() => setIsAuthOpen(true)}
        onUploadSuccess={handleUploadSuccess}
        addToast={addToast}
      />

      <DashboardModal 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        currentUser={currentUser}
        documents={documents}
        onDeleteDoc={handleDeleteDoc}
        addToast={addToast}
      />

      {selectedDoc && (
        <DocumentDetail 
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          currentUser={currentUser}
          onUpdateDoc={handleUpdateDoc}
          addToast={addToast}
          openAuthModal={() => setIsAuthOpen(true)}
        />
      )}

      {/* Toast Alert Popups */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
