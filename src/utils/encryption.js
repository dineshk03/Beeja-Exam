import CryptoJS from 'crypto-js';

// Encryption key - must match server key
const ENCRYPTION_KEY = 'exam-secure-key-2024-change-in-production';

/**
 * Decrypt data using AES-256
 * @param {string} encryptedData - Encrypted string
 * @returns {*} - Decrypted and parsed data
 */
export const decrypt = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Decrypt individual question
 * @param {Object} encryptedQuestion - Encrypted question object
 * @returns {Object} - Decrypted question
 */
export const decryptQuestion = (encryptedQuestion) => {
  if (!encryptedQuestion.encrypted) {
    return encryptedQuestion; // Already decrypted or not encrypted
  }
  return decrypt(encryptedQuestion.data);
};

/**
 * Decrypt array of questions
 * @param {Array} encryptedQuestions - Array of encrypted question objects
 * @returns {Array} - Array of decrypted questions
 */
export const decryptQuestions = (encryptedQuestions) => {
  if (!Array.isArray(encryptedQuestions)) {
    return [];
  }
  return encryptedQuestions.map(q => decryptQuestion(q));
};
