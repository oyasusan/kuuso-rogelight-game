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
   * 熱狂状態の観客は変化しない（マイナスでも下がらない）。
   * @param {import('../objects/Audience.js').default} audience
   * @param {number} baseAmount 倍率適用前の Heat 量（負値で減少）
   */
  applyHeat(audience, baseAmount) {
    if (audience.isFrenzied) {
      return;
    }
    // MC の倍率は上昇にのみ適用する（マイナスまで増幅しない）
    const amount =
      baseAmount > 0 ? baseAmount * this.heatMultiplier : baseAmount;
    audience.heat = Phaser.Math.Clamp(
      audience.heat + amount,
      0,
      AUDIENCE_CONFIG.MAX_HEAT,
    );

    if (audience.heat >= AUDIENCE_CONFIG.MAX_HEAT) {
      this.forceFrenzy(audience);
    } else {
      audience.updateAppearance();
    }
  }

  /**
   * 観客を即座に熱狂状態にする（ファンサ、および Heat 最大到達時）。
   * @param {import('../objects/Audience.js').default} audience
   */
  forceFrenzy(audience) {
    if (audience.isFrenzied) {
      return;
    }
    audience.enterFrenzy();
    this.frenziedAudiences.push(audience);
    this.emit('frenzy', audience);
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
   * 指定座標から扇形範囲内のすべての観客へ Heat を与える。
   * ダンス（Phase2）から使用する。
   * @param {number} x 扇形の頂点 x
   * @param {number} y 扇形の頂点 y
   * @param {number} radius 扇形の半径
   * @param {number} facingAngle 扇形の中心方向（ラジアン）
   * @param {number} angleDeg 扇形の中心角（度）
   * @param {number} baseAmount 与える Heat 量
   */
  applyHeatInSector(x, y, radius, facingAngle, angleDeg, baseAmount) {
    const radiusSq = radius * radius;
    const halfAngle = Phaser.Math.DegToRad(angleDeg) / 2;
    for (const audience of this.audiences) {
      const distSq = Phaser.Math.Distance.BetweenPointsSquared(
        { x, y },
        audience,
      );
      if (distSq > radiusSq) {
        continue;
      }
      const toAudience = Phaser.Math.Angle.Between(x, y, audience.x, audience.y);
      const diff = Phaser.Math.Angle.Wrap(toAudience - facingAngle);
      if (Math.abs(diff) <= halfAngle) {
        this.applyHeat(audience, baseAmount);
      }
    }
  }

  /**
   * 最も近い熱狂していない観客を返す。ファンサの対象選択に使用する。
   * @returns {import('../objects/Audience.js').default | null}
   */
  findNearestCalmAudience(x, y) {
    let nearest = null;
    let nearestDistSq = Infinity;
    for (const audience of this.audiences) {
      if (audience.isFrenzied) {
        continue;
      }
      const distSq = Phaser.Math.Distance.BetweenPointsSquared(
        { x, y },
        audience,
      );
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = audience;
      }
    }
    return nearest;
  }

  /**
   * 熱狂の連鎖と自然減衰の処理。1 秒に 1 回呼ぶこと。
   * - 熱狂していない観客は毎秒冷めていく（盛り上げ続けないと維持できない）
   * - 熱狂状態の観客は周囲 CHAIN_RADIUS px 以内の観客へ Heat を与える
   */
  chainTick() {
    // 自然減衰（熱狂した観客は冷めない）
    for (const audience of this.audiences) {
      if (!audience.isFrenzied && audience.heat > 0) {
        this.applyHeat(audience, -AUDIENCE_CONFIG.HEAT_DECAY_PER_SEC);
      }
    }

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
