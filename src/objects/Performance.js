import Phaser from 'phaser';
import {
  DANCE_CONFIG,
  DEPTH,
  FANSERVICE_CONFIG,
  GAME,
  MC_CONFIG,
  SONG_CONFIG,
  UI_CONFIG,
} from '../constants.js';
import { NoteEffectPool } from './NoteEffect.js';

/**
 * パフォーマンスの基底クラス。
 * 攻撃ボタンは存在せず、各パフォーマンスはタイマーで自動発動する。
 * 歌は最初から有効。ダンス・ファンサ・MC はレベルアップで取得（activate）する。
 */
export class Performance {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./Player.js').default} player
   * @param {import('../systems/HeatSystem.js').default} heatSystem
   */
  constructor(scene, player, heatSystem) {
    this.scene = scene;
    this.player = player;
    this.heatSystem = heatSystem;
    /** 自動発動タイマー */
    this.timer = null;
    /** 取得済みかどうか */
    this.isActive = false;
  }

  /**
   * 自動発動を開始する。すでに動いている場合は間隔を更新して再スタートする。
   * @param {number} intervalMs 発動間隔（ミリ秒）
   */
  start(intervalMs) {
    if (this.timer) {
      this.timer.remove();
    }
    this.isActive = true;
    this.timer = this.scene.time.addEvent({
      delay: intervalMs,
      loop: true,
      callback: () => this.execute(),
    });
  }

  /** パフォーマンスを発動する。サブクラスで実装する */
  execute() {
    throw new Error('Performance.execute() はサブクラスで実装してください');
  }
}

/**
 * 通常パフォーマンス「歌」。
 * 一定間隔で自動発動し、半径内の観客の Heat を上げ、アンチにダメージを与える。
 */
export class SongPerformance extends Performance {
  /**
   * @param {Phaser.Physics.Arcade.Group} antiGroup ダメージ対象のアンチのプール
   */
  constructor(scene, player, heatSystem, antiGroup) {
    super(scene, player, heatSystem);
    this.antiGroup = antiGroup;

    /** 効果半径（レベルアップ強化で変更される） */
    this.radius = SONG_CONFIG.RADIUS;
    /** 与える Heat 量 */
    this.heatGain = SONG_CONFIG.HEAT_GAIN;
    /** アンチへ与えるダメージ */
    this.damage = SONG_CONFIG.DAMAGE;

    this.notePool = new NoteEffectPool(scene);

    // 効果範囲を示すリング。歌うたびに広がって消える（使い回し）
    this.ring = scene.add
      .circle(0, 0, this.radius)
      .setStrokeStyle(2, 0xff99cc)
      .setDepth(DEPTH.EFFECT)
      .setVisible(false);
  }

  /** 歌を発動し、半径内の観客の Heat を上げ、アンチへダメージを与える */
  execute() {
    const { x, y } = this.player;
    this.heatSystem.applyHeatInRadius(x, y, this.radius, this.heatGain);
    this.damageAntis(x, y);
    this.playEffect(x, y);
  }

  /** 半径内のアンチへダメージを与える */
  damageAntis(x, y) {
    const radiusSq = this.radius * this.radius;
    for (const anti of this.antiGroup.getMatching('active', true)) {
      const distSq = Phaser.Math.Distance.BetweenPointsSquared({ x, y }, anti);
      if (distSq <= radiusSq) {
        anti.takeDamage(this.damage);
      }
    }
  }

  /** リングと音符のエフェクトを再生する */
  playEffect(x, y) {
    this.ring.setRadius(this.radius);
    this.ring.setPosition(x, y);
    this.ring.setScale(0.3);
    this.ring.setAlpha(1);
    this.ring.setVisible(true);
    this.scene.tweens.add({
      targets: this.ring,
      scale: 1,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => this.ring.setVisible(false),
    });

    for (let i = 0; i < SONG_CONFIG.NOTES_PER_CAST; i += 1) {
      const offsetX = Phaser.Math.Between(-30, 30);
      const offsetY = Phaser.Math.Between(-30, 10);
      this.notePool.spawn(x + offsetX, y - 20 + offsetY);
    }
  }
}

/**
 * パフォーマンス「ダンス」（レベルアップで取得）。
 * プレイヤーの向いている方向の扇形範囲の観客の Heat を上げる。
 */
export class DancePerformance extends Performance {
  constructor(scene, player, heatSystem) {
    super(scene, player, heatSystem);

    /** 扇形の半径（レベルアップ強化で変更される） */
    this.radius = DANCE_CONFIG.RADIUS;
    /** 与える Heat 量 */
    this.heatGain = DANCE_CONFIG.HEAT_GAIN;

    // 扇形の可視化用（使い回し）
    this.graphics = scene.add.graphics().setDepth(DEPTH.EFFECT);
  }

  /** 取得時に呼ぶ。自動発動を開始する */
  activate() {
    this.start(DANCE_CONFIG.INTERVAL_MS);
  }

  /** プレイヤーの向きへ扇形の Heat 付与を行う */
  execute() {
    const { x, y, facingAngle } = this.player;
    this.heatSystem.applyHeatInSector(
      x,
      y,
      this.radius,
      facingAngle,
      DANCE_CONFIG.ANGLE_DEG,
      this.heatGain,
    );
    this.playEffect(x, y, facingAngle);
  }

  /** 扇形を一瞬表示して消す */
  playEffect(x, y, facingAngle) {
    const halfAngle = Phaser.Math.DegToRad(DANCE_CONFIG.ANGLE_DEG) / 2;
    this.graphics.clear();
    this.graphics.fillStyle(0xff77cc, 0.3);
    this.graphics.slice(
      x,
      y,
      this.radius,
      facingAngle - halfAngle,
      facingAngle + halfAngle,
      false,
    );
    this.graphics.fillPath();
    this.graphics.setAlpha(1);

    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
    });
  }
}

/**
 * パフォーマンス「ファンサ」（レベルアップで取得）。
 * クールタイムごとに、最も近い熱狂していない観客を即座に熱狂状態にする。
 */
export class FanServicePerformance extends Performance {
  constructor(scene, player, heatSystem) {
    super(scene, player, heatSystem);

    /** クールタイム（レベルアップ強化で短縮される） */
    this.cooldownMs = FANSERVICE_CONFIG.COOLDOWN_MS;
  }

  /** 取得時に呼ぶ。自動発動を開始する */
  activate() {
    this.start(this.cooldownMs);
  }

  /** クールタイムを短縮し、タイマーを再スタートする */
  reduceCooldown(stepMs) {
    this.cooldownMs = Math.max(
      FANSERVICE_CONFIG.MIN_COOLDOWN_MS,
      this.cooldownMs - stepMs,
    );
    this.start(this.cooldownMs);
  }

  /** 最も近い観客を熱狂状態にする */
  execute() {
    const target = this.heatSystem.findNearestCalmAudience(
      this.player.x,
      this.player.y,
    );
    if (!target) {
      return; // 全員熱狂済み
    }
    this.heatSystem.forceFrenzy(target);
    this.playEffect(target);
  }

  /** ハートが対象へ弾むエフェクト */
  playEffect(target) {
    const heart = this.scene.add
      .text(this.player.x, this.player.y - 20, '♥', {
        fontSize: '24px',
        color: '#ff5599',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.EFFECT);

    this.scene.tweens.add({
      targets: heart,
      x: target.x,
      y: target.y - 10,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: heart,
          scale: 1.8,
          alpha: 0,
          duration: 300,
          onComplete: () => heart.destroy(),
        });
      },
    });
  }
}

/**
 * パフォーマンス「MC」（レベルアップで取得）。
 * 一定間隔で発動し、効果時間中はすべての Heat 上昇量を 1.5 倍にする。
 */
export class MCPerformance extends Performance {
  constructor(scene, player, heatSystem) {
    super(scene, player, heatSystem);

    /** 効果時間（レベルアップ強化で延長される） */
    this.durationMs = MC_CONFIG.DURATION_MS;
    /** 効果中かどうか */
    this.isRunning = false;

    this.indicator = scene.add
      .text(GAME.WIDTH / 2, 72, `MC TIME! Heat×${MC_CONFIG.MULTIPLIER}`, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '22px',
        color: UI_CONFIG.ACCENT_COLOR,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI)
      .setVisible(false);
  }

  /** 取得時に呼ぶ。即座に 1 回発動し、以後は一定間隔で自動発動する */
  activate() {
    this.start(MC_CONFIG.INTERVAL_MS);
    this.execute();
  }

  /** MC を開始し、効果時間後に元へ戻す */
  execute() {
    if (this.isRunning) {
      return; // 効果時間が発動間隔を超えた場合の重複防止
    }
    this.isRunning = true;
    this.heatSystem.heatMultiplier = MC_CONFIG.MULTIPLIER;
    this.indicator.setVisible(true);

    this.scene.time.delayedCall(this.durationMs, () => {
      this.isRunning = false;
      this.heatSystem.heatMultiplier = 1;
      this.indicator.setVisible(false);
    });
  }
}
