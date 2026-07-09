/**
 * セーブデータの管理システム。
 * ファン（永久強化の通貨）・永久強化ランク・選択中のキャラクター / ステージを
 * localStorage に永続化する。
 *
 * localStorage が使えない環境（プライベートモード等）でも
 * メモリ上のデータで動作し続ける（永続化だけされない）。
 *
 * モジュール末尾で生成するシングルトンを import して使う。
 */

const STORAGE_KEY = 'hundred-sec-idol-live-save-v1';

/** セーブデータの初期値 */
const DEFAULT_SAVE = {
  /** 所持ファン数（永久強化の通貨） */
  fans: 0,
  /** 永久強化の取得ランク（id → ランク） */
  permaRanks: {},
  /** 選択中のキャラクター id */
  characterId: 'aika',
  /** 選択中のステージ id */
  stageId: 'hall',
};

class SaveSystem {
  constructor() {
    /** @type {typeof DEFAULT_SAVE} */
    this.data = this.load();
  }

  /** localStorage から読み込む。壊れていたら初期値に戻す */
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE };
      }
      const parsed = JSON.parse(raw);
      // 将来キーが増えても初期値で補完されるようマージする
      return { ...DEFAULT_SAVE, ...parsed };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  /** 現在のデータを localStorage へ書き込む */
  persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // 永続化できない環境ではメモリ上のデータだけで続行する
    }
  }

  /** 永久強化のランクを取得する */
  getRank(upgradeId) {
    return this.data.permaRanks[upgradeId] ?? 0;
  }

  /** 永久強化のランクを 1 上げて保存する */
  addRank(upgradeId) {
    this.data.permaRanks[upgradeId] = this.getRank(upgradeId) + 1;
    this.persist();
  }

  /** ファンを増減して保存する */
  addFans(amount) {
    this.data.fans += amount;
    this.persist();
  }
}

/** シングルトン。各シーンから import して使う */
const saveSystem = new SaveSystem();
export default saveSystem;
