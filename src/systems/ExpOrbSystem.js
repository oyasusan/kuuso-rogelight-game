import Phaser from 'phaser';
import ExpOrb from '../objects/ExpOrb.js';
import { EXP_ORB_CONFIG } from '../constants.js';
import audioSystem from './AudioSystem.js';

/**
 * 経験値オーブの管理システム（ヴァンサバ風の落とし物・吸い取り仕様）。
 * アンチを倒すとオーブが落ち、プレイヤーが player.magnetRadius 以内に
 * 近づくと引き寄せられて自動回収される。吸収範囲はレベルアップ強化で拡大できる
 * （UpgradeSystem の 'magnet' を参照）。
 */
export default class ExpOrbSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../objects/Player.js').default} player
   * @param {import('./LevelSystem.js').default} levelSystem
   */
  constructor(scene, player, levelSystem) {
    this.scene = scene;
    this.player = player;
    this.levelSystem = levelSystem;

    /** オーブのオブジェクトプール */
    this.group = scene.physics.add.group({
      classType: ExpOrb,
      maxSize: EXP_ORB_CONFIG.POOL_SIZE,
      runChildUpdate: false,
    });
  }

  /**
   * 指定位置にオーブを 1 個出現させる。プールが満杯のときは何もしない
   * @param {number} x
   * @param {number} y
   * @param {number} value 回収時に得られる経験値
   */
  spawn(x, y, value) {
    const orb = this.group.get();
    if (!orb) {
      return;
    }
    orb.spawn(x, y, value);
  }

  /** 毎フレーム呼ぶ。吸引と回収の判定を行う */
  update() {
    const { x: px, y: py, magnetRadius } = this.player;
    for (const orb of this.group.getMatching('active', true)) {
      const dist = Phaser.Math.Distance.Between(orb.x, orb.y, px, py);
      if (dist <= EXP_ORB_CONFIG.PICKUP_DISTANCE) {
        this.collect(orb);
        continue;
      }
      if (dist <= magnetRadius) {
        this.scene.physics.moveToObject(orb, this.player, EXP_ORB_CONFIG.MAGNET_SPEED);
      } else if (orb.body) {
        orb.body.setVelocity(0, 0);
      }
    }
  }

  /** オーブを回収し、経験値を加算してプールへ戻す */
  collect(orb) {
    this.levelSystem.gainExp(orb.value);
    audioSystem.playExpPickup();
    orb.despawn();
  }
}
