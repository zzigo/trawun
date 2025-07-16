# Trawun

Trawun is a networked real-time music performance system designed for distributed cognition and collaborative sound synthesis. It uses WebSockets to connect multiple performers together, each contributing to a shared sonic environment through a minimalist text-based syntax called SYNO.

## System Architecture

Bbuilt on a client-server architecture using:

- **Backend**: Express.js with Socket.io for real-time communication
- **Frontend**: HTML5, JavaScript with Tone.js for audio synthesis and p5.js for visualization
- **Communication Protocol**: WebSockets via Socket.io
- **Sound Engine**: Tone.js for real-time audio synthesis and processing

### Core Design Patterns

The architecture follows several key design patterns:

- **Observer Pattern**: The renderer listens to audio state changes and updates the UI
- **Composite Pattern**: The audio system walks the AST node tree for sound generation
- **Factory Method**: Creates audio nodes from parsed SYNO commands
- **Command Pattern**: Schedules parameter transitions as commands
- **Facade Pattern**: Main entry point orchestrates parser, audio, and renderer modules

## SYNO Language Reference

SYNO is a terse, energy-efficient language designed for live coding music. It emphasizes minimalism while allowing complex sound generation and manipulation.

### Syntax Philosophy

- **Characters**: Generators and processors
- **Numbers**: Parameter values
- **Parentheses**: Nested operations
- **Order-Independence**: Parameter order doesn't matter (e.g., `sf100-500v1p?` = `sf100-500p?v1`)

### Sound Generators

#### Basic Sine Wave (`s`)

```syno
s                    # 220 Hz sine wave, default duration
s440                 # 440 Hz sine wave
s220^2               # 220 Hz sine for 2 seconds
s100>300'10         # Sweep 100 to 300 Hz in 10 seconds
s440v5              # 440 Hz sine at volume 5
s440p1              # 440 Hz sine panned right
```

#### Sine Fade Cloud (`sf`)

```syno
sf                   # Default sine fade cloud (20-440Hz range, 5 tones, 10s window)
sf100-500            # Random frequencies between 100-500Hz
sf100-500^1*5v1)^10 # 5 tones between 100-500Hz, each 1s, spread over 10s window, volume 1
sf20-440^1*5v1p?    # Same but with random panning
```

Parameters (order doesn't matter):
- **Frequency Range**: `sf100-500` (min-max in Hz)
- **Duration**: `^1` (duration in seconds for each tone)
- **Count**: `*5` (number of tones to generate)
- **Volume**: `v1` to `v9` (volume level) or `v?` (random volume)
- **Window**: `)^10` (time window in seconds to distribute sounds)
- **Panning**: `p-1` (left) to `p1` (right) or `p?` (random panning)
- **Randomness**: `?` for random values (e.g., `sf100-500v?p?`)

#### Other Waveforms

```syno
t440               # Triangle wave at 440 Hz
a440               # Sawtooth wave at 440 Hz
q440               # Square wave at 440 Hz
```

#### Noise Generators

```syno
n1                 # Grey noise
n2                 # Pink noise
n3                 # Brown noise
n4                 # Blue noise
n5                 # Azure noise
n6                 # Violet noise
n7                 # Purple noise
n8                 # Black noise
```

### Modifiers and Effects

#### Volume

```syno
s440v1             # Low volume (0.1)
s440v9             # High volume (0.9)
s440v0>5'6         # Fade in over 6 seconds
s440v5>0'1         # Fade out over 1 second
```

#### Panning

```syno
s440p-1            # Hard left
s440p1             # Hard right
s440p-1>1'2        # Pan sweep left to right over 2 seconds
```

#### Envelopes

```syno
s440e9159          # Envelope: attack 0ms, decay 100ms, sustain 0.5, release 500ms
s440e1234          # Envelope: attack 100ms, decay 200ms, sustain 0.3, release 400ms
```

#### Filter

```syno
s440f8>2           # Filter sweep from 8000Hz to 2000Hz
q40v1>0'10f8>2'10  # Filter sweep with volume fade
```

#### Reverb

```syno
s440r              # Sine with default reverb (50ms)
s440r1             # Sine with minimal reverb (50ms)
s440r9             # Sine with long reverb (1000ms)
sf100-500r3        # Sine cloud with moderate reverb
```

The reverb parameter 'r' applies a convolution reverb effect:
- Values range from 1-9 representing reverb time (decay)
- r1 = 50ms (minimal room)
- r5 = 2s (medium hall)
- r9 = 8s (cathedral/ambient space)
- Default is r1 when using just 'r' with no number
- Higher values also increase the wet/dry mix ratio for more dramatic effect

#### Chopping/Gate

```syno
s440h1             # Chop at 1Hz rate
s440>220v5>0h5     # Frequency sweep with volume fade and chopping
```

### Sequencing and Timing

```syno
s440'1             # Play for 1 second
1s480'1            # Play after 1 second delay
2s500'1            # Play after 2 second delay
```

### Looping

```syno
s[400 880 220]     # Play sequence of frequencies
[s400'2]10         # Loop s400 ten times, each for 2 seconds
[s400'2]10|0.5     # Same with 0.5s gap between loops
```

### Advanced Features

#### Indeterminacy

```syno
s?                 # Random frequency sine
s?v5>?             # Random freq, random volume fade
```

#### Buffer Recording and Playback

```syno
b0\400>200'10      # Record to buffer 0
{b0}s4             # Play buffer with modifier
```

#### Recursion

```syno
{s400}s300v3       # Recursive synthesis
```

#### Master Control

```syno
master v7          # Set master volume to 0.7
```

### Complex Examples

```syno
# Complex texture with multiple overlapping sounds
s440>220'20v0>5>0'20.5p-1>1'20h5r3f8>2'20 s220>440'20v0>3>0'20.5p1>-1'20h2r2f6>3'20
q300>230'20v0>1>0'20.5p0>1'20h4f5>2'20 t500>400'20v0>3>0'20.5p0>1'20h3r4f4>1'20
```

## System Architecture Insights

### Module Structure

- **parser.ts**: Tokenizes and builds AST from SYNO commands
- **audio.ts**: Executes AST, manages AudioContext, coordinates generators
- **renderer.ts**: Updates UI based on audio events (VU meters, timers, etc.)
- **nodeFactory.ts**: Creates nodes from parsed commands
- **transitions.ts**: Schedules parameter changes over time
- **bufferManager.ts**: Manages audio buffers (recording/playback)
- **generators.ts**: Low-level generator functions for different sound types
- **main.ts**: Entry point and facade for the entire system

### Design Philosophy

Trawun and SYNO are designed around principles of:

1. **Minimal Interface**: Terse syntax reduces cognitive load during live performance
2. **Loose Coupling**: Modules interact via flexible interfaces, allowing "fuzzy" inputs
3. **Emergent Complexity**: Simple rules create complex sonic results through interaction
4. **Distributed Cognition**: Multiple performers contribute to a shared cognitive space
5. **Non-Deterministic Aesthetics**: Embraces "deviations, tiny errors, and fuzzy information"

## Networked Music Performance

Trawun supports distributed musical cognition through:

1. **Role-Based Participation**: Conductors can control global parameters while performers contribute individual sounds
2. **Real-Time Communication**: All sonic events are broadcast to all participants
3. **Shared Sonic Canvas**: Each performer's actions affect the collective sound space
4. **Spatial Awareness**: Normalized coordinate system maps performers in virtual space

This approach treats networked music as a form of distributed cognition where:

- Individual cognitive processes extend across multiple human actors
- The network becomes a medium for shared musical thinking
- Technology mediates between individual and collective musical expression
- The resulting music emerges from complex interactions rather than top-down design

## Getting Started

```
npm install
node server.js
```

Open `http://localhost:4000` in your browser to join as a performer.

## Future Directions

- MIDI integration with `s(m1)` syntax
- Enhanced visual representation of sound objects
- Mobile-friendly interface improvements
- Additional synthesis methods and sound processors
- Machine learning for pattern recognition and response

