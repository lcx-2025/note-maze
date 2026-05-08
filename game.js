// ========== 全局状态 ==========
const state = {
  gridSize: 5,
  grid: [],
  player: { x: 0, y: 0 },
  melody: [],
  currentIndex: 0,
  mistakes: 0,
  steps: 0,
  wins: 0,
  audioCtx: null,
  volume: 0.8,
  isPlaying: false,
  touchStartX: 0,
  touchStartY: 0,
  history: [],
  showHint: false,
  usedHint: false,
  currentScore: 0,
  mistakeCount: 0,
  hintModalShown: false,
  currentPhraseMap: [],
  totalCoins: 0,
  currentSound: 'piano',
  ownedSounds: ['piano']
};

// DOM 元素缓存
const els = {};
let moveLock = false;

// ========== 初始化入口 ==========
window.addEventListener('DOMContentLoaded', () => {
  // 绑定所有 DOM 元素
  Object.assign(els, {
    board: document.getElementById('maze-board'),
    nextNote: document.getElementById('next-note'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    mistakes: document.getElementById('mistakes'),
    winCount: document.getElementById('win-count'),
    totalSteps: document.getElementById('total-steps'),
    currentScore: document.getElementById('current-score'),
    totalScore: document.getElementById('total-score'),
    message: document.getElementById('message'),
    audioOverlay: document.getElementById('audio-init-overlay'),
    songList: document.getElementById('song-list'),
    undoBtn: document.getElementById('undo-btn'),
    hintBtn: document.getElementById('hint-btn'),
    mistakeModal: document.getElementById('mistake-modal'),
    modalHintBtn: document.getElementById('modal-hint-btn'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    totalCoins: document.getElementById('total-coins'),
    soundShopModal: document.getElementById('sound-shop-modal'),
    closeShopBtn: document.getElementById('close-shop-btn'),
    shopCoinsDisplay: document.getElementById('shop-coins-display'),
    soundList: document.querySelector('.sound-list'),
    currentSongName: document.getElementById('current-song-name')
  });

  // 音频初始化
  if (els.audioOverlay) {
    els.audioOverlay.addEventListener('click', () => {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      els.audioOverlay.style.display = 'none';
      startGame();
    });
  } else {
    startGame();
  }
});

// 游戏启动流程
function startGame() {
  // 加载持久化数据
  state.totalCoins = loadCoins();
  const soundData = loadOwnedSounds();
  state.ownedSounds = soundData.ownedSounds;
  state.currentSound = soundData.currentSound;

  renderSongList();
  bindInputs();

  // 尝试恢复存档
  const restored = loadProgress(state, state.gridSize);
  if (!restored) {
    loadSong(SONGS[0].id, true);
  }

  updateCoinUI();
  updateBestScoreUI();

  if (els.currentSongName) {
    els.currentSongName.textContent = SONGS[0].name;
  }
}

// ========== UI 渲染 ==========
function renderSongList() {
  if (!els.songList) return;
  els.songList.innerHTML = '';
  SONGS.forEach(song => {
    const li = document.createElement('li');
    li.textContent = song.name;
    li.dataset.id = song.id;
    li.onclick = () => loadSong(song.id);
    els.songList.appendChild(li);
  });
}

function renderGrid() {
  if (!els.board) return;
  els.board.style.setProperty('--size', state.gridSize);
  els.board.innerHTML = '';

  state.grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      const div = document.createElement('div');
      div.className = 'cell';

      if (x === 0 && y === 0) div.classList.add('start');
      if (state.endPos && x === state.endPos.x && y === state.endPos.y) div.classList.add('end');
      if (x === state.player.x && y === state.player.y) div.classList.add('player');

      if (cell.visited) {
        div.classList.add('visited');
        if (cell.phraseColor && cell.phraseColor !== 'default') {
          div.classList.add(`phrase-${cell.phraseColor}`);
        }
      } else if (state.showHint && cell.isPath) {
        div.classList.add('hint');
      }

      div.dataset.x = x;
      div.dataset.y = y;
      div.textContent = cell.note;
      els.board.appendChild(div);
    });
  });
}

function updateUI() {
  if (els.nextNote) els.nextNote.textContent = state.currentIndex >= state.melody.length ? '✅' : state.melody[state.currentIndex];
  if (els.progressBar) els.progressBar.value = Math.min((state.currentIndex / state.melody.length) * 100, 100);
  if (els.progressText) els.progressText.textContent = `${state.currentIndex} / ${state.melody.length}`;
  if (els.mistakes) els.mistakes.textContent = state.mistakes;
  if (els.winCount) els.winCount.textContent = state.wins;
  if (els.totalSteps) els.totalSteps.textContent = state.steps;
  if (els.currentScore) els.currentScore.textContent = state.currentScore;
}

function updateCoinUI() {
  if (els.totalCoins) {
    els.totalCoins.textContent = state.totalCoins;
    els.totalCoins.parentElement.classList.remove('coin-pop');
    void els.totalCoins.parentElement.offsetWidth;
    els.totalCoins.parentElement.classList.add('coin-pop');
  }
}

function updateBestScoreUI() {
  if (els.totalScore) {
    els.totalScore.textContent = loadBestScore(state.gridSize);
  }
}

// ========== 游戏逻辑 ==========
function loadSong(songId, skipAutoSave = false) {
  const song = SONGS.find(s => s.id === songId);
  if (els.currentSongName) {
    els.currentSongName.classList.add('updating');
    setTimeout(() => {
      els.currentSongName.textContent = song.name;
      els.currentSongName.classList.remove('updating');
    }, 150);
  }

  const maxLen = Math.floor(state.gridSize * state.gridSize * 0.7);
  state.melody = song.notes.slice(0, maxLen);
  state.currentPhraseMap = song.phraseColors || [];
  state.currentIndex = 0;
  state.player = { x: 0, y: 0 };
  state.mistakes = 0;
  state.steps = 0;
  state.isPlaying = true;
  state.history = [];
  state.showHint = false;
  state.usedHint = false;
  state.currentScore = 0;
  state.mistakeCount = 0;
  state.hintModalShown = false;

  if (!skipAutoSave) clearProgress(songId, state.gridSize);
  if (els.hintBtn) els.hintBtn.textContent = '💡 出示路径';

  if (els.songList) {
    document.querySelectorAll('.song-list li').forEach(li =>
      li.classList.toggle('active', li.dataset.id === songId)
    );
  }

  generateMaze();

  if (state.melody.length > 0) {
    state.grid[0][0].visited = true;
    state.grid[0][0].phraseColor = state.currentPhraseMap[0] || 'default';
    playNote(state.melody[0], false, state.audioCtx, state.volume, state.currentSound);
    state.currentIndex = 1;
  }

  pushHistory();
  renderGrid();
  updateUI();
  if (state.melody.length <= 1) winGame();
  if (!skipAutoSave) saveProgress(state, () => document.querySelector('.song-list li.active')?.dataset.id);
}

function generateMaze() {
  const size = state.gridSize;
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  let success = false;

  while (!success) {
    const path = [];
    let curr = { x: 0, y: 0 };
    const visited = new Set([`0,0`]);
    path.push(curr);
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    let safety = 0;

    while (path.length < state.melody.length && safety < 3000) {
      safety++;
      const neighbors = dirs
        .map(([dx, dy]) => ({ x: curr.x + dx, y: curr.y + dy }))
        .filter(p => p.x >= 0 && p.x < size && p.y >= 0 && p.y < size && !visited.has(`${p.x},${p.y}`));

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        visited.add(`${next.x},${next.y}`);
        path.push(next);
        curr = next;
      } else {
        path.pop();
        if (path.length === 0) break;
        curr = path[path.length - 1];
        visited.delete(`${curr.x},${curr.y}`);
      }
    }

    if (path.length >= state.melody.length) {
      path.forEach((pos, idx) => {
        grid[pos.y][pos.x] = { note: state.melody[idx], isPath: true, visited: false, phraseColor: null };
      });
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!grid[y][x]) {
            grid[y][x] = { note: NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)], isPath: false, visited: false };
          }
        }
      }
      state.grid = grid;
      state.endPos = path[path.length - 1];
      success = true;
    }
  }
}

function movePlayer(dx, dy) {
  if (!state.isPlaying || moveLock) return;
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  if (nx < 0 || nx >= state.gridSize || ny < 0 || ny >= state.gridSize) return;
  if (state.grid[ny][nx].visited) return;

  moveLock = true;
  const prevX = state.player.x, prevY = state.player.y;
  const prevEl = getCellEl(prevX, prevY);
  const currEl = getCellEl(nx, ny);
  const cell = state.grid[ny][nx];

  if (prevEl) prevEl.classList.remove('player');
  if (currEl) currEl.classList.add('player');

  state.player = { x: nx, y: ny };
  state.steps++;
  const targetNote = state.melody[state.currentIndex];

  if (cell.note === targetNote) {
    playNote(targetNote, false, state.audioCtx, state.volume, state.currentSound);
    cell.visited = true;
    cell.phraseColor = state.currentPhraseMap[state.currentIndex] || 'default';
    if (currEl) {
      currEl.classList.add('visited');
      if (cell.phraseColor && cell.phraseColor !== 'default') {
        currEl.classList.add(`phrase-${cell.phraseColor}`);
      }
    }
    state.currentIndex++;
    pushHistory();
    if (state.currentIndex >= state.melody.length) winGame();
    setTimeout(() => { moveLock = false; saveProgress(state, () => document.querySelector('.song-list li.active')?.dataset.id); }, 250);
  } else {
    playNote(cell.note, true, state.audioCtx, state.volume, state.currentSound);
    state.mistakes++;
    state.mistakeCount++;
    if (currEl) currEl.classList.add('wrong');
    if (state.mistakeCount >= 5 && !state.hintModalShown) {
      setTimeout(() => showMistakeModal(), 400);
    }
    setTimeout(() => {
      if (currEl) currEl.classList.remove('player', 'wrong');
      if (prevEl) prevEl.classList.add('player');
      state.player = { x: prevX, y: prevY };
      state.steps--;
      moveLock = false;
      updateUI();
      saveProgress(state, () => document.querySelector('.song-list li.active')?.dataset.id);
    }, 300);
  }
}

function pushHistory() {
  state.history.push({
    player: { ...state.player },
    currentIndex: state.currentIndex,
    steps: state.steps,
    mistakes: state.mistakes,
    visitedGrid: state.grid.map(row => row.map(c => c.visited))
  });
  updateUndoButton();
}

function undoMove() {
  if (state.history.length <= 1 || moveLock) return;
  state.history.pop();
  const prev = state.history[state.history.length - 1];
  state.player = prev.player;
  state.currentIndex = prev.currentIndex;
  state.steps = prev.steps;
  state.mistakes = prev.mistakes;
  for (let y = 0; y < state.gridSize; y++) {
    for (let x = 0; x < state.gridSize; x++) {
      state.grid[y][x].visited = prev.visitedGrid[y][x];
    }
  }
  renderGrid();
  updateUI();
  updateUndoButton();
  saveProgress(state, () => document.querySelector('.song-list li.active')?.dataset.id);
}

function updateUndoButton() {
  if (els.undoBtn) els.undoBtn.disabled = state.history.length <= 1;
}

function getCellEl(x, y) {
  return els.board.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

function winGame() {
  state.isPlaying = false;
  state.wins++;
  state.currentScore = DIFFICULTY[state.gridSize]?.baseScore || 5;
  if (state.usedHint) state.currentScore = Math.floor(state.currentScore / 2);

  state.totalCoins += state.currentScore;
  saveCoins(state.totalCoins);
  updateCoinUI();

  const isNewRecord = saveBestScore(state.gridSize, state.currentScore);
  updateBestScoreUI();

  if (els.message) {
    const hintPenalty = state.usedHint ? '（提示惩罚：分数减半）' : '';
    const recordTip = isNewRecord ? ' 🎉 新纪录！' : '';
    els.message.innerHTML = `🎉 通关成功！<br>得分：<strong style="color:#f4d03f">${state.currentScore}</strong>${hintPenalty}${recordTip}`;
    els.message.classList.remove('hidden');
    setTimeout(() => els.message.classList.add('hidden'), 4000);
  }
  updateUI();
}

// ========== 模态框管理 ==========
function showMistakeModal() {
  if (els.mistakeModal) {
    els.mistakeModal.classList.remove('hidden');
    state.hintModalShown = true;
  }
}
function hideMistakeModal() {
  if (els.mistakeModal) els.mistakeModal.classList.add('hidden');
}
function activateHint() {
  state.showHint = true;
  state.usedHint = true;
  renderGrid();
  if (els.hintBtn) els.hintBtn.textContent = '💡 隐藏提示';
  hideMistakeModal();
  saveProgress(state, () => document.querySelector('.song-list li.active')?.dataset.id);
}

// ========== 音色商店 ==========
function renderSoundShop() {
  if (!els.soundList) return;
  els.soundList.innerHTML = '';
  SOUND_PACKS.forEach(sound => {
    const isOwned = state.ownedSounds.includes(sound.id);
    const isActive = state.currentSound === sound.id;
    const canAfford = state.totalCoins >= sound.price;

    const card = document.createElement('div');
    card.className = `sound-card ${isOwned ? 'owned' : ''} ${isActive ? 'active' : ''}`;
    card.innerHTML = `
      <div class="sound-info">
        <div class="sound-name">${sound.name}</div>
        <div class="sound-desc">${sound.desc}</div>
      </div>
      <button class="btn-preview" onclick="previewSound('${sound.id}', state.audioCtx)">▶️ 试听</button>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">
        ${isOwned
          ? `<button class="sound-btn ${isActive ? 'btn-equipped' : 'btn-equip'}"
                    ${isActive ? 'disabled' : `onclick="equipSound('${sound.id}')"`}>
               ${isActive ? '✅ 使用中' : '🎵 装备'}
             </button>`
          : `<span class="sound-price">${sound.price} 💰</span>
             <button class="sound-btn btn-buy"
                     ${!canAfford ? 'disabled' : `onclick="buySound('${sound.id}')"`}>
               ${sound.price === 0 ? '🆓 免费' : '💰 购买'}
             </button>`
        }
      </div>
    `;
    els.soundList.appendChild(card);
  });
}

function buySound(soundId) {
  const sound = SOUND_PACKS.find(s => s.id === soundId);
  if (!sound || state.ownedSounds.includes(soundId)) return;
  if (state.totalCoins < sound.price) {
    showToast('💰 金币不足！', true);
    return;
  }
  state.totalCoins -= sound.price;
  state.ownedSounds.push(soundId);
  saveCoins(state.totalCoins);
  saveOwnedSounds(state.ownedSounds, state.currentSound);
  updateCoinUI();
  showToast(`🎉 购买成功：${sound.name}`);
  renderSoundShop();
}

function equipSound(soundId) {
  if (!state.ownedSounds.includes(soundId)) return;
  state.currentSound = soundId;
  saveOwnedSounds(state.ownedSounds, state.currentSound);
  renderSoundShop();
  showToast(`🎵 已切换：${SOUND_PACKS.find(s => s.id === soundId).name}`);
}

function openSoundShop() {
  if (els.soundShopModal) {
    els.soundShopModal.classList.remove('hidden');
    if (els.shopCoinsDisplay) els.shopCoinsDisplay.textContent = state.totalCoins;
    renderSoundShop();
  }
}
function closeSoundShop() {
  if (els.soundShopModal) els.soundShopModal.classList.add('hidden');
}

// 简易提示框
function showToast(msg, isError = false) {
  if (!els.message) return;
  els.message.textContent = msg;
  els.message.style.background = isError ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)';
  els.message.classList.remove('hidden');
  setTimeout(() => els.message.classList.add('hidden'), 2000);
}

// ========== 事件绑定 ==========
function bindInputs() {
  // 键盘
  document.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
      if (e.repeat) return;
      const map = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0] };
      movePlayer(...map[e.key]);
    }
    if (e.key === 'Escape') hideMistakeModal();
  });

  // 触屏
  if (els.board) {
    els.board.addEventListener('touchstart', e => {
      state.touchStartX = e.touches[0].clientX;
      state.touchStartY = e.touches[0].clientY;
    }, { passive: true });
    els.board.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - state.touchStartX;
      const dy = e.changedTouches[0].clientY - state.touchStartY;
      const minSwipe = 30;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        e.preventDefault();
        movePlayer(dx > 0 ? 1 : -1, 0);
      } else if (Math.abs(dy) > minSwipe) {
        e.preventDefault();
        movePlayer(0, dy > 0 ? 1 : -1);
      }
    }, { passive: false });
  }

  // 按钮绑定
  if (els.undoBtn) els.undoBtn.addEventListener('click', undoMove);
  if (els.hintBtn) els.hintBtn.addEventListener('click', () => {
    state.showHint = !state.showHint;
    state.usedHint = true;
    renderGrid();
    els.hintBtn.textContent = state.showHint ? '💡 隐藏提示' : '💡 出示路径';
  });
  if (els.modalHintBtn) els.modalHintBtn.addEventListener('click', activateHint);
  if (els.modalCloseBtn) els.modalCloseBtn.addEventListener('click', hideMistakeModal);

  // 商店按钮
  if (document.getElementById('sound-shop-btn')) {
    document.getElementById('sound-shop-btn').addEventListener('click', openSoundShop);
  }
  if (els.closeShopBtn) els.closeShopBtn.addEventListener('click', closeSoundShop);
  if (els.soundShopModal) {
    els.soundShopModal.addEventListener('click', e => { if (e.target === els.soundShopModal) closeSoundShop(); });
  }

  // 难度切换
  document.querySelectorAll('.difficulty-selector button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.difficulty-selector button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.gridSize = parseInt(btn.dataset.size);
      clearProgress(document.querySelector('.song-list li.active')?.dataset.id, state.gridSize);
      const activeSong = document.querySelector('.song-list li.active');
      loadSong(activeSong ? activeSong.dataset.id : SONGS[0].id, true);
      updateBestScoreUI();
    };
  });

  // 重新开始
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.onclick = () => {
    clearProgress(document.querySelector('.song-list li.active')?.dataset.id, state.gridSize);
    const activeSong = document.querySelector('.song-list li.active');
    loadSong(activeSong ? activeSong.dataset.id : SONGS[0].id, true);
  };

  // 音量
  const volumeBtn = document.getElementById('volume-btn');
  if (volumeBtn) volumeBtn.onclick = () => {
    state.volume = state.volume >= 0.8 ? 0.4 : (state.volume >= 0.4 ? 0 : 0.8);
    volumeBtn.textContent = `🔊 音量: ${state.volume * 100}%`;
  };
}
