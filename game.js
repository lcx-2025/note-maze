// 全局状态
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
  currentPhraseMap: [], // 存储当前歌曲的分句颜色数组
  totalCoins: 0 // 全局金币总数
};

// DOM 元素
const els = {};

let moveLock = false;

// 🚀 初始化入口
window.addEventListener('DOMContentLoaded', () => {
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
    // 🆕 模态框元素
    mistakeModal: document.getElementById('mistake-modal'),
    modalHintBtn: document.getElementById('modal-hint-btn'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    totalCoins: document.getElementById('total-coins')
  });

  if (els.audioOverlay) {
    els.audioOverlay.addEventListener('click', () => {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      els.audioOverlay.style.display = 'none';
      initGame();
    });
  } else {
    initGame();
  }
});

function initGame() {
  renderSongList();
  bindInputs();
  // 优先尝试恢复存档
  const restored = loadProgress();
  if (!restored) {
    // 无存档则正常加载歌曲
    loadSong(SONGS[0].id, true);  // skipAutoSave=true 避免重复清除
  }
  loadTotalScore();
  loadCoins();
}

// 🆕 生成存档唯一 Key
function getSaveKey() {
  const activeSong = document.querySelector('.song-list li.active');
  const songId = activeSong ? activeSong.dataset.id : 'unknown';
  return `noteMaze_save_${songId}_${state.gridSize}`;
}

// 🆕 保存游戏进度
function saveProgress() {
  if (!state.isPlaying) return;

  const saveData = {
    songId: document.querySelector('.song-list li.active')?.dataset.id,
    gridSize: state.gridSize,
    player: { ...state.player },
    currentIndex: state.currentIndex,
    mistakes: state.mistakes,
    steps: state.steps,
    mistakeCount: state.mistakeCount,
    usedHint: state.usedHint,
    showHint: state.showHint,
    hintModalShown: state.hintModalShown,
    // 精简存储网格状态（只存 visited 和 phraseColor）
    gridState: state.grid.map(row =>
      row.map(cell => ({
        visited: cell.visited,
        phraseColor: cell.phraseColor || null
      }))
    ),
    // 历史栈（支持回退功能续玩）
    history: state.history.map(h => ({
      player: h.player,
      currentIndex: h.currentIndex,
      steps: h.steps,
      mistakes: h.mistakes,
      visitedGrid: h.visitedGrid
    })),
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(getSaveKey(), JSON.stringify(saveData));
    // console.log('💾 进度已保存');
  } catch (e) {
    console.warn('⚠️ 存档失败（可能超出存储限制）:', e);
  }
}

// 🆕 读取并恢复游戏进度
function loadProgress() {
  const key = getSaveKey();
  const saved = localStorage.getItem(key);
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);

    // 验证存档有效性（防止版本不兼容）
    if (data.gridSize !== state.gridSize) return false;

    // 恢复核心状态
    state.player = data.player;
    state.currentIndex = data.currentIndex;
    state.mistakes = data.mistakes;
    state.steps = data.steps;
    state.mistakeCount = data.mistakeCount;
    state.usedHint = data.usedHint;
    state.showHint = data.showHint;
    state.hintModalShown = data.hintModalShown;

    // 恢复网格状态（保留 note 和 isPath，只更新 visited/phraseColor）
    for (let y = 0; y < state.gridSize; y++) {
      for (let x = 0; x < state.gridSize; x++) {
        if (data.gridState[y]?.[x]) {
          state.grid[y][x].visited = data.gridState[y][x].visited;
          state.grid[y][x].phraseColor = data.gridState[y][x].phraseColor;
        }
      }
    }

    // 恢复历史栈
    state.history = data.history.map(h => ({
      ...h,
      visitedGrid: h.visitedGrid // 已经是二维数组，可直接用
    }));

    // 重绘界面
    renderGrid();
    updateUI();
    updateUndoButton();

    // 更新提示按钮文字
    if (els.hintBtn) {
      els.hintBtn.textContent = state.showHint ? '💡 隐藏提示' : '💡 出示路径';
    }

    console.log('✅ 已从存档恢复进度');
    return true;
  } catch (e) {
    console.warn('⚠️ 读取存档失败:', e);
    localStorage.removeItem(key); // 清除损坏的存档
    return false;
  }
}

// 🆕 清除当前存档（用于重新开始/换曲）
function clearProgress() {
  localStorage.removeItem(getSaveKey());
}

//  加载金币
function loadCoins() {
  const saved = localStorage.getItem('noteMaze_coins');
  state.totalCoins = saved ? parseInt(saved) : 0;
  updateCoinUI();
}

// 保存金币
function saveCoins() {
  localStorage.setItem('noteMaze_coins', state.totalCoins);
  updateCoinUI();
}

// 更新金币 UI（带动画）
function updateCoinUI() {
  if (els.totalCoins) {
    els.totalCoins.textContent = state.totalCoins;
    // 触发跳动动画
    els.totalCoins.parentElement.classList.remove('coin-pop');
    void els.totalCoins.parentElement.offsetWidth; // 强制重排以重置动画
    els.totalCoins.parentElement.classList.add('coin-pop');
  }
}

function loadTotalScore() {
  const key = `noteMaze_best_${state.gridSize}`;
  const best = localStorage.getItem(key);
  if (els.totalScore) {
    els.totalScore.textContent = best ? parseInt(best) : 0;
  }
}

function saveTotalScore(score) {
  const key = `noteMaze_best_${state.gridSize}`;
  const currentBest = parseInt(localStorage.getItem(key) || 0);
  if (score > currentBest) {
    localStorage.setItem(key, score);
    if (els.totalScore) {
      els.totalScore.textContent = score;
      els.totalScore.classList.add('score-pop');
      setTimeout(() => els.totalScore.classList.remove('score-pop'), 500);
    }
    return true;
  }
  return false;
}

function calculateScore() {
  const baseScore = { 5: 5, 8: 10, 12: 20 }[state.gridSize] || 5;
  const finalScore = state.usedHint ? Math.floor(baseScore / 2) : baseScore;
  return finalScore;
}

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

function loadSong(songId, skipAutoSave = false) {  // 🆕 新增 skipAutoSave 参数
  const song = SONGS.find(s => s.id === songId);
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

  // 🆕 换曲时清除旧存档
  if (!skipAutoSave) clearProgress();

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
    playNote(state.melody[0], false);
    state.currentIndex = 1;
  }

  pushHistory();
  renderGrid();
  updateUI();
  if (state.melody.length <= 1) winGame();

  // 🆕 新开局自动保存初始状态
  if (!skipAutoSave) saveProgress();
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
  saveProgress();  // 回退操作后保存

}

function updateUndoButton() {
  if (els.undoBtn) els.undoBtn.disabled = state.history.length <= 1;
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
        // 动态追加分句颜色类
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

function getCellEl(x, y) {
  return els.board.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

// 显示犯错提示框
function showMistakeModal() {
  if (els.mistakeModal) {
    els.mistakeModal.classList.remove('hidden');
    state.hintModalShown = true;
  }
}

// 隐藏犯错提示框
function hideMistakeModal() {
  if (els.mistakeModal) {
    els.mistakeModal.classList.add('hidden');
  }
}

// 激活提示功能（被模态框和主按钮共用）
function activateHint() {
  state.showHint = true;
  state.usedHint = true;
  renderGrid();
  if (els.hintBtn) els.hintBtn.textContent = '💡 隐藏提示';
  hideMistakeModal();
  saveProgress();  // 使用提示后保存
}

function movePlayer(dx, dy) {
  if (!state.isPlaying || moveLock) return;

  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  if (nx < 0 || nx >= state.gridSize || ny < 0 || ny >= state.gridSize) return;
  if (state.grid[ny][nx].visited) return;

  moveLock = true;

  const prevX = state.player.x;
  const prevY = state.player.y;
  const prevEl = getCellEl(prevX, prevY);
  const currEl = getCellEl(nx, ny);
  const cell = state.grid[ny][nx];

  if (prevEl) prevEl.classList.remove('player');
  if (currEl) currEl.classList.add('player');

  state.player = { x: nx, y: ny };
  state.steps++;

  const targetNote = state.melody[state.currentIndex];

  if (cell.note === targetNote) {
    playNote(targetNote, false);
    cell.visited = true;
    // 绑定当前索引对应的分句颜色
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
    setTimeout(() => {
        moveLock = false;
        saveProgress();  // 正确移动后保存
      }, 250);
  } else {
    playNote(cell.note, true);
    state.mistakes++;
    state.mistakeCount++;  // 增加犯错次数
    if (currEl) currEl.classList.add('wrong');

    // 检查是否达到5次犯错且未显示过提示框
    if (state.mistakeCount >= 5 && !state.hintModalShown) {
      setTimeout(() => {
        showMistakeModal();
      }, 400); // 等错误动画结束后再显示
    }

    setTimeout(() => {
      if (currEl) currEl.classList.remove('player', 'wrong');
      if (prevEl) prevEl.classList.add('player');
      state.player = { x: prevX, y: prevY };
      state.steps--;
      moveLock = false;
      updateUI();
      saveProgress();
    }, 300);
  }
}

// 🎹 钢琴音色合成函数
function playPianoNote(frequency, duration = 0.6) {
  if (!state.audioCtx) return;

  const ctx = state.audioCtx;
  const now = ctx.currentTime;

  // 创建主振荡器组（模拟钢琴弦的多谐波）
  const oscillators = [];
  const gains = [];

  // 钢琴谐波比例（基频 + 2倍频 + 3倍频 + 4倍频）
  const harmonics = [
    { freq: 1, gain: 1.0 },      // 基频
    { freq: 2, gain: 0.5 },      // 第二谐波
    { freq: 3, gain: 0.25 },     // 第三谐波
    { freq: 4, gain: 0.125 },    // 第四谐波
  ];

  // 创建主混音增益节点
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // 添加低通滤波器（模拟钢琴音色的衰减特性）
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.Q.value = 1;
  filter.connect(masterGain);

  // 创建多个谐波振荡器
  harmonics.forEach(harmonic => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 钢琴使用三角波或正弦波混合
    osc.type = harmonic.freq === 1 ? 'triangle' : 'sine';
    osc.frequency.value = frequency * harmonic.freq;

    // 轻微失谐（模拟真实钢琴弦的微小频率偏差）
    const detune = (Math.random() - 0.5) * 3; // ±3 音分
    osc.detune.value = detune;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(harmonic.gain * 0.3, now + 0.02); // 快速起音
    gainNode.gain.exponentialRampToValueAtTime(harmonic.gain * 0.01, now + duration); // 指数衰减

    osc.connect(gainNode);
    gainNode.connect(filter);

    osc.start(now);
    osc.stop(now + duration);

    oscillators.push(osc);
    gains.push(gainNode);
  });

  // 添加轻微的击键噪声（模拟琴槌敲击）
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBuffer.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseBuffer.length, 2);
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 2000;

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  noiseSource.start(now);
  noiseSource.stop(now + 0.05);
}

// 调用钢琴音色
function playNote(noteName, isError) {
  if (!state.audioCtx || !noteName) return;

  if (isError) {
    // 错误音效保留锯齿波（不和谐音）
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(state.volume * 0.5, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.3);

    osc.connect(gain).connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + 0.3);
  } else {
    // 正确音符使用钢琴音色
    const frequency = NOTE_MAP[noteName] || 261.63;
    playPianoNote(frequency, 1.2);
  }
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

function winGame() {
  state.isPlaying = false;
  state.wins++;

  state.currentScore = calculateScore();
  state.currentScore = calculateScore();
  state.totalCoins += state.currentScore; //  得分充入金币池
  saveCoins();                            // 持久化保存
  const isNewRecord = saveTotalScore(state.currentScore);

  if (els.message) {
    const hintPenalty = state.usedHint ? '（提示惩罚：分数减半）' : '';
    const recordTip = isNewRecord ? ' 🎉 新纪录！' : '';
    els.message.innerHTML = `🎉 通关成功！<br>得分：<strong style="color:#f4d03f">${state.currentScore}</strong>${hintPenalty}${recordTip}`;
    els.message.classList.remove('hidden');
    setTimeout(() => els.message.classList.add('hidden'), 4000);
  }

  updateUI();
}

function bindInputs() {
  // 键盘
  document.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      if (e.repeat) return;
      switch(e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
      }
    }
    // 🆕 ESC 键关闭模态框
    if (e.key === 'Escape') {
      hideMistakeModal();
    }
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

  // 回退按钮
  if (els.undoBtn) els.undoBtn.addEventListener('click', undoMove);

  // 💡 提示按钮
  if (els.hintBtn) {
    els.hintBtn.addEventListener('click', () => {
      state.showHint = !state.showHint;
      state.usedHint = true;
      renderGrid();
      els.hintBtn.textContent = state.showHint ? '💡 隐藏提示' : '💡 出示路径';
    });
  }

  // 🆕 模态框按钮绑定
  if (els.modalHintBtn) {
    els.modalHintBtn.addEventListener('click', activateHint);
  }

  if (els.modalCloseBtn) {
    els.modalCloseBtn.addEventListener('click', hideMistakeModal);
  }

  // 难度切换按钮绑定
  document.querySelectorAll('.difficulty-selector button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.difficulty-selector button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.gridSize = parseInt(btn.dataset.size);

      // 切换难度时清除存档 + 重新加载歌曲
      clearProgress();
      const activeSong = document.querySelector('.song-list li.active');
      loadSong(activeSong ? activeSong.dataset.id : SONGS[0].id, true);
      loadTotalScore();
    };
  });

  // 重新开始按钮
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.onclick = () => {
    // 重开时清除存档
    clearProgress();
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
