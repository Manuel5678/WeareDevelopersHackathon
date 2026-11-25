import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

const MAX_DISPLAY_NAME = 100;
const MAX_EMAIL = 254;
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function sanitizeProfilePayload(user: User) {
  const uid = user.uid;
  if (!VALID_ID_REGEX.test(uid) || uid.length > 128) {
    throw new Error('Invalid user identifier format.');
  }
  const rawName = (user.displayName || user.email?.split('@')[0] || 'User').trim();
  const displayName = rawName.slice(0, MAX_DISPLAY_NAME) || 'User';
  const email = (user.email || '').trim().slice(0, MAX_EMAIL);
  return { uid, displayName, email };
}

async function syncUserProfile(user: User) {
  if (!user.emailVerified || !user.email) {
    return;
  }

  const profilePath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const { uid, displayName, email } = sanitizeProfilePayload(user);

  let exists = false;
  try {
    const snap = await getDoc(userRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  if (!exists) {
    try {
      await setDoc(userRef, {
        uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, profilePath);
    }
  } else {
    try {
      await updateDoc(userRef, {
        displayName,
        email,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, profilePath);
    }
  }
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        try {
          await syncUserProfile(nextUser);
        } catch (error) {
          console.error('Failed to sync user profile:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <FirebaseContext.Provider value={{ user, authReady, signInWithGoogle, logout }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
