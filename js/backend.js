// set uop firestore bankend connection
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBzxNleGg-uarKjHON_axWaNJ0EltofVgo",
    authDomain: "engagement-project-1597c.firebaseapp.com",
    projectId: "engagement-project-1597c",
    storageBucket: "engagement-project-1597c.firebasestorage.app",
    messagingSenderId: "691010878556",
    appId: "1:691010878556:web:555652f47ffd61e570ba99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const Backend = {
  /**
   * In-memory cache of feedback submissions for this session.
   * @type {Array<Object>}
   */
  feedback: [],

  /**
   * Save a new feedback entry from the map form.
   * @param {Object} feedbackData - The feedback data to save.
   * @param {string} feedbackData.locationCoordinates - "lng, lat" string from the map.
   * @param {string} feedbackData.feedbackType - Category of feedback (issue, safety, etc.).
   * @param {string} feedbackData.feedbackText - Free-text description.
   * @param {string} [feedbackData.contactName] - Optional name.
   * @param {string} [feedbackData.contactEmail] - Optional email.
  * @return {Promise<Object>} The saved feedback with generated id and timestamps.
   */
  async saveFeedback(feedbackData) {
    const record = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...feedbackData,
      submittedAt: new Date().toISOString(),
    };

    // Save to Firestore
    try {
        const coll = collection(db, 'feedbacks');
        const docRef = await addDoc(coll, record);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }

    Backend.feedback.push(record);
    console.log('Feedback saved:', record);
    return record;
  },

  /**
   * Load all stored feedback entries from localStorage into memory.
   * Safe to call multiple times.
  * @return {Promise<Array<Object>>}
   */
  async loadFeedback() {
    if (Backend.feedback.length > 0) {
      return Backend.feedback;
    }

    const coll = collection(db, 'feedbacks');
    const querySnapshot = await getDocs(coll);
    const stored = [];
    querySnapshot.forEach((doc) => {
        stored.push(doc.data());
    });
    Backend.feedback = stored;
    return stored;
  },

  /**
   * Get all stored feedback entries.
  * @return {Promise<Array<Object>>}
   */
  async getFeedback() {
    await Backend.loadFeedback();
    return Backend.feedback;
  },
};

export { Backend };
