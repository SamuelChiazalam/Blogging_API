// This file contains the algorithm for calculating reading time

/**
 * Calculate the estimated reading time for a blog post
 *
 * Algorithm:
 * 1. Count the total number of words in the blog body
 * 2. Divide by average reading speed (200 words per minute)
 * 3. Round up to nearest minute
 *
 * @param {String} text - The blog content (body)
 * @returns {Number} - Estimated reading time in minutes
 */
const calculateReadingTime = (text) => {
  // If no text provided, return 0
  if (!text || typeof text !== "string") {
    return 0;
  }

  // Remove extra whitespace and split into words
  // This regex matches sequences of non-whitespace characters
  const words = text.trim().split(/\s+/);

  // Count total words
  const wordCount = words.length;

  // Average reading speed (words per minute)
  // Most adults read at 200-250 words per minute
  // We use 200 to be conservative
  const wordsPerMinute = 200;

  // Calculate reading time in minutes
  const readingTime = wordCount / wordsPerMinute;

  // Round up to nearest minute
  // Math.ceil ensures we always round up (e.g., 1.1 minutes becomes 2 minutes)
  // Minimum of 1 minute for any blog post
  return Math.ceil(readingTime) || 1;
};

// Export the function
module.exports = calculateReadingTime;
