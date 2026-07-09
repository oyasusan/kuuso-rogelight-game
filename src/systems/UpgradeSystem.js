import Phaser from 'phaser';
import { FANSERVICE_CONFIG, UPGRADE_CONFIG } from '../constants.js';

/**
 * レベルアップ時のアップグレード（3 択）を管理するシステム。
 * 選択肢の抽選と適用、取得状況（ランク）の記録を行う。
 */
export default class UpgradeSystem {
  /**
   * @param {object} context アップグレードの適用対象
   * @param {import('../objects/Player.js').default} context.player
   * @param {import('../objects/Performance.js').SongPerformance} context.song
   * @param {import('../objects/Performance.js').DancePerformance} context.dance
   * @param {import('../objects/Performance.js').FanServicePerformance} context.fanService
   * @param {import('../objects/Performance.js').MCPerformance} context.mc
   */
  constructor(context) {
    this.context = context;

    /** 各アップグレードの取得回数 */
    this.ranks = {
      song: 0,
      dance: 0,
      fanService: 0,
      mc: 0,
      range: 0,
      speed: 0,
    };
  }

  /**
   * 現在の状態に応じたアップグレード定義一覧を返す。
   * label / description は取得状況によって変化する。
   */
  buildDefinitions() {
    const { player, song, dance, fanService, mc } = this.context;

    return [
      {
        id: 'song',
        label: '歌強化',
        description: `歌のHeat +${UPGRADE_CONFIG.SONG_HEAT_BONUS}、アンチへのダメージ +${UPGRADE_CONFIG.SONG_DAMAGE_BONUS}`,
        isAvailable: () => true,
        apply: () => {
          song.heatGain += UPGRADE_CONFIG.SONG_HEAT_BONUS;
          song.damage += UPGRADE_CONFIG.SONG_DAMAGE_BONUS;
          this.ranks.song += 1;
        },
      },
      {
        id: 'dance',
        label: dance.isActive ? 'ダンス強化' : 'ダンス取得',
        description: dance.isActive
          ? `ダンスのHeat +${UPGRADE_CONFIG.DANCE_HEAT_BONUS}`
          : '前方の扇形範囲の観客のHeatを上げるパフォーマンスを取得',
        isAvailable: () => true,
        apply: () => {
          if (dance.isActive) {
            dance.heatGain += UPGRADE_CONFIG.DANCE_HEAT_BONUS;
          } else {
            dance.activate();
          }
          this.ranks.dance += 1;
        },
      },
      {
        id: 'fanService',
        label: fanService.isActive ? 'ファンサ強化' : 'ファンサ取得',
        description: fanService.isActive
          ? `クールタイム -${UPGRADE_CONFIG.FANS_COOLDOWN_STEP_MS / 1000} 秒`
          : '最も近い観客を即座に熱狂させるパフォーマンスを取得（クールタイム5秒）',
        // クールタイムが下限に達したらこれ以上強化できない
        isAvailable: () =>
          !fanService.isActive ||
          fanService.cooldownMs > FANSERVICE_CONFIG.MIN_COOLDOWN_MS,
        apply: () => {
          if (fanService.isActive) {
            fanService.reduceCooldown(UPGRADE_CONFIG.FANS_COOLDOWN_STEP_MS);
          } else {
            fanService.activate();
          }
          this.ranks.fanService += 1;
        },
      },
      {
        id: 'mc',
        label: mc.isActive ? 'MC強化' : 'MC追加',
        description: mc.isActive
          ? `MCの効果時間 +${UPGRADE_CONFIG.MC_DURATION_BONUS_MS / 1000} 秒`
          : '10秒間すべてのHeat上昇量を1.5倍にするパフォーマンスを取得',
        isAvailable: () => true,
        apply: () => {
          if (mc.isActive) {
            mc.durationMs += UPGRADE_CONFIG.MC_DURATION_BONUS_MS;
          } else {
            mc.activate();
          }
          this.ranks.mc += 1;
        },
      },
      {
        id: 'range',
        label: 'パフォーマンス範囲UP',
        description: '歌とダンスの効果範囲を 15% 拡大',
        isAvailable: () => true,
        apply: () => {
          song.radius *= UPGRADE_CONFIG.RANGE_MULTIPLIER;
          dance.radius *= UPGRADE_CONFIG.RANGE_MULTIPLIER;
          this.ranks.range += 1;
        },
      },
      {
        id: 'speed',
        label: '移動速度UP',
        description: '移動速度を 12% 上昇',
        isAvailable: () => true,
        apply: () => {
          player.moveSpeed *= UPGRADE_CONFIG.SPEED_MULTIPLIER;
          this.ranks.speed += 1;
        },
      },
    ];
  }

  /**
   * 取得可能なアップグレードからランダムに 3 つ抽選する。
   * @returns {Array<{id: string, label: string, description: string, apply: Function}>}
   */
  pickChoices() {
    const pool = this.buildDefinitions().filter((def) => def.isAvailable());
    Phaser.Utils.Array.Shuffle(pool);
    return pool.slice(0, UPGRADE_CONFIG.CHOICES);
  }

  /** HUD 表示用の取得状況サマリー（例: 歌Lv2 / ダンスLv1） */
  summary() {
    const names = {
      song: '歌',
      dance: 'ダンス',
      fanService: 'ファンサ',
      mc: 'MC',
      range: '範囲',
      speed: '速度',
    };
    const parts = Object.entries(this.ranks)
      .filter(([, rank]) => rank > 0)
      .map(([id, rank]) => `${names[id]}Lv${rank}`);
    return parts.join(' / ');
  }
}
