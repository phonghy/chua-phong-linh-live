import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clapperboard,
  Copy,
  Flower2,
  Flame,
  Gift,
  HandHeart,
  Heart,
  LayoutDashboard,
  Link2,
  MessageCircle,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import {
  actionLabels,
  defaultSettings,
  type Action,
  type AdminSnapshot,
  type GiftMapping,
  type TikTokConfig,
  type LiveEvent,
  type Settings,
} from "../../../packages/shared/src/index.ts";
import { api } from "./api";
import { TempleView } from "./TempleView";
import { AdminLeaderboards } from "./Leaderboard";
import { useTemple } from "./useTemple";

type Tab = "control" | "prayers" | "gifts" | "settings";
const names = [
  "Minh An",
  "Ngọc Linh",
  "Bảo An",
  "Thanh Tâm",
  "Diệu Hương",
  "Hải Đăng",
  "Khánh Vy",
  "Tâm Bình",
  "Phương Anh",
  "Gia Hân",
  "An Nhiên",
  "Tuệ Minh",
];
const icons = { bow: HandHeart, incense: Flame, lotus: Flower2, prayer: Heart };
const commands: Record<Action, string> = {
  bow: "!le",
  incense: "!nhang",
  lotus: "!sen",
  prayer: "!cau",
};
function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function makeEvent(
  type: LiveEvent["type"],
  name: string,
  extra: Record<string, unknown> = {},
  userId?: string,
) {
  return {
    id: safeUUID(),
    timestamp: Date.now(),
    source: "mock",
    type,
    user: { id: userId ?? `demo:${name}`, name },
    ...extra,
  };
}
const resultLabels: Record<string, string> = {
  bow: "Lễ Phật",
  incense: "Thắp nhang",
  lotus: "Dâng hoa",
  prayer: "Cầu nguyện",
  received: "Ghé thăm",
  cooldown: "Đang chờ lượt",
  ignored: "Bình luận",
  "pending-approval": "Chờ duyệt lời nguyện",
  "empty-prayer": "Chưa có lời nguyện",
  "streak-already-counted": "Chuỗi đã ghi nhận",
  "prayer-queue-full": "Hàng chờ đầy",
  "gift-required": "Dâng hoa bằng quà tặng LIVE",
};

export function Admin() {
  const { client, state: raw, connected } = useTemple(true),
    state = raw as AdminSnapshot | undefined;
  const [tab, setTab] = useState<Tab>("control"),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [running, setRunning] = useState(false),
    [sessionResetArmed, setSessionResetArmed] = useState(false);
  const [narratorStatus, setNarratorStatus] = useState<{
    available: boolean;
    voice: string;
    detail: string;
  }>();
  const [name, setName] = useState("Tâm An"),
    [prayer, setPrayer] = useState("Cầu cho gia đình bốn mùa bình an, tám tiết cát tường"),
    [templeNotice, setTempleNotice] = useState("Đại lễ cầu an đang diễn ra, kính mời quý Phật tử cùng thành tâm hướng về Tam Bảo."),
    [giftId, setGiftId] = useState("mock-lotus"),
    [count, setCount] = useState(1),
    [audienceCount, setAudienceCount] = useState(1000);
  const [draft, setDraft] = useState<Settings>(defaultSettings),
    [mappings, setMappings] = useState<GiftMapping[]>([]),
    [fps, setFps] = useState(0);
  const draftDirty = useRef(false);
  const [tiktok, setTiktok] = useState<TikTokConfig>({
      username: "",
      hasSignKey: false,
    }),
    [tiktokUser, setTiktokUser] = useState(""),
    [tiktokKey, setTiktokKey] = useState("");
  const obsUrl = `${location.origin}/overlay`;
  useEffect(() => {
    const timer = setInterval(
      () => setFps(Math.round(window.__TEMPLE_STATS__?.fps ?? 0)),
      1200,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    void api<{ available: boolean; voice: string; detail: string }>(
      "narrator",
      undefined,
      "GET",
    )
      .then((status) => {
        if (active) setNarratorStatus(status);
      })
      .catch((e) => {
        if (active)
          setNarratorStatus({
            available: false,
            voice: "Linh",
            detail: (e as Error).message,
          });
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    void api<TikTokConfig>("tiktok", undefined, "GET")
      .then((config) => {
        if (!active) return;
        setTiktok(config);
        setTiktokUser(config.username);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  async function saveTikTok(clearKey = false) {
    const config = await api<TikTokConfig>(
      "tiktok",
      {
        username: tiktokUser,
        ...(clearKey
          ? { signApiKey: null }
          : tiktokKey
            ? { signApiKey: tiktokKey }
            : {}),
      },
      "PUT",
    );
    setTiktok(config);
    setTiktokUser(config.username);
    setTiktokKey("");
  }
  useEffect(() => {
    if (state && !draftDirty.current) setDraft(state.settings);
  }, [JSON.stringify(state?.settings)]);
  useEffect(() => {
    if (state) {
      setMappings(state.mappings);
      setGiftId((current) =>
        state.mappings.some((m) => m.giftId === current)
          ? current
          : (state.mappings[0]?.giftId ?? ""),
      );
    }
  }, [JSON.stringify(state?.mappings)]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  async function run(task: () => Promise<unknown>, success?: string) {
    setBusy(true);
    setError("");
    try {
      await task();
      if (success) setToast(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function sendAction(action: Action) {
    const result = await api<{ result: string }>(
      "events",
      makeEvent("comment", name, {
        text: `${commands[action]}${action === "prayer" ? ` ${prayer}` : ""}`,
      }),
    );
    setToast(
      result.result === "cooldown"
        ? `Khách này đang chờ ${state?.settings.cooldownSeconds ?? 10} giây giữa các lượt.`
        : result.result === "pending-approval"
          ? "Đã gửi lời nguyện vào hàng chờ duyệt."
          : `${actionLabels[action]} · Đã gửi`,
    );
  }
  async function sendTempleNotice() {
    if (!templeNotice.trim()) return;
    await api("announcements", { text: templeNotice });
    setToast("Đã phát thông báo của Chùa lên LIVE (Ưu tiên phát thanh).");
  }
  async function triggerCeremonyEffect(action: "milestone" | "bow" | "incense" | "lotus", intensity = 4) {
    await api("ceremonies", { action, name, intensity });
    setToast(
      action === "milestone"
        ? "Đã kích hoạt Nghi lễ Thắp sáng Tam Bảo (Milestone)."
        : action === "bow" && intensity === 4
          ? "Đã kích hoạt Hào quang Phật đắc đạo (Đại thí chủ cúng dường)."
          : `Đã kích hoạt nghi lễ ${actionLabels[action] ?? action}.`
    );
  }
  async function sendGreeting() {
    await api("events", makeEvent("join", name));
    setToast(`Đã gửi lời chào đón ${name} vào chùa (Voice AI đọc chúc).`);
  }
  async function sendPrayerAction() {
    if (!prayer.trim() || !name.trim()) return;
    await api("events", makeEvent("comment", name, { text: `!cau ${prayer}` }));
    setToast(`Đã phát lời nguyện của ${name} (Hiển thị & Giọng AI đọc).`);
  }
  async function updateCamera(camera: Settings["camera"]) {
    if (state) await api("settings", { ...state.settings, camera }, "PUT");
  }
  useEffect(() => {
    if (!running) return;
    let active = true,
      index = 0,
      timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        if (index === 0)
          await api("events", {
            id: safeUUID(),
            timestamp: Date.now(),
            source: "mock",
            type: "audience",
            count: Math.max(160, Number.isInteger(audienceCount) && audienceCount > 0 ? audienceCount : 160),
          });
        if (!active) return;
        const n = index++,
          user = names[n % names.length];
        if (n % 4 === 0)
          await api(
            "events",
            makeEvent(
              "gift",
              user,
              {
                giftId: "mock-lotus",
                giftName: "Hoa sen mẫu",
                count: 1,
                streakId: safeUUID(),
                final: true,
              },
              `mock:aud:${n % 160}`,
            ),
          );
        else
          await api(
            "events",
            makeEvent(
              "comment",
              user,
              { text: ["!le", "!nhang"][n % 2] },
              `mock:aud:${n % 160}`,
            ),
          );
        if (active) timer = setTimeout(tick, 1800);
      } catch (e) {
        if (active) {
          setRunning(false);
          setError((e as Error).message);
        }
      }
    };
    void tick();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [running]);
  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    draftDirty.current = true;
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const mutateMapping = (
    index: number,
    key: keyof GiftMapping,
    value: string | number,
  ) =>
    setMappings((old) =>
      old.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    );
  const navigation: [Tab, string, typeof Flower2][] = [
    ["control", "Phòng điều khiển", LayoutDashboard],
    ["prayers", "Lời cầu nguyện", MessageCircle],
    ["gifts", "Quà tặng", Gift],
    ["settings", "Cài đặt", SlidersHorizontal],
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/admin">
          <span className="brand-icon">
            <Flower2 size={30} strokeWidth={1.4} />
          </span>
          <span>
            Tâm An Vạn Sự An<small>Không gian an lành</small>
          </span>
        </a>
        <nav aria-label="Điều hướng quản trị">
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "nav-item active" : "nav-item"}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "prayers" && !!state?.pendingPrayers.length && (
                <b>{state.pendingPrayers.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Flower2 size={24} />
          <p>
            Một không gian nhỏ.
            <br />
            Ngàn điều bình an.
          </p>
          <span>Cùng nhau vun đắp qua từng lời nguyện.</span>
        </div>
        <div className="local-status">
          <span>
            <i className={connected ? "status-dot" : "status-dot offline"} />
            {connected ? "Máy chủ cục bộ" : "Đang kết nối lại"}
          </span>
          <small>SQLite · Dữ liệu trên máy</small>
        </div>
      </aside>
      <main className="admin-main">
        <header className="page-header">
          <div>
            <h1>{navigation.find((n) => n[0] === tab)?.[1]}</h1>
            <p>
              {tab === "control"
                ? "Chăm chút không gian, kết nối những tâm lành."
                : tab === "prayers"
                  ? "Đọc và duyệt lời nguyện trước khi hiển thị trong chùa."
                  : tab === "gifts"
                    ? "Mỗi món quà, một hành động và một khoảnh khắc."
                    : "Thiết lập trải nghiệm và chuẩn bị nguồn phát."}
            </p>
          </div>
          <div className="header-actions">
            <span
              className={`connection-badge ${state?.connector.mode === "tiktok" ? "live" : ""}`}
            >
              <Radio size={14} />
              {state?.connector.mode === "tiktok"
                ? state.connector.state === "connected"
                  ? "TikTok LIVE"
                  : "TikTok chưa kết nối"
                : "Chế độ mô phỏng"}
            </span>
            <a
              className="button secondary"
              href="/game"
              target="_blank"
              rel="noreferrer"
            >
              Mở sân chùa <ArrowUpRight size={16} />
            </a>
          </div>
        </header>
        {!connected && (
          <div className="banner warning" role="status">
            <Wifi size={18} />
            Đang kết nối lại máy chủ. Các điều khiển sẽ sẵn sàng khi có kết nối.
          </div>
        )}
        {error && (
          <div className="banner error" role="alert">
            <span>{error}</span>
            <button
              aria-label="Đóng thông báo lỗi"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {toast && (
          <div className="toast" role="status">
            <Check size={17} />
            {toast}
          </div>
        )}

        {tab === "control" && (
          <>
            <div className="workspace-toolbar">
              <div className="section-title">
                <span className="status-dot" />
                <h2>Không gian chùa</h2>
                <span className="subtle">9:16 · 1080 × 1920</span>
              </div>
              <div className="segmented" aria-label="Góc nhìn">
                <button
                  className={
                    state?.settings.camera === "wide" ? "selected" : ""
                  }
                  disabled={!connected || busy}
                  onClick={() => void run(() => updateCamera("wide"))}
                >
                  Toàn cảnh
                </button>
                <button
                  className={
                    state?.settings.camera === "close" ? "selected" : ""
                  }
                  disabled={!connected || busy}
                  onClick={() => void run(() => updateCamera("close"))}
                >
                  Cận cảnh
                </button>
              </div>
            </div>
            <div className="control-grid">
              <section className="preview-column" aria-label="Xem trước">
                <div className="preview-frame">
                  <TempleView client={client} state={state} preview />
                </div>
                <div className="preview-footer">
                  <span>
                    <span className="status-dot" />
                    Xem trước · Không phát âm thanh
                  </span>
                  <span>{fps ? `${fps} FPS` : "Đang tải…"}</span>
                </div>
                <button
                  className="obs-link"
                  onClick={() => {
                    setTab("settings");
                    void navigator.clipboard
                      ?.writeText(obsUrl)
                      .then(() => setToast("Đã sao chép địa chỉ nguồn OBS."))
                      .catch(() =>
                        setToast("Địa chỉ nguồn OBS có trong Cài đặt."),
                      );
                  }}
                >
                  <Clapperboard size={16} />
                  Lấy đường dẫn cho OBS
                  <ArrowUpRight size={15} />
                </button>
              </section>
              <div className="operator-column">
                <section className="panel simulator dispatch-station">
                  <div className="panel-heading">
                    <h2>Điều phối phòng LIVE & Nghi lễ Chùa</h2>
                    <span className="tag primary">Bàn điều phối</span>
                  </div>
                  <p className="description">
                    Điều phối phát thanh chánh điện, phát lời thông báo của chùa, phát lời cầu nguyện và kích hoạt đại nghi lễ.
                  </p>
                  <fieldset disabled={!connected || busy}>
                    {/* DANH XƯNG TƯƠNG TÁC */}
                    <div className="dispatch-box">
                      <div className="dispatch-header">
                        <label className="field-label" htmlFor="viewer-name">
                          Danh xưng phát biểu / Khách tương tác
                        </label>
                        <span className="subtle-hint">Mặc định: <strong>Tâm An</strong> (Chùa hoặc khách)</span>
                      </div>
                      <div className="name-input-row">
                        <input
                          id="viewer-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={60}
                          placeholder="Nhập tên (ví dụ: Tâm An)"
                          required
                        />
                        <div className="quick-names">
                          {["Tâm An", "Minh An", "An Nhiên", "Đại Thí Chủ"].map((quickName) => (
                            <button
                              key={quickName}
                              type="button"
                              className={`pill-button ${name === quickName ? "active" : ""}`}
                              onClick={() => setName(quickName)}
                            >
                              {quickName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* THÔNG BÁO CỦA CHÙA (ƯU TIÊN CAO NHẤT) */}
                    <div className="dispatch-box temple-notice-box">
                      <div className="dispatch-header">
                        <label className="field-label" htmlFor="temple-notice">
                          <Volume2 size={15} /> Thông báo của Chùa (Ưu tiên phát thanh cao nhất)
                        </label>
                        <span className="badge-highlight">Ưu tiên 1</span>
                      </div>
                      <div className="dispatch-input-row">
                        <textarea
                          id="temple-notice"
                          rows={2}
                          value={templeNotice}
                          onChange={(e) => setTempleNotice(e.target.value)}
                          maxLength={300}
                          placeholder="Nhập thông báo của chùa để Voice AI phát thanh chánh điện ngay lập tức..."
                        />
                        <button
                          type="button"
                          className="button primary dispatch-send-btn"
                          disabled={!templeNotice.trim()}
                          onClick={() => void run(sendTempleNotice)}
                        >
                          <Send size={15} /> Phát thông báo
                        </button>
                      </div>
                    </div>

                    {/* LỜI CẦU NGUYỆN & LỜI CHÀO */}
                    <div className="dispatch-box">
                      <div className="dispatch-header">
                        <label className="field-label" htmlFor="prayer-text">
                          <Heart size={15} /> Lời cầu nguyện & Lời chúc (Hiện text + Voice AI đọc)
                        </label>
                        <button
                          type="button"
                          className="button text-link-btn"
                          onClick={() => void run(sendGreeting)}
                        >
                          <Users size={14} /> Chào đón {name}
                        </button>
                      </div>
                      <div className="dispatch-input-row">
                        <textarea
                          id="prayer-text"
                          rows={2}
                          value={prayer}
                          onChange={(e) => setPrayer(e.target.value)}
                          maxLength={240}
                          placeholder="Nhập lời cầu nguyện hoặc chúc phúc..."
                        />
                        <button
                          type="button"
                          className="button secondary dispatch-send-btn"
                          disabled={!prayer.trim() || !name.trim()}
                          onClick={() => void run(sendPrayerAction)}
                        >
                          <Send size={15} /> Gửi & Đọc
                        </button>
                      </div>
                    </div>

                    {/* BÀN PHÍM HIỆU ỨNG & ĐẠI NGHI LỄ CHÁNH ĐIỆN */}
                    <div className="dispatch-box effects-box">
                      <label className="field-label">
                        <Sparkles size={15} /> Kích hoạt Hiệu ứng & Đại Nghi Lễ Chánh Điện
                      </label>
                      <div className="effect-grid">
                        <button
                          type="button"
                          className="effect-btn ceremony-milestone-btn"
                          onClick={() => void run(() => triggerCeremonyEffect("milestone", 3))}
                        >
                          <Flame size={20} />
                          <div>
                            <strong>Đại Lễ Thắp Đèn Tam Bảo</strong>
                            <small>Hạ đèn 65% → Sóng quang minh → Bừng sáng + 110 sen vàng</small>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="effect-btn ceremony-halo-btn"
                          onClick={() => void run(() => triggerCeremonyEffect("bow", 4))}
                        >
                          <Sparkles size={20} />
                          <div>
                            <strong>Hào Quang Phật Đắc Đạo</strong>
                            <small>Đại hào quang xoay tròn + 200 người quỳ lạy + 130 sen vàng</small>
                          </div>
                        </button>
                      </div>
                      <div className="action-grid mini-actions">
                        {(["bow", "incense", "lotus"] as Action[]).map((action) => {
                          const Icon = icons[action];
                          return (
                            <button
                              key={action}
                              type="button"
                              className={`action-button ${action}`}
                              disabled={!name.trim()}
                              onClick={() => void run(() => sendAction(action))}
                            >
                              <Icon size={20} strokeWidth={1.5} />
                              <strong>${actionLabels[action]}</strong>
                              <code>${commands[action]}</code>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CÚNG DƯỜNG QUÀ TẶNG LIVE */}
                    <div className="gift-row">
                      <label>
                        Cúng dường Quà tặng LIVE
                        <select
                          aria-label="Chọn quà tặng"
                          value={giftId}
                          onChange={(e) => setGiftId(e.target.value)}
                        >
                          {(state?.mappings ?? []).map((m) => (
                            <option key={m.giftId} value={m.giftId}>
                              {m.name} · Cấp {m.intensity} (+{m.points} điểm)
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="count-field">
                        Số lượng
                        <input
                          aria-label="Số lượng quà"
                          type="number"
                          min="1"
                          max="1000"
                          value={count}
                          onChange={(e) => setCount(e.target.valueAsNumber)}
                        />
                      </label>
                      <button
                        type="button"
                        className="button secondary gift-send"
                        disabled={
                          !giftId ||
                          !name.trim() ||
                          !Number.isInteger(count) ||
                          count < 1 ||
                          count > 1000
                        }
                        onClick={() =>
                          void run(
                            () =>
                              api(
                                "events",
                                makeEvent("gift", name, {
                                  giftId,
                                  giftName:
                                    state?.mappings.find(
                                      (m) => m.giftId === giftId,
                                    )?.name ?? giftId,
                                  count,
                                  streakId: safeUUID(),
                                  final: true,
                                }),
                              ),
                            "Đã gửi quà cúng dường.",
                          )
                        }
                      >
                        <Gift size={17} />
                        Gửi quà
                      </button>
                    </div>

                    {/* MÔ PHỎNG NGƯỜI XEM & LƯỢT CHIA SẺ */}
                    <div className="audience-simulator">
                      <label htmlFor="mock-audience-count">
                        Người xem đồng thời (Giả lập lượng khách vào chùa)
                      </label>
                      <div>
                        <input
                          id="mock-audience-count"
                          aria-label="Người xem đồng thời mô phỏng"
                          type="number"
                          min="0"
                          max="1000000"
                          step="1"
                          value={audienceCount}
                          onChange={(e) =>
                            setAudienceCount(e.target.valueAsNumber)
                          }
                        />
                        <button
                          type="button"
                          className="button secondary"
                          disabled={
                            !connected ||
                            busy ||
                            state?.connector.mode === "tiktok" ||
                            !Number.isInteger(audienceCount) ||
                            audienceCount < 0 ||
                            audienceCount > 1000000
                          }
                          onClick={() =>
                            void run(
                              () =>
                                api("events", {
                                  id: safeUUID(),
                                  timestamp: Date.now(),
                                  source: "mock",
                                  type: "audience",
                                  count: audienceCount,
                                }),
                              "Đã cập nhật số người xem mô phỏng.",
                            )
                          }
                        >
                          Cập nhật người xem
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          disabled={
                            !connected ||
                            busy ||
                            state?.connector.mode === "tiktok" ||
                            !name.trim()
                          }
                          onClick={() =>
                            void run(
                              () => api("events", makeEvent("share", name)),
                              "Đã gửi lượt chia sẻ mô phỏng.",
                            )
                          }
                        >
                          Thử chia sẻ
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </section>
                <section
                  className="community-strip"
                  aria-label="Thống kê cộng đồng"
                >
                  <div>
                    <Flower2 />
                    <strong>
                      {state?.totals.lotus.toLocaleString("vi-VN") ?? 0}
                    </strong>
                    <span>Đóa hoa</span>
                  </div>
                  <div>
                    <Flame />
                    <strong>
                      {state?.totals.incense.toLocaleString("vi-VN") ?? 0}
                    </strong>
                    <span>Nén nhang</span>
                  </div>
                  <div>
                    <Users />
                    <strong>
                      {state?.totals.visits.toLocaleString("vi-VN") ?? 0}
                    </strong>
                    <span>Lượt ghé thăm</span>
                  </div>
                </section>
                <AdminLeaderboards state={state} />
                <section className="panel session-panel">
                  <div className="panel-heading">
                    <h2>Phiên LIVE</h2>
                    <span className="tag">
                      {state?.session.source === "tiktok"
                        ? "TikTok LIVE"
                        : "Mô phỏng"}
                    </span>
                  </div>
                  <p className="description">
                    Bắt đầu{" "}
                    {state
                      ? new Date(state.session.startedAt).toLocaleString(
                          "vi-VN",
                        )
                      : "—"}
                    . Phiên mới đặt lại hai bảng tri ân.
                  </p>
                  {!sessionResetArmed ? (
                    <button
                      className="button secondary"
                      disabled={!connected || busy}
                      onClick={() => setSessionResetArmed(true)}
                    >
                      <RotateCcw size={16} /> Bắt đầu phiên mới
                    </button>
                  ) : (
                    <div
                      className="session-confirm"
                      role="group"
                      aria-label="Xác nhận phiên mới"
                    >
                      <span>Đặt lại điểm trên hai bảng tri ân?</span>
                      <button
                        className="button primary"
                        disabled={!connected || busy}
                        onClick={() =>
                          void run(
                            () => api("session/new"),
                            "Phiên mới đã bắt đầu.",
                          ).then(() => setSessionResetArmed(false))
                        }
                      >
                        Xác nhận phiên mới
                      </button>
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => setSessionResetArmed(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </section>
                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <h2>Nhịp chùa</h2>
                    <span className="activity-caption">
                      <Activity size={13} />
                      Thời gian thực
                    </span>
                  </div>
                  <EventList state={state} />
                </section>
                <div className="quiet-note">
                  <ShieldCheck size={18} />
                  <p>
                    {state?.connector.mode === "tiktok" &&
                    state.connector.state === "connected"
                      ? "Đang nhận tương tác từ TikTok LIVE."
                      : "Không cần kết nối TikTok để trải nghiệm."}
                    <br />
                    <span>
                      {state?.connector.mode === "tiktok"
                        ? "Bảng tương tác thử vẫn gửi dữ liệu mô phỏng."
                        : "Các tương tác hiện tại là dữ liệu mô phỏng."}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "prayers" && (
          <section className="content-sheet">
            <div className="sheet-heading">
              <h2>
                Đang chờ duyệt{" "}
                <span className="tag">{state?.pendingPrayers.length ?? 0}</span>
              </h2>
              <span className="subtle">Tối đa 240 ký tự mỗi lời nguyện</span>
            </div>
            {!state?.pendingPrayers.length ? (
              <div className="empty-state">
                <Heart size={34} strokeWidth={1.2} />
                <h3>Một khoảng lặng an lành</h3>
                <p>Lời nguyện mới sẽ xuất hiện ở đây để bạn duyệt.</p>
                <button
                  className="button secondary"
                  onClick={() => setTab("control")}
                >
                  Gửi lời nguyện thử <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="prayer-list">
                {state.pendingPrayers.map((p) => (
                  <article className="prayer-row" key={p.id}>
                    <span className="visitor-avatar">
                      {p.userName.charAt(0)}
                    </span>
                    <div>
                      <strong>{p.userName}</strong>
                      <p>{p.text}</p>
                      <small>
                        {new Date(p.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <div className="row-actions">
                      <button
                        className="button secondary"
                        disabled={busy || !connected}
                        onClick={() =>
                          void run(
                            () =>
                              api(`prayers/${p.id}`, { status: "rejected" }),
                            "Đã ẩn lời nguyện.",
                          )
                        }
                      >
                        <X size={15} />
                        Ẩn
                      </button>
                      <button
                        className="button primary"
                        disabled={busy || !connected}
                        onClick={() =>
                          void run(
                            () =>
                              api(`prayers/${p.id}`, { status: "approved" }),
                            "Lời nguyện đã được hiển thị trong chùa.",
                          )
                        }
                      >
                        <Check size={16} />
                        Duyệt
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="approved-prayers">
              <h2>Đã gửi lên chùa</h2>
              {state?.prayers.length ? (
                state.prayers
                  .slice()
                  .reverse()
                  .map((p) => (
                    <p key={p.id}>
                      <Heart size={14} />
                      <span>
                        {p.text}
                        <small>{p.userName}</small>
                      </span>
                    </p>
                  ))
              ) : (
                <p className="subtle">Chưa có lời nguyện được duyệt.</p>
              )}
            </div>
          </section>
        )}

        {tab === "gifts" && (
          <section className="content-sheet">
            <div className="sheet-heading">
              <h2>Hành động theo quà tặng</h2>
              <button
                className="button secondary"
                disabled={!connected || busy || mappings.length >= 100}
                onClick={() =>
                  setMappings((old) => [
                    ...old,
                    {
                      giftId: "",
                      name: "",
                      action: "lotus",
                      intensity: 1,
                      points: 1,
                    },
                  ])
                }
              >
                <Gift size={16} />
                Thêm quà
              </button>
            </div>
            <p className="description">
              Các mã <code>mock-*</code> dành cho mô phỏng. Khi nhận quà thật,
              dùng mã quà trong Nhịp chùa để tạo quy tắc. Quà chưa có quy tắc sẽ
              dâng hoa và cộng 1 điểm mỗi lượt.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(
                  () => api("mappings", mappings, "PUT"),
                  "Đã lưu quy tắc quà tặng.",
                );
              }}
            >
              <div className="mapping-list">
                {mappings.map((m, i) => (
                  <div className="mapping-row" key={i}>
                    <label>
                      Tên quà
                      <input
                        aria-label={`Tên quà ${i + 1}`}
                        required
                        maxLength={60}
                        value={m.name}
                        onChange={(e) =>
                          mutateMapping(i, "name", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Mã quà
                      <input
                        aria-label={`Mã quà ${i + 1}`}
                        required
                        maxLength={100}
                        value={m.giftId}
                        onChange={(e) =>
                          mutateMapping(i, "giftId", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Hành động
                      <select
                        value={m.action}
                        onChange={(e) =>
                          mutateMapping(i, "action", e.target.value)
                        }
                      >
                        {Object.entries(actionLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Hiệu ứng
                      <select
                        value={m.intensity}
                        onChange={(e) =>
                          mutateMapping(i, "intensity", Number(e.target.value))
                        }
                      >
                        <option value={1}>Nhẹ</option>
                        <option value={2}>Vừa</option>
                        <option value={3}>Lễ hội</option>
                      </select>
                    </label>
                    <label>
                      Điểm
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        required
                        value={m.points}
                        onChange={(e) =>
                          mutateMapping(i, "points", e.target.valueAsNumber)
                        }
                      />
                    </label>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Xóa quà ${m.name || i + 1}`}
                      onClick={() =>
                        setMappings((old) =>
                          old.filter((_, index) => index !== i),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="button primary"
                type="submit"
                disabled={!connected || busy}
              >
                <Check size={16} />
                Lưu quy tắc
              </button>
            </form>
          </section>
        )}

        {tab === "settings" && (
          <div className="settings-grid">
            <section className="content-sheet">
              <h2>Trải nghiệm trong chùa</h2>
              <form
                className="settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await api("settings", draft, "PUT");
                    draftDirty.current = false;
                  }, "Đã lưu cài đặt.");
                }}
              >
                <label>
                  Thời gian chờ giữa hai lượt (giây)
                  <input
                    type="number"
                    min="0"
                    max="300"
                    required
                    value={draft.cooldownSeconds}
                    onChange={(e) =>
                      setSetting("cooldownSeconds", e.target.valueAsNumber)
                    }
                  />
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={draft.autoCamera}
                    onChange={(e) => setSetting("autoCamera", e.target.checked)}
                  />
                  Camera tự động lia chuyển động mượt mà (Toàn cảnh & Cận cảnh)
                </label>
                <div className="narrator-settings">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={draft.narratorEnabled}
                      onChange={(e) =>
                        setSetting("narratorEnabled", e.target.checked)
                      }
                    />
                    Đọc lời tri ân bằng giọng Linh
                  </label>
                  <p className="field-hint" role="status">
                    Giọng đọc cục bộ:{" "}
                    {narratorStatus
                      ? narratorStatus.available
                        ? `Sẵn sàng · ${narratorStatus.voice}`
                        : `Chưa khả dụng · ${narratorStatus.detail}`
                      : "Đang kiểm tra…"}
                  </p>
                  <label>
                    <span>
                      <Volume2 size={16} /> Âm lượng giọng đọc{" "}
                      <small>{Math.round(draft.narratorVolume * 100)}%</small>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={draft.narratorVolume}
                      onChange={(e) =>
                        setSetting("narratorVolume", Number(e.target.value))
                      }
                    />
                  </label>
                </div>
                <label>
                  <span>
                    <Volume2 size={16} />
                    Âm nền{" "}
                    <small>{Math.round(draft.ambientVolume * 100)}%</small>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={draft.ambientVolume}
                    onChange={(e) =>
                      setSetting("ambientVolume", Number(e.target.value))
                    }
                  />
                </label>
                <label>
                  <span>
                    <Bell size={16} />
                    Tiếng chuông{" "}
                    <small>{Math.round(draft.ceremonyVolume * 100)}%</small>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={draft.ceremonyVolume}
                    onChange={(e) =>
                      setSetting("ceremonyVolume", Number(e.target.value))
                    }
                  />
                </label>
                <p className="field-hint">
                  Bản xem trước luôn tắt tiếng. Bật âm thanh ở sân chùa hoặc
                  dùng nguồn OBS có âm thanh.
                </p>
                <button
                  className="button primary"
                  disabled={!connected || busy}
                >
                  Lưu cài đặt
                </button>
              </form>
            </section>
            <section className="content-sheet">
              <h2>
                <Clapperboard size={20} />
                Nguồn phát OBS
              </h2>
              <p className="description">
                Thêm Browser Source với kích thước 1080 × 1920. Nguồn này chỉ
                chứa cảnh chùa.
              </p>
              <label>
                Địa chỉ nguồn
                <input
                  readOnly
                  value={obsUrl}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                className="button secondary"
                onClick={() =>
                  void run(async () => {
                    await navigator.clipboard.writeText(obsUrl);
                  }, "Đã sao chép địa chỉ OBS.")
                }
              >
                <Copy size={16} />
                Sao chép
              </button>
              <label className="audio-url-label">
                Nguồn có âm thanh
                <input
                  readOnly
                  value={`${obsUrl}?audio=1`}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <p className="field-hint">
                Trong OBS, bật “Control audio via OBS”. Không phát âm thanh đồng
                thời từ sân chùa và OBS.
              </p>
              <div className="setup-note">
                <Link2 size={18} />
                <p>
                  Bạn hiện có LIVE trên điện thoại. Trò chơi chạy độc lập; đưa
                  cảnh lên TikTok cần quyền phát máy tính phù hợp. Xem README để
                  thiết lập.
                </p>
              </div>
            </section>
            <section className="content-sheet">
              <h2>
                <Radio size={20} />
                Kết nối TikTok
              </h2>
              <p className="description">
                {state?.connector.detail ?? "Đang tải trạng thái…"}
              </p>
              <p className="field-hint">
                Connector bên thứ ba, không chính thức. Không nhập mật khẩu
                TikTok vào ứng dụng.
              </p>
              <form
                className="settings-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(() => saveTikTok(), "Đã lưu thông tin TikTok.");
                }}
              >
                <label>
                  Tên tài khoản TikTok đang LIVE
                  <input
                    value={tiktokUser}
                    placeholder="@ten_tai_khoan"
                    maxLength={65}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setTiktokUser(e.target.value)}
                  />
                </label>
                <label>
                  Khóa dịch vụ ký (tùy chọn)
                  <input
                    type="password"
                    value={tiktokKey}
                    maxLength={200}
                    autoComplete="off"
                    placeholder={
                      tiktok.hasSignKey
                        ? "Đã lưu — để trống để giữ nguyên"
                        : "Chỉ nhập nếu dịch vụ ký yêu cầu"
                    }
                    onChange={(e) => setTiktokKey(e.target.value)}
                  />
                </label>
                <p className="field-hint">
                  Khóa được lưu trên máy này và không bao giờ hiển thị lại.
                  {state?.connector.mode === "tiktok"
                    ? " Bấm Kết nối TikTok lần nữa để áp dụng thay đổi."
                    : ""}
                </p>
                <div className="inline-actions">
                  <button
                    type="submit"
                    className="button secondary"
                    disabled={busy}
                  >
                    <Check size={16} />
                    Lưu thông tin
                  </button>
                  {tiktok.hasSignKey && (
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(() => saveTikTok(true), "Đã xóa khóa.")
                      }
                    >
                      <Trash2 size={16} />
                      Xóa khóa
                    </button>
                  )}
                </div>
              </form>
              <div className="inline-actions">
                <button
                  className="button primary"
                  disabled={
                    !connected ||
                    busy ||
                    !tiktok.username ||
                    state?.connector.state === "connecting"
                  }
                  onClick={() => {
                    setRunning(false);
                    void run(() => api("connector", { mode: "tiktok" }));
                  }}
                >
                  <Wifi size={16} />
                  Kết nối TikTok
                </button>
                <button
                  className="button secondary"
                  disabled={!connected || busy}
                  onClick={() =>
                    void run(
                      () => api("connector", { mode: "mock" }),
                      "Đã chuyển về mô phỏng.",
                    )
                  }
                >
                  <Play size={16} />
                  Dùng mô phỏng
                </button>
              </div>
            </section>
            <section className="content-sheet">
              <h2>
                <RotateCcw size={20} />
                Phát lại sự kiện
              </h2>
              <p className="description">
                Phát lại 20 sự kiện gần nhất dưới dạng thử nghiệm. Các hành động
                hợp lệ sẽ cộng điểm thêm; lời nguyện vẫn cần duyệt.
              </p>
              <button
                className="button secondary"
                disabled={!connected || busy}
                onClick={() =>
                  void run(
                    () => api("replay", { limit: 20 }),
                    "Đã phát lại sự kiện.",
                  )
                }
              >
                <RotateCcw size={16} />
                Phát lại 20 sự kiện
              </button>
            </section>
          </div>
        )}
        <footer className="page-footer">
          <span>Tâm An Vạn Sự An LIVE</span>
          <span>
            <ShieldCheck size={13} />
            Được lưu trên máy của bạn
          </span>
        </footer>
      </main>
    </div>
  );
}
function EventList({ state }: { state?: AdminSnapshot }) {
  return (
    <div className="event-list" aria-label="Sự kiện gần đây">
      {!state?.recent.length ? (
        <div className="event-empty">
          <Activity size={22} />
          <p>
            Chùa đang yên tĩnh.
            <br />
            <span>Thử một tương tác để bắt đầu.</span>
          </p>
        </div>
      ) : (
        state.recent.slice(0, 5).map((event) => (
          <div className="event-row" key={event.id}>
            <span className={`event-icon ${event.type}`}>
              {event.type === "gift" ? (
                <Gift size={16} />
              ) : event.type === "comment" ? (
                <Flower2 size={16} />
              ) : (
                <Users size={16} />
              )}
            </span>
            <div>
              <strong>{event.userName}</strong>
              <span>
                {resultLabels[event.result] ?? event.result}
                {event.giftId ? ` · ${event.giftId}` : ""}
              </span>
            </div>
            <time>
              {new Date(event.at).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        ))
      )}
    </div>
  );
}
