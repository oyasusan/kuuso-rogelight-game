import Phaser from 'phaser';
import Player from '../objects/Player.js';
import { SongPerformance } from '../objects/Performance.js';
import HeatSystem from '../systems/HeatSystem.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import LevelSystem from '../systems/LevelSystem.js';
import HUD from '../ui/HUD.js';
import {
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

    // --- オブジェクト・システムの初期化 ---
    this.spawnSystem = new SpawnSystem(this);
    this.audiences = this.spawnSystem.spawnAudiences();

    this.player = new Player(this, GAME.WIDTH / 2, GAME.HEIGHT / 2);

    this.heatSystem = new HeatSystem(this.audiences);
    this.levelSystem = new LevelSystem();
    this.song = new SongPerformance(this, this.player, this.heatSystem);
    this.hud = new HUD(this);

    // --- 進行状態 ---
    this.remainingSec = GAME.LIVE_DURATION_SEC;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastFrenzyAt = 0;
    this.isLiveFinished = false;

    // --- イベント購読 ---
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
    // 歌の自動発動
    this.time.addEvent({
      delay: SONG_CONFIG.INTERVAL_MS,
      loop: true,
      callback: () => this.song.execute(),
    });

    this.updateHud();
  }

  /** プレイヤー・観客用のテクスチャを動的生成する（画像アセット不使用） */
  createTextures() {
    this.createCircleTexture('audience', AUDIENCE_CONFIG.RADIUS);
    this.createCircleTexture('player', PLAYER_CONFIG.RADIUS);
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

  update() {
    if (this.isLiveFinished) {
      return;
    }
    this.player.update();
  }

  /** 1 秒ごとの進行処理 */
  onSecondTick() {
    if (this.isLiveFinished) {
      return;
    }

    this.heatSystem.chainTick();

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

  /** 観客が熱狂したときの処理（経験値・コンボ） */
  onFrenzy() {
    this.levelSystem.gainExp(FRENZY_CONFIG.EXP_PER_FRENZY);

    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.lastFrenzyAt = this.time.now;

    this.updateHud();
  }

  /**
   * レベルアップ時の処理。
   * Phase2 でゲームを一時停止して 3 択アップグレードを表示する。
   * Phase1 では通知テキストのみ。
   */
  onLevelUp(newLevel) {
    const text = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 80, `LEVEL UP! Lv${newLevel}`, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '36px',
        color: UI_CONFIG.ACCENT_COLOR,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);

    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
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
