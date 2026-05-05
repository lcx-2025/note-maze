// ========== 乐器音色合成函数 ==========

// 🎹 钢琴音色
function playPianoNote(ctx, frequency, duration = 0.8, volume = 1.0) {
  const now = ctx.currentTime;
  const harmonics = [
    { freq: 1, gain: 1.0, type: 'triangle' },
    { freq: 2, gain: 0.5, type: 'sine' },
    { freq: 3, gain: 0.25, type: 'sine' },
    { freq: 4, gain: 0.125, type: 'sine' },
  ];

  const masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.Q.value = 1;
  filter.connect(masterGain);

  harmonics.forEach(h => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = h.type;
    osc.frequency.value = frequency * h.freq;
    osc.detune.value = (Math.random() - 0.5) * 3;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(h.gain * 0.3, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(h.gain * 0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(filter);
    osc.start(now);
    osc.stop(now + duration);
  });

  // 击键噪声
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBuffer.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseBuffer.length, 2);
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15 * volume, now);
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

// 🔔 木琴音色
function playXylophoneNote(ctx, frequency, duration = 0.4, volume = 1.0) {
  const now = ctx.currentTime;
  const harmonics = [
    { freq: 1, gain: 1.0 },
    { freq: 2.756, gain: 0.3 },
    { freq: 5.404, gain: 0.1 },
  ];

  const masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(ctx.destination);

  harmonics.forEach(h => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency * h.freq;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(h.gain * 0.5, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

    osc.connect(gainNode);
    gainNode.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);
  });
}

// 🎶 八音盒音色
function playMusicBoxNote(ctx, frequency, duration = 1.0, volume = 1.0) {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;

  vibrato.type = 'sine';
  vibrato.frequency.value = 6;
  vibratoGain.gain.value = 3;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.4 * volume, now + 0.01);
  gainNode.gain.setValueAtTime(0.4 * volume, now + duration * 0.7);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  vibrato.start(now);
  osc.stop(now + duration);
  vibrato.stop(now + duration);
}

// 🎛️ 电子琴音色
function playSynthNote(ctx, frequency, duration = 0.5, volume = 1.0) {
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = 'square';
  osc1.frequency.value = frequency;

  osc2.type = 'sawtooth';
  osc2.frequency.value = frequency * 1.005;
  osc2.detune.value = 7;

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(8000, now);
  filter.frequency.exponentialRampToValueAtTime(2000, now + duration);
  filter.Q.value = 5;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3 * volume, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

// 🎼 长笛音色（正弦波 + 轻柔颤音）
function playFluteNote(ctx, frequency, duration = 1.0, volume = 1.0) {
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency;

  const vibratoOsc = ctx.createOscillator();
  vibratoOsc.type = 'sine';
  vibratoOsc.frequency.value = 5.5;

  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 2.5;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.6 * volume, now + 0.08);
  gainNode.gain.setValueAtTime(0.6 * volume, now + duration * 0.7);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4000;
  filter.Q.value = 0.8;

  vibratoOsc.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  vibratoOsc.start(now);
  osc.stop(now + duration);
  vibratoOsc.stop(now + duration);
}

// 🎻 小提琴音色（锯齿波 + 持续颤音 + 滤波扫描）
function playViolinNote(ctx, frequency, duration = 0.7, volume = 1.0) {
  const now = ctx.currentTime;

  // 双振荡器模拟琴弦共鸣（轻微失谐）
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();

  osc1.type = 'sawtooth'; // 丰富高频泛音
  osc1.frequency.value = frequency;

  osc2.type = 'triangle'; // 补充中频
  osc2.frequency.value = frequency * 1.003; // +3 音分失谐
  osc2.detune.value = 5;

  // 持续颤音（比长笛更深）
  const vibratoOsc = ctx.createOscillator();
  vibratoOsc.type = 'sine';
  vibratoOsc.frequency.value = 6.5; // 6.5Hz 颤音

  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 2.0; // ±4 音分颤音深度

  // 🔧 音量包络：快速起音 + 短促持续 + 快速衰减
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.45 * volume, now + 0.03); // 🔧 更快起音 (0.05→0.03)
  gainNode.gain.setValueAtTime(0.45 * volume, now + duration * 0.6); // 🔧 缩短持续段 (0.8→0.6)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9); // 🔧 提前开始衰减

  // 🔧 动态低通滤波（缩短扫描时间）
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, now); // 🔧 稍低起始频率
  filter.frequency.linearRampToValueAtTime(4500, now + duration * 0.4); // 🔧 更快完成扫描
  filter.Q.value = 1.0; // 🔧 稍低共振，减少尾音

  // 混音节点
  const mixer = ctx.createGain();
  mixer.gain.value = 0.9;

  // 连接：颤音 → 双振荡器频率，双振荡器 → 混音 → 滤波 → 音量 → 输出
  vibratoOsc.connect(vibratoGain);
  vibratoGain.connect(osc1.frequency);
  vibratoGain.connect(osc2.frequency);

  osc1.connect(mixer);
  osc2.connect(mixer);
  mixer.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  // 启动
  osc1.start(now);
  osc2.start(now);
  vibratoOsc.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
  vibratoOsc.stop(now + duration);
}

// 🎵 统一播放入口
function playInstrumentNote(ctx, frequency, soundId = 'piano', volume = 1.0) {
  switch(soundId) {
    case 'piano': playPianoNote(ctx, frequency, 0.8, volume); break;
    case 'guitar': playGuitarNote(ctx, frequency, 0.6, volume); break;
    case 'xylophone': playXylophoneNote(ctx, frequency, 0.4, volume); break;
    case 'musicbox': playMusicBoxNote(ctx, frequency, 1.0, volume); break;
    case 'synth': playSynthNote(ctx, frequency, 0.5, volume); break;
    case 'flute': playFluteNote(ctx, frequency, 1.0, volume); break;
    case 'violin': playViolinNote(ctx, frequency, 1.2, volume); break;
    default: playPianoNote(ctx, frequency, 0.8, volume);
  }
}

// 🎵 主播放函数（供 game.js 调用）
function playNote(noteName, isError, audioCtx, volume, currentSound) {
  if (!audioCtx || !noteName) return;

  if (isError) {
    // 错误音效（锯齿波）
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } else {
    // 使用当前选中的乐器音色
    const frequency = NOTE_MAP[noteName] || 261.63;
    playInstrumentNote(audioCtx, frequency, currentSound, volume);
  }
}

// 🔊 预览音色（用于商店试听）
function previewSound(soundId, audioCtx) {
  if (!audioCtx) return;
  const freq = NOTE_MAP['do'];
  playInstrumentNote(audioCtx, freq, soundId, 0.6);
}
