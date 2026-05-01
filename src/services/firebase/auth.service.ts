import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { User } from '@/types/user.types';
import { authModular as auth, dbModular as db } from './config';

function mapAuthError(error: any): Error {
  const code = error?.code || '';
  const originalMessage = error?.message || '';
  let message = "Ocorreu um erro na autenticação.";
  
  if (code === 'auth/user-not-found') message = "Usuário não encontrado";
  else if (code === 'auth/wrong-password') message = "Senha incorreta";
  else if (code === 'auth/email-already-in-use') message = "Este e-mail já está em uso";
  else if (code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres";
  else if (code === 'auth/invalid-email') message = "E-mail inválido";
  else if (code === 'auth/operation-not-allowed') message = "Operação não permitida. Ative o E-mail/Senha no console do Firebase.";
  else if (originalMessage) message = `Erro: ${originalMessage}`;
  
  return new Error(message);
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    
    throw new Error('Usuário não encontrado no banco de dados.');
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function signUpWithEmail(email: string, password: string, name: string, phone: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    const newUser: User = {
      id: uid,
      name,
      email,
      phone,
      avatar: null,
      bio: '',
      verified: false,
      rating: 0,
      totalSales: 0,
      totalReviews: 0,
      city: '',
      state: '',
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', uid), newUser);
    return newUser;
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function updateUserProfile(data: Partial<User>): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, data as any);
  } catch (error) {
    throw new Error('Erro ao atualizar perfil.');
  }
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          callback({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          callback(null);
        }
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}
