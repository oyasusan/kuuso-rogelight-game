import saveSystem from './SaveSystem.js';
import {
  ANTI_CONFIG,
  AUDIENCE_CONFIG,
  CHARACTERS,
  PERMA_CONFIG,
  PLAYER_CONFIG,
  SONG_CONFIG,
  STAGES,
} from '../constants.js';

/**
 * セーブデータ（選択キャラクター・ステージ・永久強化）から、
 * 今回のラン 1 回分のパラメータを組み立てる。
 * GameScene の開始時に 1 度だけ呼ぶ。
 */
export function buildRunModifiers() {
  const { data } = saveSystem;
  const character =
    CHARACTERS.find((c) => c.id === data.characterId) ?? CHARACTERS[0];
  const stage = STAGES.find((s) => s.id === data.stageId) ?? STAGES[0];

  /** 永久強化の効果量（step × 取得ランク） */
  const permaBonus = (upgradeId) => {
    const definition = PERMA_CONFIG.UPGRADES.find((u) => u.id === upgradeId);
    return definition.step * saveSystem.getRank(upgradeId);
  };

  return {
    character,
    stage,
    /** 観客の初期 Heat */
    audienceInitialHeat:
      AUDIENCE_CONFIG.INITIAL_HEAT + permaBonus('initialHeat'),
    /** 歌の Heat 量（キャラクター倍率 → 永久強化の順に適用） */
    songHeatGain: Math.round(
      SONG_CONFIG.HEAT_GAIN * character.songHeatMult + permaBonus('songHeat'),
    ),
    /** 歌の半径 */
    songRadius: SONG_CONFIG.RADIUS * character.songRadiusMult,
    /** プレイヤーの移動速度 */
    playerSpeed:
      PLAYER_CONFIG.SPEED * character.speedMult * (1 + permaBonus('speed')),
    /** アンチ接触時の会場 Heat 減少量（緩和されても 0 より下がらない＝回復はしない） */
    antiHeatDrain: Math.min(0, ANTI_CONFIG.HEAT_DRAIN + permaBonus('antiResist')),
    /** アンチのスポーン間隔 */
    antiSpawnIntervalMs: Math.round(
      ANTI_CONFIG.SPAWN_INTERVAL_MS * stage.antiIntervalMult,
    ),
  };
}
