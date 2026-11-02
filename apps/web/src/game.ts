import Phaser from "phaser";
import type { Ceremony, Visitor } from "../../../packages/shared/src/index.ts";
import type { TempleClient } from "./api";
export interface GameStats {
  ready: boolean;
  fps: number;
  visibleVisitors: number;
  effects: number;
  peakEffects: number;
  frames: number;
  frameTimes: number[];
  renderer: string;
  gpu: string;
  updateMs: number;
}
declare global {
  interface Window {
    __TEMPLE_STATS__?: GameStats;
  }
}
interface VisitorArt {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  aura: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  curX: number;
  curY: number;
  curScale: number;
  initialized: boolean;
}
interface AltarHonorSlot {
  visitorId: string;
  spotIndex: number; // 0: center (540), 1: left (385), 2: right (695)
  action: NonNullable<Visitor["action"]>;
  startedAt: number;
  until: number;
  isGift: boolean;
  lastSmokeAt: number;
}
interface Particle {
  image: Phaser.GameObjects.Image;
  start: number;
  duration: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: string;
  size: number;
}

const MAX_ALTAR_HONOR = 3;
const ALTAR_SPOTS = [
  { x: 540, y: 1058, scale: 0.96 }, // Vị trí chính giữa trước lư hương
  { x: 382, y: 1076, scale: 0.92 }, // Vị trí bên trái bàn thờ
  { x: 698, y: 1076, scale: 0.92 }, // Vị trí bên phải bàn thờ
];
const HONOR_ACTION_TEXT: Record<NonNullable<Visitor["action"]>, string> = {
  lotus: "✦ Dâng Hoa Lễ Phật",
  incense: "✦ Lên Thắp Hương",
  bow: "✦ Lên Vái Lạy",
  prayer: "✦ Dâng Lời Nguyện",
};

export function mountGame(parent: HTMLElement, client: TempleClient) {
  const capture = new URLSearchParams(location.search).has("capture");
  const stats: GameStats = {
    ready: false,
    fps: 0,
    visibleVisitors: 0,
    effects: 0,
    peakEffects: 0,
    frames: 0,
    frameTimes: [],
    renderer: "",
    gpu: "",
    updateMs: 0,
  };
  window.__TEMPLE_STATS__ = stats;
  class TempleScene extends Phaser.Scene {
    private visitors = new Map<string, VisitorArt>();
    private honorSlots: AltarHonorSlot[] = [];
    private processedActions = new Map<string, number>();
    private particles: Particle[] = [];
    private seen = new Set<string>();
    private cameraMode = "";
    private camX = 540;
    private camY = 950;
    private camZoom = 1.07;
    private ceremonyBoostUntil = 0;
    private started = 0;
    private lastStats = 0;
    private lastRawFrame = 0;
    private unsubscribe?: () => void;
    private hall!: Phaser.GameObjects.Image;
    private altar!: Phaser.GameObjects.Image;
    private light!: Phaser.GameObjects.Image;
    private lanterns: Phaser.GameObjects.Image[] = [];
    private ready = false;
    private hasSnapshot = false;
    private sessionId = "";
    private communalBowUntil = 0;
    private audienceStartedAt = 0;
    private audienceEndsAt = 0;
    private audienceLift = 0;
    private reducedMotion = false;
    constructor() {
      super("temple");
    }
    preload() {
      this.load.image("hall", "/assets/temple-hall.webp");
      this.load.image("altar", "/assets/altar.webp");
      this.load.spritesheet("visitor", "/assets/visitors.png", {
        frameWidth: 512,
        frameHeight: 512,
      });
      this.load.on("loaderror", () => {
        parent.dataset.loadError =
          "Một hình ảnh chưa tải được. Vui lòng tải lại.";
      });
    }
    create() {
      this.started = this.time.now;
      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      this.hall = this.add
        .image(540, 960, "hall")
        .setDisplaySize(capture ? 1080 : 1160, capture ? 1920 : 2050)
        .setDepth(0);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255,222,134,.55)");
      gradient.addColorStop(0.28, "rgba(255,179,66,.17)");
      gradient.addColorStop(1, "rgba(255,140,20,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      this.textures.addCanvas("glow", canvas);
      const spark = this.add.graphics();
      spark.fillStyle(0xffe9a9);
      spark.fillCircle(8, 8, 6);
      spark.generateTexture("spark", 16, 16);
      spark.destroy();
      const petal = this.add.graphics();
      petal.fillStyle(0xf6a2bd);
      petal.fillEllipse(12, 16, 16, 28);
      petal.fillStyle(0xffd4cb);
      petal.fillEllipse(10, 13, 5, 18);
      petal.generateTexture("petal", 24, 32);
      petal.destroy();
      this.light = this.add
        .image(540, 670, "glow")
        .setDisplaySize(850, 1050)
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.altar = this.add
        .image(540, 1050, "altar")
        .setOrigin(0.5, 1)
        .setDisplaySize(610, 762)
        .setDepth(2);
      for (const x of [160, 920])
        this.lanterns.push(
          this.add
            .image(x, 840, "glow")
            .setDisplaySize(240, 330)
            .setAlpha(0.35)
            .setDepth(3)
            .setBlendMode(Phaser.BlendModes.ADD),
        );
      for (let i = 0; i < 180; i++)
        this.particles.push({
          image: this.add.image(0, 0, "spark").setVisible(false).setDepth(2500),
          start: 0,
          duration: 0,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          kind: "spark",
          size: 1,
        });
      this.unsubscribe = client.subscribe(() => this.sync());
      this.events.once("shutdown", () => this.unsubscribe?.());
      this.ready = true;
      stats.ready = true;
      stats.renderer =
        this.game.renderer.type === Phaser.WEBGL ? "WebGL" : "Canvas";
      const gl = (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl;
      const debug = gl?.getExtension("WEBGL_debug_renderer_info");
      stats.gpu = debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : stats.renderer;
      parent.dataset.ready = "true";
      this.sync();
    }
    private assignHonorSlot(v: Visitor, now: number) {
      if (capture || !v.action || v.actionAt <= 0) return;
      const prevAt = this.processedActions.get(v.id) ?? 0;
      if (v.actionAt <= prevAt) return;
      this.processedActions.set(v.id, v.actionAt);
      if (Math.abs(now - v.actionAt) > 6000) return;

      const isGift = v.action === "lotus";
      const duration = isGift ? 14000 : 8500;
      this.honorSlots = this.honorSlots.filter((s) => s.until > now);

      const existing = this.honorSlots.find((s) => s.visitorId === v.id);
      if (existing) {
        existing.action = v.action;
        existing.startedAt = now;
        existing.until = now + duration;
        existing.isGift = existing.isGift || isGift;
        return;
      }

      if (this.honorSlots.length < MAX_ALTAR_HONOR) {
        const usedSpots = new Set(this.honorSlots.map((s) => s.spotIndex));
        const freeSpot = [0, 1, 2].find((idx) => !usedSpots.has(idx)) ?? 0;
        this.honorSlots.push({
          visitorId: v.id,
          spotIndex: freeSpot,
          action: v.action,
          startedAt: now,
          until: now + duration,
          isGift,
          lastSmokeAt: 0,
        });
      } else if (isGift) {
        // Nếu người xem tặng quà mà cả 3 vị trí đã đầy, ưu tiên nhường chỗ của khách thường hoặc người đứng lâu nhất
        const replaceable =
          this.honorSlots
            .filter((s) => !s.isGift)
            .sort((a, b) => a.startedAt - b.startedAt)[0] ??
          this.honorSlots.sort((a, b) => a.startedAt - b.startedAt)[0];
        if (replaceable) {
          replaceable.visitorId = v.id;
          replaceable.action = v.action;
          replaceable.startedAt = now;
          replaceable.until = now + duration;
          replaceable.isGift = true;
          replaceable.lastSmokeAt = 0;
        }
      }
    }
    private spawnAltarOfferingEffect(
      x: number,
      y: number,
      action: NonNullable<Visitor["action"]>,
    ) {
      let spawned = 0;
      const limit = action === "lotus" ? 4 : 2;
      for (const p of this.particles) {
        if (p.duration > 0) continue;
        p.kind =
          action === "lotus"
            ? "petal"
            : action === "incense"
              ? "smoke"
              : "spark";
        p.start = this.time.now;
        p.duration = 2600 + (spawned % 3) * 400;
        p.x = x + (Math.random() - 0.5) * 44;
        p.y = y - 70;
        p.vx = (Math.random() - 0.5) * 24;
        p.vy = -(38 + Math.random() * 28);
        p.size = p.kind === "petal" ? 16 : p.kind === "smoke" ? 72 : 7;
        p.image
          .setTexture(
            p.kind === "petal"
              ? "petal"
              : p.kind === "smoke"
                ? "glow"
                : "spark",
          )
          .setVisible(true)
          .setTint(p.kind === "smoke" ? 0xd8cfc0 : 0xffe8a3)
          .setAlpha(0.75);
        if (++spawned >= limit) break;
      }
    }
    private sync() {
      if (!this.ready || !client.state) return;
      const state = client.state,
        now = Date.now(),
        ids = new Set(state.visitors.map((v) => v.id));
      for (const [id, art] of this.visitors)
        if (!ids.has(id)) {
          art.sprite.destroy();
          art.shadow.destroy();
          art.aura.destroy();
          art.label.destroy();
          this.visitors.delete(id);
          this.processedActions.delete(id);
        }
      this.honorSlots = this.honorSlots.filter(
        (s) => ids.has(s.visitorId) && s.until > now,
      );
      for (const v of state.visitors) {
        if (!this.visitors.has(v.id)) {
          this.visitors.set(v.id, {
            sprite: this.add
              .image(0, 0, "visitor", (v.variant % 2) * 4 + 1)
              .setOrigin(0.5, 490 / 512),
            shadow: this.add.ellipse(0, 0, 70, 18, 0x160d08, 0.32),
            aura: this.add
              .image(0, 0, "glow")
              .setDisplaySize(165, 68)
              .setAlpha(0)
              .setBlendMode(Phaser.BlendModes.ADD),
            label: this.add
              .text(0, 0, v.name, {
                fontFamily: '"Be Vietnam Pro"',
                fontSize: "22px",
                color: "#fff0d1",
                backgroundColor: "#291b12e8",
                padding: { left: 8, right: 8, top: 4, bottom: 4 },
              })
              .setOrigin(0.5, 0),
            curX: 540,
            curY: 1350,
            curScale: 0.85,
            initialized: false,
          });
          if (v.actionAt > 0 && Math.abs(now - v.actionAt) > 6000) {
            this.processedActions.set(v.id, v.actionAt);
          }
        }
        this.assignHonorSlot(v, now);
      }
      if (!this.hasSnapshot || state.session.id !== this.sessionId) {
        this.hasSnapshot = true;
        this.sessionId = state.session.id;
        this.seen = new Set(state.ceremonies.map((c) => c.id));
      } else {
        for (const c of state.ceremonies)
          if (!this.seen.has(c.id)) {
            this.seen.add(c.id);
            if (!capture && Math.abs(state.serverTime - c.at) < 2500) {
              if (c.action === "audience-milestone")
                this.celebrateAudience(c.count, c.intensity);
              if (c.intensity >= 2 || c.action === "milestone")
                this.ceremonyBoostUntil = this.time.now + 5500;
              this.burst(c.action, c.intensity, c.count);
            }
          }
      }
      if (this.seen.size > 256)
        this.seen = new Set(state.ceremonies.map((c) => c.id));
    }
    private burst(action: Ceremony["action"], intensity: number, count = 0) {
      const amount =
        action === "audience-milestone"
          ? Math.min(
              120,
              (count >= 1000 ? 90 : 24 + intensity * 16) *
                (this.reducedMotion ? 0.3 : 1),
            )
          : action === "milestone"
            ? 90
            : action === "like"
              ? 8
              : action === "share"
                ? 16
                : 20 * intensity;
      let spawned = 0;
      for (const p of this.particles) {
        if (p.duration > 0) continue;
        const i = spawned++,
          angle = i * 2.399963 + this.time.now * 0.0001;
        p.kind =
          action === "lotus" ||
          action === "milestone" ||
          action === "audience-milestone"
            ? "petal"
            : action === "incense"
              ? "smoke"
              : "spark";
        p.start = this.time.now;
        p.duration = 3500 + (i % 5) * 350;
        p.x = 540 + Math.sin(angle) * 170;
        p.y = 1130 + (i % 4) * 45;
        p.vx = Math.sin(angle) * 65;
        p.vy = -(70 + (i % 7) * 20);
        p.size = p.kind === "petal" ? 18 : p.kind === "smoke" ? 100 : 8;
        p.image
          .setTexture(
            p.kind === "petal"
              ? "petal"
              : p.kind === "smoke"
                ? "glow"
                : "spark",
          )
          .setVisible(true)
          .setTint(p.kind === "smoke" ? 0xbcb4a4 : 0xffffff)
          .setAlpha(0.8);
        if (spawned >= amount) break;
      }
    }
    private celebrateAudience(count: number, intensity: number) {
      const now = this.time.now;
      this.communalBowUntil = Date.now() + 4200;
      if (this.reducedMotion) return;
      this.audienceStartedAt = now;
      this.audienceEndsAt = now + 6500;
      this.audienceLift = count >= 1000 ? 0.24 : intensity >= 2 ? 0.14 : 0.07;
    }
    private pose(
      v: Visitor,
      now: number,
      honorSlot: AltarHonorSlot | undefined,
      isWalking: boolean,
    ) {
      if (now - v.joinedAt < 1400 || v.expiresAt - now < 1800) return 0;
      if (isWalking) return 0; // Đứng/bước trang nghiêm khi đang di chuyển lên bàn thờ hoặc lùi về
      if (honorSlot) {
        const honorAge = now - honorSlot.startedAt;
        if (honorSlot.action === "lotus") {
          // Dâng hoa sen xen kẽ cúi lạy trước bàn thờ
          return Math.floor(honorAge / 2800) % 2 === 0 ? 3 : 2;
        }
        if (honorSlot.action === "bow") {
          return Math.floor(honorAge / 2400) % 2 === 0 ? 2 : 1;
        }
        // Thắp hương hoặc cầu nguyện: thành kính dâng lễ rồi vái lạy
        return honorAge < 3200 ? 3 : 2;
      }
      const age = now - Math.max(v.actionAt, v.joinedAt + 1400);
      if (v.action && age >= 650 && age < 3600) {
        if (v.action === "bow") return 2;
        if (v.action === "lotus") return 3;
        return 1;
      }
      if (now < this.communalBowUntil) return 2;
      return 1;
    }
    update(time: number, delta: number) {
      if (!this.ready) return;
      const updateStart = performance.now(),
        state = client.state,
        visualTime = capture ? 5000 : time,
        now = capture ? (state?.serverTime ?? Date.now()) + 6000 : Date.now();
      if (state) {
        const mode = state.settings.camera;
        if (capture || this.reducedMotion) {
          if (mode !== this.cameraMode) {
            this.cameraMode = mode;
            this.cameras.main.setZoom(mode === "close" ? 1.42 : 1);
            this.cameras.main.centerOn(540, mode === "close" ? 790 : 960);
          }
        } else {
          // Nhịp lia máy cực kỳ chậm rãi, tĩnh tại và thanh tịnh (~95 giây / chu kỳ)
          const ceremonyFocus = this.ceremonyBoostUntil > time ? 1 : 0;
          let targetZoom: number;
          let targetX: number;
          let targetY: number;

          if (state.settings.autoCamera) {
            const tourWave = (1 - Math.cos(visualTime * 0.000066)) * 0.5;
            const baseSweep =
              mode === "close" ? 0.5 + tourWave * 0.5 : tourWave * 0.85;
            const focusSweep = Math.min(1, baseSweep + ceremonyFocus * 0.16);
            targetZoom =
              1.06 +
              focusSweep * 0.26 +
              Math.sin(visualTime * 0.00014) * 0.012;
            targetX =
              540 +
              Math.sin(visualTime * 0.000095) * 24 +
              Math.cos(visualTime * 0.00005) * 10;
            targetY =
              965 -
              focusSweep * 165 +
              Math.cos(visualTime * 0.00008) * 14;
          } else if (mode === "close") {
            targetZoom =
              1.36 +
              ceremonyFocus * 0.04 +
              Math.sin(visualTime * 0.00012) * 0.02;
            targetX = 540 + Math.sin(visualTime * 0.00009) * 18;
            targetY = 805 + Math.cos(visualTime * 0.00008) * 12;
          } else {
            targetZoom =
              1.07 +
              ceremonyFocus * 0.05 +
              Math.sin(visualTime * 0.00011) * 0.018;
            targetX = 540 + Math.sin(visualTime * 0.00009) * 22;
            targetY =
              950 -
              ceremonyFocus * 30 +
              Math.cos(visualTime * 0.00008) * 14;
          }

          const smooth = Math.min(1, Math.max(0.004, delta * 0.00075));
          this.camX += (targetX - this.camX) * smooth;
          this.camY += (targetY - this.camY) * smooth;
          this.camZoom += (targetZoom - this.camZoom) * smooth;

          this.cameras.main.setZoom(this.camZoom);
          this.cameras.main.centerOn(this.camX, this.camY);

          // Hiệu ứng chiều sâu 2.5D nhẹ nhàng theo nhịp thở của máy quay
          const dx = this.camX - 540;
          const dy = this.camY - 920;
          this.hall.setPosition(540 + dx * 0.18, 960 + dy * 0.18);
          this.altar.setPosition(540 + dx * 0.04, 1050 + dy * 0.04);
          this.light.setPosition(540 + dx * 0.06, 670 + dy * 0.06);
          this.lanterns.forEach((l, i) => {
            const baseX = i === 0 ? 160 : 920;
            const sway = Math.sin(visualTime * 0.0006 + i * 1.7) * 4;
            l.setPosition(baseX - dx * 0.1 + sway, 840 - dy * 0.06);
          });
        }

        const audienceProgress =
          this.audienceEndsAt > time
            ? Math.min(
                1,
                (time - this.audienceStartedAt) / 800,
                (this.audienceEndsAt - time) / 1800,
              )
            : 0;
        const glow = Math.max(0, audienceProgress) * this.audienceLift;
        const lightPulse = this.reducedMotion
          ? 0
          : Math.sin(visualTime * 0.0005) * 0.05;
        const lanternPulse = this.reducedMotion ? 0 : 0.03;
        this.light.setAlpha(
          0.68 +
            Math.min(0.18, state.milestones.length * 0.04) +
            lightPulse +
            glow,
        );
        this.lanterns.forEach((l, i) =>
          l.setAlpha(
            0.24 +
              Math.min(0.3, state.milestones.length * 0.06) +
              (this.reducedMotion
                ? 0
                : Math.sin(visualTime * 0.0012 + i) * lanternPulse) +
              glow * 0.6,
          ),
        );

        // Làm sạch danh sách 3 vị trí danh dự trước bàn thờ nếu đã hết thời gian hành lễ
        this.honorSlots = this.honorSlots.filter((s) => s.until > now);

        for (const v of state.visitors) {
          const art = this.visitors.get(v.id);
          if (!art) continue;
          const row = Math.floor(v.slot / 5),
            col = v.slot % 5,
            spread = 108 + row * 17,
            baseX = 540 + (col - 2) * spread,
            baseY = 1190 + row * 84,
            baseScale = 0.8 + row * 0.085;

          const honorSlot = capture
            ? undefined
            : this.honorSlots.find((s) => s.visitorId === v.id);
          const targetSpot = honorSlot
            ? ALTAR_SPOTS[honorSlot.spotIndex]
            : { x: baseX, y: baseY, scale: baseScale };

          if (!art.initialized || capture) {
            art.curX = targetSpot.x;
            art.curY = targetSpot.y;
            art.curScale = targetSpot.scale;
            art.initialized = true;
          } else {
            const walkLerp = Math.min(1, Math.max(0.02, delta * 0.0032));
            art.curX += (targetSpot.x - art.curX) * walkLerp;
            art.curY += (targetSpot.y - art.curY) * walkLerp;
            art.curScale += (targetSpot.scale - art.curScale) * walkLerp;
          }

          const distToTarget = Math.hypot(
            targetSpot.x - art.curX,
            targetSpot.y - art.curY,
          );
          const isWalking = !capture && distToTarget > 18;
          // Hiệu ứng nhịp bước chân nhẹ nhàng khi đang tiến lên bàn thờ hoặc lùi về
          const walkBob = isWalking
            ? Math.abs(Math.sin(visualTime * 0.012 + v.slot)) * -6
            : 0;

          const entry = Phaser.Math.Clamp((now - v.joinedAt) / 1400, 0, 1),
            exit = Phaser.Math.Clamp((v.expiresAt - now) / 1800, 0, 1),
            offset = (1 - entry) * 100 - (1 - exit) * 80;
          const pose = this.pose(v, now, honorSlot, isWalking),
            breathe =
              pose === 1 && !isWalking
                ? Math.sin(visualTime * 0.0015 + v.slot) * 1.3
                : 0;

          const drawX = art.curX;
          const drawY = art.curY + offset + breathe + walkBob;
          const drawScale = art.curScale;
          const alpha = Math.min(entry, exit);

          art.sprite
            .setFrame((v.variant % 2) * 4 + pose)
            .setPosition(drawX, drawY)
            .setDisplaySize(154 * drawScale, 154 * drawScale)
            .setAlpha(alpha)
            .setDepth(drawY);
          art.shadow
            .setPosition(drawX, art.curY + 3)
            .setScale(drawScale)
            .setAlpha(0.32 * alpha)
            .setDepth(drawY - 1);

          if (honorSlot) {
            art.aura
              .setPosition(drawX, art.curY + 2)
              .setDisplaySize(175 * drawScale, 72 * drawScale)
              .setAlpha(
                (0.42 + Math.sin(visualTime * 0.003) * 0.1) * alpha,
              )
              .setDepth(drawY - 2);
            if (!isWalking && time - honorSlot.lastSmokeAt > 1300) {
              honorSlot.lastSmokeAt = time;
              this.spawnAltarOfferingEffect(
                drawX,
                art.curY,
                honorSlot.action,
              );
            }
            const honorLabel = `${v.name} · ${HONOR_ACTION_TEXT[honorSlot.action]}`;
            if (art.label.text !== honorLabel) {
              art.label.setText(honorLabel);
              art.label.setStyle({
                fontFamily: '"Be Vietnam Pro"',
                fontSize: "21px",
                color: "#ffe8a3",
                backgroundColor: "#3b2310f2",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
              });
            }
          } else {
            art.aura.setAlpha(0);
            if (art.label.text !== v.name) {
              art.label.setText(v.name);
              art.label.setStyle({
                fontFamily: '"Be Vietnam Pro"',
                fontSize: "22px",
                color: "#fff0d1",
                backgroundColor: "#291b12e8",
                padding: { left: 8, right: 8, top: 4, bottom: 4 },
              });
            }
          }

          art.label
            .setPosition(drawX, art.curY + 10)
            .setScale(Math.min(1, drawScale))
            .setVisible(
              entry === 1 &&
                exit === 1 &&
                (!!honorSlot || (!!v.action && now - v.actionAt < 5000)),
            )
            .setDepth(2600);
        }
      }
      let active = 0;
      for (const p of this.particles) {
        if (p.duration === 0) continue;
        const age = time - p.start,
          t = age / p.duration;
        if (t >= 1) {
          p.duration = 0;
          p.image.setVisible(false);
          continue;
        }
        active++;
        p.image
          .setPosition(
            p.x + (p.vx * age) / 1000 + Math.sin(age * 0.002) * 18,
            p.y + (p.vy * age) / 1000,
          )
          .setAlpha((1 - t) * (p.kind === "smoke" ? 0.22 : 0.85))
          .setDisplaySize(
            p.size * (1 + t * 0.8),
            p.size * (p.kind === "petal" ? 1.4 : 1) * (1 + t * 0.8),
          )
          .setRotation(p.kind === "petal" ? t * 3 : 0);
      }
      stats.frames++;
      stats.effects = active;
      stats.peakEffects = Math.max(stats.peakEffects, active);
      stats.visibleVisitors = this.visitors.size;
      if (this.lastRawFrame) {
        stats.frameTimes.push(updateStart - this.lastRawFrame);
        if (stats.frameTimes.length > 7200) stats.frameTimes.splice(0, 120);
      }
      this.lastRawFrame = updateStart;
      stats.updateMs = performance.now() - updateStart;
      if (time - this.lastStats > 1000) {
        this.lastStats = time;
        const recent = stats.frameTimes.slice(-60);
        stats.fps = recent.length
          ? 1000 / (recent.reduce((a, b) => a + b, 0) / recent.length)
          : 0;
      }
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1080,
    height: 1920,
    backgroundColor: "#20150b",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    fps: { target: 60 },
    scene: [TempleScene],
    audio: { noAudio: true },
  });
}
