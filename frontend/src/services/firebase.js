// Firebase configuration for YemenMarket
// Project: yemenmarket-b8137

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// TODO: Replace with your actual Web Config from Firebase Console
// Firebase Console → Project Settings → Your apps → Web app → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyAD-N2Gv0wlOPkJ__Fu35ozmxlZsDVQWTE",
  authDomain: "yemenmarket-b8137.firebaseapp.com",
  projectId: "yemenmarket-b8137",
  storageBucket: "yemenmarket-b8137.firebasestorage.app",
  messagingSenderId: "283582430224",
  appId: "1:283582430224:web:db7c3aea3a3f24873ade95"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Setup invisible reCAPTCHA on a DOM element.
 * @param {string} containerId - ID of the DOM element for reCAPTCHA
 */
export const setupRecaptcha = async (containerId) => {
  // Clear any previous verifier
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch (_) {}
    window.recaptchaVerifier = null;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      window.recaptchaVerifier = null;
    }
  });

  // Render explicitly to detect reCAPTCHA errors early
  await verifier.render();
  window.recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Send OTP to a Yemen phone number.
 * @param {string} phone - e.g. "771234567" (without country code)
 * @returns {Promise<ConfirmationResult>}
 */
export const sendPhoneOTP = async (phone) => {
  // Normalize to international format
  const cleaned = phone.replace(/\D/g, '').replace(/^0+/, '');
  const normalized = cleaned.startsWith('967') ? `+${cleaned}` : `+967${cleaned}`;

  const appVerifier = await setupRecaptcha('recaptcha-container');
  const confirmationResult = await signInWithPhoneNumber(auth, normalized, appVerifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
};

/**
 * Verify OTP and get Firebase ID token.
 * @param {string} otp - 6-digit OTP from SMS
 * @returns {Promise<string>} Firebase ID token
 */
export const verifyPhoneOTP = async (otp) => {
  if (!window.confirmationResult) throw new Error('لم يتم إرسال رمز التحقق بعد');
  const result = await window.confirmationResult.confirm(otp);
  const idToken = await result.user.getIdToken();
  return idToken;
};
