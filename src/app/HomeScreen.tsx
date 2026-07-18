import { useState } from "react";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  DownloadSimpleIcon,
  GuitarIcon,
  HardDrivesIcon,
  PlayIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import {
  ArtworkImage,
  Button,
  Dialog,
  Feedback,
  Panel,
  StatusBadge,
} from "../components";
import { resolvePublicPath } from "../config/runtime";
import { OPENING_ARTWORK } from "../data";
import type { ExportResult, SaveResult } from "../persistence";

interface HomeScreenProps {
  hasSave: boolean;
  isReady: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenRules: () => void;
  loadError: string | null;
  onExportSave: () => ExportResult;
  onImportSave: (text: string) => SaveResult;
  onClearSave: () => SaveResult;
}

export function HomeScreen({
  hasSave,
  isReady,
  onContinue,
  onNewGame,
  onOpenRules,
  loadError,
  onExportSave,
  onImportSave,
  onClearSave,
}: HomeScreenProps) {
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function requestNewGame() {
    if (hasSave) {
      setConfirmingNewGame(true);
      return;
    }
    onNewGame();
  }

  function exportSave() {
    const result = onExportSave();
    if (!result.ok) {
      setSaveMessage(result.error);
      return;
    }
    const blob = new Blob([result.text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "band-simulator-save.json";
    link.click();
    URL.revokeObjectURL(url);
    setSaveMessage("存档文件已经导出。");
  }

  async function importSave(file: File | undefined) {
    if (!file) return;
    const result = onImportSave(await file.text());
    setSaveMessage(result.ok ? "存档导入成功。" : result.error);
  }

  return (
    <main className="home-shell">
      <section className="home-hero" aria-labelledby="game-title">
        <div className="home-hero__copy">
          <ArtworkImage
            artwork={OPENING_ARTWORK.graduationNight}
            className="home-hero__art"
            decorative
            eager
          />
          <div className="home-kicker">
            <GuitarIcon size={18} weight="fill" aria-hidden="true" />
            <span>乐队后台工作站</span>
            <small>v1.0.0</small>
          </div>
          <h1 id="game-title">毕业以后，组一支不会轻易散场的乐队。</h1>
          <p>
            你是队长、吉他手兼主唱。从第一间排练室开始，用每月三个行动点写下二十年的乐队履历。
          </p>
          <div className="home-actions">
            <Button
              variant="primary"
              size="lg"
              icon={<PlayIcon size={19} weight="fill" aria-hidden="true" />}
              disabled={!hasSave || !isReady}
              onClick={onContinue}
            >
              继续游戏
            </Button>
            <Button
              size="lg"
              icon={<ArrowRightIcon size={19} weight="bold" aria-hidden="true" />}
              iconPosition="end"
              disabled={!isReady}
              onClick={requestNewGame}
            >
              新的乐队
            </Button>
            <Button
              variant="ghost"
              size="lg"
              icon={<BookOpenTextIcon size={19} aria-hidden="true" />}
              onClick={onOpenRules}
            >
              规则
            </Button>
          </div>
        </div>

        <Panel
          className="home-case"
          eyebrow="毕业当年"
          title="第一张排练清单"
          description="没有公司，没有资源。只有五个人、一万元公共资金和三点本月行动。"
          accent
        >
          <div className="home-case__status">
            <StatusBadge tone="accent">风格一局固定</StatusBadge>
            <StatusBadge tone="info">五人阵容固定</StatusBadge>
            <StatusBadge tone="warning">每月 3 AP</StatusBadge>
          </div>
          <ol className="home-setlist">
            <li>
              <span>01</span>
              <div>
                <strong>确定声音</strong>
                <small>流行、独立摇滚、朋克或金属</small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>邀请四名队友</strong>
                <small>旧友、现场认识的乐手与社交平台同好</small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>让乐队活下去</strong>
                <small>培养、专辑、演出、资金与归属感</small>
              </div>
            </li>
          </ol>
          <div className="home-save-state">
            <HardDrivesIcon size={20} aria-hidden="true" />
            <span>
              {hasSave
                ? "当前有一支乐队可以继续；手动保存后可在刷新页面后载入"
                : "当前没有可继续的乐队，新游戏将从毕业剧情开始"}
            </span>
          </div>
          {loadError && (
            <Feedback
              role="alert"
              tone="danger"
              title="存档需要处理"
              description={loadError}
            />
          )}
          <div className="home-save-tools">
            <Button
              size="sm"
              variant="secondary"
              icon={<DownloadSimpleIcon size={16} weight="bold" />}
              disabled={!hasSave}
              onClick={exportSave}
            >
              导出存档
            </Button>
            <label className="home-file-button">
              <UploadSimpleIcon size={16} weight="bold" aria-hidden="true" />
              导入存档
              <input
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  void importSave(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {(hasSave || loadError) && (
              <Button
                size="sm"
                variant="ghost"
                icon={<TrashIcon size={16} weight="bold" />}
                onClick={() => {
                  const result = onClearSave();
                  setSaveMessage(
                    result.ok ? "本地存档已经清除。" : result.error,
                  );
                }}
              >
                清除存档
              </Button>
            )}
          </div>
          {saveMessage && <p className="home-save-tools__message">{saveMessage}</p>}
          <p className="home-credits">
            角色手绘与摄影素材均已按许可使用。
            <a
              href={resolvePublicPath("/credits.html")}
              target="_blank"
              rel="noreferrer"
            >
              查看素材来源与许可
            </a>
          </p>
        </Panel>
      </section>

      <Dialog
        open={confirmingNewGame}
        onClose={() => setConfirmingNewGame(false)}
        title="覆盖当前存档？"
        description="开始新游戏后，旧乐队需要等到你手动保存时才会被新存档覆盖。"
        size="sm"
        footer={
          <>
            <Button onClick={() => setConfirmingNewGame(false)}>取消</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmingNewGame(false);
                onNewGame();
              }}
            >
              重新开始
            </Button>
          </>
        }
      >
        <p className="dialog-copy">
          重玩不会继承属性、成员或解锁内容。新的乐队将重新选择风格和全部成员。
        </p>
      </Dialog>
    </main>
  );
}
