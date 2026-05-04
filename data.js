// 音符频率映射 (C4~B4 + C5)
const NOTE_MAP = {
  // 低音区（低八度）
  'do↓': 130.81, 're↓': 146.83, '#re↓': 155.56, 'mi↓': 164.81,
  'fa↓': 174.61, '#fa↓': 185.00, 'sol↓': 196.00, '#sol↓': 207.65,
  'la↓': 220.00, '#la↓': 233.08, 'si↓': 246.94,

  // 中音区
  'do': 261.63, 're': 293.66, '#re': 311.13, 'mi': 329.63,
  'fa': 349.23, '#fa': 369.99, 'sol': 392.00, '#sol': 415.30,
  'la': 440.00, '#la': 466.16, 'si': 493.88,

  // 高音区（高八度）
  'do↑': 523.25, 're↑': 587.33, '#re↑': 622.25, 'mi↑': 659.26,
  'fa↑': 698.46, '#fa↑': 739.99, 'sol↑': 783.99, '#sol↑': 830.61,
  'la↑': 880.00, '#la↑': 932.33, 'si↑': 987.77
};

// 音符名称数组（用于随机填充）
const NOTE_NAMES = [
  'do↓', 're↓', 'mi↓', 'fa↓', 'sol↓', 'la↓', 'si↓',
  'do', 're', 'mi', 'fa', 'sol', 'la', 'si',
  'do↑', 're↑', 'mi↑', 'fa↑', 'sol↑', 'la↑', 'si↑'
];

// 预设曲库 (音符顺序即为通关序列)
const SONGS = [
  { id: 'xiaoxingxing', name: '小星星', notes: ['do','do','sol','sol','la','la','sol',
        'fa','fa','mi','mi','re','re','do',
        'sol','sol','fa','fa','mi','mi','re',
        'sol','sol','fa','fa','mi','mi','re',
        'do','do','sol','sol','la','la','sol',
        'fa','fa','mi','mi','re','re','do'],
  phraseColors: ['bl','bl','bl','bl','bl','bl','bl','pp','pp','pp','pp','pp','pp','pp','pk', 'pk', 'pk', 'pk', 'pk', 'pk', 'pk', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl', 'bl','pp', 'pp', 'pp', 'pp', 'pp', 'pp', 'pp'] },

  { id: 'shengrikuaile', name: '生日快乐', notes: ['do','do','re','do','fa','mi','do','do','re','do','sol','fa','do','do','do↑','la','fa','mi','re','la↑','la↑','fa','sol','fa'] },
  { id: 'liangzhilaohu', name: '两只老虎', notes: ['do','re','mi','do','do','re','mi','do','mi','fa','sol','mi','fa','sol','sol','la','sol','fa','mi','do','sol','la','sol','fa','mi','do','do↑','sol','do↑','do↑','sol','do↑'] },
  { id: 'night5', name: '夜的钢琴曲五', notes: [
        "la↓","si↓","do","mi","la","la↓","si↓","do","mi","la","re↑","do↑","si","do","la",
        "la↓","si↓","do","mi","la","la↓","si↓","do","mi","la","re↑","do↑","si","do","la",
        "mi","sol","la","mi↑","re↑","mi↑","re↑","mi↑","re↑","do↑",
        "re↑","re↑","mi↑","sol↑","mi↑","sol","mi","sol","mi","sol","re↑","do↑",
        "la↓","si↓","do","mi","la","mi↑","mi↑","re↑","mi↑","re↑","si","re↑","do↑","si","do",
        "la","la↓","si↓","do","mi","la","la↓","si↓","do","mi","la","re↑","do↑","si","do","la","do↑","si","la↓","si↓","do","mi",
        "la","la↓","si↓","do","mi","la","re↑","do↑","si","do","la","do↑","si","mi","sol","la","mi↑","re↑","mi↑","re↑","mi↑","re↑","do↑",
        "re↑","re↑","mi↑","sol↑","mi↑","sol","mi","sol","mi","sol","re↑","do↑",
        "do","re","mi","la","la","mi↑","mi↑","re↑","mi↑","re↑","si","re↑","do↑","si","do",
        "la","do↑","si","do","re","mi","la","la","do","re","mi","la","la","do","re","mi","do↑",
        "la","do↑","si","do","re","mi","la","la","do","re","mi","la","mi↑","re↑","mi↑","sol↑","mi↑","re↑","mi↑",
        "la↓","si↓","do","mi","la","mi↑","mi↑","re↑","mi↑","sol↑",
        "re↑","re↑","mi↑","sol↑","mi↑","sol","mi","sol","mi","sol","re↑","do↑",
        "do","re","mi","la","la","mi↑","mi↑","re↑","mi↑","re↑","si","re↑","do↑","si","do",
        "la","do↑","si","la↓","si↓","do","mi","la","la↓","si↓","do","mi","la","re↑","do↑","si","do","la",
        "do↑","si","la↓","si↓","do","mi","la","la↓","si↓","do","mi","la","re↑","do↑","si","do","la","do↑","si","mi","sol","la","mi↑",
        "re↑","mi↑","re↑","mi↑","re↑","do↑","re↑","re↑","mi↑","sol↑","mi↑","sol","mi","sol","mi","sol","re↑","do↑",
        "do","re","mi","la","la","mi↑","mi↑","re↑","mi↑","re↑","si","re↑","do↑","si","do",
        "la","do↑","si","do","re","mi","la","la","do","re","mi","la","la","do","re","mi","do↑",
        "la","do↑","si","do","re","mi","la","la","do","re","mi","la","mi↑","re↑","mi↑","sol↑","mi↑"
  ] },
  {id:'qinghuaci', name: '青花瓷', notes: ['sol↑','sol↑','mi↑','re↑','mi↑','la','re↑','mi↑','sol↑','mi↑','re↑',
        'sol↑','sol↑','mi↑','re↑','mi↑','sol','re↑','mi↑','sol↑','re↑','do↑',
        'do↑','re↑','mi↑','sol','la','sol','mi','sol','mi','mi','re','re',
        'do↑','re↑','do↑','re↑','do↑','re↑','mi↑','sol↑','mi↑',
        'sol↑','sol↑','mi↑','re↑','mi↑','la↑','re↑','mi↑','sol↑','mi↑','re↑',
        'sol↑','sol↑','mi↑','re↑','mi↑','sol','re↑','mi↑','sol↑','re↑','do↑',
        'do↑','re↑','mi↑','sol','la','sol','mi','sol','mi','mi','re','re',
        'sol','mi↑','re↑','re↑','do↑']},
  {id:'chuanyueshikongdesinian', name: '穿越时空的思念', notes: ['mi↓','sol↓','la↓','la↓','do','re','mi','sol','mi','re','do','la↓','mi','re',
        'la↓','mi','re','la↓','sol↓','mi↓','mi↓','sol↓','la↓','la↓','do','re','mi','sol',
        'mi↓','re','do','la↓','mi','re','la↓','mi','re','la↓','sol↓','la↓','mi','sol',
        'la↓','sol','la','si','sol','la','sol','re','mi','mi','sol','la','sol','la','do↑','si','sol',
        'mi','mi','sol','la','sol','la','si','sol','la','sol','re','mi','mi','re',
        'la↓','mi','re','la↓','sol↓','la↓','mi','sol','la','sol','la','si','sol',
        'la','sol','re','mi','mi','sol','la','sol','la','do↑','si','sol','mi','mi','sol',
        'la','sol','la','si','sol','la','sol','re','mi','mi','re','la↓','mi','re','la↓','sol↓',
        'la↓','mi','re','la↓','mi','re','la↓','sol↓','la↓']},
  {id:'juebieshu', name: '诀别书', notes: ['la','mi↑','re↑','mi↑','re↑','mi↑','la↑','mi↑','re↑','mi↑','re↑','mi↑','re↑','mi↑','re↑','sol','re↑','si','sol','sol','re↑','do↑','re↑','do↑','re↑','sol↑','sol↑','re↑','re↑','mi↑','re↑','mi↑','re↑','si','do↑','la','mi↑','re↑','mi↑','re↑','mi↑','la↑','mi↑','re↑','mi↑','re↑','mi↑','re↑','mi↑','re↑','sol','re↑','si','sol','sol','re↑','do↑','re↑','do↑','re↑','sol↑','sol↑', 'si↑','la↑','si↑','la↑','si↑','la↑','sol↑','la↑']},
  {id:'jucilangdexiatian', name: '菊次郎的夏天', notes: ['sol','do↑','re↑','mi↑','re↑','do↑','do↑',
        'sol','do↑','re↑','mi↑','re↑','do↑','re↑','mi↑','mi↑',
        'sol','do↑','re↑','mi↑','re↑','do↑','do↑',
        'sol','do↑','re↑','mi↑','re↑','do↑','re↑','sol↑','mi↑',
        'mi↑','fa↑','sol↑','sol↑','sol↑','sol↑','sol↑','mi↑','do↑',
        'mi↑','fa↑','sol↑','sol↑','sol↑','sol↑','sol↑','mi↑','do↑',
        'do↑','re↑','mi↑','mi↑','mi↑','mi↑','mi↑','la↑','mi↑','re↑','do↑','re↑']},
//  {id:'zhiailisi', name: '致爱丽丝', notes: ['do']},
  {id:'tiankongzhicheng', name: '天空之城', notes: ['la','si','do↑','si','do↑','mi↑','si','mi','mi','la','sol','la','do↑','sol','mi','fa','mi','fa','do↑','mi','do↑','do↑','si','fa','fa','si','si','la','si','do↑','si','do↑','mi↑','si','mi','mi','la','sol','la','do↑','sol','re','mi','fa','do↑','si','do↑','re↑','mi↑','do↑','do↑','si','la','la','si','sol','la']},
  {id:'dreamwedding', name: '梦中的婚礼', notes: ['la','la','si','si','do↑','do↑','si','si','la','la','mi','mi','do','do','la↓','la↓','sol',
        'sol','fa','fa','mi','fa','sol','fa',
        'fa','fa','sol','sol','la','la','si','si','sol','sol','re','re','fa',
        'fa','mi','mi','re','mi','fa↑','mi↑',
        'mi','la','do↑','mi↑','re↑','mi↑','la','do↑','mi↑','re↑','mi↑','la','do↑','fa↑','mi↑','fa↑','la','do↑','fa↑','mi↑','fa↑',
        'fa','mi','fa','fa#','sol','sol','la','sol','la','mi↑']},
  {id:'kissofrain', name: '雨的印记', notes: ['sol','do↑','re↑','re↑','mi↑','mi↑','do↑','re↑','mi↑','re↑','sol↑','sol↑','sol↑','la↑','si↑',
        'si↑','do↑','do↑','re↑','mi↑','re↑','do↑','si','do↑','si','sol','sol','la','la','sol','fa',
        'fa','sol','sol','do','re','mi','fa','fa','sol','fa','mi','sol','do↑','re↑',
        're↑','mi↑','mi↑','do↑','re↑','mi↑','re↑','sol↑','sol↑','sol↑','la↑','si↑','si↑','do↑','do↑','re↑','mi↑','re↑','do↑',
        'si','do↑','si','sol','sol','la','la','sol','fa','fa','sol','sol','do↑','re↑',
        'mi','fa','la','do↑','si','do↑','do','mi','sol','la','do','si','do','la',
        'sol','do','si','do','si','do','sol','sol','fa','fa','mi','mi','re','re','do',
        're','mi','mi','do','mi','sol','la','do','si','si','la','sol','mi','fa','sol','fa','mi',
        'fa','sol','la','si','do↑','mi↑','re↑','sol','do↑','re↑','re↑','mi↑','mi↑','do','re↑','mi↑',
        're↑','sol↑','sol↑','sol↑','la↑','si↑','si↑','do↑','do↑','re↑','mi↑','re↑','do↑','si','do↑','si↑','sol↑',
        'sol↑','la↑','la↑','sol↑','fa↑','fa↑','sol↑','sol','do↑','re↑','mi','fa','fa','sol','fa']},
  {id:'chengnanhuayikai', name: '城南花已开', notes: ['la','do↑','re↑','mi↑','la','re↑','mi↑','la','sol↑','mi↑','sol↑','mi↑','la','do↑','re↑','mi↑','la','re↑','mi↑','sol','mi','la','do↑','si','sol','la','la','do↑','re↑','mi↑','la','re↑','mi↑','la','sol↑','mi↑','sol↑','mi↑','la','do↑','re↑','mi↑','la','re↑','mi↑','sol','mi','do↑','si','la','sol','la']},

];

// 难度与格子大小映射
const DIFFICULTY = {5: '简单', 8: '中等', 12: '困难' };