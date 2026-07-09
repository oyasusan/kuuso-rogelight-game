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
  /** 見た目のサイズ（px、ひし形の一辺） */
  SIZE: 18,
  COLOR: 0x9933ee,
  /** 移動速度（px/秒） */
  SPEED: 70,
  /** 退場までに必要なダメージ量 */
  MAX_HP: 3,
  /** プレイヤー接触時に会場全体へ与える Heat 量（負値） */
  HEAT_DRAIN: -10,
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
  SONG_HEAT_BONUS: 8,
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
