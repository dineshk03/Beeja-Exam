import CryptoJS from 'crypto-js';

// Encryption key - should be stored in environment variables in production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'exam-secure-key-2024-change-in-production';

/**
 * Encrypt data using AES-256
 * @param {*} data - Data to encrypt (will be stringified)
 * @returns {string} - Encrypted string
 */
export const encrypt = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

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
 * Encrypt individual question
 * @param {Object} question - Question object
 * @returns {Object} - Encrypted question with metadata
 */
export const encryptQuestion = (question) => {
  return {
    _id: question._id,
    encrypted: true,
    data: encrypt(question)
  };
};

/**
 * Encrypt array of questions
 * @param {Array} questions - Array of question objects
 * @returns {Array} - Array of encrypted questions
 */
export const encryptQuestions = (questions) => {
  return questions.map(q => encryptQuestion(q));
};

/**
 * Decrypt individual question
 * @param {Object} encryptedQuestion - Encrypted question object
 * @returns {Object} - Decrypted question
 */
export const decryptQuestion = (encryptedQuestion) => {
  if (!encryptedQuestion.encrypted) {
    return encryptedQuestion; // Already decrypted
  }
  return decrypt(encryptedQuestion.data);
};

/**
 * Decrypt array of questions
 * @param {Array} encryptedQuestions - Array of encrypted question objects
 * @returns {Array} - Array of decrypted questions
 */
export const decryptQuestions = (encryptedQuestions) => {
  return encryptedQuestions.map(q => decryptQuestion(q));
};

/**
 * Hash sensitive data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed string
 */
export const hash = (data) => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Generate secure random token
 * @param {number} length - Length of token
 * @returns {string} - Random token
 */
export const generateToken = (length = 32) => {
  return CryptoJS.lib.WordArray.random(length).toString();
};
