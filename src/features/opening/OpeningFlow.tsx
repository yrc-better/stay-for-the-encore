import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  GraduationCapIcon,
  GuitarIcon,
  UsersThreeIcon,
  VinylRecordIcon,
} from "@phosphor-icons/react";
import {
  AttributeMeter,
  ArtworkImage,
  Button,
  Panel,
  StatusBadge,
} from "../../components";
import { PLAYER_AVATARS } from "../../data/avatars";
import {
  CANDIDATES,
  CANDIDATES_BY_ROLE,
  RECRUITABLE_ROLE_LABELS,
} from "../../data/candidates";
import { GENRES as GENRE_CONTENT } from "../../data/genres";
import {
  GENRE_ARTWORK,
  OPENING_ARTWORK,
  portraitArtwork,
} from "../../data/artwork";
import { NAME_SUGGESTIONS } from "../../data/nameSuggestions";
import type {
  CandidateContent,
  PortraitResource,
  RecruitableRole,
} from "../../data/types";
import type {
  Genre,
  MemberSeed,
  NewGameInput,
} from "../../domain";
import "./opening.css";

const RECRUITMENT_ORDER = [
  "leadGuitar",
  "bass",
  "drums",
  "keyboard",
] as const satisfies readonly RecruitableRole[];

const ALL_CANDIDATES: readonly CandidateContent[] = CANDIDATES;

const OPENING_STEPS = [
  { id: "identity", shortLabel: "毕业", label: "毕业之后" },
  { id: "genre", shortLabel: "风格", label: "确定风格" },
  { id: "leadGuitar", shortLabel: "主音", label: "邀请主音吉他" },
  { id: "bass", shortLabel: "贝斯", label: "邀请贝斯手" },
  { id: "drums", shortLabel: "鼓手", label: "邀请鼓手" },
  { id: "keyboard", shortLabel: "键盘", label: "邀请键盘手" },
  { id: "naming", shortLabel: "命名", label: "给乐队命名" },
  { id: "confirmation", shortLabel: "确认", label: "第一次合影" },
] as const;

export type OpeningStepId = (typeof OPENING_STEPS)[number]["id"];

export interface OpeningFlowInitialState {
  step?: OpeningStepId;
  protagonistName?: string;
  protagonistAvatarId?: string;
  genre?: Genre;
  selectedMemberIds?: Partial<Record<RecruitableRole, string>>;
  bandName?: string;
}

export interface OpeningFlowProps {
  onComplete: (input: NewGameInput) => void;
  onCancel?: () => void;
  initialState?: OpeningFlowInitialState;
  className?: string;
}

type OpeningPortraitStyle = CSSProperties & {
  "--opening-portrait-background": string;
  "--opening-portrait-foreground": string;
};

const MEMBER_STAT_LABELS = {
  professional: "专业",
  creation: "创作",
  performance: "表现",
  heat: "热度",
  belonging: "归属感",
} as const;

function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

function getInitialStepIndex(step?: OpeningStepId): number {
  if (!step) {
    return 0;
  }

  const index = OPENING_STEPS.findIndex((item) => item.id === step);
  return index >= 0 ? index : 0;
}

function getInitialAvatarId(avatarId?: string): string {
  return PLAYER_AVATARS.some((avatar) => avatar.id === avatarId)
    ? (avatarId as string)
    : PLAYER_AVATARS[0].id;
}

function getInitialMemberSelections(
  initialSelections?: Partial<Record<RecruitableRole, string>>,
): Partial<Record<RecruitableRole, string>> {
  if (!initialSelections) {
    return {};
  }

  return RECRUITMENT_ORDER.reduce<
    Partial<Record<RecruitableRole, string>>
  >((validSelections, role) => {
    const candidateId = initialSelections[role];
    const isValid = CANDIDATES_BY_ROLE[role].some(
      (candidate) => candidate.id === candidateId,
    );

    if (candidateId && isValid) {
      validSelections[role] = candidateId;
    }

    return validSelections;
  }, {});
}

function candidateToMemberSeed(candidate: CandidateContent): MemberSeed {
  return {
    id: candidate.id,
    name: candidate.name,
    age: candidate.age,
    role: candidate.role,
    avatarId: candidate.id,
    biography: candidate.biography,
    quote: candidate.quote,
    traits: candidate.tags.map((tag) => tag.label),
    stats: {
      professional: candidate.stats.professional,
      creativity: candidate.stats.creation,
      performance: candidate.stats.performance,
      popularity: candidate.stats.heat,
      belonging: candidate.stats.belonging,
    },
  };
}

function OpeningPortrait({
  portrait,
  name,
  size = "regular",
  decorative = false,
}: {
  portrait: PortraitResource;
  name: string;
  size?: "compact" | "regular" | "large";
  decorative?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const artwork = portraitArtwork(
    portrait,
    size === "large"
      ? "(max-width: 720px) 34vw, 180px"
      : "(max-width: 720px) 44vw, 120px",
  );
  const style: OpeningPortraitStyle = {
    "--opening-portrait-background": portrait.placeholder.background,
    "--opening-portrait-foreground": portrait.placeholder.foreground,
  };

  useEffect(() => {
    setImageFailed(false);
  }, [portrait.futureAssetPath]);

  const hasImage = portrait.available && !imageFailed;

  return (
    <span
      className="opening-portrait"
      data-size={size}
      style={style}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : portrait.alt}
    >
      {hasImage ? (
        <img
          src={artwork.src}
          srcSet={artwork.srcSet}
          sizes={artwork.sizes}
          width={artwork.width}
          height={artwork.height}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: artwork.focalPoint }}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <span className="opening-portrait__light" aria-hidden="true" />
          <span className="opening-portrait__monogram" aria-hidden="true">
            {portrait.placeholder.monogram}
          </span>
          <span className="opening-portrait__name" aria-hidden="true">
            {name}
          </span>
        </>
      )}
    </span>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      className="opening-selection-mark"
      data-selected={selected}
      aria-hidden="true"
    >
      {selected && <CheckIcon size={15} weight="bold" />}
    </span>
  );
}

function StepMessage({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="opening-message">
      <span className="opening-message__icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="opening-message__title">{title}</p>
        <p className="opening-message__copy">{children}</p>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: CandidateContent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="opening-candidate"
      data-selected={selected}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="opening-candidate__top">
        <OpeningPortrait
          portrait={candidate.portrait}
          name={candidate.name}
          size="large"
          decorative
        />
        <SelectionMark selected={selected} />
      </div>

      <div className="opening-candidate__identity">
        <div>
          <h3>{candidate.name}</h3>
          <span>{candidate.age} 岁</span>
        </div>
        <div className="opening-candidate__tags" aria-label="性格标签">
          {candidate.tags.map((tag) => (
            <StatusBadge key={tag.id} showIcon={false}>
              {tag.label}
            </StatusBadge>
          ))}
        </div>
      </div>

      <p className="opening-candidate__biography">{candidate.biography}</p>
      <blockquote className="opening-candidate__quote">
        “{candidate.quote}”
      </blockquote>

      <div className="opening-candidate__stats" aria-label={`${candidate.name}的属性`}>
        {Object.entries(MEMBER_STAT_LABELS).map(([key, label]) => (
          <AttributeMeter
            key={key}
            label={label}
            value={candidate.stats[key as keyof typeof candidate.stats]}
            size="compact"
          />
        ))}
      </div>
    </button>
  );
}

export function OpeningFlow({
  onComplete,
  onCancel,
  initialState,
  className,
}: OpeningFlowProps) {
  const [stepIndex, setStepIndex] = useState(() =>
    getInitialStepIndex(initialState?.step),
  );
  const [protagonistName, setProtagonistName] = useState(
    initialState?.protagonistName ?? "",
  );
  const [protagonistAvatarId, setProtagonistAvatarId] = useState(
    getInitialAvatarId(initialState?.protagonistAvatarId),
  );
  const [genre, setGenre] = useState<Genre | null>(
    initialState?.genre ?? null,
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<
    Partial<Record<RecruitableRole, string>>
  >(() => getInitialMemberSelections(initialState?.selectedMemberIds));
  const [bandName, setBandName] = useState(initialState?.bandName ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  const currentStep = OPENING_STEPS[stepIndex];
  const selectedAvatar =
    PLAYER_AVATARS.find((avatar) => avatar.id === protagonistAvatarId) ??
    PLAYER_AVATARS[0];
  const selectedGenre = GENRE_CONTENT.find((item) => item.id === genre) ?? null;
  const currentRecruitmentRole = RECRUITMENT_ORDER.find(
    (role) => role === currentStep.id,
  );
  const selectedCandidates = useMemo(
    () =>
      RECRUITMENT_ORDER.map((role) =>
        ALL_CANDIDATES.find(
          (candidate) => candidate.id === selectedMemberIds[role],
        ),
      ).filter((candidate): candidate is CandidateContent => Boolean(candidate)),
    [selectedMemberIds],
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  function validateCurrentStep(): string | null {
    if (currentStep.id === "identity") {
      const normalizedName = protagonistName.trim();
      if (!normalizedName) {
        return "请先写下主角的名字。";
      }
      if (normalizedName.length > 16) {
        return "主角姓名最多 16 个字符。";
      }
      if (!PLAYER_AVATARS.some((avatar) => avatar.id === protagonistAvatarId)) {
        return "请选择一个主角头像。";
      }
    }

    if (currentStep.id === "genre" && !genre) {
      return "请选择本局始终坚持的音乐风格。";
    }

    if (
      currentRecruitmentRole &&
      !selectedMemberIds[currentRecruitmentRole]
    ) {
      return `请选择一名${RECRUITABLE_ROLE_LABELS[currentRecruitmentRole]}。`;
    }

    if (currentStep.id === "naming") {
      const normalizedBandName = bandName.trim();
      if (!normalizedBandName) {
        return "请给乐队取一个名字。";
      }
      if (normalizedBandName.length > 24) {
        return "乐队名称最多 24 个字符。";
      }
    }

    return null;
  }

  function goForward() {
    const message = validateCurrentStep();
    if (message) {
      setValidationMessage(message);
      return;
    }

    setValidationMessage(null);
    setStepIndex((current) =>
      Math.min(current + 1, OPENING_STEPS.length - 1),
    );
  }

  function goBack() {
    setValidationMessage(null);
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function completeOpening() {
    const normalizedName = protagonistName.trim();
    const normalizedBandName = bandName.trim();
    const allMembersSelected = selectedCandidates.length === 4;

    if (
      !normalizedName ||
      !normalizedBandName ||
      !genre ||
      !allMembersSelected
    ) {
      setValidationMessage("开局信息还不完整，请返回检查姓名、风格和成员。");
      return;
    }

    onComplete({
      bandName: normalizedBandName,
      genre,
      protagonist: {
        name: normalizedName,
        avatarId: protagonistAvatarId,
      },
      selectedMembers: selectedCandidates.map(candidateToMemberSeed),
    });
  }

  function selectCandidate(role: RecruitableRole, candidateId: string) {
    setSelectedMemberIds((current) => ({
      ...current,
      [role]: candidateId,
    }));
    setValidationMessage(null);
  }

  let content: ReactNode;

  if (currentStep.id === "identity") {
    content = (
      <div className="opening-identity">
        <section className="opening-identity__story">
          <ArtworkImage
            artwork={OPENING_ARTWORK.graduationNight}
            className="opening-story-art"
            eager
          />
          <div className="opening-identity__story-icon" aria-hidden="true">
            <GraduationCapIcon size={35} weight="duotone" />
          </div>
          <p className="opening-kicker">毕业那天</p>
          <h2>散场以后，你决定再组一次乐队。</h2>
          <p>
            你刚从一所普通一本大学毕业。过去几年，你一直待在吉他社，
            也在那里学会了弹琴、写歌，以及怎样在台下只剩几个人时继续唱完。
          </p>
          <p>
            工作、房租和未来都还没有答案。唯一确定的是，你想以队长、
            吉他手兼主唱的身份，把这件事认真做下去。
          </p>
        </section>

        <section className="opening-identity__form" aria-label="设置主角">
          <div className="opening-field">
            <label htmlFor="opening-protagonist-name">你的名字</label>
            <input
              id="opening-protagonist-name"
              value={protagonistName}
              maxLength={16}
              autoComplete="off"
              placeholder="输入姓名或昵称"
              onChange={(event) => {
                setProtagonistName(event.target.value);
                setValidationMessage(null);
              }}
            />
            <p className="opening-field__helper">
              这个名字会出现在成员对话、演出海报和乐队履历中。
            </p>
          </div>

          <fieldset className="opening-avatar-fieldset">
            <legend>选择主角头像</legend>
            <div className="opening-avatar-grid">
              {PLAYER_AVATARS.map((avatar) => {
                const selected = avatar.id === protagonistAvatarId;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    className="opening-avatar-option"
                    data-selected={selected}
                    aria-pressed={selected}
                    onClick={() => {
                      setProtagonistAvatarId(avatar.id);
                      setValidationMessage(null);
                    }}
                  >
                    <OpeningPortrait
                      portrait={avatar.portrait}
                      name={avatar.label}
                      decorative
                    />
                    <span className="opening-avatar-option__copy">
                      <strong>{avatar.label}</strong>
                      <span>{avatar.description}</span>
                    </span>
                    <SelectionMark selected={selected} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>
      </div>
    );
  } else if (currentStep.id === "genre") {
    content = (
      <div className="opening-genre">
        <StepMessage
          icon={<GuitarIcon size={23} weight="duotone" />}
          title="这一局只走一种声音"
        >
          风格确定后不会改变。它会影响文案、事件权重和少量隐藏判定，
          但不会改变每月三点行动力的核心规则。
        </StepMessage>

        <div className="opening-genre-grid">
          {GENRE_CONTENT.map((item) => {
            const selected = item.id === genre;
            const style = {
              "--opening-option-accent": item.accentColor,
              "--opening-option-soft": item.accentSoftColor,
            } as CSSProperties;

            return (
              <button
                key={item.id}
                type="button"
                className="opening-genre-card"
                style={style}
                data-selected={selected}
                aria-pressed={selected}
                onClick={() => {
                  setGenre(item.id);
                  setValidationMessage(null);
                }}
              >
                <ArtworkImage
                  artwork={GENRE_ARTWORK[item.id]}
                  className="opening-genre-card__art"
                  decorative
                />
                <span className="opening-genre-card__english">
                  {item.englishLabel}
                </span>
                <div className="opening-genre-card__heading">
                  <h3>{item.label}</h3>
                  <SelectionMark selected={selected} />
                </div>
                <strong>{item.tagline}</strong>
                <p>{item.description}</p>
                <span className="opening-genre-card__tone">
                  {item.audienceTone}
                </span>
                <blockquote>“{item.openingLine}”</blockquote>
              </button>
            );
          })}
        </div>
      </div>
    );
  } else if (currentRecruitmentRole) {
    const roleLabel = RECRUITABLE_ROLE_LABELS[currentRecruitmentRole];
    const candidates = CANDIDATES_BY_ROLE[currentRecruitmentRole];

    content = (
      <div className="opening-recruitment">
        <StepMessage
          icon={<UsersThreeIcon size={23} weight="duotone" />}
          title={`邀请一名${roleLabel}`}
        >
          这三个人都愿意接受你的邀请。选择会决定固定阵容，
          乐队成立后不能更换成员。
        </StepMessage>
        <div className="opening-candidate-grid">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              selected={selectedMemberIds[currentRecruitmentRole] === candidate.id}
              onSelect={() =>
                selectCandidate(currentRecruitmentRole, candidate.id)
              }
            />
          ))}
        </div>
      </div>
    );
  } else if (currentStep.id === "naming") {
    const suggestions = genre
      ? NAME_SUGGESTIONS[genre].bandNames
      : ([] as readonly string[]);

    content = (
      <div className="opening-naming">
        <section className="opening-naming__form">
          <ArtworkImage
            artwork={OPENING_ARTWORK.firstRehearsal}
            className="opening-naming__art"
          />
          <p className="opening-kicker">第一次全员会议</p>
          <h2>五个人围着排练室的折叠桌，终于聊到了名字。</h2>
          <p>
            有人希望它容易被记住，也有人觉得最好别解释得太清楚。
            最后，大家把决定交给了队长。
          </p>

          <div className="opening-field">
            <label htmlFor="opening-band-name">乐队名称</label>
            <input
              id="opening-band-name"
              value={bandName}
              maxLength={24}
              autoComplete="off"
              placeholder="中文、英文或混合名称"
              onChange={(event) => {
                setBandName(event.target.value);
                setValidationMessage(null);
              }}
            />
            <p className="opening-field__helper">
              确认后，这个名字会伴随乐队直到本局结束。
            </p>
          </div>

          <div className="opening-name-suggestions">
            <p>风格名称备选</p>
            <div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  data-selected={bandName.trim() === suggestion}
                  onClick={() => {
                    setBandName(suggestion);
                    setValidationMessage(null);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="opening-naming__preview" aria-label="乐队名称预览">
          <span>排练室门牌</span>
          <strong>{bandName.trim() || "未命名乐队"}</strong>
          <p>{selectedGenre?.englishLabel ?? "NEW BAND"}</p>
          <div className="opening-naming__member-strip">
            <OpeningPortrait
              portrait={selectedAvatar.portrait}
              name={protagonistName || "主角"}
              size="compact"
            />
            {selectedCandidates.map((candidate) => (
              <OpeningPortrait
                key={candidate.id}
                portrait={candidate.portrait}
                name={candidate.name}
                size="compact"
              />
            ))}
          </div>
        </aside>
      </div>
    );
  } else {
    content = (
      <div className="opening-confirmation">
        <section className="opening-confirmation__poster">
          <span className="opening-confirmation__genre">
            {selectedGenre?.englishLabel ?? "NEW BAND"}
          </span>
          <strong>{bandName.trim() || "未命名乐队"}</strong>
          <p>{selectedGenre?.tagline}</p>
          <div className="opening-confirmation__lineup" aria-label="乐队成员合影">
            <div>
              <OpeningPortrait
                portrait={selectedAvatar.portrait}
                name={protagonistName || "主角"}
                size="large"
              />
              <span>{protagonistName.trim() || "主角"}</span>
              <small>队长 / 吉他兼主唱</small>
            </div>
            {selectedCandidates.map((candidate) => (
              <div key={candidate.id}>
                <OpeningPortrait
                  portrait={candidate.portrait}
                  name={candidate.name}
                  size="large"
                />
                <span>{candidate.name}</span>
                <small>{RECRUITABLE_ROLE_LABELS[candidate.role]}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="opening-confirmation__notes">
          <div>
            <p className="opening-kicker">阵容确认</p>
            <h2>快门按下，乐队正式成立。</h2>
            <p>
              接下来从毕业后的第一个月开始。每月拥有三个行动点，
              队伍阵容和音乐风格不会再改变。
            </p>
          </div>
          <dl>
            <div>
              <dt>乐队</dt>
              <dd>{bandName.trim() || "未命名"}</dd>
            </div>
            <div>
              <dt>风格</dt>
              <dd>{selectedGenre?.label ?? "未选择"}</dd>
            </div>
            <div>
              <dt>成员</dt>
              <dd>{selectedCandidates.length + 1} 人</dd>
            </div>
            <div>
              <dt>起点</dt>
              <dd>毕业后的第一个月</dd>
            </div>
          </dl>
        </section>
      </div>
    );
  }

  return (
    <main
      className={classNames("opening-flow", className)}
      data-genre={genre ?? undefined}
    >
      <div className="opening-flow__shell">
        <header className="opening-flow__header">
          <div className="opening-flow__brand">
            <VinylRecordIcon size={24} weight="duotone" aria-hidden="true" />
            <div>
              <span>乐队后台工作站</span>
              <strong>组建乐队</strong>
            </div>
          </div>

          <div className="opening-flow__progress">
            <span>
              {stepIndex + 1} / {OPENING_STEPS.length}
            </span>
            <ol aria-label="开局进度">
              {OPENING_STEPS.map((step, index) => (
                <li
                  key={step.id}
                  data-current={index === stepIndex}
                  data-complete={index < stepIndex}
                  aria-current={index === stepIndex ? "step" : undefined}
                  title={step.label}
                >
                  <span>{step.shortLabel}</span>
                </li>
              ))}
            </ol>
          </div>
        </header>

        <Panel
          className="opening-flow__panel"
          bodyClassName="opening-flow__body"
          variant="raised"
        >
          <div className="opening-flow__step-heading">
            <p>{currentStep.label}</p>
            <h1 ref={headingRef} tabIndex={-1}>
              {currentStep.id === "identity" && "从毕业那天开始"}
              {currentStep.id === "genre" && "你们要成为怎样的乐队？"}
              {currentRecruitmentRole &&
                `把${RECRUITABLE_ROLE_LABELS[currentRecruitmentRole]}的位置交给谁？`}
              {currentStep.id === "naming" && "这支乐队叫什么？"}
              {currentStep.id === "confirmation" && "所有人都到齐了"}
            </h1>
          </div>

          <div className="opening-flow__content">{content}</div>

          <footer className="opening-flow__footer">
            <div
              className="opening-flow__validation"
              role={validationMessage ? "alert" : undefined}
              aria-live="polite"
            >
              {validationMessage}
            </div>
            <div className="opening-flow__footer-actions">
              {stepIndex > 0 ? (
                <Button
                  variant="ghost"
                  size="lg"
                  icon={<ArrowLeftIcon size={18} weight="bold" />}
                  onClick={goBack}
                >
                  返回
                </Button>
              ) : onCancel ? (
                <Button
                  variant="ghost"
                  size="lg"
                  icon={<ArrowLeftIcon size={18} weight="bold" />}
                  onClick={onCancel}
                >
                  返回首页
                </Button>
              ) : null}
              {currentStep.id === "confirmation" ? (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<CheckIcon size={18} weight="bold" />}
                  iconPosition="end"
                  onClick={completeOpening}
                >
                  确认成立
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRightIcon size={18} weight="bold" />}
                  iconPosition="end"
                  onClick={goForward}
                >
                  下一步
                </Button>
              )}
            </div>
          </footer>
        </Panel>
      </div>
    </main>
  );
}
