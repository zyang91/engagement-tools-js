const STORAGE_KEY = 'engagement-feedback';

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
    // Small artificial delay to mimic real network behaviour
    await new Promise((resolve) => setTimeout(resolve, 300));

    const record = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...feedbackData,
      submittedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

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

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
