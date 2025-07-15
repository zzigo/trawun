// pulseGenerator.js
// Generates random pulse schedules for performers

/**
 * Generate pulse schedules for performers
 * @param {Object[]} performers - Array of performer objects (id, name, etc)
 * @param {number} count - Total number of pulses
 * @param {number} duration - Total duration in seconds
 * @returns {Object} - Map of performerId -> [timestamps in seconds]
 */
function generatePulseSchedule(performers, count, duration) {
  const result = {};
  // Initialize result for each performer
  performers.forEach(p => result[p.id] = []);
  // Randomly assign each pulse
  for (let i = 0; i < count; i++) {
    const performer = performers[Math.floor(Math.random() * performers.length)];
    const t = Math.random() * duration;
    result[performer.id].push(t);
  }
  // Sort each performer's schedule
  Object.values(result).forEach(arr => arr.sort((a, b) => a - b));
  return result;
}

module.exports = { generatePulseSchedule };
