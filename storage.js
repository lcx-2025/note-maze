// ========== 存档管理 ==========

// 生成存档唯一 Key
function getSaveKey(songId, gridSize) {
  return `noteMaze_save_${songId}_${gridSize}`;
}

// 保存游戏进度
function saveProgress(state, getActiveSongId) {
  if (!state.isPlaying) return;

  const saveData = {
    songId: getActiveSongId(),
    gridSize: state.gridSize,
    player: { ...state.player },
    currentIndex: state.currentIndex,
    mistakes: state.mistakes,
    steps: state.steps,
    mistakeCount: state.mistakeCount,
    usedHint: state.usedHint,
    showHint: state.showHint,
    hintModalShown: state.hintModalShown,
    gridState: state.grid.map(row =>
      row.map(cell => ({ visited: cell.visited, phraseColor: cell.phraseColor || null }))
    ),
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
    localStorage.setItem(getSaveKey(saveData.songId, state.gridSize), JSON.stringify(saveData));
  } catch (e) {
    console.warn('⚠️ 存档失败:', e);
  }
}

// 读取并恢复游戏进度
function loadProgress(state, gridSize) {
  const activeSong = document.querySelector('.song-list li.active');
  const songId = activeSong ? activeSong.dataset.id : 'unknown';
  const key = getSaveKey(songId, gridSize);
  const saved = localStorage.getItem(key);
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);
    if (data.gridSize !== gridSize) return false;

    // 恢复核心状态
    state.player = data.player;
    state.currentIndex = data.currentIndex;
    state.mistakes = data.mistakes;
    state.steps = data.steps;
    state.mistakeCount = data.mistakeCount;
    state.usedHint = data.usedHint;
    state.showHint = data.showHint;
    state.hintModalShown = data.hintModalShown;

    // 恢复网格状态
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (data.gridState[y]?.[x]) {
          state.grid[y][x].visited = data.gridState[y][x].visited;
          state.grid[y][x].phraseColor = data.gridState[y][x].phraseColor;
        }
      }
    }

    // 恢复历史栈
    state.history = data.history.map(h => ({ ...h, visitedGrid: h.visitedGrid }));

    console.log('✅ 已从存档恢复进度');
    return true;
  } catch (e) {
    console.warn('⚠️ 读取存档失败:', e);
    localStorage.removeItem(key);
    return false;
  }
}

// 清除当前存档
function clearProgress(songId, gridSize) {
  localStorage.removeItem(getSaveKey(songId, gridSize));
}

// ========== 金币管理 ==========
function loadCoins() {
  const saved = localStorage.getItem('noteMaze_coins');
  return saved ? parseInt(saved) : 0;
}

function saveCoins(totalCoins) {
  localStorage.setItem('noteMaze_coins', totalCoins);
}

// ========== 分数管理 ==========
function loadBestScore(gridSize) {
  const key = `noteMaze_best_${gridSize}`;
  const best = localStorage.getItem(key);
  return best ? parseInt(best) : 0;
}

function saveBestScore(gridSize, score) {
  const key = `noteMaze_best_${gridSize}`;
  const currentBest = parseInt(localStorage.getItem(key) || 0);
  if (score > currentBest) {
    localStorage.setItem(key, score);
    return true;
  }
  return false;
}

// ========== 音色购买管理 ==========
function loadOwnedSounds() {
  const saved = localStorage.getItem('noteMaze_ownedSounds');
  const owned = saved ? JSON.parse(saved) : ['piano'];

  const current = localStorage.getItem('noteMaze_currentSound');
  const currentSound = current || 'piano';

  return { ownedSounds: owned, currentSound };
}

function saveOwnedSounds(ownedSounds, currentSound) {
  localStorage.setItem('noteMaze_ownedSounds', JSON.stringify(ownedSounds));
  localStorage.setItem('noteMaze_currentSound', currentSound);
}
