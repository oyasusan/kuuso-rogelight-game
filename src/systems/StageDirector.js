import Phaser from 'phaser';
import { DEPTH, GAME, STAGE_CONFIG, UI_CONFIG } from '../constants.js';
import audioSystem from './AudioSystem.js';

/**
 * 会場演出を管理するシステム。
 * 平均 Heat に応じて演出段階（tier）を判定し、段階ごとの演出を出し分ける。
 *
 * tier0: 静か / tier1: 少し歓声 / tier2: サイリウム /
 * tier3: 紙吹雪 / tier4: レーザー・歓声最大
 *
 * 上位の段階は下位の演出を含む。平均 Heat が下がれば演出も収まる。
 */
export default class StageDirector {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../objects/Audience.js').default[]} audiences
   */
  constructor(scene, audiences) {
    this.scene = scene;
    this.audiences = audiences;
    this.tier = 0;

    /** 熱狂した観客 → サイリウムのスプライト */
    this.syliumByAudience = new Map();
    this.confetti = null;
    this.lasers = [];

    this.createTextures();
  }

  /** 演出用テクスチャを動的生成する */
  createTextures() {
    if (!this.scene.textures.exists('sylium')) {
      const graphics = this.scene.make.graphics({ add: false });
      graphics.fillStyle(0xffffff);
      graphics.fillRect(0, 0, 4, 16);
      graphics.generateTexture('sylium', 4, 16);
      graphics.destroy();
    }
    if (!this.scene.textures.exists('confetti')) {
      const graphics = this.scene.make.graphics({ add: false });
      graphics.fillStyle(0xffffff);
      graphics.fillRect(0, 0, 6, 6);
      graphics.generateTexture('confetti', 6, 6);
      graphics.destroy();
    }
  }

  /**
   * 演出の更新。1 秒に 1 回呼ぶ。
   * @param {number} averageHeat 会場の平均 Heat
   */
  tick(averageHeat) {
    const newTier = this.computeTier(averageHeat);
    if (newTier > this.tier) {
      this.announce(newTier);
    }
    if (newTier !== this.tier) {
      this.tier = newTier;
      audioSystem.setCheerTier(this.tier);
    }

    this.updateSylium();
    this.updateConfetti();
    this.updateLasers();
  }

  /** 平均 Heat から演出段階（0〜4）を求める */
  computeTier(averageHeat) {
    let tier = 0;
    for (const threshold of STAGE_CONFIG.TIER_THRESHOLDS) {
      if (averageHeat >= threshold) {
        tier += 1;
      }
    }
    return tier;
  }

  /** 段階が上がったことを画面中央に短く表示する */
  announce(tier) {
    const message = STAGE_CONFIG.TIER_ANNOUNCES[tier];
    if (!message) {
      return;
    }
    const text = this.scene.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 120, message, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '30px',
        color: UI_CONFIG.ACCENT_COLOR,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 1400,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  // ------------------------------------------------------------------
  // tier2: サイリウム
  // ------------------------------------------------------------------

  /** 熱狂した観客の頭上にサイリウムを振らせる */
  updateSylium() {
    const visible = this.tier >= 2;

    if (visible) {
      let count = this.syliumByAudience.size;
      for (const audience of this.audiences) {
        if (count >= STAGE_CONFIG.SYLIUM_MAX) {
          break;
        }
        if (!audience.isFrenzied || this.syliumByAudience.has(audience)) {
          continue;
        }
        this.syliumByAudience.set(audience, this.createSylium(audience));
        count += 1;
      }
    }

    for (const sylium of this.syliumByAudience.values()) {
      sylium.setVisible(visible);
    }
  }

  /** サイリウム 1 本を生成して振りアニメーションを付ける */
  createSylium(audience) {
    const color = Phaser.Utils.Array.GetRandom(STAGE_CONFIG.SYLIUM_COLORS);
    const sylium = this.scene.add
      .image(audience.x, audience.y - 6, 'sylium')
      .setOrigin(0.5, 1) // 根元を軸に振る
      .setTint(color)
      .setDepth(DEPTH.AUDIENCE + 1)
      .setAngle(-25);

    this.scene.tweens.add({
      targets: sylium,
      angle: 25,
      duration: Phaser.Math.Between(350, 600),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return sylium;
  }

  // ------------------------------------------------------------------
  // tier3: 紙吹雪
  // ------------------------------------------------------------------

  /** 画面上部から紙吹雪を降らせる */
  updateConfetti() {
    const active = this.tier >= 3;

    if (active && !this.confetti) {
      this.confetti = this.scene.add
        .particles(0, 0, 'confetti', {
          x: { min: 0, max: GAME.WIDTH },
          y: -10,
          lifespan: 4500,
          speedY: { min: 60, max: 140 },
          speedX: { min: -40, max: 40 },
          rotate: { start: 0, end: 360 },
          scale: { min: 0.6, max: 1 },
          quantity: 2,
          frequency: STAGE_CONFIG.CONFETTI_INTERVAL_MS,
          tint: STAGE_CONFIG.CONFETTI_COLORS,
        })
        .setDepth(DEPTH.EFFECT);
    }

    if (this.confetti) {
      if (active && !this.confetti.emitting) {
        this.confetti.start();
      } else if (!active && this.confetti.emitting) {
        this.confetti.stop();
      }
    }
  }

  // ------------------------------------------------------------------
  // tier4: レーザー
  // ------------------------------------------------------------------

  /** 画面上部から降り注ぐレーザーを揺らす */
  updateLasers() {
    const visible = this.tier >= 4;

    if (visible && this.lasers.length === 0) {
      for (let i = 0; i < STAGE_CONFIG.LASER_COUNT; i += 1) {
        const x = (GAME.WIDTH / (STAGE_CONFIG.LASER_COUNT + 1)) * (i + 1);
        const color = STAGE_CONFIG.LASER_COLORS[i % STAGE_CONFIG.LASER_COLORS.length];
        const laser = this.scene.add
          .rectangle(x, 0, 4, GAME.HEIGHT * 1.5, color, 0.35)
          .setOrigin(0.5, 0)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(DEPTH.EFFECT)
          .setAngle(-35);

        this.scene.tweens.add({
          targets: laser,
          angle: 35,
          duration: Phaser.Math.Between(900, 1500),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: i * 150,
        });
        this.lasers.push(laser);
      }
    }

    for (const laser of this.lasers) {
      laser.setVisible(visible);
    }
  }
}
