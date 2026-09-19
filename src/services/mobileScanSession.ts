import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { firestoreDb } from './pathologyFirebase';

export interface MobileScanSessionDoc {
  sessionId: string;
  status: 'waiting' | 'uploaded' | 'completed' | 'expired';
  imageBase64?: string;
  mimeType?: string;
  createdAt?: any;
  uploadedAt?: string;
}

const SCAN_SESSIONS_COLLECTION = 'scan_sessions';

/**
 * Creates a temporary scan session for mobile camera capture.
 */
export async function createMobileScanSession(): Promise<{ sessionId: string; sessionUrl: string }> {
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const sessionId = `scan_${Date.now()}_${randomSuffix}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://labnova.com';
  const sessionUrl = `${origin}/?mobileScanSession=${sessionId}`;

  const sessionRef = doc(firestoreDb, SCAN_SESSIONS_COLLECTION, sessionId);
  await setDoc(sessionRef, {
    sessionId,
    status: 'waiting',
    createdAt: serverTimestamp(),
  });

  return { sessionId, sessionUrl };
}

/**
 * Listens in real-time to a mobile scan session until an image is uploaded or completed.
 */
export function subscribeToMobileScanSession(
  sessionId: string,
  onUpdate: (data: MobileScanSessionDoc) => void,
  onError?: (err: any) => void
): () => void {
  const sessionRef = doc(firestoreDb, SCAN_SESSIONS_COLLECTION, sessionId);
  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as MobileScanSessionDoc);
      }
    },
    (err) => {
      console.error('Error listening to mobile scan session:', err);
      onError?.(err);
    }
  );
}

/**
 * Called by the mobile device to securely send the captured photo to the PC session.
 */
export async function submitMobileCapturedImage(
  sessionId: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<void> {
  const sessionRef = doc(firestoreDb, SCAN_SESSIONS_COLLECTION, sessionId);
  await updateDoc(sessionRef, {
    status: 'uploaded',
    imageBase64,
    mimeType,
    uploadedAt: new Date().toISOString(),
  });
}

/**
 * Marks session as completed or expired.
 */
export async function markMobileScanCompleted(sessionId: string): Promise<void> {
  try {
    const sessionRef = doc(firestoreDb, SCAN_SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      status: 'completed',
    });
  } catch (err) {
    console.warn('Could not mark session completed:', err);
  }
}
