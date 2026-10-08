// Main Application Orchestrator

// Keep in sync with CACHE_NAME in sw.js (bump both on every release)
const APP_VERSION = '1.1.0';

document.addEventListener('DOMContentLoaded', () => {
  const matrixCanvas = document.getElementById('matrix-canvas');
  const nextCanvas = document.getElementById('next-canvas');
  const holdCanvas = document.getElementById('hold-canvas');

  // HUD elements
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-highscore');
  const hudLevel = document.getElementById('hud-level');
  const hudLines = document.getElementById('hud-lines');

  // Modals
  const startModal = document.getElementById('start-modal');
  const pauseModal = document.getElementById('pause-modal');
  const gameOverModal = document.getElementById('gameover-modal');
  const settingsModal = document.getElementById('settings-modal');

  // Modal buttons
  const btnStartNew = document.getElementById('btn-start-new');
  const btnResumeSaved = document.getElementById('btn-resume-saved');
  const btnPauseResume = document.getElementById('btn-pause-resume');
  const btnPauseRestart = document.getElementById('btn-pause-restart');
  const btnGameOverRestart = document.getElementById('btn-gameover-restart');
  const btnSettingsClose = document.getElementById('btn-settings-close');

  // Header buttons
  const btnPauseHeader = document.getElementById('btn-header-pause');
  const btnSoundHeader = document.getElementById('btn-header-sound');
  const btnSettingsHeader = document.getElementById('btn-header-settings');

  // Settings inputs
  const toggleSfx = document.getElementById('toggle-sfx');
  const toggleMusic = document.getElementById('toggle-music');
  const toggleGhost = document.getElementById('toggle-ghost');
  const toggleSwipe = document.getElementById('toggle-swipe');
  const toggleReversed = document.getElementById('toggle-reversed');
  const controlsContainer = document.getElementById('controls-container');

  document.getElementById('app-version').textContent = APP_VERSION;

  // Initialize Game & Controls
  const game = new TetrisGame(matrixCanvas, nextCanvas, holdCanvas);
  const controls = new ControlsManager(game);

  // Sync initial settings
  toggleSfx.checked = window.retroAudio.sfxEnabled;
  toggleMusic.checked = window.retroAudio.musicEnabled;
  toggleGhost.checked = game.ghostEnabled;
  toggleSwipe.checked = controls.swipeMode;
  toggleReversed.checked = controls.layoutReversed;

  controlsContainer.classList.toggle('reversed', controls.layoutReversed);
  applySwipeModeLook();
  updateSoundHeaderIcon();

  // Check saved game state for resume button
  btnResumeSaved.style.display = game.hasSavedState() ? 'block' : 'none';

  // --- Pause helpers (single path for buttons, keyboard, tab switch, rotation) ---

  function pauseGame(showModal = true) {
    if (!game.isRunning || game.isGameOver || game.isPaused) return;
    game.pause();
    controls.releaseAll();
    if (showModal) pauseModal.classList.remove('hidden');
  }

  function resumeGame() {
    pauseModal.classList.add('hidden');
    window.retroAudio.init(); // iOS: (re)activate audio from a user gesture
    game.resume();
  }

  function togglePause() {
    if (!game.isRunning || game.isGameOver) return;
    if (!settingsModal.classList.contains('hidden')) return; // settings own the pause state
    if (game.isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }

  controls.onTogglePause = togglePause;

  // Keep the board sized to the layout (handles rotation, iOS toolbar changes, etc.)
  const resize = () => game.resizeCanvases();
  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(document.getElementById('playfield-area'));
  } else {
    window.addEventListener('resize', resize);
  }

  // Main Loop
  let lastTime = performance.now();
  const hudCache = {};
  function setHud(el, key, value) {
    // Only touch the DOM when a value actually changed
    if (hudCache[key] !== value) {
      hudCache[key] = value;
      el.textContent = value;
    }
  }

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1); // clamp delta
    lastTime = now;

    game.update(dt);
    game.render();

    setHud(hudScore, 'score', game.score);
    setHud(hudHighScore, 'high', Math.max(game.highScore, game.score));
    setHud(hudLevel, 'level', game.level);
    setHud(hudLines, 'lines', game.lines);

    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // --- Button Handlers ---

  btnStartNew.addEventListener('click', () => {
    startModal.classList.add('hidden');
    game.start();
  });

  btnResumeSaved.addEventListener('click', () => {
    window.retroAudio.init(); // restoring skips start(), so activate audio here
    if (game.restoreState()) {
      startModal.classList.add('hidden');
      game.resume();
    } else {
      startModal.classList.add('hidden');
      game.start();
    }
  });

  btnPauseHeader.addEventListener('click', togglePause);

  btnPauseResume.addEventListener('click', resumeGame);

  btnPauseRestart.addEventListener('click', () => {
    pauseModal.classList.add('hidden');
    game.start();
  });

  btnGameOverRestart.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    game.start();
  });

  game.onGameOver = (finalScore, highScore) => {
    controls.releaseAll();
    document.getElementById('gameover-score').textContent = finalScore;
    document.getElementById('gameover-highscore').textContent = highScore;
    gameOverModal.classList.remove('hidden');
  };

  // Header sound toggle
  btnSoundHeader.addEventListener('click', () => {
    const sfxOn = window.retroAudio.toggleSfx();
    window.retroAudio.init();
    toggleSfx.checked = sfxOn;
    updateSoundHeaderIcon();
  });

  function updateSoundHeaderIcon() {
    btnSoundHeader.textContent = window.retroAudio.sfxEnabled ? '🔊' : '🔇';
  }

  function applySwipeModeLook() {
    // Buttons stay usable in swipe mode, they are just de-emphasised
    controlsContainer.style.opacity = controls.swipeMode ? '0.35' : '1';
  }

  // Settings
  btnSettingsHeader.addEventListener('click', () => {
    pauseGame(false); // settings sit on top of a paused game
    settingsModal.classList.remove('hidden');
  });

  btnSettingsClose.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    if (game.isRunning && !game.isGameOver && game.isPaused) {
      pauseModal.classList.remove('hidden');
    }
  });

  toggleSfx.addEventListener('change', () => {
    window.retroAudio.sfxEnabled = toggleSfx.checked;
    window.retroAudio.init();
    try { localStorage.setItem('tetris_sfx', toggleSfx.checked); } catch(e){}
    updateSoundHeaderIcon();
  });

  toggleMusic.addEventListener('change', () => {
    if (toggleMusic.checked) {
      window.retroAudio.musicEnabled = true;
      window.retroAudio.init();
      if (game.isRunning && !game.isPaused && !game.isGameOver) {
        window.retroAudio.startMusic();
      }
    } else {
      window.retroAudio.musicEnabled = false;
      window.retroAudio.stopMusic();
    }
    try { localStorage.setItem('tetris_music', toggleMusic.checked); } catch(e){}
  });

  toggleGhost.addEventListener('change', () => {
    game.ghostEnabled = toggleGhost.checked;
  });

  toggleSwipe.addEventListener('change', () => {
    controls.swipeMode = toggleSwipe.checked;
    try { localStorage.setItem('tetris_swipe_mode', toggleSwipe.checked); } catch(e){}
    applySwipeModeLook();
  });

  toggleReversed.addEventListener('change', () => {
    controls.layoutReversed = toggleReversed.checked;
    try { localStorage.setItem('tetris_layout_reversed', toggleReversed.checked); } catch(e){}
    controlsContainer.classList.toggle('reversed', controls.layoutReversed);
  });

  // --- Auto-pause: tab switch / screen lock / app switch / landscape ---
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });

  const landscapeQuery = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
  const onOrientation = (e) => { if (e.matches) pauseGame(); };
  if (landscapeQuery.addEventListener) {
    landscapeQuery.addEventListener('change', onOrientation);
  } else if (landscapeQuery.addListener) {
    landscapeQuery.addListener(onOrientation);
  }

  // --- Service Worker Offline Registration ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('Tetris Service Worker registrerad!');
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.onstatechange = () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('En ny version av Tetris finns tillgänglig (laddas vid nästa start).');
              }
            };
          };
        })
        .catch(err => {
          console.log('Service Worker registrering misslyckades (kräver HTTPS eller localhost):', err);
        });
    });
  }

  // Show the "add to home screen" hint only on iPhone/iPad Safari that isn't installed yet
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const iosBanner = document.getElementById('ios-install-banner');
  if (iosBanner && isIOS && !isStandalone) {
    iosBanner.hidden = false;
  }
});
