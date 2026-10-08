// Controls manager: Multi-touch pointer controls, DAS/ARR auto-repeat, swipe mode, and keyboard fallback

class ControlsManager {
  constructor(game) {
    this.game = game;

    // DAS (Delayed Auto Shift) & ARR (Auto Repeat Rate) in ms
    this.dasDelay = 140;
    this.arrInterval = 35;

    // Active repeats
    this.activeRepeat = null; // { direction: -1 or 1, dasTimeout, arrInterval }
    this.softDropActive = false;

    // Settings
    this.swipeMode = false;
    this.layoutReversed = false;

    try {
      const savedSwipe = localStorage.getItem('tetris_swipe_mode');
      if (savedSwipe !== null) this.swipeMode = savedSwipe === 'true';
      const savedReversed = localStorage.getItem('tetris_layout_reversed');
      if (savedReversed !== null) this.layoutReversed = savedReversed === 'true';
    } catch (e) {}

    // Swipe tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.lastSwipeCellX = 0;
    this.isSwiping = false;

    this.initTouchControls();
    this.initKeyboardControls();
    this.initPreventDefaultBehaviors();
  }

  // --- Virtual Button Handling with DAS / ARR ---

  initTouchControls() {
    // Helper to attach pointer handlers safely
    const setupRepeatButton = (btnId, onStart, onEnd) => {
      const el = document.getElementById(btnId);
      if (!el) return;

      const handleDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('active');
        onStart();
      };

      const handleUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');
        onEnd();
      };

      el.addEventListener('pointerdown', handleDown, { passive: false });
      el.addEventListener('pointerup', handleUp, { passive: false });
      el.addEventListener('pointercancel', handleUp, { passive: false });
      el.addEventListener('pointerleave', handleUp, { passive: false });
    };

    const setupTapButton = (btnId, onAction) => {
      const el = document.getElementById(btnId);
      if (!el) return;

      const handleDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('active');
        onAction();
      };

      const handleUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');
      };

      el.addEventListener('pointerdown', handleDown, { passive: false });
      el.addEventListener('pointerup', handleUp, { passive: false });
      el.addEventListener('pointercancel', handleUp, { passive: false });
      el.addEventListener('pointerleave', handleUp, { passive: false });
    };

    // Left button
    setupRepeatButton('btn-left', 
      () => this.startMoveRepeat(-1), 
      () => this.stopMoveRepeat(-1)
    );

    // Right button
    setupRepeatButton('btn-right', 
      () => this.startMoveRepeat(1), 
      () => this.stopMoveRepeat(1)
    );

    // Soft drop button
    setupRepeatButton('btn-soft-drop', 
      () => {
        this.game.isSoftDropping = true;
        this.game.move(0, 1);
      }, 
      () => {
        this.game.isSoftDropping = false;
      }
    );

    // Hard drop button
    setupTapButton('btn-hard-drop', () => {
      this.game.hardDrop();
    });

    // Rotate Clockwise
    setupTapButton('btn-rotate-cw', () => {
      this.game.rotate(1);
    });

    // Rotate Counter-Clockwise
    setupTapButton('btn-rotate-ccw', () => {
      this.game.rotate(-1);
    });

    // Hold button
    setupTapButton('btn-hold', () => {
      this.game.hold();
    });

    // Swipe handling on canvas area
    this.initCanvasSwipe();
  }

  startMoveRepeat(dir) {
    this.stopMoveRepeat();

    // Initial move
    this.game.move(dir, 0);

    const dasTimeout = setTimeout(() => {
      const arrInterval = setInterval(() => {
        this.game.move(dir, 0);
      }, this.arrInterval);

      if (this.activeRepeat) {
        this.activeRepeat.arrInterval = arrInterval;
      }
    }, this.dasDelay);

    this.activeRepeat = {
      dir: dir,
      dasTimeout: dasTimeout,
      arrInterval: null
    };
  }

  stopMoveRepeat(dir = null) {
    if (this.activeRepeat) {
      if (dir === null || this.activeRepeat.dir === dir) {
        clearTimeout(this.activeRepeat.dasTimeout);
        if (this.activeRepeat.arrInterval) {
          clearInterval(this.activeRepeat.arrInterval);
        }
        this.activeRepeat = null;
      }
    }
  }

  // --- Optional Canvas Swipe Mode ---

  initCanvasSwipe() {
    const canvas = this.game.canvas;

    canvas.addEventListener('touchstart', (e) => {
      if (!this.swipeMode || !this.game.isRunning || this.game.isPaused) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.lastSwipeCellX = touch.clientX;
        this.touchStartTime = performance.now();
        this.isSwiping = false;
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (!this.swipeMode || !this.game.isRunning || this.game.isPaused) return;
      e.preventDefault();

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const dxTotal = touch.clientX - this.touchStartX;
        const dyTotal = touch.clientY - this.touchStartY;

        if (Math.abs(dxTotal) > 10 || Math.abs(dyTotal) > 10) {
          this.isSwiping = true;
        }

        // Horizontal stepping
        const dxCell = touch.clientX - this.lastSwipeCellX;
        const cellThreshold = this.game.cellSize * 0.9;

        if (Math.abs(dxCell) >= cellThreshold) {
          const steps = Math.floor(Math.abs(dxCell) / cellThreshold);
          const dir = dxCell > 0 ? 1 : -1;
          for (let i = 0; i < steps; i++) {
            this.game.move(dir, 0);
          }
          this.lastSwipeCellX = touch.clientX;
        }

        // Downward drag (soft drop)
        if (dyTotal > 30) {
          this.game.isSoftDropping = true;
        } else {
          this.game.isSoftDropping = false;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (!this.swipeMode || !this.game.isRunning || this.game.isPaused) return;
      this.game.isSoftDropping = false;

      const duration = performance.now() - this.touchStartTime;

      if (!this.isSwiping && duration < 250) {
        // Tap = Rotate CW
        this.game.rotate(1);
      } else {
        // Fast downward flick = Hard Drop
        const changeY = (e.changedTouches[0]?.clientY || 0) - this.touchStartY;
        if (changeY > 80 && duration < 200) {
          this.game.hardDrop();
        }
      }
    }, { passive: false });
  }

  // --- Keyboard Fallback ---

  initKeyboardControls() {
    const keysDown = new Set();
    this._keysDown = keysDown;

    window.addEventListener('keydown', (e) => {
      // Don't intercept when modal forms or inputs are focused
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
        // A focused <button> would otherwise also be "clicked" by Space
        if (document.activeElement?.tagName === 'BUTTON') document.activeElement.blur();
      }

      if (keysDown.has(e.code)) return;
      keysDown.add(e.code);

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.startMoveRepeat(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.startMoveRepeat(1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.game.isSoftDropping = true;
          this.game.move(0, 1);
          break;
        case 'Space':
          this.game.hardDrop();
          break;
        case 'ArrowUp':
        case 'KeyX':
        case 'KeyW':
          this.game.rotate(1);
          break;
        case 'KeyZ':
        case 'ControlLeft':
        case 'ControlRight':
          this.game.rotate(-1);
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.game.hold();
          break;
        case 'KeyP':
        case 'Escape':
          // The app owns pause UI (modal), so delegate to it when available
          if (this.onTogglePause) {
            this.onTogglePause();
          } else if (this.game.isPaused) {
            this.game.resume();
          } else {
            this.game.pause();
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      keysDown.delete(e.code);

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.stopMoveRepeat(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.stopMoveRepeat(1);
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.game.isSoftDropping = false;
      }
    });
  }

  // Release every held input (buttons, keys, swipe). Called when the app is
  // backgrounded/paused: iOS may never deliver the matching pointerup/keyup,
  // which would otherwise leave a piece auto-repeating or soft-dropping.
  releaseAll() {
    this.stopMoveRepeat();
    this.game.isSoftDropping = false;
    this.isSwiping = false;
    if (this._keysDown) this._keysDown.clear();
    document.querySelectorAll('.ctrl-btn.active').forEach(el => el.classList.remove('active'));
  }

  // --- Prevent Unwanted iOS Web Gestures ---

  initPreventDefaultBehaviors() {
    // Double-tap zoom is already disabled by `touch-action: none` in the CSS.
    // (A global touchend preventDefault was removed: it also swallowed `click`
    // events on menu buttons tapped shortly after a control button.)

    // Disable pinch-to-zoom (Safari)
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });

    // Disable context menu (long press callout)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Never leave an input "stuck" when focus/visibility is lost
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });
  }
}

window.ControlsManager = ControlsManager;
