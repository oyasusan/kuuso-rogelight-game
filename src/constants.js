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
  OBSTACLE: 2,
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
  /** 経験値オーブの吸収範囲（px）。レベルアップ強化で拡大する */
  MAGNET_RADIUS: 60,
};

/**
 * 仮想パッド（スマホ等タッチデバイス向けの移動操作）関連。
 * タッチ対応デバイスでのみ、画面をタップした位置にフローティング表示する
 * （VirtualJoystick を参照）。指を離すと消え、次にタップした位置に再び現れる。
 */
export const JOYSTICK_CONFIG = {
  /** ベース（外側の円）の半径（px） */
  BASE_RADIUS: 50,
  /** ノブ（操作する内側の円）の半径（px） */
  KNOB_RADIUS: 24,
  /** この割合未満の傾きは入力なしとみなす（わずかな指のブレで動き出さないように） */
  DEAD_ZONE_RATIO: 0.15,
  BASE_COLOR: 0xffffff,
  BASE_ALPHA: 0.15,
  BASE_BORDER_ALPHA: 0.35,
  KNOB_COLOR: 0xffffff,
  KNOB_ALPHA: 0.4,
};

/**
 * 障害物（機材ケース風のボックス）関連。中箱以降のステージにのみ配置される
 * （個数・サイズは STAGES[].obstacles で会場ごとに指定する）。
 * プレイヤーは衝突して通れないが、アンチは無視してすり抜ける
 * （GameScene 側でプレイヤーとのみ collider を張ることで実現している）。
 */
export const OBSTACLE_CONFIG = {
  /** ワールド端からの最小距離（px） */
  WORLD_MARGIN: 60,
  /** プレイヤーの初期位置（ワールド中心）から確保する安全地帯の半径（px） */
  SPAWN_EXCLUSION_RADIUS: 170,
  /** 障害物どうしの最小の隙間（px）。プレイヤーが通り抜けられる幅を確保する */
  MIN_GAP: 80,
  /** 配置を試みる最大回数（1 個あたり）。密集して置き場所が見つからない場合に無限ループしないためのガード */
  MAX_ATTEMPTS_PER_OBSTACLE: 20,
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

/**
 * 経験値オーブ（ヴァンサバ風の落とし物・吸い取り仕様）関連。
 * アンチを倒すと落ち、プレイヤーが player.magnetRadius 以内に近づくと
 * 引き寄せられ、PICKUP_DISTANCE まで近づくと自動的に回収される
 */
export const EXP_ORB_CONFIG = {
  /** オブジェクトプールの上限 */
  POOL_SIZE: 64,
  /** オーブの表示半径（px） */
  RADIUS: 5,
  /** オーブの色 */
  COLOR: 0x66ffcc,
  /** この距離まで近づいたら自動的に回収される（px） */
  PICKUP_DISTANCE: 20,
  /** 吸引開始後、オーブがプレイヤーへ向かう速度（px/秒） */
  MAGNET_SPEED: 260,
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
  /** 強化（テンポアップ）で短縮できる発動間隔の下限（ミリ秒） */
  MIN_INTERVAL_MS: 800,
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
  /** 強化（テンポアップ）で短縮できる発動間隔の下限（ミリ秒） */
  MIN_INTERVAL_MS: 1200,
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
  /** 強化（テンポアップ）で短縮できる発動間隔の下限（ミリ秒） */
  MIN_INTERVAL_MS: 10000,
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
  // --- 通常出現（告知なしの少数トリクル。常時のプレッシャーを作る） ---
  /** 最初のスポーンまでの時間（ミリ秒） */
  FIRST_SPAWN_MS: 8000,
  /** スポーン間隔（ミリ秒）。stage.antiIntervalMult で会場ごとに調整される */
  SPAWN_INTERVAL_MS: 7000,
  /** 1 回あたりの基本スポーン数（stage.antiNormalCountMult 適用前） */
  NORMAL_BASE_COUNT: 1,
  /** この秒数が経過するごとに 1 回あたりの基本スポーン数が 1 体増える */
  RAMP_EVERY_SEC: 35,

  // --- ウェーブ出現（告知つきの大量出現。1 ゲームに stage.waveCount 回だけ発生） ---
  /** 最初のウェーブが来るタイミング（ミリ秒） */
  WAVE_FIRST_MS: 18000,
  /** 最後のウェーブが来るタイミング（ミリ秒）。この間で waveCount 回を等間隔に配置する */
  WAVE_LAST_MS: 88000,
  /** 1 ウェーブあたりの基本出現数（stage.waveSizeMult 適用前） */
  WAVE_BASE_SIZE: 10,

  /**
   * オブジェクトプールの上限。
   * ドーム級の会場ではウェーブ 1 回で 20 体以上まとめて出現するうえ、
   * 通常出現との重なりもあるため、小箱基準の値よりかなり余裕を持たせている
   */
  POOL_SIZE: 96,
  /** 画面外スポーン時の画面端からの距離（px） */
  SPAWN_MARGIN: 30,

  // --- ボス（1 ゲームに 1 体だけ登場する特別なアンチ） ---
  /** ボスが出現するタイミング（ミリ秒） */
  BOSS_SPAWN_MS: 60000,
};

/**
 * アンチの種類。ANTI_CONFIG の SIZE/SPEED/MAX_HP/HEAT_DRAIN を基準値として、
 * 各倍率を掛けて個性を出す。
 * behavior: 'contact'（プレイヤーに接触したときだけ効果を発揮）/
 *   'pulse'（接触しなくても一定間隔で周囲の Heat を削る遠隔攻撃。ジャマー専用）
 * normalWeight/waveWeight: 通常出現・ウェーブ出現での抽選重み（0 なら出現しない）。
 * expValue: 撃破時に落とす経験値オーブの経験値量（EXP_ORB_CONFIG を参照）。
 * ボスは抽選には使わず、GameScene.spawnBoss が個別に生成する
 * （HP は stage.bossHpMult で会場ごとに調整される）。
 */
export const ANTI_TYPES = [
  {
    id: 'normal',
    name: '通常',
    color: 0x9933ee,
    speedMult: 1,
    sizeMult: 1,
    hpMult: 1,
    heatDrainMult: 1,
    behavior: 'contact',
    normalWeight: 6,
    waveWeight: 4,
    expValue: 8,
  },
  {
    id: 'runner',
    name: 'ランナー',
    description: '速いが打たれ弱い',
    color: 0x33ccff,
    speedMult: 1.6,
    sizeMult: 0.7,
    hpMult: 0.7,
    heatDrainMult: 0.6,
    behavior: 'contact',
    normalWeight: 2,
    waveWeight: 3,
    expValue: 6,
  },
  {
    id: 'brute',
    name: 'ブルート',
    description: '遅いが硬く、接触ダメージが大きい',
    color: 0xcc4422,
    speedMult: 0.6,
    sizeMult: 1.6,
    hpMult: 2.5,
    heatDrainMult: 1.8,
    behavior: 'contact',
    normalWeight: 1,
    waveWeight: 2,
    expValue: 15,
  },
  {
    id: 'jammer',
    name: 'ジャマー',
    description: '接触しなくても周囲のHeatを定期的に削る',
    color: 0x99ee33,
    speedMult: 0.85,
    sizeMult: 1,
    hpMult: 1.2,
    heatDrainMult: 0.8,
    behavior: 'pulse',
    pulseRadius: 90,
    pulseIntervalMs: 2200,
    pulseHeatDrain: -4,
    normalWeight: 0,
    waveWeight: 2,
    expValue: 10,
  },
  {
    id: 'boss',
    name: 'ボス',
    description: '1ゲームに1体だけ現れる巨大なアンチ',
    color: 0xdd1144,
    speedMult: 0.5,
    sizeMult: 2.4,
    hpMult: 6,
    heatDrainMult: 3,
    behavior: 'contact',
    /** ボスは接触しても退場せず、この間隔ごとに 1 回だけダメージ判定を受ける */
    contactCooldownMs: 1200,
    normalWeight: 0,
    waveWeight: 0,
    expValue: 50,
  },
];

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
  /** 経験値吸収範囲 UP 1 回あたりの半径倍率 */
  MAGNET_MULTIPLIER: 1.25,
  /** テンポアップ 1 回あたりの発動間隔倍率（小さいほど間隔が短くなる） */
  TEMPO_MULTIPLIER: 0.88,
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
  /** 経験値オーブ回収 SE の最短再生間隔（ミリ秒、大量回収時の鳴りすぎ防止） */
  EXP_PICKUP_SE_MIN_INTERVAL_MS: 60,
};

/**
 * プレイアブルキャラクター。
 * songHeatMult: 歌の Heat 量倍率 / songRadiusMult: 歌の半径倍率 / speedMult: 移動速度倍率
 * どのキャラクターも「2 種類を強化する代わりに 1 種類を犠牲にする」形の
 * トレードオフで構成し、一方的に強い／弱いキャラクターが生まれないようにしている。
 *
 * unlocked: false のキャラクターは最初は選択できず、PERMA_CONFIG.UPGRADES の
 * unlockUpgradeId で指定した永久強化を購入すると解放される
 * （判定は RunModifiers.isCharacterUnlocked を使う）。
 */
export const CHARACTERS = [
  {
    id: 'suzu',
    name: 'すず',
    description: '情熱型\n歌のHeat +35%\n移動速度 -10%',
    color: 0xff3355,
    songHeatMult: 1.35,
    songRadiusMult: 1,
    speedMult: 0.9,
    unlocked: true,
    unlockUpgradeId: null,
  },
  {
    id: 'ami',
    name: 'あみ',
    description: 'バランス型\nクセがなく扱いやすい',
    color: 0x55ccee,
    songHeatMult: 1,
    songRadiusMult: 1,
    speedMult: 1,
    unlocked: true,
    unlockUpgradeId: null,
  },
  {
    id: 'yui',
    name: 'ゆい',
    description: 'ヒットアンドアウェイ型\n歌のHeat +15%\n移動速度 +25%\n歌の範囲 -15%',
    color: 0xffdd44,
    songHeatMult: 1.15,
    songRadiusMult: 0.85,
    speedMult: 1.25,
    unlocked: true,
    unlockUpgradeId: null,
  },
  {
    id: 'uyu',
    name: 'うゆ',
    description: '範囲型\n歌の範囲 +30%\n歌のHeat -15%',
    color: 0x66cc66,
    songHeatMult: 0.85,
    songRadiusMult: 1.3,
    speedMult: 1,
    unlocked: false,
    unlockUpgradeId: 'unlockUyu',
  },
  {
    id: 'mirei',
    name: 'みれい',
    description: '機動支援型\n移動速度 +15%\n歌の範囲 +15%\n歌のHeat -20%',
    color: 0xff88cc,
    songHeatMult: 0.8,
    songRadiusMult: 1.15,
    speedMult: 1.15,
    unlocked: false,
    unlockUpgradeId: 'unlockMirei',
  },
  {
    id: 'kotone',
    name: 'ことね',
    description: '求心力型\n歌のHeat +20%\n歌の範囲 +15%\n移動速度 -20%',
    color: 0xff9933,
    songHeatMult: 1.2,
    songRadiusMult: 1.15,
    speedMult: 0.8,
    unlocked: false,
    unlockUpgradeId: 'unlockKotone',
  },
  {
    id: 'mayupi',
    name: 'まゆぴ',
    description: '俊敏型\n歌のHeat +15%\n移動速度 +15%\n歌の範囲 -20%',
    color: 0xaa66ee,
    songHeatMult: 1.15,
    songRadiusMult: 0.8,
    speedMult: 1.15,
    unlocked: false,
    unlockUpgradeId: 'unlockMayupi',
  },
];

/**
 * ステージ（会場）定義。小箱 → ドームの順に規模が大きくなり、それに伴って
 * 観客数（＝獲得できる経験値・ファンの総量）とアンチの脅威が同時に増していく。
 *
 * worldWidth/worldHeight: ワールド（マップ）の実サイズ。GAME.WIDTH/HEIGHT
 *   （画面表示サイズ）より大きい場合はカメラがプレイヤーを追従してスクロールする。
 *   小箱だけは画面サイズと同じでスクロールしない
 * blocks: 観客を配置する格子エリアの配列（cols x rows 人ずつ生成される）。
 *   会場が大きくなっても観客の間隔（密度）はほぼ一定（56px）に保っている。
 *   密度を上げてしまうと歌・ダンスの範囲攻撃 1 回で当たる人数が跳ね上がり、
 *   経験値が過剰に稼げてしまう＝難易度が下がる問題があったため、
 *   「範囲は同じ密度のまま広がる」形にして、広い会場を歩き回って稼ぐ必要がある
 *   ようにしている
 * アンチは「通常出現（告知なしの少数トリクル）」と「ウェーブ（告知つきの大量出現、
 * 1 ゲームに数回だけ）」の 2 系統に分かれる（GameScene.spawnNormalAnti /
 * spawnWave を参照）。
 * antiIntervalMult: 通常出現のスポーン間隔の倍率（小さいほど頻繁）
 * antiNormalCountMult: 通常出現 1 回あたりの人数の倍率
 * waveCount: 1 ゲームあたりのウェーブ回数（3〜5 回を目安にしている）
 * waveSizeMult: ウェーブ 1 回あたりの出現数の倍率（ANTI_CONFIG.WAVE_BASE_SIZE に乗算）
 * bossHpMult: ボス（1 ゲームに 1 体、ANTI_CONFIG.BOSS_SPAWN_MS に出現）の HP 倍率
 *   （ANTI_TYPES の 'boss'.hpMult をこの値で上書きする）
 * heatDecayMult: 観客の自然冷却速度の倍率（大きいほど Heat が鈍化しやすい）
 * obstacles: 障害物の個数・サイズ範囲（{ count, minSize, maxSize } または null）。
 *   小箱は null（障害物なし）。中箱以降はライブ開始のたびにランダムな位置へ
 *   再配置される（SpawnSystem.spawnObstacles を参照）
 * unlocked: false のステージは最初は選択できず、PERMA_CONFIG.UPGRADES の
 * unlockUpgradeId で指定した永久強化を購入すると解放される
 * （判定は RunModifiers.isStageUnlocked を使う）。
 */
export const STAGES = [
  {
    id: 'small',
    name: '小箱',
    description: '標準的な会場\n観客 約112人',
    bgColor: '#0d0d1f',
    worldWidth: GAME.WIDTH,
    worldHeight: GAME.HEIGHT,
    antiIntervalMult: 1,
    antiNormalCountMult: 1,
    waveCount: 3,
    waveSizeMult: 1,
    bossHpMult: 4,
    heatDecayMult: 1,
    obstacles: null,
    unlocked: true,
    unlockUpgradeId: null,
    blocks: [{ x: 60, y: 130, width: 840, height: 360, cols: 16, rows: 7 }],
  },
  {
    id: 'medium',
    name: '中箱',
    description: '観客 約2倍(220人)\nマップ拡大\nアンチ増加',
    bgColor: '#101229',
    worldWidth: 1400,
    worldHeight: 900,
    antiIntervalMult: 0.85,
    antiNormalCountMult: 1.2,
    waveCount: 3,
    waveSizeMult: 1.2,
    bossHpMult: 5,
    heatDecayMult: 1.15,
    obstacles: { count: 5, minSize: 40, maxSize: 70 },
    unlocked: false,
    unlockUpgradeId: 'unlockMedium',
    blocks: [{ x: 168, y: 170, width: 1064, height: 560, cols: 20, rows: 11 }],
  },
  {
    id: 'large',
    name: '大箱',
    description: '観客 約4倍(442人)\nマップ拡大\nアンチ強襲',
    bgColor: '#141026',
    worldWidth: 1700,
    worldHeight: 1200,
    antiIntervalMult: 0.7,
    antiNormalCountMult: 1.5,
    waveCount: 4,
    waveSizeMult: 1.5,
    bossHpMult: 6,
    heatDecayMult: 1.3,
    obstacles: { count: 8, minSize: 45, maxSize: 80 },
    unlocked: false,
    unlockUpgradeId: 'unlockLarge',
    blocks: [{ x: 150, y: 152, width: 1400, height: 896, cols: 26, rows: 17 }],
  },
  {
    id: 'arena',
    name: 'アリーナ',
    description: '観客 約6倍(672人)\nマップ大拡大\nアンチ猛攻',
    bgColor: '#160e22',
    worldWidth: 2050,
    worldHeight: 1450,
    antiIntervalMult: 0.55,
    antiNormalCountMult: 1.8,
    waveCount: 4,
    waveSizeMult: 1.8,
    bossHpMult: 7,
    heatDecayMult: 1.45,
    obstacles: { count: 11, minSize: 50, maxSize: 90 },
    unlocked: false,
    unlockUpgradeId: 'unlockArena',
    blocks: [{ x: 157, y: 165, width: 1736, height: 1120, cols: 32, rows: 21 }],
  },
  {
    id: 'dome',
    name: 'ドーム',
    description: '観客 約8倍(912人)\n最大級マップ\n全難易度MAX',
    bgColor: '#180c1e',
    worldWidth: 2400,
    worldHeight: 1600,
    antiIntervalMult: 0.45,
    antiNormalCountMult: 2.2,
    waveCount: 5,
    waveSizeMult: 2.2,
    bossHpMult: 8,
    heatDecayMult: 1.6,
    obstacles: { count: 14, minSize: 55, maxSize: 100 },
    unlocked: false,
    unlockUpgradeId: 'unlockDome',
    blocks: [{ x: 164, y: 156, width: 2072, height: 1288, cols: 38, rows: 24 }],
  },
];

/** 永久強化（ラン間で持ち越すメタ進行） */
export const PERMA_CONFIG = {
  /** スコアいくつごとにファン 1 人を獲得するか */
  SCORE_PER_FAN: 100,
  /**
   * 永久強化の定義。cost = baseCost × (現在ランク + 1)。
   * step はランク 1 につき加算される効果量（category: 'character' / 'stage' の
   * 解放系は maxRank: 1 の 1 回購入で、cost は常に baseCost になる）。
   * category は PermanentUpgradeScene のタブ分けに使う。
   */
  UPGRADES: [
    // --- ステータス強化（購入するたびに効果が積み重なる） ---
    {
      id: 'initialHeat',
      category: 'stat',
      name: 'ファンの期待',
      description: '観客の初期Heat +5',
      maxRank: 6,
      baseCost: 100,
      step: 5,
    },
    {
      id: 'songHeat',
      category: 'stat',
      name: 'ボイストレーニング',
      description: '歌のHeat +4',
      maxRank: 8,
      baseCost: 80,
      step: 4,
    },
    {
      id: 'speed',
      category: 'stat',
      name: '体力づくり',
      description: '移動速度 +8%',
      maxRank: 6,
      baseCost: 80,
      step: 0.08,
    },
    {
      id: 'antiResist',
      category: 'stat',
      name: 'メンタルケア',
      description: 'アンチによるHeat減少を2緩和',
      maxRank: 6,
      baseCost: 120,
      step: 2,
    },
    {
      id: 'heatStamina',
      category: 'stat',
      name: 'スタミナ強化',
      description: '観客の自然冷却 -0.3/秒（中箱以上のHeat鈍化に対抗する）',
      maxRank: 6,
      baseCost: 110,
      step: 0.3,
    },
    {
      id: 'antiPower',
      category: 'stat',
      name: '護衛訓練',
      description: '歌のアンチダメージ +1（大きい会場のアンチ猛攻に対抗する）',
      maxRank: 3,
      baseCost: 150,
      step: 1,
    },
    // --- キャラクター解放（1 回だけ購入） ---
    {
      id: 'unlockUyu',
      category: 'character',
      characterId: 'uyu',
      name: 'うゆ 加入',
      description: 'キャラクター「うゆ」が選択可能になる',
      maxRank: 1,
      baseCost: 150,
      step: 0,
    },
    {
      id: 'unlockMirei',
      category: 'character',
      characterId: 'mirei',
      name: 'みれい 加入',
      description: 'キャラクター「みれい」が選択可能になる',
      maxRank: 1,
      baseCost: 220,
      step: 0,
    },
    {
      id: 'unlockKotone',
      category: 'character',
      characterId: 'kotone',
      name: 'ことね 加入',
      description: 'キャラクター「ことね」が選択可能になる',
      maxRank: 1,
      baseCost: 220,
      step: 0,
    },
    {
      id: 'unlockMayupi',
      category: 'character',
      characterId: 'mayupi',
      name: 'まゆぴ 加入',
      description: 'キャラクター「まゆぴ」が選択可能になる',
      maxRank: 1,
      baseCost: 300,
      step: 0,
    },
    // --- 会場解放（1 回だけ購入。規模が大きいほど難易度も上がる） ---
    {
      id: 'unlockMedium',
      category: 'stage',
      stageId: 'medium',
      name: '中箱 解放',
      description: '観客約2倍の会場が選択可能になる',
      maxRank: 1,
      baseCost: 200,
      step: 0,
    },
    {
      id: 'unlockLarge',
      category: 'stage',
      stageId: 'large',
      name: '大箱 解放',
      description: '観客約4倍の会場が選択可能になる',
      maxRank: 1,
      baseCost: 400,
      step: 0,
    },
    {
      id: 'unlockArena',
      category: 'stage',
      stageId: 'arena',
      name: 'アリーナ 解放',
      description: '観客約6倍の会場が選択可能になる',
      maxRank: 1,
      baseCost: 700,
      step: 0,
    },
    {
      id: 'unlockDome',
      category: 'stage',
      stageId: 'dome',
      name: 'ドーム 解放',
      description: '観客約8倍の会場が選択可能になる',
      maxRank: 1,
      baseCost: 1200,
      step: 0,
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
