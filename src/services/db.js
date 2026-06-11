const DB_NAME = 'VGUStudyHubDB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database failed to open:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Object store for document metadata
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }

      // Object store for heavy PDF blobs
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
  });
};

// Helper to write to stores
export const saveDocument = async (docMetadata, fileBlob) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents', 'files'], 'readwrite');
    const docStore = transaction.objectStore('documents');
    const fileStore = transaction.objectStore('files');

    const docReq = docStore.put(docMetadata);
    const fileReq = fileStore.put({ id: docMetadata.id, blob: fileBlob });

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// Retrieve all document metadata
export const getAllDocuments = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents'], 'readonly');
    const store = transaction.objectStore('documents');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// Get file blob by ID
export const getFileBlob = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result ? request.result.blob : null);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// Update document metadata (e.g. comments, ratings, downloads)
export const updateDocumentMetadata = async (metadata) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents'], 'readwrite');
    const store = transaction.objectStore('documents');
    const request = store.put(metadata);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// Delete a document and its file
export const deleteDocument = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents', 'files'], 'readwrite');
    const docStore = transaction.objectStore('documents');
    const fileStore = transaction.objectStore('files');

    docStore.delete(id);
    fileStore.delete(id);

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// Generates a simple, functional PDF binary blob
const makeMinimalPDFBlob = (title, subject, category) => {
  const content = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [ 0 0 595.28 841.89 ] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 20 Tf
50 760 Td
(VGU STUDY HUB - Academic Portal) Tj
0 -45 Td
/F1 16 Tf
(Document: ${title}) Tj
0 -30 Td
/F1 12 Tf
(Subject: ${subject}) Tj
0 -20 Td
(Category: ${category}) Tj
0 -40 Td
(VGU Study Hub is a student resource portal for Vivekananda Global University.) Tj
0 -20 Td
(This document has been pre-seeded for demonstration purposes.) Tj
0 -20 Td
(Feel free to upload your own previous year questions and notes!) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000143 00000 n 
0000000305 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
575
%%EOF`;

  const bytes = new Uint8Array(content.length);
  for (let i = 0; i < content.length; i++) {
    bytes[i] = content.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'application/pdf' });
};

// Seed initial database content if empty
export const seedDatabaseIfEmpty = async () => {
  const docs = await getAllDocuments();
  if (docs.length > 0) return;

  const seeds = [
    {
      id: 'seed-1',
      title: 'Design and Analysis of Algorithms - Mid Term PYQ (2025)',
      department: 'Computer Science & Engineering',
      subjectCode: 'CSE-301',
      semester: '5th Semester',
      category: 'Previous Year Question',
      year: '2025',
      description: 'Mid-term question paper for DAA. Includes asymptotic notations, recurrence relation questions, divide & conquer, and dynamic programming problems.',
      fileName: 'daa-mid-term-2025.pdf',
      fileSize: '5.2 KB',
      uploadDate: '2026-05-15',
      uploaderName: 'Amit Sharma',
      uploaderId: 'user-amit',
      rating: 4.8,
      ratingsCount: 5,
      totalStars: 24,
      downloadsCount: 42,
      comments: [
        { id: 'c1', commenterName: 'Rohan Gupta', commentText: 'Super helpful! These exact dynamic programming questions were repeated in our internal test.', date: '2026-05-16' },
        { id: 'c2', commenterName: 'Priya Verma', commentText: 'Thanks Amit, do you have the solution sheet as well?', date: '2026-05-18' }
      ]
    },
    {
      id: 'seed-2',
      title: 'Data Science & Big Data - Complete Lecture Notes',
      department: 'Information Technology',
      subjectCode: 'IT-402',
      semester: '7th Semester',
      category: 'Lecture Note',
      year: '2026',
      description: 'Handwritten and typed notes covering Hadoop architecture, MapReduce, Spark, Pig, Hive and basic data analysis workflows. Extremely concise for end-term prep.',
      fileName: 'big-data-full-notes.pdf',
      fileSize: '5.2 KB',
      uploadDate: '2026-05-20',
      uploaderName: 'Dr. K. C. Roy',
      uploaderId: 'user-roy',
      rating: 4.5,
      ratingsCount: 8,
      totalStars: 36,
      downloadsCount: 110,
      comments: [
        { id: 'c3', commenterName: 'Anshul Meena', commentText: 'Best notes for Hadoop! Clear explanation of HDFS read-write mechanism.', date: '2026-05-21' }
      ]
    },
    {
      id: 'seed-3',
      title: 'Compiler Design Lab Manual & Experiments',
      department: 'Computer Science & Engineering',
      subjectCode: 'CSE-304',
      semester: '6th Semester',
      category: 'Lab Manual',
      year: '2025',
      description: 'Full Compiler Design lab manual containing 10 experiments. Code for Lexical Analyzer using Lex, Yacc parsers, and target code generator in C/C++.',
      fileName: 'compiler-design-lab.pdf',
      fileSize: '5.2 KB',
      uploadDate: '2026-05-28',
      uploaderName: 'Sneha Reddy',
      uploaderId: 'user-sneha',
      rating: 4.2,
      ratingsCount: 3,
      totalStars: 13,
      downloadsCount: 19,
      comments: [
        { id: 'c4', commenterName: 'Rahul Sen', commentText: 'Code blocks are correct, compiles without issues in Linux.', date: '2026-05-29' }
      ]
    },
    {
      id: 'seed-4',
      title: 'Engineering Mathematics-I - Tutorial Sheets & PYQs',
      department: 'Basic Sciences',
      subjectCode: 'MTH-101',
      semester: '1st Semester',
      category: 'Study Guide',
      year: '2024',
      description: 'First semester tutorial questions on Matrices, Calculus, Fourier Series, and Differential Equations. Includes step-by-step solved sample papers from previous years.',
      fileName: 'engineering-math-tuts.pdf',
      fileSize: '5.2 KB',
      uploadDate: '2026-06-01',
      uploaderName: 'Prof. Manish Sen',
      uploaderId: 'user-manish',
      rating: 5.0,
      ratingsCount: 12,
      totalStars: 60,
      downloadsCount: 154,
      comments: [
        { id: 'c5', commenterName: 'Divya Soni', commentText: 'Life saver for first-year students! Solved examples are really clear.', date: '2026-06-01' }
      ]
    }
  ];

  for (const seed of seeds) {
    const pdfBlob = makeMinimalPDFBlob(seed.title, seed.subjectCode, seed.category);
    await saveDocument(seed, pdfBlob);
  }
};
