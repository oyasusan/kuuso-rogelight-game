import Phaser from 'phaser';
import { LEVEL_CONFIG } from '../constants.js';

/**
 * 経験値とレベルを管理するシステム。
 * 観客が熱狂すると経験値を獲得し、一定値でレベルアップする。
 *
 * イベント:
 * - 'levelup' (newLevel): レベルが上がった（Phase2 でアップグレード 3 択を開く）
 *
 * Phase1 ではレベルアップ時の強化選択は未実装（通知のみ）。
 */
export default class LevelSystem extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.level = 1;
    /** 現在レベル内での経験値 */
    this.exp = 0;
    /** 次のレベルまでに必要な経験値 */
    this.expToNext = LEVEL_CONFIG.BASE_EXP;
  }

  /** 経験値を加算し、必要値に達したらレベルアップする */
  gainExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level += 1;
      this.expToNext = Math.round(this.expToNext * LEVEL_CONFIG.EXP_GROWTH);
      this.emit('levelup', this.level);
    }
  }
}
