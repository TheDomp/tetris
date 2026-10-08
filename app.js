// Main Application Orchestrator

// Bump both on every release to ensure fresh PWA service worker cache
const APP_VERSION = '1.2.0';

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
  const btnPauseGhost = document.getElementById('btn-pause-ghost');
  const btnPauseSound = document.getElementById('btn-pause-sound');
  const btnGameOverRestart = document.getElementById('btn-gameover-restart');
  const btnSettingsClose = document.getElementById('btn-settings-close');

  // Header buttons
  const btnGhostHeader = document.getElementById('btn-header-ghost');
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
  updateSoundUI();
  updateGhostUI();
  refreshResumeButton();

  // --- Ghost & Sound UI Updaters ---

  function updateGhostUI() {
    btnGhostHeader.classList.toggle('off', !game.ghostEnabled);
    btnGhostHeader.title = game.ghostEnabled ? 'Skuggbit: PÅ' : 'Skuggbit: AV';
    if (btnPauseGhost) {
      btnPauseGhost.textContent = game.ghostEnabled ? '👻 Skugga: PÅ' : '👻 Skugga: AV';
    }
    toggleGhost.checked = game.ghostEnabled;
  }

  function toggleGhostState() {
    game.toggleGhost();
    updateGhostUI();
  }

  function updateSoundUI() {
    const sfxOn = window.retroAudio.sfxEnabled;
    btnSoundHeader.textContent = sfxOn ? '🔊' : '🔇';
    btnSoundHeader.classList.toggle('off', !sfxOn);
    if (btnPauseSound) {
      btnPauseSound.textContent = sfxOn ? '🔊 Ljud: PÅ' : '🔇 Ljud: AV';
    }
    toggleSfx.checked = sfxOn;
  }

  function toggleSoundState() {
    window.retroAudio.toggleSfx();
    window.retroAudio.init();
    updateSoundUI();
  }

  function refreshResumeButton() {
    if (game.hasSavedState()) {
      try {
        const saved = JSON.parse(localStorage.getItem('tetris_saved_state'));
        btnResumeSaved.textContent = `Återuppta Spel (${saved.score || 0} p • Nivå ${saved.level || 1})`;
      } catch (e) {
        btnResumeSaved.textContent = 'Återuppta Spel';
      }
      btnResumeSaved.style.display = 'block';
      btnResumeSaved.className = 'primary-btn';
      btnStartNew.className = 'secondary-btn';
    } else {
      btnResumeSaved.style.display = 'none';
      btnStartNew.className = 'primary-btn';
    }
  }

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

  btnGhostHeader.addEventListener('click', toggleGhostState);
  if (btnPauseGhost) btnPauseGhost.addEventListener('click', toggleGhostState);

  btnSoundHeader.addEventListener('click', toggleSoundState);
  if (btnPauseSound) btnPauseSound.addEventListener('click', toggleSoundState);

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
    refreshResumeButton();
  };

  function applySwipeModeLook() {
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
    updateSoundUI();
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
    try { localStorage.setItem('tetris_ghost', toggleGhost.checked); } catch(e){}
    updateGhostUI();
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
