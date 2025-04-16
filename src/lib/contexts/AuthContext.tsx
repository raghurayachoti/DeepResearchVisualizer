"use client";

import React, { createContext, useEffect, useState } from "react";
import { 
  signInWithPopup,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  browserLocalPersistence,
  setPersistence,
  inMemoryPersistence
} from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "../firebase/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", { user: user?.email });
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    try {
      // First try with in-memory persistence
      try {
        await setPersistence(auth, inMemoryPersistence);
      } catch (persistenceError) {
        console.error("Failed to set persistence:", persistenceError);
        // Continue anyway as this isn't critical
      }
      
      console.log("Attempting popup sign-in...");
      const result = await signInWithPopup(auth, provider);
      console.log("Sign-in successful:", result.user.email);
      
      // Try to upgrade to local persistence after successful sign-in
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (localPersistenceError) {
        console.warn("Could not set local persistence:", localPersistenceError);
        // Not critical, continue with in-memory persistence
      }
    } catch (error: any) {
      console.error("Error during sign-in:", error);
      throw new Error(error.message || "Failed to sign in with Google");
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
