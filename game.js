(() => {
    "use strict";

    // =========================================================================
    // CONSTANTS & CONFIGURATION
    // =========================================================================
    const STORAGE_KEYS = {
        BEST_SCORE: "flappy_bird_best_score_v1",
        SOUND_ENABLED: "flappy_bird_sound_v1"
    };

    const GAME_STATE = {
        MENU: "MENU",
        READY: "READY",
        PLAYING: "PLAYING",
        PAUSED: "PAUSED",
        DYING: "DYING",
        GAME_OVER: "GAME_OVER"
    };

    const PHYSICS = {
        BASE_HEIGHT: 640,
        MIN_WIDTH: 360,
        GROUND_HEIGHT: 96,
        GRAVITY: 1580,
        JUMP_VELOCITY: -475,
        MAX_FALL_SPEED: 640,
        BASE_PIPE_SPEED: 185,
        MAX_PIPE_SPEED: 335,
        SPEED_INCREMENT: 2.6,
        PIPE_WIDTH: 68,
        PIPE_CAP_HEIGHT: 26,
        PIPE_CAP_OVERHANG: 5,
        BASE_PIPE_GAP: 158,
        MIN_PIPE_GAP: 124,
        PIPE_SPACING: 255,
        BIRD_DRAW_RADIUS: 17,
        BIRD_HITBOX_RADIUS: 13
    };

    // =========================================================================
    // DOM ELEMENTS
    // =========================================================================
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    const hud = document.getElementById("hud");
    const liveScoreEl = document.getElementById("live-score");
    const hudSoundBtn = document.getElementById("hud-sound-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const readyBanner = document.getElementById("ready-banner");

    const menuScreen = document.getElementById("menu-screen");
    const menuBestScoreEl = document.getElementById("menu-best-score");
    const playBtn = document.getElementById("play-btn");
    const menuSoundBtn = document.getElementById("menu-sound-btn");
    const menuSoundIcon = document.getElementById("menu-sound-icon");
    const menuSoundLabel = document.getElementById("menu-sound-label");

    const pauseScreen = document.getElementById("pause-screen");
    const resumeBtn = document.getElementById("resume-btn");
    const pauseRestartBtn = document.getElementById("pause-restart-btn");
    const pauseSoundBtn = document.getElementById("pause-sound-btn");
    const pauseMenuBtn = document.getElementById("pause-menu-btn");

    const gameOverScreen = document.getElementById("gameover-screen");
    const finalScoreEl = document.getElementById("final-score");
    const finalBestEl = document.getElementById("final-best");
    const newBestTag = document.getElementById("new-best-tag");
    const medalBadge = document.getElementById("medal-badge");
    const medalIcon = document.getElementById("medal-icon");
    const medalName = document.getElementById("medal-name");
    const playAgainBtn = document.getElementById("play-again-btn");
    const gameOverMenuBtn = document.getElementById("gameover-menu-btn");

    // =========================================================================
    // WEB AUDIO SOUND ENGINE
    // =========================================================================
    class SoundEngine {
        constructor(enabled) {
            this.enabled = enabled;
            this.ctx = null;
        }

        ensureContext() {
            if (!this.enabled) return null;
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return null;
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }
            return this.ctx;
        }

        setEnabled(enabled) {
            this.enabled = enabled;
            if (enabled) {
                this.ensureContext();
            }
        }

        playFlap() {
            const ac = this.ensureContext();
            if (!ac) return;
            const now = ac.currentTime;
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(now);
            osc.stop(now + 0.11);
        }

        playScore() {
            const ac = this.ensureContext();
            if (!ac) return;
            const now = ac.currentTime;

            const notes = [987.77, 1318.51]; // B5 -> E6
            notes.forEach((freq, idx) => {
                const start = now + idx * 0.065;
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.16, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(start);
                osc.stop(start + 0.2);
            });
        }

        playHit() {
            const ac = this.ensureContext();
            if (!ac) return;
            const now = ac.currentTime;

            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }

        playGameOver() {
            const ac = this.ensureContext();
            if (!ac) return;
            const now = ac.currentTime;
            const notes = [392.0, 349.23, 311.13, 261.63]; // G4 -> F4 -> Eb4 -> C4
            notes.forEach((freq, i) => {
                const start = now + i * 0.11;
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.14, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(start);
                osc.stop(start + 0.18);
            });
        }

        playClick() {
            const ac = this.ensureContext();
            if (!ac) return;
            const now = ac.currentTime;
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(640, now);
            osc.frequency.exponentialRampToValueAtTime(420, now + 0.045);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        }
    }

    // =========================================================================
    // PERSISTENCE HELPERS
    // =========================================================================
    function loadBestScore() {
        try {
            const val = Number(window.localStorage.getItem(STORAGE_KEYS.BEST_SCORE));
            return Number.isFinite(val) && val > 0 ? Math.floor(val) : 0;
        } catch {
            return 0;
        }
    }

    function saveBestScore(score) {
        try {
            window.localStorage.setItem(STORAGE_KEYS.BEST_SCORE, String(score));
        } catch {
            // Ignore private browsing / quota errors
        }
    }

    function loadSoundPreference() {
        try {
            return window.localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== "false";
        } catch {
            return true;
        }
    }

    function saveSoundPreference(enabled) {
        try {
            window.localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
        } catch {
            // Ignore private browsing / quota errors
        }
    }

    // =========================================================================
    // GAME WORLD STATE & OBJECT POOLS
    // =========================================================================
    const sound = new SoundEngine(loadSoundPreference());

    const world = {
        width: 480,
        height: 640,
        scale: 1,
        groundY: 640 - PHYSICS.GROUND_HEIGHT,
        state: GAME_STATE.MENU,
        score: 0,
        bestScore: loadBestScore(),
        isNewBest: false,
        groundOffset: 0,
        hillsOffset: 0,
        flashAlpha: 0,
        shakeTime: 0,
        lastTime: 0,
        rafId: null
    };

    const bird = {
        x: 130,
        y: 260,
        vy: 0,
        rotation: 0,
        wingPhase: 0,
        blinkTimer: 2.5
    };

    // Pre-allocated particle pool to avoid GC spikes during gameplay
    const PARTICLE_POOL_SIZE = 72;
    const particlePool = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        life: 0,
        maxLife: 0.5,
        color: "#ffffff"
    }));

    // Active pipes array + recycled pool
    const pipes = [];
    const pipePool = [];

    // Background clouds
    const clouds = [
        { x: 60, y: 85, scale: 1.0, speed: 16 },
        { x: 260, y: 145, scale: 0.78, speed: 11 },
        { x: 470, y: 72, scale: 1.15, speed: 20 },
        { x: 700, y: 128, scale: 0.9, speed: 14 },
        { x: 960, y: 92, scale: 1.05, speed: 18 }
    ];

    // =========================================================================
    // VIEWPORT & RESPONSIVE SCALING
    // =========================================================================
    function resizeCanvas() {
        const cssWidth = window.innerWidth;
        const cssHeight = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(cssWidth * dpr);
        canvas.height = Math.floor(cssHeight * dpr);

        const scale = Math.min(cssHeight / PHYSICS.BASE_HEIGHT, cssWidth / PHYSICS.MIN_WIDTH);
        world.scale = scale;
        world.width = cssWidth / scale;
        world.height = cssHeight / scale;
        world.groundY = world.height - PHYSICS.GROUND_HEIGHT;

        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

        bird.x = Math.min(world.width * 0.28, 260);
        if (world.state === GAME_STATE.MENU || world.state === GAME_STATE.READY) {
            bird.y = world.groundY * 0.46;
        }
    }

    // =========================================================================
    // PARTICLE & PIPE HELPERS
    // =========================================================================
    function spawnParticles(x, y, count, colors, speedRange) {
        let spawned = 0;
        for (let i = 0; i < PARTICLE_POOL_SIZE && spawned < count; i++) {
            const p = particlePool[i];
            if (p.active) continue;

            const angle = Math.random() * Math.PI * 2;
            const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
            p.active = true;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 40;
            p.size = 2.5 + Math.random() * 3.5;
            p.maxLife = 0.35 + Math.random() * 0.3;
            p.life = p.maxLife;
            p.color = colors[Math.floor(Math.random() * colors.length)];
            spawned++;
        }
    }

    function acquirePipe(x) {
        const pipe = pipePool.length > 0 ? pipePool.pop() : {};
        const gap = Math.max(
            PHYSICS.MIN_PIPE_GAP,
            PHYSICS.BASE_PIPE_GAP - Math.floor(world.score / 5) * 3
        );
        const minTop = 58;
        const maxTop = Math.max(minTop + 20, world.groundY - gap - 58);
        const topHeight = minTop + Math.random() * (maxTop - minTop);

        pipe.x = x;
        pipe.topHeight = topHeight;
        pipe.gap = gap;
        pipe.bottomY = topHeight + gap;
        pipe.passed = false;
        return pipe;
    }

    function recycleAllPipes() {
        while (pipes.length > 0) {
            pipePool.push(pipes.pop());
        }
    }

    function getCurrentPipeSpeed() {
        return Math.min(
            PHYSICS.MAX_PIPE_SPEED,
            PHYSICS.BASE_PIPE_SPEED + world.score * PHYSICS.SPEED_INCREMENT
        );
    }

    // =========================================================================
    // UI & SCREEN MANAGEMENT
    // =========================================================================
    function syncSoundUI() {
        const on = sound.enabled;
        const icon = on ? "&#128266;" : "&#128263;";
        const label = on ? "SOUND: ON" : "SOUND: OFF";

        hudSoundBtn.innerHTML = `<span class="sound-icon" aria-hidden="true">${icon}</span>`;
        hudSoundBtn.setAttribute("aria-pressed", String(on));

        menuSoundIcon.innerHTML = icon;
        menuSoundLabel.textContent = label;
        menuSoundBtn.setAttribute("aria-pressed", String(on));

        pauseSoundBtn.textContent = label;
    }

    function getMedalInfo(score) {
        if (score >= 50) return { cls: "medal-platinum", label: "PLATINUM", icon: "&#128142;" };
        if (score >= 30) return { cls: "medal-gold", label: "GOLD", icon: "&#9733;" };
        if (score >= 20) return { cls: "medal-silver", label: "SILVER", icon: "&#9733;" };
        if (score >= 10) return { cls: "medal-bronze", label: "BRONZE", icon: "&#9733;" };
        return { cls: "medal-none", label: "NONE", icon: "&#9733;" };
    }

    function updateOverlays() {
        const s = world.state;
        menuScreen.classList.toggle("hidden", s !== GAME_STATE.MENU);
        pauseScreen.classList.toggle("hidden", s !== GAME_STATE.PAUSED);
        gameOverScreen.classList.toggle("hidden", s !== GAME_STATE.GAME_OVER);
        hud.classList.toggle("hidden", s === GAME_STATE.MENU || s === GAME_STATE.GAME_OVER);
        readyBanner.classList.toggle("hidden", s !== GAME_STATE.READY);

        menuBestScoreEl.textContent = String(world.bestScore);
        liveScoreEl.textContent = String(world.score);
    }

    function showGameOverScreen() {
        world.state = GAME_STATE.GAME_OVER;
        sound.playGameOver();

        finalScoreEl.textContent = String(world.score);
        finalBestEl.textContent = String(world.bestScore);
        newBestTag.classList.toggle("hidden", !world.isNewBest);

        const medal = getMedalInfo(world.score);
        medalBadge.className = `medal-badge ${medal.cls}`;
        medalIcon.innerHTML = medal.icon;
        medalName.textContent = medal.label;

        updateOverlays();
    }

    // =========================================================================
    // STATE TRANSITIONS & INPUT ACTIONS
    // =========================================================================
    function startNewRun() {
        recycleAllPipes();
        world.score = 0;
        world.isNewBest = false;
        world.flashAlpha = 0;
        world.shakeTime = 0;

        bird.x = Math.min(world.width * 0.28, 260);
        bird.y = world.groundY * 0.46;
        bird.vy = 0;
        bird.rotation = 0;

        world.state = GAME_STATE.READY;
        updateOverlays();
    }

    function goToMenu() {
        recycleAllPipes();
        world.score = 0;
        world.flashAlpha = 0;
        world.shakeTime = 0;
        bird.y = world.groundY * 0.42;
        bird.vy = 0;
        bird.rotation = 0;
        world.state = GAME_STATE.MENU;
        updateOverlays();
    }

    function togglePause() {
        if (world.state === GAME_STATE.PLAYING) {
            sound.playClick();
            world.state = GAME_STATE.PAUSED;
            updateOverlays();
        } else if (world.state === GAME_STATE.PAUSED) {
            sound.playClick();
            world.lastTime = performance.now();
            world.state = GAME_STATE.PLAYING;
            updateOverlays();
        }
    }

    function toggleSound() {
        const next = !sound.enabled;
        sound.setEnabled(next);
        saveSoundPreference(next);
        syncSoundUI();
        if (next) sound.playClick();
    }

    function flap() {
        if (world.state === GAME_STATE.READY) {
            world.state = GAME_STATE.PLAYING;
            pipes.push(acquirePipe(world.width + 80));
            updateOverlays();
        } else if (world.state !== GAME_STATE.PLAYING) {
            return;
        }

        bird.vy = PHYSICS.JUMP_VELOCITY;
        bird.wingPhase = Math.PI * 0.5;
        sound.playFlap();
        spawnParticles(bird.x - 10, bird.y + 6, 5, ["#ffffff", "#fef9c3", "#bae6fd"], [35, 95]);
    }

    function triggerCollision() {
        if (world.state !== GAME_STATE.PLAYING) return;

        world.state = GAME_STATE.DYING;
        world.flashAlpha = 0.75;
        world.shakeTime = 0.26;
        sound.playHit();

        if (world.score > world.bestScore) {
            world.bestScore = world.score;
            world.isNewBest = true;
            saveBestScore(world.bestScore);
        }

        spawnParticles(bird.x, bird.y, 16, ["#fde047", "#f97316", "#ffffff"], [70, 210]);
    }

    // =========================================================================
    // COLLISION DETECTION (CIRCLE VS AABB)
    // =========================================================================
    function circleIntersectsRect(cx, cy, r, rx, ry, rw, rh) {
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - closestX;
        const dy = cy - closestY;
        return dx * dx + dy * dy < r * r;
    }

    // =========================================================================
    // UPDATE LOOP (DELTA TIME)
    // =========================================================================
    function update(dt) {
        // Animate clouds across all non-paused states
        if (world.state !== GAME_STATE.PAUSED) {
            const cloudWrapWidth = Math.max(world.width + 180, 1150);
            for (let i = 0; i < clouds.length; i++) {
                const c = clouds[i];
                c.x -= c.speed * dt;
                if (c.x < -120) {
                    c.x = cloudWrapWidth;
                }
            }
        }

        // Update particles
        for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
            const p = particlePool[i];
            if (!p.active) continue;
            p.life -= dt;
            if (p.life <= 0) {
                p.active = false;
                continue;
            }
            p.vy += 320 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        if (world.flashAlpha > 0) {
            world.flashAlpha = Math.max(0, world.flashAlpha - dt * 2.6);
        }
        if (world.shakeTime > 0) {
            world.shakeTime = Math.max(0, world.shakeTime - dt);
        }

        // Blink timer
        bird.blinkTimer -= dt;
        if (bird.blinkTimer <= -0.12) {
            bird.blinkTimer = 2.4 + Math.random() * 2.5;
        }

        if (world.state === GAME_STATE.MENU || world.state === GAME_STATE.READY) {
            const scrollSpeed = PHYSICS.BASE_PIPE_SPEED * 0.65;
            world.groundOffset = (world.groundOffset + scrollSpeed * dt) % 48;
            world.hillsOffset = (world.hillsOffset + scrollSpeed * 0.25 * dt) % 320;
            bird.wingPhase += dt * 11;
            const center = world.state === GAME_STATE.MENU ? world.groundY * 0.4 : world.groundY * 0.46;
            bird.y = center + Math.sin(performance.now() * 0.0055) * 10;
            bird.rotation = Math.sin(performance.now() * 0.0055) * 0.06;
            return;
        }

        if (world.state === GAME_STATE.PAUSED || world.state === GAME_STATE.GAME_OVER) {
            return;
        }

        if (world.state === GAME_STATE.DYING) {
            bird.vy = Math.min(PHYSICS.MAX_FALL_SPEED * 1.15, bird.vy + PHYSICS.GRAVITY * dt);
            bird.y += bird.vy * dt;
            bird.rotation = Math.min(Math.PI * 0.5, bird.rotation + dt * 6.5);

            if (bird.y + PHYSICS.BIRD_HITBOX_RADIUS >= world.groundY) {
                bird.y = world.groundY - PHYSICS.BIRD_HITBOX_RADIUS;
                showGameOverScreen();
            }
            return;
        }

        // GAME_STATE.PLAYING
        const pipeSpeed = getCurrentPipeSpeed();
        world.groundOffset = (world.groundOffset + pipeSpeed * dt) % 48;
        world.hillsOffset = (world.hillsOffset + pipeSpeed * 0.22 * dt) % 320;

        bird.vy = Math.min(PHYSICS.MAX_FALL_SPEED, bird.vy + PHYSICS.GRAVITY * dt);
        bird.y += bird.vy * dt;
        bird.wingPhase += dt * (bird.vy < 0 ? 18 : 10);

        const targetRot = bird.vy < 0
            ? -0.44
            : Math.min(Math.PI * 0.45, (bird.vy / PHYSICS.MAX_FALL_SPEED) * 1.45);
        bird.rotation += (targetRot - bird.rotation) * Math.min(1, dt * 10);

        // Spawn next pipe when rightmost pipe advances
        if (pipes.length > 0) {
            const lastPipe = pipes[pipes.length - 1];
            if (lastPipe.x <= world.width - PHYSICS.PIPE_SPACING) {
                pipes.push(acquirePipe(lastPipe.x + PHYSICS.PIPE_SPACING));
            }
        }

        // Update pipes & check collisions/scoring
        const r = PHYSICS.BIRD_HITBOX_RADIUS;
        for (let i = pipes.length - 1; i >= 0; i--) {
            const p = pipes[i];
            p.x -= pipeSpeed * dt;

            // Score when bird center passes pipe center
            if (!p.passed && p.x + PHYSICS.PIPE_WIDTH * 0.5 < bird.x) {
                p.passed = true;
                world.score += 1;
                liveScoreEl.textContent = String(world.score);
                liveScoreEl.classList.remove("pop");
                void liveScoreEl.offsetWidth;
                liveScoreEl.classList.add("pop");
                window.setTimeout(() => liveScoreEl.classList.remove("pop"), 120);

                sound.playScore();
                spawnParticles(bird.x, bird.y - 16, 10, ["#fde047", "#4ade80", "#ffffff"], [55, 140]);
            }

            // Collision with top or bottom pipe
            const hitTop = circleIntersectsRect(bird.x, bird.y, r, p.x, -40, PHYSICS.PIPE_WIDTH, p.topHeight + 40);
            const hitBottom = circleIntersectsRect(
                bird.x,
                bird.y,
                r,
                p.x,
                p.bottomY,
                PHYSICS.PIPE_WIDTH,
                world.groundY - p.bottomY
            );

            if (hitTop || hitBottom) {
                triggerCollision();
                return;
            }

            if (p.x + PHYSICS.PIPE_WIDTH + 20 < 0) {
                pipePool.push(pipes.splice(i, 1)[0]);
            }
        }

        // Ceiling or ground collision
        if (bird.y - r <= 0) {
            bird.y = r;
            triggerCollision();
        } else if (bird.y + r >= world.groundY) {
            bird.y = world.groundY - r;
            triggerCollision();
        }
    }

    // =========================================================================
    // RENDERING (CARTOON ARTWORK)
    // =========================================================================
    function drawCloud(x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.arc(24, -8, 28, 0, Math.PI * 2);
        ctx.arc(52, 0, 22, 0, Math.PI * 2);
        ctx.arc(26, 10, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawSkyAndBackdrop() {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, world.groundY);
        skyGrad.addColorStop(0, "#38bdf8");
        skyGrad.addColorStop(0.65, "#7dd3fc");
        skyGrad.addColorStop(1, "#e0f2fe");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, world.width, world.groundY);

        // Soft glowing sun
        const sunX = world.width * 0.82;
        const sunY = Math.min(110, world.groundY * 0.22);
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 95);
        sunGlow.addColorStop(0, "rgba(254, 249, 195, 0.95)");
        sunGlow.addColorStop(0.45, "rgba(253, 224, 71, 0.35)");
        sunGlow.addColorStop(1, "rgba(253, 224, 71, 0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 95, 0, Math.PI * 2);
        ctx.fill();

        // Clouds
        for (let i = 0; i < clouds.length; i++) {
            const c = clouds[i];
            if (c.x < world.width + 100) {
                drawCloud(c.x, c.y, c.scale);
            }
        }

        // Distant rolling hills parallax
        ctx.fillStyle = "#86efac";
        const hillStep = 320;
        for (let x = -world.hillsOffset - hillStep; x < world.width + hillStep; x += hillStep) {
            ctx.beginPath();
            ctx.arc(x + 90, world.groundY + 12, 115, Math.PI, 0);
            ctx.arc(x + 240, world.groundY + 18, 95, Math.PI, 0);
            ctx.fill();
        }
    }

    function drawPipeSegment(x, y, width, height, capOnBottom) {
        if (height <= 0) return;

        const bodyGrad = ctx.createLinearGradient(x, 0, x + width, 0);
        bodyGrad.addColorStop(0, "#15803d");
        bodyGrad.addColorStop(0.22, "#4ade80");
        bodyGrad.addColorStop(0.55, "#22c55e");
        bodyGrad.addColorStop(1, "#14532d");

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = "#14532d";
        ctx.lineWidth = 3;

        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);

        // Pipe rim cap
        const capW = width + PHYSICS.PIPE_CAP_OVERHANG * 2;
        const capH = PHYSICS.PIPE_CAP_HEIGHT;
        const capX = x - PHYSICS.PIPE_CAP_OVERHANG;
        const capY = capOnBottom ? y + height - capH : y;

        const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
        capGrad.addColorStop(0, "#15803d");
        capGrad.addColorStop(0.22, "#86efac");
        capGrad.addColorStop(0.55, "#22c55e");
        capGrad.addColorStop(1, "#14532d");

        ctx.fillStyle = capGrad;
        ctx.fillRect(capX, capY, capW, capH);
        ctx.strokeRect(capX, capY, capW, capH);
    }

    function drawPipes() {
        for (let i = 0; i < pipes.length; i++) {
            const p = pipes[i];
            drawPipeSegment(p.x, -4, PHYSICS.PIPE_WIDTH, p.topHeight + 4, true);
            drawPipeSegment(p.x, p.bottomY, PHYSICS.PIPE_WIDTH, world.groundY - p.bottomY + 4, false);
        }
    }

    function drawGround() {
        const gy = world.groundY;

        // Soil body
        ctx.fillStyle = "#d9b372";
        ctx.fillRect(0, gy, world.width, PHYSICS.GROUND_HEIGHT);

        // Subtle dirt pebbles
        ctx.fillStyle = "#c49b56";
        for (let x = -world.groundOffset; x < world.width + 48; x += 48) {
            ctx.fillRect(x + 8, gy + 36, 12, 6);
            ctx.fillRect(x + 28, gy + 56, 10, 5);
        }

        // Top scrolling grass strip
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(0, gy, world.width, 22);

        // Diagonal scrolling stripes on grass lip
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, gy, world.width, 22);
        ctx.clip();

        ctx.fillStyle = "#4ade80";
        for (let x = -world.groundOffset - 48; x < world.width + 48; x += 48) {
            ctx.beginPath();
            ctx.moveTo(x, gy + 22);
            ctx.lineTo(x + 16, gy);
            ctx.lineTo(x + 32, gy);
            ctx.lineTo(x + 16, gy + 22);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Dark outline border along ground top
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(0, gy, world.width, 4);
        ctx.fillRect(0, gy + 20, world.width, 3);
    }

    function drawBird() {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rotation);

        const r = PHYSICS.BIRD_DRAW_RADIUS;

        // Body gradient
        const bodyGrad = ctx.createRadialGradient(-4, -5, 3, 0, 0, r * 1.2);
        bodyGrad.addColorStop(0, "#fef08a");
        bodyGrad.addColorStop(0.58, "#facc15");
        bodyGrad.addColorStop(1, "#ea580c");

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, r + 2, r - 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Belly highlight
        ctx.fillStyle = "#fef9c3";
        ctx.beginPath();
        ctx.ellipse(2, 6, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animated wing
        const flapOffset = Math.sin(bird.wingPhase) * 6;
        ctx.save();
        ctx.translate(-6, 2 + flapOffset * 0.35);
        ctx.rotate(flapOffset * 0.08);
        ctx.fillStyle = "#fde047";
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6.5, -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Eye (with periodic blink)
        if (bird.blinkTimer > 0) {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#3e2723";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(8, -5, 6.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#0f172a";
            ctx.beginPath();
            ctx.arc(10, -5, 2.7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(11, -6.3, 1, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = "#3e2723";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(4, -5);
            ctx.lineTo(13, -5);
            ctx.stroke();
        }

        // Beak
        ctx.fillStyle = "#f97316";
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(13, -1);
        ctx.lineTo(25, 2.5);
        ctx.lineTo(13, 6.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function drawParticles() {
        for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
            const p = particlePool[i];
            if (!p.active) continue;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function render() {
        ctx.save();
        if (world.shakeTime > 0) {
            const mag = world.shakeTime * 22;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        drawSkyAndBackdrop();
        drawPipes();
        drawGround();
        drawBird();
        drawParticles();

        if (world.flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${world.flashAlpha})`;
            ctx.fillRect(0, 0, world.width, world.height);
        }

        ctx.restore();
    }

    function loop(now) {
        const dt = Math.min(0.05, Math.max(0, (now - world.lastTime) / 1000));
        world.lastTime = now;

        update(dt);
        render();

        world.rafId = window.requestAnimationFrame(loop);
    }

    function startLoop() {
        if (world.rafId !== null) return;
        world.lastTime = performance.now();
        world.rafId = window.requestAnimationFrame(loop);
    }

    // =========================================================================
    // INPUT & EVENT HANDLERS
    // =========================================================================
    canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
        if (world.state === GAME_STATE.READY || world.state === GAME_STATE.PLAYING) {
            e.preventDefault();
            flap();
        }
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp") {
            if (e.repeat) return;
            if (world.state === GAME_STATE.READY || world.state === GAME_STATE.PLAYING) {
                e.preventDefault();
                flap();
            }
        } else if (e.code === "Enter") {
            if (e.repeat) return;
            if (world.state === GAME_STATE.GAME_OVER) {
                e.preventDefault();
                sound.playClick();
                startNewRun();
            } else if (world.state === GAME_STATE.MENU) {
                e.preventDefault();
                sound.playClick();
                startNewRun();
            }
        } else if (e.code === "KeyP" || e.code === "Escape") {
            if (e.repeat) return;
            if (world.state === GAME_STATE.PLAYING || world.state === GAME_STATE.PAUSED) {
                e.preventDefault();
                togglePause();
            }
        } else if (e.code === "KeyM") {
            if (e.repeat) return;
            toggleSound();
        }
    });

    // Button wiring
    playBtn.addEventListener("click", () => {
        sound.playClick();
        startNewRun();
    });

    playAgainBtn.addEventListener("click", () => {
        sound.playClick();
        startNewRun();
    });

    resumeBtn.addEventListener("click", togglePause);
    pauseBtn.addEventListener("click", togglePause);

    pauseRestartBtn.addEventListener("click", () => {
        sound.playClick();
        startNewRun();
    });

    pauseMenuBtn.addEventListener("click", () => {
        sound.playClick();
        goToMenu();
    });

    gameOverMenuBtn.addEventListener("click", () => {
        sound.playClick();
        goToMenu();
    });

    menuSoundBtn.addEventListener("click", toggleSound);
    hudSoundBtn.addEventListener("click", toggleSound);
    pauseSoundBtn.addEventListener("click", toggleSound);

    // Pause automatically when browser tab becomes hidden
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && world.state === GAME_STATE.PLAYING) {
            world.state = GAME_STATE.PAUSED;
            updateOverlays();
        } else if (!document.hidden) {
            world.lastTime = performance.now();
        }
    });

    window.addEventListener("resize", resizeCanvas);

    // =========================================================================
    // BOOTSTRAP
    // =========================================================================
    resizeCanvas();
    syncSoundUI();
    updateOverlays();
    startLoop();
})();

