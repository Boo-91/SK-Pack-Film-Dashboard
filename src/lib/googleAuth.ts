import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const ALLOWED_EMAIL_DOMAIN = 'dplusonline.net';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
  hd: ALLOWED_EMAIL_DOMAIN,
});

export function isAllowedCompanyEmail(email?: string | null): boolean {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0) return false;
  const domain = trimmed.slice(atIndex + 1);
  return domain === ALLOWED_EMAIL_DOMAIN;
}

export function initAuth(
  onAuthChange: (user: User | null) => void,
  onRejectedDomain?: (message: string) => void
) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && !isAllowedCompanyEmail(user.email)) {
      const rejectedEmail = user.email || 'this account';
      try {
        await auth.signOut();
      } catch {
        // Ignore signOut error
      }
      if (onRejectedDomain) {
        onRejectedDomain(
          `Access denied for ${rejectedEmail}. Only @${ALLOWED_EMAIL_DOMAIN} Google accounts are permitted.`
        );
      }
      onAuthChange(null);
      return;
    }

    onAuthChange(user);
  });
}

export async function googleSignIn(): Promise<User> {
  const result = await signInWithPopup(auth, provider);
  if (!isAllowedCompanyEmail(result.user.email)) {
    const rejectedEmail = result.user.email || 'this account';
    await auth.signOut();
    throw new Error(
      `Access denied for ${rejectedEmail}. Only @${ALLOWED_EMAIL_DOMAIN} Google accounts are permitted.`
    );
  }
  return result.user;
}

export async function getCurrentUserIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  if (!isAllowedCompanyEmail(auth.currentUser.email)) return null;
  return auth.currentUser.getIdToken();
}

export async function logout(): Promise<void> {
  await auth.signOut();
}

export function formatAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const message =
    err instanceof Error ? err.message : 'Unable to sign in with Google.';

  if (
    code === 'auth/unauthorized-domain' ||
    message.includes('unauthorized-domain')
  ) {
    const host =
      typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Domain "${host}" is not authorized in Firebase Authentication. Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains.`;
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in window was closed before completing authentication.';
  }

  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Allow popups for this site and try again.';
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'Previous sign-in request was cancelled. Please try again.';
  }

  return message;
}
