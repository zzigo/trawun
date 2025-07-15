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
  // Accept bare sf command
  if (cmd.toLowerCase() === 'sf') {
    return {
      generator: 'sf',
      minFreq: 20,
      maxFreq: 440,
      dur: 1,
      count: 5, 
      freqRand: false,
      volRand: false,
      vol: 1,
      window: 10,
      overallVol: null,
      pan: 0 // Center pan by default
    };
  }
  
  // Extract all parameters in any order
  const params = {
    generator: 'sf',
    minFreq: 20,
    maxFreq: 440,
    dur: 1,
    count: 5,
    freqRand: false,
    volRand: false,
    vol: 1,
    window: 10,
    overallVol: null,
    pan: 0 // Center pan by default
  };
  
  // Check for basic frequency pattern sf20-440 or sf-20-440
  const freqRe = /sf-?(\d+)-?(\d+)/i;
  const freqMatch = cmd.match(freqRe);
  if (freqMatch) {
    params.minFreq = parseFloat(freqMatch[1]);
    params.maxFreq = parseFloat(freqMatch[2]);
  }
  
  // Duration ^1 or ^.1 (decimal durations)
  const durRe = /\^(\d*\.?\d+)/i;
  const durMatch = cmd.match(durRe);
  if (durMatch) {
    params.dur = parseFloat(durMatch[1]);
    console.log(`Parsed duration: ${durMatch[1]} → ${params.dur}s`);
  }
  
  // Count *5
  const countRe = /\*(\d+)/i;
  const countMatch = cmd.match(countRe);
  if (countMatch) {
    params.count = parseInt(countMatch[1]);
  }
  
  // Random frequencies using ? or r (for backward compatibility)
  if (cmd.includes('?') || cmd.includes('r')) {
    params.freqRand = true;
  }
  
  // Volume v1 or v?
  const volRe = /v(\d+|\?)/i;
  const volMatch = cmd.match(volRe);
  if (volMatch) {
    if (volMatch[1] === '?') {
      params.volRand = true;
    } else {
      params.vol = parseInt(volMatch[1]);
    }
  }
  
  // Window )^10
  const winRe = /\)\^(\d+)/i;
  const winMatch = cmd.match(winRe);
  if (winMatch) {
    params.window = parseInt(winMatch[1]);
  }
  
  // Pan p1 or p? or p-1 (-1 left, 0 center, 1 right)
  const panRe = /p(-?\d+(\.\d+)?|\?)/i;
  const panMatch = cmd.match(panRe);
  if (panMatch) {
    if (panMatch[1] === '?') {
      // Random pan between -1 and 1
      params.panRand = true;
    } else {
      params.pan = parseFloat(panMatch[1]);
      // Ensure pan is between -1 and 1
      params.pan = Math.max(-1, Math.min(1, params.pan));
    }
  }
  
  return params;
}

window.parseCommand = function parseCommand(cmd) {
  // Sine fade cloud generator: sf...
  const sf = parseSfCommand(cmd);
  if (sf) return sf;

  // Sine generator with reverb: s220r, s220r9, s220^2r3, s^.1r3
  let sMatchReverb = cmd.match(/^s(\d+)?(?:\^(\d*\.?\d+))?r(\d+)?$/i);
  if (sMatchReverb) {
    // Defaults: freq=220, dur=1, reverb=1
    const dur = sMatchReverb[2] ? parseFloat(sMatchReverb[2]) : 1;
    console.log(`Parsed sine+reverb duration: ${sMatchReverb[2] || '1'} → ${dur}s`);
    return {
      generator: 's',
      freq: sMatchReverb[1] ? parseFloat(sMatchReverb[1]) : 220,
      dur: dur,
      reverb: sMatchReverb[3] ? parseInt(sMatchReverb[3]) : 1
    };
  }
  
  // Standard sine generator: s, s220, s^2, s220^2, s^.1, s220^.01
  let sMatch = cmd.match(/^s(\d+)?(?:\^(\d*\.?\d+))?$/i);
  if (sMatch) {
    // Defaults: freq=220, dur=1
    const dur = sMatch[2] ? parseFloat(sMatch[2]) : 1;
    console.log(`Parsed sine duration: ${sMatch[2] || '1'} → ${dur}s`);
    return {
      generator: 's',
      freq: sMatch[1] ? parseFloat(sMatch[1]) : 220,
      dur: dur
    };
  }
  // Legacy: u10^2, u10^.5
  const match = cmd.match(/([a-zA-Z]+)(\d+)\^(\d*\.?\d+)/);
  if (match) {
    const duration = parseFloat(match[3]);
    console.log(`Parsed legacy duration: ${match[3]} → ${duration}s`);
    return {
      generator: match[1],
      count: parseInt(match[2], 10),
      duration: duration
    };
  }
  return null;
}

