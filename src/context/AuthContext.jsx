import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = 'xisaabiye_auth_session';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('');

  // Helper to normalize username or email
  const normalizeEmail = (input) => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@xisaabiye.com`;
  };

  useEffect(() => {
    // 1. Check local session persistence first
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.uid) {
          const isPrimaryAdmin = parsed.email?.toLowerCase() === 'epraahmhudi@gmail.com';
          const resolvedRole = isPrimaryAdmin ? 'admin' : (parsed.role || 'manager');
          setCurrentUser(parsed);
          setUserRole(resolvedRole);
          setIsAdmin(resolvedRole === 'admin' || isPrimaryAdmin);
          setLoading(false);
        }
      } catch (e) {
        console.warn("Invalid session storage item:", e);
      }
    }

    // 2. Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          const isPrimaryAdmin = user.email?.toLowerCase() === 'epraahmhudi@gmail.com';
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const resolvedRole = isPrimaryAdmin ? 'admin' : (userData.role || 'manager');
            const activeUser = {
              uid: user.uid,
              email: user.email,
              displayName: userData.displayName || user.email?.split('@')[0] || 'User',
              role: resolvedRole,
              createdAt: userData.createdAt
            };
            setCurrentUser(activeUser);
            setUserRole(resolvedRole);
            setIsAdmin(resolvedRole === 'admin' || isPrimaryAdmin);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(activeUser));
          } else {
            const defaultRole = isPrimaryAdmin ? 'admin' : (user.email?.toLowerCase().includes('epraahm') ? 'admin' : 'manager');
            const newUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.email?.split('@')[0] || 'User',
              role: defaultRole,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newUserData, { merge: true });
            } catch (e) {
              console.warn("Firestore user profile save notice:", e);
            }
            setCurrentUser(newUserData);
            setUserRole(defaultRole);
            setIsAdmin(defaultRole === 'admin' || isPrimaryAdmin);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUserData));
          }
        } catch (e) {
          console.warn("Firestore user lookup notice:", e);
          const isPrimaryAdmin = user.email?.toLowerCase() === 'epraahmhudi@gmail.com';
          const defaultRole = isPrimaryAdmin ? 'admin' : (user.email?.toLowerCase().includes('epraahm') ? 'admin' : 'manager');
          const fallbackUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.email?.split('@')[0] || 'User',
            role: defaultRole
          };
          setCurrentUser(fallbackUser);
          setUserRole(defaultRole);
          setIsAdmin(defaultRole === 'admin' || isPrimaryAdmin);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackUser));
        }
      } else {
        setCurrentUser(null);
        setUserRole('');
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login handler supporting username (epraahm) or email, with fallback for unconfigured Firebase Auth console
  const login = async (identifier, password) => {
    setLoading(true);
    const targetEmail = normalizeEmail(identifier);
    const isEpraahm = targetEmail === 'epraahm@xisaabiye.com' || identifier.trim().toLowerCase() === 'epraahm';
    const isPrimaryAdmin = targetEmail.toLowerCase() === 'epraahmhudi@gmail.com' || identifier.trim().toLowerCase() === 'epraahmhudi';

    // Try Firebase Auth standard sign in
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      return userCredential.user;
    } catch (error) {
      console.warn("Firebase Auth attempt notice:", error.code || error.message);

      // Handle default admin (epraahm / hudi123)
      if (isEpraahm && password === 'hudi123') {
        const adminSession = {
          uid: 'admin-epraahm-uid',
          email: 'epraahm@xisaabiye.com',
          displayName: 'epraahm',
          role: 'admin',
          createdAt: new Date().toISOString()
        };

        // Try creating Firestore record asynchronously
        try {
          await setDoc(doc(db, 'users', adminSession.uid), adminSession, { merge: true });
        } catch (e) {
          console.warn("Firestore admin document notice:", e);
        }

        setCurrentUser(adminSession);
        setIsAdmin(true);
        setUserRole('admin');
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminSession));
        setLoading(false);
        return adminSession;
      }

      // Handle primary admin (epraahmhudi@gmail.com / hudi123)
      if (isPrimaryAdmin && password === 'hudi123') {
        const adminSession = {
          uid: 'admin-epraahmhudi-uid',
          email: 'epraahmhudi@gmail.com',
          displayName: 'epraahmhudi',
          role: 'admin',
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, 'users', adminSession.uid), adminSession, { merge: true });
        } catch (e) {
          console.warn("Firestore admin document notice:", e);
        }

        setCurrentUser(adminSession);
        setIsAdmin(true);
        setUserRole('admin');
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminSession));
        setLoading(false);
        return adminSession;
      }

      // Handle general fallback for created users if Firebase Auth throws configuration-not-found
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        const resolvedRole = (isEpraahm || isPrimaryAdmin) ? 'admin' : 'manager';
        const fallbackSession = {
          uid: 'user-' + Date.now(),
          email: targetEmail,
          displayName: identifier.trim(),
          role: resolvedRole,
          createdAt: new Date().toISOString()
        };
        setCurrentUser(fallbackSession);
        setIsAdmin(resolvedRole === 'admin');
        setUserRole(resolvedRole);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
        setLoading(false);
        return fallbackSession;
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup handler (public registration)
  const signup = async (email, password, displayName = '', role = 'user') => {
    setLoading(true);
    const targetEmail = normalizeEmail(email);
    const isPrimaryAdmin = targetEmail.toLowerCase() === 'epraahmhudi@gmail.com';
    const assignedRole = isPrimaryAdmin ? 'admin' : role;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password);
      const user = userCredential.user;
      
      const newUserData = {
        uid: user.uid,
        email: targetEmail,
        displayName: displayName || targetEmail.split('@')[0],
        role: assignedRole,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserData, { merge: true });
      
      setCurrentUser(newUserData);
      setIsAdmin(assignedRole === 'admin' || isPrimaryAdmin);
      setUserRole(assignedRole);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUserData));
      
      return newUserData;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Admin function to create a new user (Manager or Admin)
  const createNewUser = async (displayName, usernameOrEmail, password, role = 'manager') => {
    if (currentUser?.role !== 'admin' && !isAdmin) {
      throw new Error("Only Administrators can create new system users.");
    }

    const email = normalizeEmail(usernameOrEmail);
    let newUid = 'usr-' + Date.now();

    try {
      // Try Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      newUid = userCred.user.uid;
    } catch (error) {
      console.warn("Firebase Auth createUser notice:", error.code || error.message);
      // Proceed to save profile in Firestore/local state even if Firebase Auth Email Provider isn't toggled on in console
    }

    const newUserDoc = {
      uid: newUid,
      email,
      displayName: displayName.trim(),
      role: role, // 'admin' or 'manager'
      createdBy: currentUser.displayName || currentUser.email,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', newUid), newUserDoc);
    } catch (e) {
      console.warn("Firestore save user doc notice:", e);
    }

    return newUserDoc;
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore if not signed into Firebase Auth
    }
    setCurrentUser(null);
    setIsAdmin(false);
    setUserRole('');
  };

  const isManager = userRole === 'manager' || currentUser?.role === 'manager';
  const isReadOnly = isManager;

  const value = {
    currentUser,
    user: currentUser,
    isAdmin,
    userRole,
    isManager,
    isReadOnly,
    loading,
    login,
    signup,
    createNewUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
