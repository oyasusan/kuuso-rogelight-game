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
  PLAYER: 5,
  EFFECT: 8,
  UI: 10,
};

/** プレイヤー（アイドル）関連 */
export const PLAYER_CONFIG = {
  /** 移動速度（px/秒） */
  SPEED: 240,
  RADIUS: 14,
  COLOR: 0xff66aa,
};

/** 観客関連 */
export const AUDIENCE_CONFIG = {
  RADIUS: 9,
  /** Heat の初期値 */
  INITIAL_HEAT: 20,
  /** Heat の最大値（この値で熱狂状態になる） */
  MAX_HEAT: 100,
  /** 観客を並べる格子（COLS x ROWS 人生成される） */
  GRID: {
    COLS: 16,
    ROWS: 7,
    /** 格子位置からのランダムなずらし幅（px） */
    JITTER: 12,
  },
  /** 観客を配置する矩形エリア */
  AREA: {
    X: 60,
    Y: 130,
    WIDTH: 840,
    HEIGHT: 360,
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
  /** 毎秒与える Heat 量 */
  CHAIN_HEAT_PER_SEC: 5,
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
  HEAT_GAIN: 20,
  /** アンチへ与えるダメージ（Phase2 で使用） */
  DAMAGE: 1,
  /** 音符エフェクトのプール上限 */
  NOTE_POOL_SIZE: 24,
  /** 1 回の歌で表示する音符の数 */
  NOTES_PER_CAST: 3,
};

/** レベル関連 */
export const LEVEL_CONFIG = {
  /** レベル 1 → 2 に必要な経験値 */
  BASE_EXP: 40,
  /** レベルが上がるごとの必要経験値の倍率 */
  EXP_GROWTH: 1.35,
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

/** UI 関連 */
export const UI_CONFIG = {
  FONT_FAMILY: '"Hiragino Sans", "Noto Sans JP", sans-serif',
  HUD_HEIGHT: 48,
  TEXT_COLOR: '#ffffff',
  ACCENT_COLOR: '#ffdd66',
};
