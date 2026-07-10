/**
 * セーブデータの管理システム。
 * ファン（永久強化の通貨）・永久強化ランク・選択中のキャラクター / ステージを
 * localStorage に永続化する。ブラウザをリロードしたり、GitHub Pages への
 * 再デプロイでゲームのコードが更新されたりしても、同一オリジン（例:
 * https://<user>.github.io/<repo>/）でアクセスし続ける限りこのデータは残る。
 *
 * localStorage が使えない環境（プライベートブラウジング、Cookie/ストレージを
 * 全ブロックする設定など）では isAvailable が false になり、メモリ上の
 * データだけで動作し続ける（永続化だけされない。HomeScene で警告表示する）。
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
  characterId: 'suzu',
  /** 選択中のステージ id */
  stageId: 'small',
};

/**
 * 初期値のコピーを作る。
 * オブジェクトのスプレッドは浅いコピーのため、permaRanks を明示的に複製しないと
 * 複数インスタンス間で DEFAULT_SAVE.permaRanks を直接共有・変更してしまう
 */
function cloneDefaultSave() {
  return { ...DEFAULT_SAVE, permaRanks: { ...DEFAULT_SAVE.permaRanks } };
}

class SaveSystem {
  constructor() {
    /** localStorage が実際に読み書きできるか（プライベートモード等では false になる） */
    this.isAvailable = this.checkAvailable();
    /** @type {typeof DEFAULT_SAVE} */
    this.data = this.load();
  }

  /** localStorage へ実際に書き込めるか確認する（例外を投げるだけで値は残さない） */
  checkAvailable() {
    const probeKey = `${STORAGE_KEY}-probe`;
    try {
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      return true;
    } catch {
      return false;
    }
  }

  /** localStorage から読み込む。壊れていたら初期値に戻す */
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneDefaultSave();
      }
      const parsed = JSON.parse(raw);
      // 将来キーが増えても初期値で補完されるようマージする
      return { ...cloneDefaultSave(), ...parsed, permaRanks: { ...parsed.permaRanks } };
    } catch {
      return cloneDefaultSave();
    }
  }

  /** 現在のデータを localStorage へ書き込む */
  persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      // 永続化できない環境ではメモリ上のデータだけで続行する
      console.warn(
        'セーブデータの保存に失敗しました（プライベートブラウジングやストレージ制限の可能性があります）',
        err,
      );
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

  /**
   * 永久強化の進行（所持ファン・全ランク）をリセットする。
   * キャラクター・ステージの解放も失われるため、選択中のものが解放前に
   * 戻せない状態にならないよう選択も初期値（すず / 小箱）に戻す
   */
  resetPermanent() {
    this.data.fans = 0;
    this.data.permaRanks = {};
    this.data.characterId = DEFAULT_SAVE.characterId;
    this.data.stageId = DEFAULT_SAVE.stageId;
    this.persist();
  }
}

/** シングルトン。各シーンから import して使う */
const saveSystem = new SaveSystem();
export default saveSystem;
