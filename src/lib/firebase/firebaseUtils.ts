import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface AnimationSection {
  heading: string;
  lineIndex: number;
  content: string;
}

interface Report {
  id?: string;
  userId: string;
  title: string;
  content: string;
  animations: AnimationSection[];
  createdAt: Date;
  updatedAt: Date;
}

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Report functions
export const saveReport = async (report: Omit<Report, 'id'>) => {
  const reportsRef = collection(db, 'reports');
  return addDoc(reportsRef, {
    ...report,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

export const getReports = async (userId: string): Promise<Report[]> => {
  try {
    console.log('Starting getReports for userId:', userId);
    const reportsRef = collection(db, 'reports');
    
    // Use a simpler query without ordering to avoid index requirements
    const q = query(reportsRef, where('userId', '==', userId));
    console.log('Created simple query');
    
    const querySnapshot = await getDocs(q);
    console.log('Got query snapshot, number of docs:', querySnapshot.size);
    
    if (querySnapshot.empty) {
      console.log('No reports found for user');
      return [];
    }
    
    const reports = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title || '',
        content: data.content || '',
        animations: data.animations || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Report;
    });
    
    // Sort reports by createdAt on the client side
    const sortedReports = reports.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    console.log('Successfully processed reports:', sortedReports.length);
    return sortedReports;
  } catch (error: any) {
    console.error('Error in getReports:', error);
    
    // Check if it's a Firebase initialization error
    if (!db || !auth) {
      throw new Error('Firebase not initialized. Please check your configuration.');
    }
    
    // Network or connection errors
    if (error.code === 'failed-precondition' || error.code === 'unavailable') {
      throw new Error('Unable to connect to the database. Please check your internet connection.');
    }
    
    // Permission errors
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to access these reports.');
    }
    
    // Generic error
    throw new Error(`Failed to load reports: ${error.message}`);
  }
};

export const getReport = async (reportId: string): Promise<Report> => {
  const reportRef = doc(db, 'reports', reportId);
  const reportDoc = await getDoc(reportRef);
  if (!reportDoc.exists()) {
    throw new Error('Report not found');
  }
  return {
    id: reportDoc.id,
    ...reportDoc.data()
  } as Report;
};

export const deleteReport = async (reportId: string) => {
  const reportRef = doc(db, 'reports', reportId);
  await deleteDoc(reportRef);
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
