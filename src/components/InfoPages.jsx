import React, { useState } from 'react';
import { 
  ArrowLeft, Info, Phone, Newspaper, Shield, FileText, AlertTriangle, 
  Send, User, Award, Target, HelpCircle, Code, Star, CheckCircle, Flame, Mail, SendHorizontal
} from 'lucide-react';

export default function InfoPages({ view, setView, addToast }) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      addToast("Please fill in all fields", "error");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      addToast("Message sent successfully! Mayank will get back to you soon.", "success");
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setSubmitting(false);
    }, 1200);
  };

  const renderAboutView = () => (
    <div className="info-page-layout">
      <div className="info-header-section">
        <div className="profile-avatar-lg" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem auto' }}>
          MK
        </div>
        <h1 className="hero-gradient-text" style={{ fontSize: '2.25rem', fontWeight: 800 }}>Mayank Kumar</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.1rem', marginTop: '0.25rem' }}>
          Founder & Lead Developer of VGU Study Hub
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Computer Science Engineering student passionate about building digital tools that solve real problems.
        </p>
      </div>

      <div className="info-grid-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', marginTop: '2rem' }}>
        <div className="info-card-main">
          <h2 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: 'none' }}>
            <Award size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>Why I Built VGU Study Hub</span>
          </h2>
          <p className="info-text">
            VGU Study Hub was created with a clear vision: to provide a simple, fast, and completely free platform for students to share and access previous year questions (PYQs) and lecture notes.
          </p>
          <p className="info-text">
            During my semester exam preparations, I noticed that students often spend hours searching for correct notes, syllabus sheets, and PYQs, or have to ask around in multiple WhatsApp groups. This motivated me to build a centralized, responsive hub where anyone can collaborate and help each other.
          </p>
          <p className="info-text">
            Today, VGU Study Hub serves our campus community by providing quick access to notes, lab manuals, and tutorials. With privacy, security, and ease of use at its core, it makes exam preparations stress-free.
          </p>

          <h2 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: 'none', marginTop: '2rem' }}>
            <Target size={20} style={{ color: 'var(--accent-cyan)' }} />
            <span>Our Mission & Core Values</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="value-row">
              <span className="value-badge">Simple Access</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Find and download correct notes in 2 clicks without confusing pages.</p>
            </div>
            <div className="value-row">
              <span className="value-badge">Fast Syncing</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instantly upload and share PDFs with friends using Firebase Storage.</p>
            </div>
            <div className="value-row">
              <span className="value-badge">100% Free</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No ads, no premium charges, no subscriptions. Created by a student, for students.</p>
            </div>
          </div>
        </div>

        <div className="info-sidebar">
          <div className="sidebar-card">
            <h3>Skills & Expertise</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span className="skill-tag">Web Development</span>
              <span className="skill-tag">UI/UX Design</span>
              <span className="skill-tag">Database Management</span>
              <span className="skill-tag">Full-Stack Development</span>
              <span className="skill-tag">Problem Solving</span>
            </div>
          </div>

          <div className="sidebar-card" style={{ marginTop: '1.5rem' }}>
            <h3>Future Plans</h3>
            <ul className="sidebar-list">
              <li>Advanced OCR document scanner</li>
              <li>Official VGU Study Hub Mobile App</li>
              <li>Branch-wise WhatsApp bot</li>
              <li>Interactive solved PYQ forums</li>
              <li>AI-powered topic summarizer</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="sidebar-card" style={{ marginTop: '2.5rem', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>Why Choose VGU Study Hub?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="why-item">
            <Flame size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h4>Lightning-Fast</h4>
            <p>Direct download links.</p>
          </div>
          <div className="why-item">
            <CheckCircle size={20} style={{ color: '#10b981' }} />
            <h4>Always Free</h4>
            <p>No hidden charges.</p>
          </div>
          <div className="why-item">
            <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
            <h4>Privacy First</h4>
            <p>Secure accounts & files.</p>
          </div>
          <div className="why-item">
            <Code size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h4>Cross-Device</h4>
            <p>Fully mobile optimized.</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>"Thank you for using VGU Study Hub!"</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0.5rem auto 1.5rem auto', lineHeight: '1.5' }}>
          Your support and feedback mean the world to me and motivate me to keep building better and more helpful tools for everyone. Let's connect on social media!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a href="https://linkedin.com" target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>LinkedIn</a>
          <a href="https://youtube.com" target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>YouTube</a>
          <a href="https://instagram.com" target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Instagram</a>
          <a href="https://twitter.com" target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Twitter</a>
        </div>
      </div>
    </div>
  );

  const renderContactView = () => (
    <div className="info-page-layout" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="info-header-section">
        <h1 className="hero-gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>Contact Mayank Kumar</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Have any suggestions, feedback, or need help with VGU Study Hub? Fill out the form below to send a direct message.
        </p>
      </div>

      <form onSubmit={handleContactSubmit} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label>Your Name</label>
          <input 
            type="text" 
            placeholder="Enter your name" 
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea 
            placeholder="Write your suggestions, complaints, or feedback..." 
            value={contactMsg}
            onChange={(e) => setContactMsg(e.target.value)}
            required
            disabled={submitting}
            style={{ minHeight: '140px' }}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
          {submitting ? "Sending..." : "Send Message"}
          <SendHorizontal size={14} />
        </button>
      </form>
    </div>
  );

  const renderBlogView = () => (
    <div className="info-page-layout">
      <div className="info-header-section">
        <h1 className="hero-gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>VGU Student Blog</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Read the latest study tips, examination schedules, campus resources, and advice from seniors.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
        <div className="blog-card">
          <span className="badge badge-note">Exam Prep</span>
          <h3>How to Ace Mid-Term Exams: A Senior's Guide</h3>
          <p>Practical tips on time management, analyzing previous year question papers (PYQs), and standard exam writing strategies.</p>
          <div className="blog-meta">
            <span>By Rohan Sen • BCA 3rd Year</span>
          </div>
        </div>

        <div className="blog-card">
          <span className="badge badge-pyq">Study Tips</span>
          <h3>5 Best Tools to Manage Your Engineering Notes</h3>
          <p>A curated list of applications and methods to capture lectures, organize slides, and review before the final semester exams.</p>
          <div className="blog-meta">
            <span>By Mayank Kumar • CSE 2nd Year</span>
          </div>
        </div>

        <div className="blog-card">
          <span className="badge badge-guide">News</span>
          <h3>VGU Examination Guidelines and Updates (2026)</h3>
          <p>Read about the standard rules, hall ticket generation guides, and timing details issued for the upcoming semesters.</p>
          <div className="blog-meta">
            <span>By Admin Hub</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyView = () => (
    <div className="info-page-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="info-header-section" style={{ textAlign: 'left' }}>
        <h1 className="hero-gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Last updated: June 2026</p>
      </div>

      <div className="legal-content-box" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section>
          <h3>1. Data We Collect</h3>
          <p>We collect basic details when you register, including your Full Name and Email Address. This is used exclusively to attribute document uploads and comments to your student profile.</p>
        </section>

        <section>
          <h3>2. PDF Documents & Storage</h3>
          <p>When you upload documents, they are stored securely in our cloud bucket database. These files are accessible by all registered members of VGU Study Hub. Please ensure you do not upload files containing private personal details.</p>
        </section>

        <section>
          <h3>3. Data Protection</h3>
          <p>We do not sell, rent, or trade student details to third parties. All accounts, passwords, comments, and files are managed securely using standard database rules.</p>
        </section>

        <section>
          <h3>4. Cookies & LocalStorage</h3>
          <p>VGU Study Hub uses localStorage to store your preferences (such as light/dark mode choice) and to keep you signed in between browser sessions.</p>
        </section>
      </div>
    </div>
  );

  const renderTermsView = () => (
    <div className="info-page-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="info-header-section" style={{ textAlign: 'left' }}>
        <h1 className="hero-gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>Terms & Conditions</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Last updated: June 2026</p>
      </div>

      <div className="legal-content-box" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section>
          <h3>1. Account Registration</h3>
          <p>Anyone is free to create a student account. You are responsible for maintaining the confidentiality of your account credentials and are fully responsible for all uploads and comments posted under your account.</p>
        </section>

        <section>
          <h3>2. Permitted Uploads</h3>
          <p>You may only upload academic materials such as lecture notes, previous year exam papers (PYQs), lab manuals, solved homework sheets, and academic guides. Uploading copyright-infringed books, offensive text, spam, or private documents is strictly prohibited.</p>
        </section>

        <section>
          <h3>3. Intellectual Property</h3>
          <p>VGU Study Hub claims no ownership of uploaded notes. Uploader profiles are credited next to shared documents. By sharing documents on VGU Study Hub, you permit your peers to view and download them for educational purposes.</p>
        </section>

        <section>
          <h3>4. Termination</h3>
          <p>We reserve the right to delete files and terminate student profiles that violate our sharing guidelines or upload malicious/copyright-protected documents.</p>
        </section>
      </div>
    </div>
  );

  const renderDisclaimerView = () => (
    <div className="info-page-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="info-header-section" style={{ textAlign: 'left' }}>
        <h1 className="hero-gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>Disclaimer</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Last updated: June 2026</p>
      </div>

      <div className="legal-content-box" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section>
          <h3>Academic Purpose Only</h3>
          <p>The materials provided on VGU Study Hub are shared by students for educational and study-assistance purposes only. The platform developer (Mayank Kumar) does not guarantee the accuracy, completeness, or grades resulting from using the notes or solutions uploaded on this portal.</p>
        </section>

        <section>
          <h3>No Affiliation</h3>
          <p>VGU Study Hub is an independent student-led portal created by Mayank Kumar (CSE Student) for peers at Vivekananda Global University. It is not officially managed, owned, or operated by the university administration.</p>
        </section>

        <section>
          <h3>Copyright Concerns</h3>
          <p>If you find any document that infringes your copyright or contains unauthorized content, please contact the developer immediately using the Contact Us form, and we will take immediate action to remove the document.</p>
        </section>
      </div>
    </div>
  );

  const getPageContent = () => {
    switch (view) {
      case 'about': return renderAboutView();
      case 'contact': return renderContactView();
      case 'blog': return renderBlogView();
      case 'privacy': return renderPrivacyView();
      case 'terms': return renderTermsView();
      case 'disclaimer': return renderDisclaimerView();
      default: return renderAboutView();
    }
  };

  const getSidebarIcon = (pageName) => {
    switch (pageName) {
      case 'about': return <Info size={16} />;
      case 'contact': return <Phone size={16} />;
      case 'blog': return <Newspaper size={16} />;
      case 'privacy': return <Shield size={16} />;
      case 'terms': return <FileText size={16} />;
      case 'disclaimer': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getPageTitle = (pageName) => {
    switch (pageName) {
      case 'about': return 'About Us';
      case 'contact': return 'Contact Us';
      case 'blog': return 'Blog';
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms & Conditions';
      case 'disclaimer': return 'Disclaimer';
      default: return 'About Us';
    }
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-speed) ease-out' }}>
      {/* Back to Home Navigator */}
      <button 
        className="btn btn-secondary" 
        onClick={() => setView('home')} 
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Home Feed</span>
      </button>

      {/* Pages Container Box */}
      <div className="info-container-box">
        {/* Left Side: Sidebar List */}
        <aside className="info-page-sidebar">
          <span className="sidebar-group-title">Company</span>
          <ul className="sidebar-nav">
            {['about', 'contact', 'blog'].map((page) => (
              <li key={page}>
                <button 
                  className={`sidebar-nav-btn ${view === page ? 'active' : ''}`}
                  onClick={() => setView(page)}
                >
                  {getSidebarIcon(page)}
                  <span>{getPageTitle(page)}</span>
                </button>
              </li>
            ))}
          </ul>

          <span className="sidebar-group-title" style={{ marginTop: '1.5rem' }}>Legal</span>
          <ul className="sidebar-nav">
            {['privacy', 'terms', 'disclaimer'].map((page) => (
              <li key={page}>
                <button 
                  className={`sidebar-nav-btn ${view === page ? 'active' : ''}`}
                  onClick={() => setView(page)}
                >
                  {getSidebarIcon(page)}
                  <span>{getPageTitle(page)}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right Side: Page Details */}
        <div className="info-page-content">
          {getPageContent()}
        </div>
      </div>
    </div>
  );
}
