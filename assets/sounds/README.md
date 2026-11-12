# Sound Effects

All sound effects (wing flap, point score, collision, game over, and UI button clicks) are procedurally synthesized in real time using the browser's built-in Web Audio API inside `game.js` (`SoundEngine`).

This guarantees zero network latency, instant playback on desktop and mobile, and zero external audio dependencies.

