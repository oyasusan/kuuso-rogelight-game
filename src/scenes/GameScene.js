import Phaser from 'phaser';
import Player from '../objects/Player.js';
import {
  DancePerformance,
  FanServicePerformance,
  MCPerformance,
  SongPerformance,
} from '../objects/Performance.js';
import HeatSystem from '../systems/HeatSystem.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import LevelSystem from '../systems/LevelSystem.js';
import UpgradeSystem from '../systems/UpgradeSystem.js';
import StageDirector from '../systems/StageDirector.js';
import audioSystem from '../systems/AudioSystem.js';
import { buildRunModifiers } from '../systems/RunModifiers.js';
import HUD from '../ui/HUD.js';
import UpgradePanel from '../ui/UpgradePanel.js';
import {
  ANTI_CONFIG,
  AUDIENCE_CONFIG,
  COMBO_CONFIG,
  DEPTH,
  FRENZY_CONFIG,
  GAME,
  PLAYER_CONFIG,
  SCORE_CONFIG,
  SONG_CONFIG,
  UI_CONFIG,
} from '../constants.js';

/**
 * ライブ本編のシーン。
 * 100 秒間のライブを進行し、終了時に成績を ResultScene へ渡す。
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.createTextures();

    // 選択中のキャラクター・ステージ・永久強化から今回のラン設定を組み立てる
    this.mods = buildRunModifiers();
    this.cameras.main.setBackgroundColor(this.mods.stage.bgColor);

    // --- オブジェクト・システムの初期化 ---
    this.spawnSystem = new SpawnSystem(this);
    this.audiences = this.spawnSystem.spawnAudiences(
      this.mods.stage,
      this.mods.audienceInitialHeat,
    );
    this.antiGroup = this.spawnSystem.antiGroup;

    this.player = new Player(this, GAME.WIDTH / 2, GAME.HEIGHT / 2);
    this.player.setTint(this.mods.character.color);
    this.player.moveSpeed = this.mods.playerSpeed;

    this.heatSystem = new HeatSystem(this.audiences);
    this.levelSystem = new LevelSystem();

    // パフォーマンス。歌のみ最初から有効、他はレベルアップで取得
    this.song = new SongPerformance(
      this,
      this.player,
      this.heatSystem,
      this.antiGroup,
    );
    this.dance = new DancePerformance(this, this.player, this.heatSystem);
    this.fanService = new FanServicePerformance(
      this,
      this.player,
      this.heatSystem,
    );
    this.mc = new MCPerformance(this, this.player, this.heatSystem);
    this.song.heatGain = this.mods.songHeatGain;
    this.song.radius = this.mods.songRadius;
    this.song.start(SONG_CONFIG.INTERVAL_MS);

    this.upgradeSystem = new UpgradeSystem({
      player: this.player,
      song: this.song,
      dance: this.dance,
      fanService: this.fanService,
      mc: this.mc,
    });

    this.hud = new HUD(this);
    this.upgradePanel = new UpgradePanel(this);
    this.stageDirector = new StageDirector(this, this.audiences);

    // 熱狂時に弾けるパーティクル（Phaser のパーティクルは内部でプーリングされる）
    this.frenzySpark = this.add
      .particles(0, 0, 'spark', {
        speed: { min: 40, max: 100 },
        lifespan: 400,
        scale: { start: 1, end: 0 },
        tint: 0xffdd33,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.EFFECT);

    // BGM 開始（AudioContext はタイトル画面の操作で生成済み）
    audioSystem.unlock();
    audioSystem.startBgm();

    // --- 進行状態 ---
    this.remainingSec = GAME.LIVE_DURATION_SEC;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastFrenzyAt = 0;
    this.isLiveFinished = false;
    this.isPaused = false;
    /** 未消化のレベルアップ回数（連続レベルアップ時に順番に 3 択を出す） */
    this.pendingUpgrades = 0;

    // --- 衝突・イベント ---
    this.physics.add.overlap(this.player, this.antiGroup, (_player, anti) =>
      this.onAntiContact(anti),
    );
    this.heatSystem.on('frenzy', this.onFrenzy, this);
    this.levelSystem.on('levelup', this.onLevelUp, this);

    // --- タイマー ---
    // 1 秒ごと: 残り時間・熱狂の連鎖・コンボ途切れ判定・HUD 更新
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.onSecondTick,
      callbackScope: this,
    });
    // アンチのスポーン（初回は少し遅らせ、以後はステージに応じた間隔）
    this.time.delayedCall(ANTI_CONFIG.FIRST_SPAWN_MS, () => {
      this.spawnAntiWave();
      this.time.addEvent({
        delay: this.mods.antiSpawnIntervalMs,
        loop: true,
        callback: this.spawnAntiWave,
        callbackScope: this,
      });
    });

    this.updateHud();
  }

  /** プレイヤー・観客・アンチ用のテクスチャを動的生成する（画像アセット不使用） */
  createTextures() {
    this.createCircleTexture('audience', AUDIENCE_CONFIG.RADIUS);
    this.createCircleTexture('player', PLAYER_CONFIG.RADIUS);
    this.createCircleTexture('spark', 3);

    if (!this.textures.exists('anti')) {
      const graphics = this.make.graphics({ add: false });
      graphics.fillStyle(0xffffff);
      graphics.fillRect(0, 0, ANTI_CONFIG.SIZE, ANTI_CONFIG.SIZE);
      graphics.generateTexture('anti', ANTI_CONFIG.SIZE, ANTI_CONFIG.SIZE);
      graphics.destroy();
    }
  }

  /** 白い円のテクスチャを生成する（表示時に tint で着色する） */
  createCircleTexture(key, radius) {
    if (this.textures.exists(key)) {
      return;
    }
    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(radius, radius, radius);
    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
  }

  update(time) {
    if (this.isLiveFinished || this.isPaused) {
      return;
    }
    this.player.update();
    for (const anti of this.antiGroup.getMatching('active', true)) {
      anti.chase(this.player);
    }
    // 観客は Heat に応じて揺れ、熱狂するとジャンプする
    for (const audience of this.audiences) {
      audience.updateMotion(time);
    }
  }

  /** 経過時間に応じた数のアンチを画面外にスポーンさせる */
  spawnAntiWave() {
    const elapsedSec = GAME.LIVE_DURATION_SEC - this.remainingSec;
    const count = 1 + Math.floor(elapsedSec / ANTI_CONFIG.RAMP_EVERY_SEC);
    this.spawnSystem.spawnAntis(count);
  }

  /** アンチがプレイヤーに接触したときの処理 */
  onAntiContact(anti) {
    if (!anti.active) {
      return;
    }
    anti.despawn();
    this.heatSystem.applyHeatToAll(this.mods.antiHeatDrain);
    // 熱狂済みの観客も一部クールダウンさせる（積み上げた盛り上がりにも及ぶ罰則）
    const cooledCount = this.heatSystem.cooldownRandomFrenzy(
      ANTI_CONFIG.FRENZY_COOLDOWN_RATIO,
      ANTI_CONFIG.FRENZY_COOLDOWN_MIN_COUNT,
      ANTI_CONFIG.FRENZY_COOLDOWN_HEAT,
    );

    this.cameras.main.flash(200, 120, 0, 40);
    this.cameras.main.shake(150, 0.008);
    audioSystem.playAntiContact();
    if (cooledCount > 0) {
      this.showFloatingText(
        this.player.x,
        this.player.y - 40,
        `熱狂 ${cooledCount} 人が冷めた…`,
        '#ff6666',
      );
    }
    this.updateHud();
  }

  /** プレイヤー付近に短く浮かんで消えるテキストを表示する（演出用の汎用ヘルパー） */
  showFloatingText(x, y, message, color) {
    const text = this.add
      .text(x, y, message, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);

    this.tweens.add({
      targets: text,
      y: text.y - 24,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  /** 1 秒ごとの進行処理 */
  onSecondTick() {
    if (this.isLiveFinished) {
      return;
    }

    this.heatSystem.chainTick();
    this.stageDirector.tick(this.heatSystem.averageHeat);

    // 一定時間新しい熱狂がなければコンボが途切れる
    if (
      this.combo > 0 &&
      this.time.now - this.lastFrenzyAt > COMBO_CONFIG.TIMEOUT_MS
    ) {
      this.combo = 0;
    }

    this.remainingSec -= 1;
    this.updateHud();

    if (this.remainingSec <= 0) {
      this.endLive();
    }
  }

  /** 観客が熱狂したときの処理（経験値・コンボ・エフェクト） */
  onFrenzy(audience) {
    this.frenzySpark.explode(6, audience.x, audience.y);
    audioSystem.playFrenzy();

    this.levelSystem.gainExp(FRENZY_CONFIG.EXP_PER_FRENZY);

    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.lastFrenzyAt = this.time.now;

    this.updateHud();
  }

  /** レベルアップ時の処理。ゲームを停止して 3 択アップグレードを表示する */
  onLevelUp() {
    this.pendingUpgrades += 1;
    if (!this.upgradePanel.isOpen) {
      this.openUpgradeSelection();
    }
  }

  /** アップグレード選択を開く。連続レベルアップ時は選択後に続けて開く */
  openUpgradeSelection() {
    this.pauseGame();
    audioSystem.playLevelUp();
    this.upgradePanel.open(this.upgradeSystem.pickChoices(), (choice) => {
      audioSystem.playSelect();
      choice.apply();
      this.hud.setSkills(this.upgradeSystem.summary());
      this.pendingUpgrades -= 1;

      if (this.pendingUpgrades > 0) {
        this.openUpgradeSelection();
      } else {
        this.resumeGame();
      }
    });
  }

  /** ゲームの進行を止める（タイマー・物理・アニメーション） */
  pauseGame() {
    if (this.isPaused) {
      return;
    }
    this.isPaused = true;
    this.physics.pause();
    this.time.paused = true;
    this.tweens.pauseAll();
    this.player.setVelocity(0, 0);
    audioSystem.suspend();
  }

  /** ゲームの進行を再開する */
  resumeGame() {
    if (!this.isPaused) {
      return;
    }
    this.isPaused = false;
    this.physics.resume();
    this.time.paused = false;
    this.tweens.resumeAll();
    audioSystem.resume();
  }

  /** HUD の表示を最新の状態に更新する */
  updateHud() {
    this.hud.update({
      remainingSec: this.remainingSec,
      level: this.levelSystem.level,
      exp: this.levelSystem.exp,
      expToNext: this.levelSystem.expToNext,
      averageHeat: this.heatSystem.averageHeat,
      frenzyCount: this.heatSystem.frenzyCount,
      audienceCount: this.audiences.length,
      combo: this.combo,
    });
  }

  /** ライブ終了。成績を計算してリザルトへ遷移する */
  endLive() {
    this.isLiveFinished = true;
    this.player.setVelocity(0, 0);
    audioSystem.stopBgm();

    const averageHeat = this.heatSystem.averageHeat;
    const frenzyCount = this.heatSystem.frenzyCount;
    const score =
      Math.round(averageHeat * SCORE_CONFIG.AVG_HEAT_WEIGHT) +
      frenzyCount * SCORE_CONFIG.FRENZY_WEIGHT +
      this.maxCombo * SCORE_CONFIG.COMBO_WEIGHT;

    this.scene.start('ResultScene', {
      averageHeat,
      frenzyCount,
      audienceCount: this.audiences.length,
      maxCombo: this.maxCombo,
      score,
    });
  }
}
