import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from './firebase';

const getMockUser = () => JSON.parse(localStorage.getItem('mock_user') || 'null');
const setMockUser = (user) => {
  localStorage.setItem('mock_user', JSON.stringify(user));
  window.dispatchEvent(new Event('mock-auth-changed'));
};

/**
 * Registers a new user using email and password.
 */
export const signUpWithEmail = async (email, password) => {
  if (!auth) {
    const user = { uid: 'local-' + Date.now(), email, displayName: email.split('@')[0] };
    setMockUser(user);
    return user;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw processAuthError(error);
  }
};

/**
 * Logs in an existing user using email and password, setting persistence to LOCAL.
 */
export const loginWithEmail = async (email, password, rememberMe = true) => {
  if (!auth) {
    const user = { uid: 'local-user', email, displayName: email.split('@')[0] };
    setMockUser(user);
    return user;
  }
  try {
    // We enforce local persistence by default for the "Remember Me" flow.
    // If not rememberMe, you might set it to browserSessionPersistence.
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw processAuthError(error);
  }
};

/**
 * Logs out the currently authenticated user.
 */
export const logoutUser = async () => {
  if (!auth) {
    setMockUser(null);
    return;
  }
  try {
    await signOut(auth);
  } catch (error) {
    throw processAuthError(error);
  }
};

/**
 * Sends a password reset email to the given address.
 */
export const resetPassword = async (email) => {
  if (!auth) return;
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw processAuthError(error);
  }
};

/**
 * Helper function to parse Firebase auth errors into user-friendly messages.
 */
const processAuthError = (error) => {
  let message = 'An unexpected error occurred. Please try again.';
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'An account with this email already exists.';
      break;
    case 'auth/invalid-email':
      message = 'Please enter a valid email address.';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters.';
      break;
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      message = 'Invalid email or password.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed login attempts. Please try again later.';
      break;
    default:
      console.error('Unhandled Auth Error:', error);
      break;
  }
  return new Error(message);
};
