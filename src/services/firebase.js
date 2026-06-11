import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  arrayUnion
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

// Import local fallback operations
import { 
  getAllDocuments, 
  saveDocument, 
  deleteDocument, 
  updateDocumentMetadata,
  getFileBlob,
  seedDatabaseIfEmpty
} from './db';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials are properly filled (not containing placeholder template strings)
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key_here' && 
  firebaseConfig.apiKey.trim() !== '';

let app, auth, db, storage;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase initialized successfully in cloud mode.");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
} else {
  console.log("Running in Local Sandbox mode (IndexedDB + LocalStorage) because VITE_FIREBASE_API_KEY is not configured.");
}

// ----------------------------------------------------
// Authentication Helpers
// ----------------------------------------------------

export const registerUser = async (name, email, password) => {
  if (isFirebaseConfigured) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return {
      id: userCredential.user.uid,
      name: name,
      email: userCredential.user.email
    };
  } else {
    // Local fallback
    const users = JSON.parse(localStorage.getItem('vgu_users') || '[]');
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      throw new Error("Email already registered");
    }
    const newUser = { id: 'user-' + Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('vgu_users', JSON.stringify(users));
    return newUser;
  }
};

export const loginUser = async (email, password) => {
  if (isFirebaseConfigured) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      id: userCredential.user.uid,
      name: userCredential.user.displayName || userCredential.user.email.split('@')[0],
      email: userCredential.user.email
    };
  } else {
    // Local fallback
    const users = JSON.parse(localStorage.getItem('vgu_users') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    return user;
  }
};

export const logoutUser = async () => {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
};

// Monitor Auth Session
export const subscribeToAuth = (callback) => {
  if (isFirebaseConfigured) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email
        });
      } else {
        callback(null);
      }
    });
  } else {
    // For local mode, we pull from localStorage on mount. Changes are handled manually.
    const user = localStorage.getItem('vgu_current_user');
    callback(user ? JSON.parse(user) : null);
    return () => {};
  }
};

// ----------------------------------------------------
// PDF Documents / Database CRUD operations
// ----------------------------------------------------

// Seeding documents to Firestore if empty
const seedFirestoreIfEmpty = async () => {
  if (!isFirebaseConfigured) return;
  
  try {
    const q = query(collection(db, 'documents'));
    const snapshot = await getDocs(q);
    if (snapshot.size > 0) return; // Already seeded

    console.log("Seeding initial notes to Firestore...");

    // Minimal PDF builder
    const makeMinimalPDFBlob = (title, subject, category) => {
      const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [ 0 0 595 842 ] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 150 >>\nstream\nBT\n/F1 16 Tf\n50 750 Td\n(VGU STUDY HUB - Cloud Seed)\nTj\n0 -30 Td\n(Subject: ${subject})\nTj\n0 -20 Td\n(Document: ${title})\nTj\n0 -20 Td\n(Category: ${category})\nTj\nET\nendstream\nendobj\ntrailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF`;
      const bytes = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) {
        bytes[i] = content.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'application/pdf' });
    };

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
      }
    ];

    for (const seed of seeds) {
      const pdfBlob = makeMinimalPDFBlob(seed.title, seed.subjectCode, seed.category);
      const storageRef = ref(storage, `notes/${seed.id}-${seed.fileName}`);
      await uploadBytes(storageRef, pdfBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      const seedDoc = {
        ...seed,
        downloadUrl,
        storagePath: storageRef.fullPath
      };

      await setDoc(doc(db, 'documents', seed.id), seedDoc);
    }
    console.log("Firestore seeding completed successfully.");
  } catch (err) {
    console.error("Firestore seeding error:", err);
  }
};

// Fetch and listen for documents updates
export const subscribeToDocuments = (onUpdate, onError) => {
  if (isFirebaseConfigured) {
    // Trigger lazy Firestore seeding if empty
    seedFirestoreIfEmpty();

    const q = query(collection(db, 'documents'), orderBy('uploadDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      onUpdate(docs);
    }, onError);
  } else {
    // Local fallback: load once and push to updater
    const loadLocal = async () => {
      try {
        await seedDatabaseIfEmpty();
        const docs = await getAllDocuments();
        // Sort by upload date desc
        docs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        onUpdate(docs);
      } catch (err) {
        if (onError) onError(err);
      }
    };
    loadLocal();
    // Return empty cleanup function
    return () => {};
  }
};

// Upload document (file to storage, metadata to Firestore)
export const uploadDocumentCloud = async (docMeta, fileBlob) => {
  if (isFirebaseConfigured) {
    // 1. Upload file to Firebase storage
    const storagePath = `notes/${docMeta.id}-${docMeta.fileName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, fileBlob);

    // 2. Fetch public download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // 3. Write metadata to Firestore
    const finalDoc = {
      ...docMeta,
      downloadUrl,
      storagePath
    };
    await setDoc(doc(db, 'documents', docMeta.id), finalDoc);
    return finalDoc;
  } else {
    // Local fallback
    await saveDocument(docMeta, fileBlob);
    return docMeta;
  }
};

// Fetch file blob (for inline iframe rendering or downloads)
export const getDocumentBlob = async (id, fallbackDownloadUrl) => {
  if (isFirebaseConfigured) {
    if (fallbackDownloadUrl) {
      // Fetch the file as a Blob using download URL
      const res = await fetch(fallbackDownloadUrl);
      return await res.blob();
    }
    return null;
  } else {
    // Local fallback
    return await getFileBlob(id);
  }
};

// Delete note and file
export const deleteDocumentCloud = async (id, storagePath) => {
  if (isFirebaseConfigured) {
    // 1. Delete document metadata from Firestore
    await deleteDoc(doc(db, 'documents', id));

    // 2. Delete file from Firebase Storage
    if (storagePath) {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    }
  } else {
    // Local fallback
    await deleteDocument(id);
  }
};

// Post a comment
export const addCommentCloud = async (docId, commentObj) => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, 'documents', docId);
    await updateDoc(docRef, {
      comments: arrayUnion(commentObj)
    });
  } else {
    // Local fallback
    const docs = await getAllDocuments();
    const targetDoc = docs.find(d => d.id === docId);
    if (targetDoc) {
      targetDoc.comments = [commentObj, ...targetDoc.comments];
      await updateDocumentMetadata(targetDoc);
    }
  }
};

// Post a rating
export const rateDocumentCloud = async (docId, ratingValue) => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, 'documents', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const docData = docSnap.data();
      const newTotalStars = (docData.totalStars || 0) + ratingValue;
      const newRatingsCount = (docData.ratingsCount || 0) + 1;
      const newAverageRating = parseFloat((newTotalStars / newRatingsCount).toFixed(1));

      await updateDoc(docRef, {
        totalStars: newTotalStars,
        ratingsCount: newRatingsCount,
        rating: newAverageRating
      });
    }
  } else {
    // Local fallback
    const docs = await getAllDocuments();
    const targetDoc = docs.find(d => d.id === docId);
    if (targetDoc) {
      const newTotalStars = targetDoc.totalStars + ratingValue;
      const newRatingsCount = targetDoc.ratingsCount + 1;
      const newAverageRating = parseFloat((newTotalStars / newRatingsCount).toFixed(1));
      
      targetDoc.totalStars = newTotalStars;
      targetDoc.ratingsCount = newRatingsCount;
      targetDoc.rating = newAverageRating;

      await updateDocumentMetadata(targetDoc);
    }
  }
};

// Track and update downloads count
export const incrementDownloadsCloud = async (docId) => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, 'documents', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentDownloads = docSnap.data().downloadsCount || 0;
      await updateDoc(docRef, {
        downloadsCount: currentDownloads + 1
      });
    }
  } else {
    // Local fallback
    const docs = await getAllDocuments();
    const targetDoc = docs.find(d => d.id === docId);
    if (targetDoc) {
      targetDoc.downloadsCount = targetDoc.downloadsCount + 1;
      await updateDocumentMetadata(targetDoc);
    }
  }
};
