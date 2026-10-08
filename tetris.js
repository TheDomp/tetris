// Klassisk Tetris Engine with Modern Guidelines (SRS, 7-Bag, Lock Delay, Retina Canvas)

const COLS = 10;
const ROWS = 20;
const HIDDEN_ROWS = 4;
const TOTAL_ROWS = ROWS + HIDDEN_ROWS;

// Standard Tetromino definitions (4x4 or 3x3 matrix in 4 rotation states)
const SHAPES = {
  I: [
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
    [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
    [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
  ],
  J: [
    [[1,0,0], [1,1,1], [0,0,0]],
    [[0,1,1], [0,1,0], [0,1,0]],
    [[0,0,0], [1,1,1], [0,0,1]],
    [[0,1,0], [0,1,0], [1,1,0]]
  ],
  L: [
    [[0,0,1], [1,1,1], [0,0,0]],
    [[0,1,0], [0,1,0], [0,1,1]],
    [[0,0,0], [1,1,1], [1,0,0]],
    [[1,1,0], [0,1,0], [0,1,0]]
  ],
  O: [
    [[1,1], [1,1]],
    [[1,1], [1,1]],
    [[1,1], [1,1]],
    [[1,1], [1,1]]
  ],
  S: [
    [[0,1,1], [1,1,0], [0,0,0]],
    [[0,1,0], [0,1,1], [0,0,1]],
    [[0,0,0], [0,1,1], [1,1,0]],
    [[1,0,0], [1,1,0], [0,1,0]]
  ],
  T: [
    [[0,1,0], [1,1,1], [0,0,0]],
    [[0,1,0], [0,1,1], [0,1,0]],
    [[0,0,0], [1,1,1], [0,1,0]],
    [[0,1,0], [1,1,0], [0,1,0]]
  ],
  Z: [
    [[1,1,0], [0,1,1], [0,0,0]],
    [[0,0,1], [0,1,1], [0,1,0]],
    [[0,0,0], [1,1,0], [0,1,1]],
    [[0,1,0], [1,1,0], [1,0,0]]
  ]
};

const PIECE_COLORS = {
  I: { main: '#00f0ff', light: '#80f8ff', dark: '#00a3cc' }, // Cyan
  J: { main: '#2979ff', light: '#82b1ff', dark: '#1565c0' }, // Blue
  L: { main: '#ff9100', light: '#ffd180', dark: '#e65100' }, // Orange
  O: { main: '#ffd600', light: '#ffff8d', dark: '#f57f17' }, // Yellow
  S: { main: '#00e676', light: '#b9f6ca', dark: '#00c853' }, // Green
  T: { main: '#d500f9', light: '#ea80fc', dark: '#aa00ff' }, // Magenta
  Z: { main: '#ff1744', light: '#ff8a80', dark: '#d50000' }  // Red
};

// Super Rotation System (SRS) Kick Tables
// Coordinates are [dx, dy] where dy is POSITIVE UP in SRS, so in grid terms dy is negative
const KICKS_JLSTZ = {
  '0->1': [[0,0], [-1,0], [-1, 1], [0,-2], [-1,-2]],
  '1->0': [[0,0], [ 1,0], [ 1,-1], [0, 2], [ 1, 2]],
  '1->2': [[0,0], [ 1,0], [ 1,-1], [0, 2], [ 1, 2]],
  '2->1': [[0,0], [-1,0], [-1, 1], [0,-2], [-1,-2]],
  '2->3': [[0,0], [ 1,0], [ 1, 1], [0,-2], [ 1,-2]],
  '3->2': [[0,0], [-1,0], [-1,-1], [0, 2], [-1, 2]],
  '3->0': [[0,0], [-1,0], [-1,-1], [0, 2], [-1, 2]],
  '0->3': [[0,0], [ 1,0], [ 1, 1], [0,-2], [ 1,-2]]
};

const KICKS_I = {
  '0->1': [[0,0], [-2,0], [ 1,0], [-2,-1], [ 1, 2]],
  '1->0': [[0,0], [ 2,0], [-1,0], [ 2, 1], [-1,-2]],
  '1->2': [[0,0], [-1,0], [ 2,0], [-1, 2], [ 2,-1]],
  '2->1': [[0,0], [ 1,0], [-2,0], [ 1,-2], [-2, 1]],
  '2->3': [[0,0], [ 2,0], [-1,0], [ 2, 1], [-1,-2]],
  '3->2': [[0,0], [-2,0], [ 1,0], [-2,-1], [ 1, 2]],
  '3->0': [[0,0], [ 1,0], [-2,0], [ 1,-2], [-2, 1]],
  '0->3': [[0,0], [-1,0], [ 2,0], [-1, 2], [ 2,-1]]
};

class TetrisGame {
  constructor(canvas, nextCanvas, holdCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');
    this.holdCanvas = holdCanvas;
    this.holdCtx = holdCanvas.getContext('2d');

    // Display scale
    this.dpr = window.devicePixelRatio || 1;
    this.cellSize = 28;

    // Game state
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.isBackToBack = false;

    // Piece bags
    this.bag = [];
    this.currentPiece = null;
    this.holdPieceType = null;
    this.canHold = true;

    // Timers
    this.dropInterval = 0.8; // seconds
    this.dropTimer = 0;
    this.lockDelay = 0.5; // seconds
    this.lockTimer = 0;
    this.isLocking = false;
    this.lockResetMoves = 0;
    this.maxLockResets = 15;

    // Soft drop state
    this.isSoftDropping = false;

    // Animation & FX
    this.lastTime = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.clearingLines = [];
    this.clearAnimationTimer = 0;
    this.particles = [];
    this.screenShake = 0;
    this.floatingTexts = [];

    // Settings
    this.ghostEnabled = true;
    try {
      const savedGhost = localStorage.getItem('tetris_ghost');
      if (savedGhost !== null) this.ghostEnabled = savedGhost === 'true';
    } catch (e) {}

    this.resizeCanvases();
  }

  toggleGhost() {
    this.ghostEnabled = !this.ghostEnabled;
    try {
      localStorage.setItem('tetris_ghost', this.ghostEnabled);
    } catch (e) {}
    return this.ghostEnabled;
  }

  createEmptyGrid() {
    return Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
  }

  loadHighScore() {
    try {
      return parseInt(localStorage.getItem('tetris_high_score'), 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('tetris_high_score', this.highScore);
      } catch (e) {}
    }
  }

  resizeCanvases() {
    this.dpr = window.devicePixelRatio || 1;

    // The playfield area is a flex row: [matrix wrapper][side panel]. The wrapper's
    // own size depends on the canvas, so measure the *parent* row and subtract the
    // panel instead (measuring the wrapper is circular and never grows/shrinks).
    const area = this.canvas.closest('#playfield-area') || this.canvas.parentElement;
    if (!area) return;

    const panel = area.querySelector('.side-panel');
    const gap = parseFloat(getComputedStyle(area).columnGap) || 0;
    const availableWidth = area.clientWidth - (panel ? panel.offsetWidth : 0) - gap;
    const availableHeight = area.clientHeight;
    if (availableWidth <= 0 || availableHeight <= 0) return;

    // Largest whole-pixel cell that fits both ways (keeps the grid crisp)
    const cellW = Math.floor(availableWidth / COLS);
    const cellH = Math.floor(availableHeight / ROWS);
    this.cellSize = Math.max(12, Math.min(cellW, cellH));

    const width = this.cellSize * COLS;
    const height = this.cellSize * ROWS;

    // Main Canvas (setting width/height also resets the 2D transform)
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.dpr, this.dpr);

    // Next / Hold previews: fixed compact size so the side panel always fits
    const previewSize = 60;
    for (const [cv, cx] of [[this.nextCanvas, this.nextCtx], [this.holdCanvas, this.holdCtx]]) {
      cv.width = previewSize * this.dpr;
      cv.height = previewSize * this.dpr;
      cv.style.width = `${previewSize}px`;
      cv.style.height = `${previewSize}px`;
      cx.scale(this.dpr, this.dpr);
    }

    this.render();
  }

  // --- 7-Bag Randomizer ---

  fillBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    // Fisher-Yates shuffle
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag.push(...pieces);
  }

  getNextPieceType() {
    if (this.bag.length < 7) {
      this.fillBag();
    }
    return this.bag.shift();
  }

  spawnPiece(type = null) {
    const pieceType = type || this.getNextPieceType();
    const shapes = SHAPES[pieceType];
    const matrix = shapes[0];

    // Spawn one row above the visible field: the piece's top matrix row sits in the
    // hidden buffer and its filled row is the first visible row (guideline behaviour).
    const x = Math.floor((COLS - matrix[0].length) / 2);
    const y = HIDDEN_ROWS - 1;
    this.lowestY = y;

    this.currentPiece = {
      type: pieceType,
      rotation: 0,
      matrix: matrix,
      x: x,
      y: y
    };

    this.canHold = true;
    this.isLocking = false;
    this.lockTimer = 0;
    this.lockResetMoves = 0;

    // Check game over (spawn collision)
    if (this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y)) {
      this.gameOver();
    }
  }

  // --- Collision & Super Rotation System (SRS) ---

  checkCollision(matrix, px, py) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const gx = px + c;
          const gy = py + r;

          // Out of horizontal bounds
          if (gx < 0 || gx >= COLS) return true;
          // Out of vertical bounds (above the hidden buffer or below the floor)
          if (gy < 0 || gy >= TOTAL_ROWS) return true;

          // Cell already occupied
          if (this.grid[gy][gx]) return true;
        }
      }
    }
    return false;
  }

  rotate(direction = 1) { // 1 = Clockwise, -1 = Counter-Clockwise
    if (!this.currentPiece || this.isGameOver || this.isPaused) return false;

    const type = this.currentPiece.type;
    if (type === 'O') return true; // O does not rotate

    const currentRot = this.currentPiece.rotation;
    const nextRot = (currentRot + direction + 4) % 4;
    const nextMatrix = SHAPES[type][nextRot];

    const transitionKey = `${currentRot}->${nextRot}`;
    const kickTable = (type === 'I') ? KICKS_I : KICKS_JLSTZ;
    const kicks = kickTable[transitionKey] || [[0, 0]];

    for (const [dx, srsDy] of kicks) {
      // In SRS dy is inverted compared to grid row index
      const dy = -srsDy;
      const testX = this.currentPiece.x + dx;
      const testY = this.currentPiece.y + dy;

      if (!this.checkCollision(nextMatrix, testX, testY)) {
        this.currentPiece.rotation = nextRot;
        this.currentPiece.matrix = nextMatrix;
        this.currentPiece.x = testX;
        this.currentPiece.y = testY;

        if (this.isLocking && this.lockResetMoves < this.maxLockResets) {
          this.lockTimer = 0;
          this.lockResetMoves++;
        }

        window.retroAudio.playRotate();
        return true;
      }
    }

    return false;
  }

  moveLeft() {
    return this.move(-1, 0);
  }

  moveRight() {
    return this.move(1, 0);
  }

  move(dx, dy) {
    if (!this.currentPiece || this.isGameOver || this.isPaused) return false;

    const nextX = this.currentPiece.x + dx;
    const nextY = this.currentPiece.y + dy;

    if (!this.checkCollision(this.currentPiece.matrix, nextX, nextY)) {
      this.currentPiece.x = nextX;
      this.currentPiece.y = nextY;

      if (dx !== 0) {
        window.retroAudio.playMove();
        if (this.isLocking && this.lockResetMoves < this.maxLockResets) {
          this.lockTimer = 0;
          this.lockResetMoves++;
        }
      }

      return true;
    }
    return false;
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let gy = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, gy + 1)) {
      gy++;
    }
    return gy;
  }

  hardDrop() {
    if (!this.currentPiece || this.isGameOver || this.isPaused) return;

    const startY = this.currentPiece.y;
    const ghostY = this.getGhostY();
    const droppedDistance = ghostY - startY;

    this.currentPiece.y = ghostY;
    this.score += droppedDistance * 2;

    this.triggerScreenShake(4);
    this.addHardDropParticles();

    window.retroAudio.playHardDrop();
    this.lockPiece();
  }

  hold() {
    if (!this.currentPiece || !this.canHold || this.isGameOver || this.isPaused) return;

    const currentType = this.currentPiece.type;
    window.retroAudio.playHold();

    if (this.holdPieceType === null) {
      this.holdPieceType = currentType;
      this.spawnPiece();
    } else {
      const temp = this.holdPieceType;
      this.holdPieceType = currentType;
      this.spawnPiece(temp);
    }

    this.canHold = false;
  }

  // --- Game Loop & Logic ---

  start() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.isBackToBack = false;
    this.bag = [];
    this.holdPieceType = null;
    this.canHold = true;
    this.isGameOver = false;
    this.isPaused = false;
    this.isRunning = true;
    this.particles = [];
    this.floatingTexts = [];
    this.clearingLines = [];
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.isLocking = false;

    this.updateDropInterval();
    this.spawnPiece();
    this.lastTime = performance.now();

    window.retroAudio.init();
    if (window.retroAudio.musicEnabled) {
      window.retroAudio.startMusic();
    }

    this.saveState();
  }

  pause() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = true;
    window.retroAudio.stopMusic();
    this.saveState();
  }

  resume() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    if (window.retroAudio.musicEnabled) {
      window.retroAudio.startMusic();
    }
  }

  updateDropInterval() {
    // Guideline gravity curve: seconds per row = (0.8 - (level - 1) * 0.007) ^ (level - 1)
    // Floored so touch controls stay playable at the highest levels.
    const n = this.level - 1;
    const base = 0.8 - n * 0.007;
    this.dropInterval = Math.max(0.05, Math.pow(base, n));
  }

  update(dt) {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;

    // Handle line clear animation pause
    if (this.clearingLines.length > 0) {
      this.clearAnimationTimer += dt;
      if (this.clearAnimationTimer >= 0.2) {
        this.finishLineClear();
      }
      this.updateParticles(dt);
      return;
    }

    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 20);
    }

    if (!this.currentPiece) return;

    // Gravity: accumulate time and drop as many rows as the elapsed time allows,
    // so speed does not depend on the display refresh rate (60/120 Hz) or frame drops.
    const currentSpeed = this.isSoftDropping ? Math.min(this.dropInterval, 0.035) : this.dropInterval;
    this.dropTimer += dt;

    let guard = 0;
    while (this.dropTimer >= currentSpeed && guard++ < 25) {
      this.dropTimer -= currentSpeed;
      if (!this.move(0, 1)) {
        this.dropTimer = 0; // resting on something; lock delay below takes over
        break;
      }
      if (this.isSoftDropping) this.score += 1;
    }

    // Reaching a new lowest row refreshes the lock-reset allowance
    if (this.currentPiece.y > this.lowestY) {
      this.lowestY = this.currentPiece.y;
      this.lockResetMoves = 0;
    }

    // Lock delay while resting on the stack
    const isGrounded = this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1);
    if (isGrounded) {
      this.isLocking = true;
      this.lockTimer += dt;
      if (this.lockTimer >= this.lockDelay) {
        this.lockPiece();
      }
    } else {
      this.isLocking = false;
      // If piece is at or below its lowest point and still has resets, clear lock timer
      if (this.lockResetMoves < this.maxLockResets && this.currentPiece.y >= this.lowestY) {
        this.lockTimer = 0;
      }
    }
  }

  lockPiece() {
    if (!this.currentPiece) return;

    const { matrix, x, y, type } = this.currentPiece;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const gx = x + c;
          const gy = y + r;
          if (gy >= 0 && gy < TOTAL_ROWS && gx >= 0 && gx < COLS) {
            this.grid[gy][gx] = type;
          }
        }
      }
    }

    this.currentPiece = null;
    this.isLocking = false;
    this.lockTimer = 0;

    // Check for completed lines
    this.checkLines();
  }

  checkLines() {
    const fullLines = [];
    for (let r = HIDDEN_ROWS; r < TOTAL_ROWS; r++) {
      if (this.grid[r].every(cell => cell !== null)) {
        fullLines.push(r);
      }
    }

    if (fullLines.length > 0) {
      this.clearingLines = fullLines;
      this.clearAnimationTimer = 0;
      window.retroAudio.playClear(fullLines.length);

      // Create particle burst on each cleared line
      fullLines.forEach(row => {
        this.addLineParticles(row);
      });
    } else {
      this.combo = -1;
      this.spawnPiece();
      this.saveState();
    }
  }

  finishLineClear() {
    const linesCount = this.clearingLines.length;
    
    // Remove cleared rows and shift down
    for (const row of this.clearingLines) {
      this.grid.splice(row, 1);
      this.grid.unshift(Array(COLS).fill(null));
    }

    this.clearingLines = [];
    this.clearAnimationTimer = 0;

    // Update lines & level
    this.lines += linesCount;
    const oldLevel = this.level;
    this.level = Math.floor(this.lines / 10) + 1;

    if (this.level > oldLevel) {
      window.retroAudio.playLevelUp();
      this.addFloatingText(`NIVÅ ${this.level}!`, COLS / 2, 8, '#ffd600');
      this.updateDropInterval();
    }

    // Scoring
    this.combo++;
    let linePoints = 0;
    let label = '';

    if (linesCount === 1) {
      linePoints = 100 * this.level;
      label = 'SINGEL';
      this.isBackToBack = false;
    } else if (linesCount === 2) {
      linePoints = 300 * this.level;
      label = 'DUBBEL';
      this.isBackToBack = false;
    } else if (linesCount === 3) {
      linePoints = 500 * this.level;
      label = 'TRIPPEL';
      this.isBackToBack = false;
    } else if (linesCount === 4) {
      if (this.isBackToBack) {
        linePoints = 1200 * this.level;
        label = 'B2B TETRIS!';
      } else {
        linePoints = 800 * this.level;
        label = 'TETRIS!';
      }
      this.isBackToBack = true;
      this.triggerScreenShake(6);
    }

    // Combo points
    const comboBonus = this.combo > 0 ? 50 * this.combo * this.level : 0;
    linePoints += comboBonus;

    this.score += linePoints;
    this.saveHighScore();
    this.addFloatingText(`${label} +${linePoints}`, COLS / 2, 10, linesCount === 4 ? '#00f0ff' : '#ffffff');
    if (this.combo > 0) {
      this.addFloatingText(`COMBO x${this.combo + 1}`, COLS / 2, 11.3, '#ffd600');
    }

    this.spawnPiece();
    this.saveState();
  }

  gameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    window.retroAudio.playGameOver();
    window.retroAudio.stopMusic();
    this.saveHighScore();

    try {
      localStorage.removeItem('tetris_saved_state');
    } catch (e) {}

    if (this.onGameOver) {
      this.onGameOver(this.score, this.highScore);
    }
  }

  // --- State Persistence ---

  saveState() {
    if (this.isGameOver) return;
    try {
      const state = {
        grid: this.grid,
        score: this.score,
        level: this.level,
        lines: this.lines,
        bag: this.bag,
        holdPieceType: this.holdPieceType,
        canHold: this.canHold,
        currentPiece: this.currentPiece,
        highScore: this.highScore
      };
      localStorage.setItem('tetris_saved_state', JSON.stringify(state));
    } catch (e) {}
  }

  restoreState() {
    try {
      const saved = localStorage.getItem('tetris_saved_state');
      if (!saved) return false;
      const state = JSON.parse(saved);
      if (!state.grid || !Array.isArray(state.grid)) return false;

      const g = state.grid;
      if (!g || !Array.isArray(g) || g.length !== TOTAL_ROWS ||
          !g.every(row => Array.isArray(row) && row.length === COLS)) return false;

      this.grid = g;
      this.score = state.score || 0;
      this.level = state.level || 1;
      this.lines = state.lines || 0;
      this.bag = Array.isArray(state.bag) ? state.bag : [];
      this.holdPieceType = state.holdPieceType || null;
      this.canHold = state.canHold !== false;
      this.currentPiece = state.currentPiece || null;
      this.highScore = Math.max(this.highScore, state.highScore || 0);
      this.combo = -1;
      this.isBackToBack = false;
      this.clearingLines = [];
      this.isGameOver = false;
      this.particles = [];
      this.floatingTexts = [];
      this.dropTimer = 0;
      this.lockTimer = 0;
      this.isLocking = false;
      this.lockResetMoves = 0;
      this.lowestY = this.currentPiece ? this.currentPiece.y : 0;

      this.updateDropInterval();
      this.isRunning = true;
      this.isPaused = true; // start in paused state so player is ready
      this.lastTime = performance.now();

      // Saved while no piece was active (paused during a line clear): finish that step
      if (!this.currentPiece) this.checkLines();
      return true;
    } catch (e) {
      return false;
    }
  }

  hasSavedState() {
    try {
      return !!localStorage.getItem('tetris_saved_state');
    } catch (e) {
      return false;
    }
  }

  // --- FX: Particles, Screen Shake, Floaters ---

  triggerScreenShake(intensity) {
    this.screenShake = intensity;
  }

  addLineParticles(row) {
    const y = (row - HIDDEN_ROWS) * this.cellSize + this.cellSize / 2;
    for (let c = 0; c < COLS; c++) {
      const x = c * this.cellSize + this.cellSize / 2;
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 80 + 20;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 2,
          color: '#ffffff',
          alpha: 1,
          life: 0.4
        });
      }
    }
  }

  addHardDropParticles() {
    if (!this.currentPiece) return;
    const { matrix, x, y, type } = this.currentPiece;
    const color = PIECE_COLORS[type].main;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const px = (x + c) * this.cellSize + this.cellSize / 2;
          const py = (y + r - HIDDEN_ROWS + 1) * this.cellSize;
          for (let i = 0; i < 2; i++) {
            this.particles.push({
              x: px + (Math.random() - 0.5) * this.cellSize,
              y: py,
              vx: (Math.random() - 0.5) * 60,
              vy: -(Math.random() * 40 + 20),
              size: Math.random() * 2.5 + 1.5,
              color: color,
              alpha: 0.9,
              life: 0.3
            });
          }
        }
      }
    }
  }

  addFloatingText(text, col, row, color) {
    this.floatingTexts.push({
      text: text,
      x: col * this.cellSize,
      y: (row - 1) * this.cellSize,
      color: color,
      alpha: 1,
      vy: -35,
      life: 1.0
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt / p.life;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt / ft.life;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- Rendering ---

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    ctx.save();

    // Screen Shake offset
    if (this.screenShake > 0) {
      const ox = (Math.random() - 0.5) * this.screenShake;
      const oy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(ox, oy);
    }

    // Background
    ctx.fillStyle = '#0e0f17';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * this.cellSize, 0);
      ctx.lineTo(c * this.cellSize, h);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * this.cellSize);
      ctx.lineTo(w, r * this.cellSize);
      ctx.stroke();
    }

    // Render locked grid cells
    for (let r = HIDDEN_ROWS; r < TOTAL_ROWS; r++) {
      const isClearing = this.clearingLines.includes(r);
      for (let c = 0; c < COLS; c++) {
        const type = this.grid[r][c];
        if (type) {
          const drawY = r - HIDDEN_ROWS;
          if (isClearing) {
            // Flash row white during clear
            this.drawCell(ctx, c, drawY, '#ffffff', '#ffffff', '#ffffff', 0.8);
          } else {
            const colors = PIECE_COLORS[type];
            this.drawCell(ctx, c, drawY, colors.main, colors.light, colors.dark);
          }
        }
      }
    }

    // Render Ghost Piece
    if (this.ghostEnabled && this.currentPiece && !this.isGameOver) {
      const ghostY = this.getGhostY();
      const { matrix, x, type } = this.currentPiece;
      const colors = PIECE_COLORS[type];

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            const gx = x + c;
            const gy = ghostY + r - HIDDEN_ROWS;
            if (gy >= 0 && gy < ROWS) {
              this.drawGhostCell(ctx, gx, gy, colors.main);
            }
          }
        }
      }
    }

    // Render Active Piece
    if (this.currentPiece && !this.isGameOver) {
      const { matrix, x, y, type } = this.currentPiece;
      const colors = PIECE_COLORS[type];

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            const gx = x + c;
            const gy = y + r - HIDDEN_ROWS;
            if (gy >= 0 && gy < ROWS) {
              this.drawCell(ctx, gx, gy, colors.main, colors.light, colors.dark);
            }
          }
        }
      }
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Render Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.font = `bold ${Math.round(this.cellSize * 0.6)}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // Render side panels (Next & Hold)
    this.renderNext();
    this.renderHold();
  }

  drawCell(ctx, col, row, mainColor, lightColor, darkColor, alpha = 1) {
    const cs = this.cellSize;
    const x = col * cs;
    const y = row * cs;
    const pad = 1.5;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Base fill
    ctx.fillStyle = mainColor;
    ctx.fillRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2);

    // Top & Left bevel highlight
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + cs - pad, y + pad);
    ctx.lineTo(x + cs - pad - 3, y + pad + 3);
    ctx.lineTo(x + pad + 3, y + pad + 3);
    ctx.lineTo(x + pad + 3, y + cs - pad - 3);
    ctx.lineTo(x + pad, y + cs - pad);
    ctx.closePath();
    ctx.fill();

    // Bottom & Right bevel shadow
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(x + cs - pad, y + pad);
    ctx.lineTo(x + cs - pad, y + cs - pad);
    ctx.lineTo(x + pad, y + cs - pad);
    ctx.lineTo(x + pad + 3, y + cs - pad - 3);
    ctx.lineTo(x + cs - pad - 3, y + cs - pad - 3);
    ctx.lineTo(x + cs - pad - 3, y + pad + 3);
    ctx.closePath();
    ctx.fill();

    // Subtle gloss in top-left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x + pad + 3, y + pad + 3, (cs - pad * 2) * 0.35, (cs - pad * 2) * 0.35);

    ctx.restore();
  }

  drawGhostCell(ctx, col, row, color) {
    const cs = this.cellSize;
    const x = col * cs;
    const y = row * cs;
    const pad = 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2);
    ctx.restore();
  }

  renderNext() {
    const ctx = this.nextCtx;
    const w = this.nextCanvas.width / this.dpr;
    const h = this.nextCanvas.height / this.dpr;

    ctx.clearRect(0, 0, w, h);

    const nextType = this.bag[0];
    if (!nextType) return;

    this.drawPreviewPiece(ctx, nextType, w, h);
  }

  renderHold() {
    const ctx = this.holdCtx;
    const w = this.holdCanvas.width / this.dpr;
    const h = this.holdCanvas.height / this.dpr;

    ctx.clearRect(0, 0, w, h);

    if (!this.holdPieceType) return;

    const alpha = this.canHold ? 1.0 : 0.4;
    this.drawPreviewPiece(ctx, this.holdPieceType, w, h, alpha);
  }

  drawPreviewPiece(ctx, type, w, h, alpha = 1.0) {
    const matrix = SHAPES[type][0];
    const colors = PIECE_COLORS[type];
    const previewCell = Math.floor(w / 4.6);

    const pieceW = matrix[0].length * previewCell;
    const pieceH = matrix.length * previewCell;

    // Center piece
    const ox = (w - pieceW) / 2;
    const oy = (h - pieceH) / 2;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const x = ox + c * previewCell;
          const y = oy + r * previewCell;
          const pad = 1.2;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = colors.main;
          ctx.fillRect(x + pad, y + pad, previewCell - pad * 2, previewCell - pad * 2);

          ctx.fillStyle = colors.light;
          ctx.fillRect(x + pad, y + pad, previewCell - pad * 2, 2.5);
          ctx.fillRect(x + pad, y + pad, 2.5, previewCell - pad * 2);

          ctx.fillStyle = colors.dark;
          ctx.fillRect(x + pad, y + previewCell - pad - 2.5, previewCell - pad * 2, 2.5);
          ctx.fillRect(x + previewCell - pad - 2.5, y + pad, 2.5, previewCell - pad * 2);
          ctx.restore();
        }
      }
    }
  }
}

window.TetrisGame = TetrisGame;
