// sineGenerator.js
// Usage: s220^1  (play 220Hz sine for 1s)
// Defaults: s, s220 => s220^1

// --- SineCirclePhysics: Per-circle shape modulation for sine generator events ---
export class SineCirclePhysics {
  constructor(baseRadius = 60) {
    this.N = 120;
    this.baseRadius = baseRadius;
    this.center = { x: 0, y: 0 };
    this.modes = [];
    this.electricModes = [];
    this.t = 0;
    this.perturbationIndex = 0.1; // 0 = none, 1 = max
    this.startTime = null;
    this.envAmt = 0;
    this.decayAmt = 0;
    this._initModes();
  }

  _initModes() {
    // Normal modes
    let modeNumbers = [2, 3, 5, 6];
    for (let n of modeNumbers) {
      this.modes.push({
        n,
        baseAmp: 0,
        amp: 0,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 2 + 1.5 // 1.5 - 3.5
      });
    }
    // Electric modes
    let electricNumbers = [13, 17, 23];
    for (let n of electricNumbers) {
      this.electricModes.push({
        n,
        amp: 0.8,
        speed: Math.random() * 15 + 15, // 15 - 30
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  trigger(nowMillis) {
    this.startTime = nowMillis || (typeof millis === 'function' ? millis() : Date.now());
    for (let m of this.modes) {
      m.baseAmp = Math.random() * 10 + 5; // 5 - 15
      m.phase = Math.random() * Math.PI * 2;
    }
    for (let em of this.electricModes) {
      em.phase = Math.random() * Math.PI * 2;
    }
  }

  // Call this once per frame
  update(nowMillis) {
    this.t += 0.04;
    // Envelope calculation
    if (this.startTime !== null) {
      let elapsed = (nowMillis || (typeof millis === 'function' ? millis() : Date.now())) - this.startTime;
      if (elapsed < 300) {
        let pct = Math.max(0, Math.min(1, elapsed / 300));
        this.envAmt = Math.pow(pct, 2.2);
      } else if (elapsed < 500) {
        this.envAmt = 1;
      } else if (elapsed < 1000) {
        this.envAmt = this._map(elapsed, 500, 1000, 1, 0);
      } else {
        this.envAmt = 0;
      }
      this.decayAmt = Math.exp(-0.0025 * elapsed);
    } else {
      this.envAmt = 0;
      this.decayAmt = 0;
    }
  }

  // Returns array of {x, y} points for the current shape
  getShapePoints(centerX, centerY) {
    let points = [];
    for (let i = 0; i < this.N; i++) {
      let angle = (Math.PI * 2) * i / this.N;
      let r = this.baseRadius;
      for (let m of this.modes) {
        let jitter = Math.sin(m.n * angle + m.phase + this.t * m.speed);
        let amp = m.baseAmp * (0.4 * this.envAmt + 0.6 * this.decayAmt);
        r += amp * jitter * this.perturbationIndex;
      }
      for (let em of this.electricModes) {
        let buzz = Math.sin(em.n * angle + em.phase + this.t * em.speed);
        r += buzz * em.amp * this.envAmt * this.perturbationIndex;
      }
      let x = centerX + r * Math.cos(angle);
      let y = centerY + r * Math.sin(angle);
      points.push({ x, y });
    }
    return points;
  }

  _map(val, a, b, c, d) {
    return c + (d - c) * ((val - a) / (b - a));
  }
}

// --- End SineCirclePhysics ---

// --- Syno Sine Fade Cloud (sf) Parser and Runner ---
// Example: sf20-440^1*5v1)^10
//          sf20-440^1*5rv1)^10
//          sf20-440^1*5v1vr)^10v3
export function runSfGenerator({ minFreq, maxFreq, dur, count, freqRand, volRand, vol, window, overallVol, onTrigger }) {
  // Pick a random frequency for this node, or per event if freqRand
  let baseFreq = minFreq + Math.random() * (maxFreq - minFreq);
  let now = (typeof millis === 'function') ? millis() : Date.now();
  for (let i = 0; i < count; i++) {
    // Time offset within window
    let tOffset = Math.random() * window * 1000;
    // Frequency
    let f = freqRand ? (minFreq + Math.random() * (maxFreq - minFreq)) : baseFreq;
    // Volume
    let v = volRand ? (1 + Math.floor(Math.random() * 9)) : (vol || 9);
    if (overallVol) v = Math.round(v * overallVol / 9);
    setTimeout(() => {
      if (typeof onTrigger === 'function') {
        onTrigger({ freq: f, dur, vol: v });
      }
    }, tOffset);
  }
}


  // Accepts: s, s220, s220^1, s^1
  // Returns: { freq: number, dur: number }
  let match = cmd.match(/^s(\d+)?(?:\^(\d+\.?\d*)?)?$/i);
  let freq = 220;
  let dur = 1;
  if (match) {
    if (match[1]) freq = parseFloat(match[1]);
    if (match[2]) dur = parseFloat(match[2]);
  }
  return { freq, dur };
}

export function runSineGenerator({ freq, dur, onTrigger }) {
  // onTrigger: callback for client-side (Tone.js) to play
  if (typeof onTrigger === 'function') {
    onTrigger({ freq, dur });
  }
}
