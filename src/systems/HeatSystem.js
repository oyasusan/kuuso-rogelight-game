import Phaser from 'phaser';
import { AUDIENCE_CONFIG, FRENZY_CONFIG } from '../constants.js';

/**
 * 会場の熱量（Heat）を一元管理するシステム。
 *
 * - すべての Heat 増減はこのクラスを通す（MC の倍率などを一括適用するため）
 * - Heat が最大に達した観客を熱狂状態にし、'frenzy' イベントを発火する
 * - 熱狂した観客は毎秒、周囲の観客へ熱を伝播させる（chainTick）
 *
 * イベント:
 * - 'frenzy' (audience): 観客が新たに熱狂状態になった
 */
export default class HeatSystem extends Phaser.Events.EventEmitter {
  /**
   * @param {import('../objects/Audience.js').default[]} audiences
   */
  constructor(audiences) {
    super();
    this.audiences = audiences;

    /** Heat 上昇量の倍率。MC（Phase2）で 1.5 になる */
    this.heatMultiplier = 1;
    /** 熱狂状態の観客リスト（毎秒の連鎖処理用キャッシュ） */
    this.frenziedAudiences = [];
  }

  /**
   * 観客 1 人へ Heat を与える。
   * @param {import('../objects/Audience.js').default} audience
   * @param {number} baseAmount 倍率適用前の Heat 量
   */
  applyHeat(audience, baseAmount) {
    if (audience.isFrenzied) {
      return;
    }
    audience.heat = Phaser.Math.Clamp(
      audience.heat + baseAmount * this.heatMultiplier,
      0,
      AUDIENCE_CONFIG.MAX_HEAT,
    );

    if (audience.heat >= AUDIENCE_CONFIG.MAX_HEAT) {
      audience.enterFrenzy();
      this.frenziedAudiences.push(audience);
      this.emit('frenzy', audience);
    } else {
      audience.updateAppearance();
    }
  }

  /**
   * 指定座標を中心とする半径内のすべての観客へ Heat を与える。
   * 歌・ダンスなどのパフォーマンスから使用する。
   */
  applyHeatInRadius(x, y, radius, baseAmount) {
    const radiusSq = radius * radius;
    for (const audience of this.audiences) {
      const distSq = Phaser.Math.Distance.BetweenPointsSquared(
        { x, y },
        audience,
      );
      if (distSq <= radiusSq) {
        this.applyHeat(audience, baseAmount);
      }
    }
  }

  /**
   * 熱狂の連鎖処理。1 秒に 1 回呼ぶこと。
   * 熱狂状態の観客が周囲 CHAIN_RADIUS px 以内の観客へ Heat を与える。
   */
  chainTick() {
    // 処理中に新たな熱狂が発生しても同一 tick では伝播させない
    const sources = [...this.frenziedAudiences];
    for (const source of sources) {
      this.applyHeatInRadius(
        source.x,
        source.y,
        FRENZY_CONFIG.CHAIN_RADIUS,
        FRENZY_CONFIG.CHAIN_HEAT_PER_SEC,
      );
    }
  }

  /** 会場全体の Heat を減らす。アンチの妨害（Phase2）で使用する */
  applyHeatToAll(baseAmount) {
    for (const audience of this.audiences) {
      this.applyHeat(audience, baseAmount);
    }
  }

  /** 会場の平均 Heat（0〜100） */
  get averageHeat() {
    if (this.audiences.length === 0) {
      return 0;
    }
    const total = this.audiences.reduce((sum, a) => sum + a.heat, 0);
    return total / this.audiences.length;
  }

  /** 熱狂状態の観客数 */
  get frenzyCount() {
    return this.frenziedAudiences.length;
  }
}
