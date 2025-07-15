// commandParser.js
// Parses commands like 'u10^2' into structured objects

/**
 * Parse a conductor command string
 * @param {string} cmd
 * @returns {Object|null} e.g. { generator: 'u', count: 10, duration: 2 }
 */
/**
 * Parse sf (sine fade cloud) command, e.g. sf20-440^1*5v1)^10
 * Returns null if not matched, else params object
 */
function parseSfCommand(cmd) {
  // Regex: sf20-440^1*5rv1)^10v3
  const re = /^sf(\d+)-(\d+)(?:\^(\d+\.?\d*)?)?\*(\d+)(r?)(v\d+|vr)?\)\^(\d+)(v\d+)?$/i;
  const m = cmd.match(re);
  if (!m) return null;
  const [_, minF, maxF, dur, count, freqRand, volMod, window, overallVol] = m;
  return {
    generator: 'sf',
    minFreq: parseFloat(minF),
    maxFreq: parseFloat(maxF),
    dur: dur ? parseFloat(dur) : 1,
    count: parseInt(count),
    freqRand: freqRand === 'r',
    volRand: volMod === 'vr',
    vol: (volMod && volMod.startsWith('v') && !volMod.endsWith('r')) ? parseInt(volMod.slice(1)) : null,
    window: parseFloat(window),
    overallVol: overallVol ? parseInt(overallVol.slice(1)) : null
  };
}

function parseCommand(cmd) {
  // Sine fade cloud generator: sf...
  const sf = parseSfCommand(cmd);
  if (sf) return sf;
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
