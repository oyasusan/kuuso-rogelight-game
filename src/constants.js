/**
 * ゲーム全体で使用する定数定義。
 * マジックナンバーを排除し、バランス調整をこのファイルに集約する。
 */

/** 画面・進行の基本設定 */
export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
  BACKGROUND_COLOR: '#0d0d1f',
  /** ライブの制限時間（秒） */
  LIVE_DURATION_SEC: 100,
};

/** 描画順（大きいほど手前） */
export const DEPTH = {
  STAGE: 0,
  AUDIENCE: 1,
  ANTI: 3,
  PLAYER: 5,
  EFFECT: 8,
  UI: 10,
  OVERLAY: 20,
};

/** プレイヤー（アイドル）関連 */
export const PLAYER_CONFIG = {
  /** 移動速度（px/秒） */
  SPEED: 240,
  /** 当たり判定の半径相当（px）。ドット絵の見た目サイズとは独立に調整する */
  RADIUS: 14,
};

/** ドット絵アイドルの生成設定（Player.js の見た目に使用） */
export const IDOL_SPRITE_CONFIG = {
  /** ドット 1 マスの描画サイズ（px） */
  CELL_SIZE: 2,
  /** グリッドの列数・行数 */
  GRID_COLS: 14,
  GRID_ROWS: 20,
  /** 肌色（キャラクター共通） */
  SKIN_COLOR: 0xffe0c2,
  /** 目の色（キャラクター共通） */
  EYE_COLOR: 0x2a2035,
  /** 衣装のベース色・影色（キャラクター共通。差し色は CHARACTERS の color を使う） */
  OUTFIT_BASE_COLOR: 0xfff6f4,
  OUTFIT_SHADOW_COLOR: 0xe6d9de,
  /** ブーツに使う、差し色を暗くする倍率（0〜1、小さいほど暗い） */
  BOOT_DARKEN_FACTOR: 0.55,
};

/** 観客のドット絵シルエット生成設定（Audience.js の見た目に使用） */
export const AUDIENCE_SPRITE_CONFIG = {
  /** ドット 1 マスの描画サイズ（px） */
  CELL_SIZE: 2,
  /** グリッドの列数・行数 */
  GRID_COLS: 8,
  GRID_ROWS: 10,
  /** 陰になるセルの暗さ（0〜1、小さいほど暗い） */
  SHADE_FACTOR: 0.72,
};

/** アンチのドット絵シルエット生成設定（AntiFan.js の見た目に使用） */
export const ANTI_SPRITE_CONFIG = {
  CELL_SIZE: 2,
  GRID_COLS: 10,
  GRID_ROWS: 12,
  SHADE_FACTOR: 0.6,
};

/** 観客関連 */
export const AUDIENCE_CONFIG = {
  /** Heat の初期値 */
  INITIAL_HEAT: 20,
  /** Heat の最大値（この値で熱狂状態になる） */
  MAX_HEAT: 100,
  /**
   * Heat の自然減衰（毎秒）。
   * 盛り上げ続けないと観客は冷めていく＝アイドルが頑張って維持する手触りの核。
   * 連鎖(3)と同値のため、熱狂者 1 人に接するだけでは現状維持で、
   * 2 人以上に囲われるか、パフォーマンスの後押しがないと熱狂は広がらない
   */
  HEAT_DECAY_PER_SEC: 3,
  /** 格子位置からのランダムなずらし幅（px） */
  JITTER: 12,
  /** 観客のモーション（Heat が高いほど大きく揺れ、熱狂するとジャンプする） */
  MOTION: {
    /** 熱狂時のジャンプの高さ（px） */
    JUMP_HEIGHT: 7,
    /** 熱狂時のジャンプの速さ */
    JUMP_FREQ: 0.008,
    /** 揺れの基本速度 */
    SWAY_BASE_FREQ: 0.002,
    /** Heat による揺れ速度の加算 */
    SWAY_HEAT_FREQ: 0.004,
    /** 揺れの基本振幅（px） */
    SWAY_BASE_AMP: 0.5,
    /** Heat による揺れ振幅の加算（px） */
    SWAY_HEAT_AMP: 2.5,
  },
  /** Heat が低いときの色 */
  COLOR_COLD: 0x4a5a9e,
  /** Heat が高いときの色 */
  COLOR_HOT: 0xff5533,
  /** 熱狂状態の色 */
  COLOR_FRENZY: 0xffdd33,
};

/** 熱狂状態（Heat 最大時）の連鎖関連 */
export const FRENZY_CONFIG = {
  /** 周囲の観客へ熱を伝える半径（px） */
  CHAIN_RADIUS: 100,
  /**
   * 毎秒与える Heat 量。
   * 熱狂源が何人近くにいても、対象 1 人が 1 tick に受け取るのはこの量 1 回分のみ
   * （HeatSystem.chainTick 側でキャップしている）。単純合算にすると熱狂の密度が
   * 上がるほど雪だるま式に加速してしまうため、対象ごとに上限を設けて
   * 「熱狂してから急に一気に広がる」体感を抑えている
   */
  CHAIN_HEAT_PER_SEC: 6,
  /** 観客 1 人が熱狂したときに得る経験値 */
  EXP_PER_FRENZY: 10,
};

/** 通常パフォーマンス「歌」 */
export const SONG_CONFIG = {
  /** 自動発動の間隔（ミリ秒） */
  INTERVAL_MS: 2000,
  /** 効果半径（px） */
  RADIUS: 120,
  /** 観客へ与える Heat 量 */
  HEAT_GAIN: 12,
  /** アンチへ与えるダメージ（Phase2 で使用） */
  DAMAGE: 1,
  /** 音符エフェクトのプール上限 */
  NOTE_POOL_SIZE: 24,
  /** 1 回の歌で表示する音符の数 */
  NOTES_PER_CAST: 3,
};

/** パフォーマンス「ダンス」（レベルアップで取得） */
export const DANCE_CONFIG = {
  /** 自動発動の間隔（ミリ秒） */
  INTERVAL_MS: 3000,
  /** 扇形の半径（px） */
  RADIUS: 150,
  /** 扇形の中心角（度） */
  ANGLE_DEG: 100,
  /** 観客へ与える Heat 量 */
  HEAT_GAIN: 30,
};

/** パフォーマンス「ファンサ」（レベルアップで取得） */
export const FANSERVICE_CONFIG = {
  /** クールタイム（ミリ秒） */
  COOLDOWN_MS: 5000,
  /** 強化で短縮できるクールタイムの下限（ミリ秒） */
  MIN_COOLDOWN_MS: 2000,
};

/** パフォーマンス「MC」（レベルアップで取得） */
export const MC_CONFIG = {
  /** 自動発動の間隔（ミリ秒） */
  INTERVAL_MS: 20000,
  /** 効果時間（ミリ秒） */
  DURATION_MS: 10000,
  /** 効果中の Heat 上昇量の倍率 */
  MULTIPLIER: 1.5,
};

/** アンチ関連 */
export const ANTI_CONFIG = {
  /** 当たり判定のサイズ（px）。ドット絵の見た目サイズとは独立に調整する */
  SIZE: 18,
  COLOR: 0x9933ee,
  /** 移動速度（px/秒） */
  SPEED: 70,
  /** 退場までに必要なダメージ量 */
  MAX_HP: 3,
  /** プレイヤー接触時に会場全体（未熱狂の観客）へ与える Heat 量（負値） */
  HEAT_DRAIN: -10,
  /**
   * プレイヤー接触時、熱狂状態の観客のうち解除する割合（0〜1）。
   * これまでは熱狂した観客は不可侵だったが、アンチの妨害が積み上げた
   * 盛り上がりにも及ぶようにするための罰則
   */
  FRENZY_COOLDOWN_RATIO: 0.2,
  /** 熱狂している観客が少なくても最低これだけ解除する */
  FRENZY_COOLDOWN_MIN_COUNT: 1,
  /** 熱狂解除後の Heat（再び熱狂させるには温め直しが必要になる） */
  FRENZY_COOLDOWN_HEAT: 50,
  /** 最初のスポーンまでの時間（ミリ秒） */
  FIRST_SPAWN_MS: 12000,
  /** スポーン間隔（ミリ秒） */
  SPAWN_INTERVAL_MS: 8000,
  /** この秒数が経過するごとに 1 回のスポーン数が 1 体増える */
  RAMP_EVERY_SEC: 40,
  /** オブジェクトプールの上限 */
  POOL_SIZE: 12,
  /** 画面外スポーン時の画面端からの距離（px） */
  SPAWN_MARGIN: 30,
};

/** レベルアップ時のアップグレード関連 */
export const UPGRADE_CONFIG = {
  /** 提示する選択肢の数 */
  CHOICES: 3,
  /** 歌強化 1 回あたりの Heat 量増加 */
  SONG_HEAT_BONUS: 6,
  /** 歌強化 1 回あたりのダメージ増加 */
  SONG_DAMAGE_BONUS: 1,
  /** ダンス強化 1 回あたりの Heat 量増加 */
  DANCE_HEAT_BONUS: 10,
  /** ファンサ強化 1 回あたりのクールタイム短縮（ミリ秒） */
  FANS_COOLDOWN_STEP_MS: 500,
  /** MC 強化 1 回あたりの効果時間延長（ミリ秒） */
  MC_DURATION_BONUS_MS: 2000,
  /** 範囲 UP 1 回あたりの半径倍率 */
  RANGE_MULTIPLIER: 1.15,
  /** 移動速度 UP 1 回あたりの倍率 */
  SPEED_MULTIPLIER: 1.12,
};

/** レベル関連 */
export const LEVEL_CONFIG = {
  /**
   * レベル 1 → 2 に必要な経験値。
   * 観客は 112 人 × 10 EXP = 総量 1120 EXP。
   * ラン全体で緩やかにレベルが上がり、ほぼ全員熱狂（1094 EXP）で
   * ゲーム終盤に Lv6（実質最大）へ届くカーブにしている:
   * Lv2=100 / Lv3=240 / Lv4=436 / Lv5=710 / Lv6=1094（累計）
   */
  BASE_EXP: 100,
  /** レベルが上がるごとの必要経験値の倍率 */
  EXP_GROWTH: 1.4,
};

/** コンボ関連（連続して観客を熱狂させると加算） */
export const COMBO_CONFIG = {
  /** この時間（ミリ秒）新しい熱狂が発生しないとコンボが途切れる */
  TIMEOUT_MS: 3000,
};

/** 最終スコアの計算重み */
export const SCORE_CONFIG = {
  AVG_HEAT_WEIGHT: 100,
  FRENZY_WEIGHT: 30,
  COMBO_WEIGHT: 15,
};

/** 会場演出（平均 Heat に応じて段階的に変化する） */
export const STAGE_CONFIG = {
  /**
   * 演出段階のしきい値（平均 Heat）。
   * tier0: 静か / tier1: 少し歓声 / tier2: サイリウム /
   * tier3: 紙吹雪 / tier4: レーザー・歓声最大
   */
  TIER_THRESHOLDS: [40, 60, 80, 100],
  /** 段階が上がったときに表示するアナウンス */
  TIER_ANNOUNCES: [
    '',
    '歓声が上がり始めた！',
    'サイリウムが揺れる！',
    '紙吹雪が舞う！',
    'レーザー全開！歓声最大！',
  ],
  /** サイリウムを表示する観客数の上限 */
  SYLIUM_MAX: 60,
  /** サイリウムの色（ランダムに選ばれる） */
  SYLIUM_COLORS: [0xff66cc, 0xffee55, 0x55ffee, 0x99ff66, 0xff9955],
  /** 紙吹雪の発生間隔（ミリ秒） */
  CONFETTI_INTERVAL_MS: 70,
  /** 紙吹雪の色 */
  CONFETTI_COLORS: [0xff6688, 0xffdd55, 0x66ddff, 0x99ff88, 0xcc88ff],
  /** レーザーの色 */
  LASER_COLORS: [0xff33cc, 0x33ffee, 0xaa66ff, 0x66aaff],
  /** レーザーの本数 */
  LASER_COUNT: 4,
};

/** サウンド関連（Web Audio によるプロシージャル生成） */
export const AUDIO_CONFIG = {
  /** 全体音量 */
  MASTER_VOLUME: 0.4,
  /** BGM のテンポ（BPM） */
  BGM_TEMPO: 132,
  /** 演出段階ごとの歓声ノイズの音量 */
  CHEER_GAINS: [0, 0.04, 0.08, 0.13, 0.2],
  /** 熱狂 SE の最短再生間隔（ミリ秒、連鎖時の鳴りすぎ防止） */
  FRENZY_SE_MIN_INTERVAL_MS: 70,
};

/**
 * プレイアブルキャラクター。
 * songHeatMult: 歌の Heat 量倍率 / songRadiusMult: 歌の半径倍率 / speedMult: 移動速度倍率
 */
export const CHARACTERS = [
  {
    id: 'aika',
    name: 'アイカ',
    description: 'バランス型\nクセがなく扱いやすい',
    color: 0xff66aa,
    songHeatMult: 1,
    songRadiusMult: 1,
    speedMult: 1,
  },
  {
    id: 'mio',
    name: 'ミオ',
    description: '歌姫型\n歌のHeat +30%\n移動速度 -10%',
    color: 0x66aaff,
    songHeatMult: 1.3,
    songRadiusMult: 1,
    speedMult: 0.9,
  },
  {
    id: 'rin',
    name: 'リン',
    description: 'スピード型\n移動速度 +25%\n歌の範囲 -15%',
    color: 0xffaa44,
    songHeatMult: 1,
    songRadiusMult: 0.85,
    speedMult: 1.25,
  },
];

/**
 * ステージ定義。
 * blocks: 観客を配置する格子エリアの配列（cols x rows 人ずつ生成される）
 * antiIntervalMult: アンチのスポーン間隔の倍率（小さいほど多い）
 */
export const STAGES = [
  {
    id: 'hall',
    name: 'ライブハウス',
    description: '標準的な会場',
    bgColor: '#0d0d1f',
    antiIntervalMult: 1,
    blocks: [{ x: 60, y: 130, width: 840, height: 360, cols: 16, rows: 7 }],
  },
  {
    id: 'festival',
    name: '野外フェス',
    description: '観客が2ブロック\nアンチ出現 +40%',
    bgColor: '#0c1e14',
    antiIntervalMult: 0.7,
    blocks: [
      { x: 40, y: 130, width: 380, height: 360, cols: 8, rows: 7 },
      { x: 540, y: 130, width: 380, height: 360, cols: 8, rows: 7 },
    ],
  },
];

/** 永久強化（ラン間で持ち越すメタ進行） */
export const PERMA_CONFIG = {
  /** スコアいくつごとにファン 1 人を獲得するか */
  SCORE_PER_FAN: 100,
  /**
   * 永久強化の定義。cost = baseCost × (現在ランク + 1)。
   * step はランク 1 につき加算される効果量。
   */
  UPGRADES: [
    {
      id: 'initialHeat',
      name: 'ファンの期待',
      description: '観客の初期Heat +5',
      maxRank: 4,
      baseCost: 100,
      step: 5,
    },
    {
      id: 'songHeat',
      name: 'ボイストレーニング',
      description: '歌のHeat +4',
      maxRank: 5,
      baseCost: 80,
      step: 4,
    },
    {
      id: 'speed',
      name: '体力づくり',
      description: '移動速度 +8%',
      maxRank: 5,
      baseCost: 80,
      step: 0.08,
    },
    {
      id: 'antiResist',
      name: 'メンタルケア',
      description: 'アンチによるHeat減少を2緩和',
      maxRank: 4,
      baseCost: 120,
      step: 2,
    },
  ],
};

/** UI 関連 */
export const UI_CONFIG = {
  FONT_FAMILY: '"Hiragino Sans", "Noto Sans JP", sans-serif',
  HUD_HEIGHT: 48,
  TEXT_COLOR: '#ffffff',
  ACCENT_COLOR: '#ffdd66',
};
