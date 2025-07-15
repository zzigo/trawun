// commandParser.js
// Parses commands like 'u10^2' into structured objects

/**
 * Parse a conductor command string
 * @param {string} cmd
 * @returns {Object|null} e.g. { generator: 'u', count: 10, duration: 2 }
 */
function parseCommand(cmd) {
  // Sine generator: s, s220, s^2, s220^2
  let sMatch = cmd.match(/^s(\d+)?(?:\^(\d*\.?\d+))?$/i);
  if (sMatch) {
    // Defaults: freq=220, dur=1
    return {
      generator: 's',
      freq: sMatch[1] ? parseFloat(sMatch[1]) : 220,
      dur: sMatch[2] ? parseFloat(sMatch[2]) : 1
    };
  }
  // Legacy: u10^2
  const match = cmd.match(/([a-zA-Z]+)(\d+)\^(\d*\.?\d+)/);
  if (match) {
    return {
      generator: match[1],
      count: parseInt(match[2], 10),
      duration: parseFloat(match[3])
    };
  }
  return null;
}

module.exports = { parseCommand };
