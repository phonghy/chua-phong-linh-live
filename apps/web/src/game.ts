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
  halo: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  curX: number;
  curY: number;
  curScale: number;
  initialized: boolean;
  wishTime?: number;
}
interface AltarHonorSlot {
  visitorId: string;
  spotIndex: number; // 0: center (540), 1: left (385), 2: right (695)
  action: NonNullable<Visitor["action"]>;
  startedAt: number;
  until: number;
  isGift: boolean;
  lastSmokeAt: number;
  intensity?: number;
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
  targetX?: number;
  targetY?: number;
}

const MAX_ALTAR_HONOR = 3;
const ALTAR_SPOTS = [
  { x: 540, y: 1052, scale: 0.74 }, // Vị trí chính giữa trước lư hương
  { x: 416, y: 1068, scale: 0.71 }, // Vị trí bên trái bàn thờ
  { x: 664, y: 1068, scale: 0.71 }, // Vị trí bên phải bàn thờ
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
    private camY = 960;
    private camZoom = 1;
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
    private milestoneCeremonyUntil = 0;
    private audienceStartedAt = 0;
    private audienceEndsAt = 0;
    private audienceLift = 0;
    private reducedMotion = false;
    constructor() {
      super("temple");
    }
    preload() {
      this.load.image("hall", "/assets/temple-hall-wide.jpg");
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
        .setDisplaySize(1120, 1960)
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

      // Golden Petal (Cánh sen vàng đại lễ)
      const goldPetal = this.add.graphics();
      goldPetal.fillStyle(0xffdf58);
      goldPetal.fillEllipse(12, 16, 16, 28);
      goldPetal.fillStyle(0xfffbe6);
      goldPetal.fillEllipse(10, 13, 6, 18);
      goldPetal.generateTexture("gold_petal", 24, 32);
      goldPetal.destroy();

      // Halo Canvas - Vòng Hào Quang Phật Đắc Đạo (Divine Buddha Halo)
      const haloCanvas = document.createElement("canvas");
      haloCanvas.width = 256;
      haloCanvas.height = 256;
      const hCtx = haloCanvas.getContext("2d")!;
      const hGrad = hCtx.createRadialGradient(128, 128, 8, 128, 128, 128);
      hGrad.addColorStop(0, "rgba(255, 248, 200, 0.95)");
      hGrad.addColorStop(0.35, "rgba(255, 215, 80, 0.65)");
      hGrad.addColorStop(0.68, "rgba(255, 160, 40, 0.35)");
      hGrad.addColorStop(0.9, "rgba(255, 120, 20, 0.12)");
      hGrad.addColorStop(1, "rgba(255, 100, 0, 0)");
      hCtx.fillStyle = hGrad;
      hCtx.fillRect(0, 0, 256, 256);
      hCtx.save();
      hCtx.translate(128, 128);
      hCtx.strokeStyle = "rgba(255, 240, 160, 0.45)";
      hCtx.lineWidth = 3;
      for (let r = 0; r < 24; r++) {
        hCtx.rotate((Math.PI * 2) / 24);
        hCtx.beginPath();
        hCtx.moveTo(0, r % 2 === 0 ? 32 : 48);
        hCtx.lineTo(0, r % 2 === 0 ? 122 : 105);
        hCtx.stroke();
      }
      hCtx.strokeStyle = "rgba(255, 255, 220, 0.85)";
      hCtx.lineWidth = 4;
      hCtx.beginPath();
      hCtx.arc(0, 0, 52, 0, Math.PI * 2);
      hCtx.stroke();
      hCtx.strokeStyle = "rgba(255, 215, 100, 0.7)";
      hCtx.lineWidth = 2.5;
      hCtx.beginPath();
      hCtx.arc(0, 0, 96, 0, Math.PI * 2);
      hCtx.stroke();
      hCtx.restore();
      this.textures.addCanvas("halo", haloCanvas);

      // Wish Firefly (Hạt nguyện ước hoàng kim bay lên bàn thờ khi bình luận)
      const wishCanvas = document.createElement("canvas");
      wishCanvas.width = 64;
      wishCanvas.height = 64;
      const wCtx = wishCanvas.getContext("2d")!;
      const wGrad = wCtx.createRadialGradient(32, 32, 2, 32, 32, 32);
      wGrad.addColorStop(0, "rgba(255, 255, 230, 1)");
      wGrad.addColorStop(0.35, "rgba(255, 220, 100, 0.85)");
      wGrad.addColorStop(0.7, "rgba(255, 170, 40, 0.35)");
      wGrad.addColorStop(1, "rgba(255, 140, 0, 0)");
      wCtx.fillStyle = wGrad;
      wCtx.fillRect(0, 0, 64, 64);
      this.textures.addCanvas("wish_firefly", wishCanvas);
      this.light = this.add
        .image(540, 760, "glow")
        .setDisplaySize(640, 780)
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.altar = this.add
        .image(540, 1028, "altar")
        .setOrigin(0.5, 1)
        .setDisplaySize(416, 520)
        .setDepth(2);
      for (const x of [160, 920])
        this.lanterns.push(
          this.add
            .image(x, 840, "glow")
            .setDisplaySize(200, 270)
            .setAlpha(0.2)
            .setDepth(3)
            .setBlendMode(Phaser.BlendModes.ADD),
        );
      for (let i = 0; i < 260; i++)
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
    private assignHonorSlot(v: Visitor, now: number, intensity = 1) {
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
          intensity,
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
          art.halo?.destroy();
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
            halo: this.add
              .image(0, 0, "halo")
              .setDisplaySize(160, 160)
              .setAlpha(0)
              .setVisible(false)
              .setBlendMode(Phaser.BlendModes.ADD),
            label: this.add
              .text(0, 0, v.name, {
                fontFamily: '"Be Vietnam Pro"',
                fontSize: "17px",
                color: "#fff0d1",
                backgroundColor: "#24170ecf",
                padding: { left: 6, right: 6, top: 2, bottom: 2 },
              })
              .setOrigin(0.5, 1),
            curX: 540,
            curY: 1350,
            curScale: 0.85,
            initialized: false,
          });
          if (v.actionAt > 0 && Math.abs(now - v.actionAt) > 6000) {
            this.processedActions.set(v.id, v.actionAt);
          }
        }
        const recentCeremony = state.ceremonies.find(
          (c) => c.name === v.name && Math.abs(now - c.at) < 6000,
        );
        this.assignHonorSlot(v, now, recentCeremony?.intensity ?? 1);
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
              if (c.action === "milestone") {
                this.ceremonyBoostUntil = this.time.now + 6000;
                this.milestoneCeremonyUntil = this.time.now + 6000;
              } else if (c.intensity >= 4) {
                // Tier 4: Đại Thí Chủ - Tất cả đạo tràng đồng loạt quỳ lạy và zoom cận
                this.ceremonyBoostUntil = this.time.now + 6500;
                this.communalBowUntil = Date.now() + 6500;
                if (!this.reducedMotion) this.cameras.main.shake(380, 0.005);
              } else if (c.intensity >= 2) {
                this.ceremonyBoostUntil = this.time.now + 5500;
              }
              if (c.action === "comment") {
                this.celebrateComment(c.name);
              } else {
                this.burst(c.action, c.intensity, c.count);
              }
            }
          }
      }
      if (this.seen.size > 256)
        this.seen = new Set(state.ceremonies.map((c) => c.id));
    }
    private burst(action: Ceremony["action"], intensity: number, count = 0) {
      const isTier4 = intensity >= 4;
      const isTier3 = intensity === 3;
      const amount =
        action === "audience-milestone"
          ? Math.min(
              120,
              (count >= 1000 ? 90 : 24 + intensity * 16) *
                (this.reducedMotion ? 0.3 : 1),
            )
          : action === "milestone"
            ? 110
            : isTier4
              ? 130
              : isTier3
                ? 70
                : action === "like"
                  ? 8
                  : action === "share"
                    ? 18
                    : 22 * intensity;
      let spawned = 0;
      for (const p of this.particles) {
        if (p.duration > 0) continue;
        const i = spawned++,
          angle = i * 2.399963 + this.time.now * 0.0001;
        p.kind =
          isTier4 || isTier3 || action === "milestone"
            ? i % 3 === 0 ? "gold_petal" : "spark"
            : action === "lotus" || action === "audience-milestone"
              ? "petal"
              : action === "incense"
                ? "smoke"
                : "spark";
        p.start = this.time.now;
        p.duration = (isTier4 ? 4500 : 3500) + (i % 5) * 350;
        p.x = 540 + Math.sin(angle) * (isTier4 ? 260 : 170);
        p.y = 1130 + (i % 4) * 45;
        p.vx = Math.sin(angle) * (isTier4 ? 90 : 65);
        p.vy = -(isTier4 ? 95 : 70 + (i % 7) * 20);
        p.size =
          p.kind === "gold_petal"
            ? isTier4 ? 26 : 21
            : p.kind === "petal"
              ? 18
              : p.kind === "smoke"
                ? 100
                : 9;
        p.image
          .setTexture(
            p.kind === "gold_petal"
              ? "gold_petal"
              : p.kind === "petal"
                ? "petal"
                : p.kind === "smoke"
                  ? "glow"
                  : "spark",
          )
          .setVisible(true)
          .setTint(p.kind === "smoke" ? 0xbcb4a4 : isTier4 ? 0xffea70 : 0xffffff)
          .setAlpha(0.85);
        if (spawned >= amount) break;
      }
    }
    private celebrateComment(userName: string) {
      const art = Array.from(this.visitors.values()).find((a) => a.label.text === userName);
      if (art) {
        art.wishTime = this.time.now;
        this.spawnWishSpark(art.curX, art.curY);
      }
    }
    private spawnWishSpark(x: number, y: number) {
      for (const p of this.particles) {
        if (p.duration > 0) continue;
        p.kind = "wish";
        p.start = this.time.now;
        p.duration = 3200;
        p.x = x;
        p.y = y - 30;
        p.targetX = 540;
        p.targetY = 1020;
        p.vx = (540 - x) / 3.2;
        p.vy = (1020 - (y - 30)) / 3.2;
        p.size = 20;
        p.image
          .setTexture("wish_firefly")
          .setVisible(true)
          .setTint(0xffea9f)
          .setAlpha(0.9);
        break;
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
        const cameraPresets: Record<string, { x: number; y: number; zoom: number }> = {
          altar: { x: 540, y: 720, zoom: 2.05 },  // Cận Tam Bảo (Nâng cao đưa tượng Phật vào trung tâm)
          honor: { x: 540, y: 1045, zoom: 2.24 }, // 3 Vị trí danh dự trước bàn thờ
          aisle: { x: 540, y: 1140, zoom: 1.48 }, // Giữa hành lang (Lối đi chính giữa nhìn lên)
          left: { x: 335, y: 1320, zoom: 1.85 },  // Khối Tả (Hàng Phật tử cánh trái)
          right: { x: 745, y: 1320, zoom: 1.85 }, // Khối Hữu (Hàng Phật tử cánh phải)
          close: { x: 540, y: 1045, zoom: 2.24 }, // Tương thích góc cận cũ
          wide: { x: 540, y: 1010, zoom: 1.08 },  // Toàn cảnh đại điện (Thấy 200 người quỳ)
        };

        if (capture || this.reducedMotion) {
          if (mode !== this.cameraMode) {
            this.cameraMode = mode;
            const preset = cameraPresets[mode] ?? cameraPresets.wide;
            this.cameras.main.setZoom(preset.zoom);
            this.cameras.main.centerOn(preset.x, preset.y);
          }
        } else {
          // Chu trình lia máy đa góc nhìn hoặc điều chỉnh thủ công chính xác
          const ceremonyFocus = this.ceremonyBoostUntil > time ? 1 : 0;
          let targetZoom: number;
          let targetX: number;
          let targetY: number;

          if (state.settings.autoCamera) {
            const tourKeyframes = [
              // 1. CẬN SÁT 3 NGƯỜI LÊN DÂNG LỄ & THẮP HƯƠNG (Tâm trước lư hương, zoom 2.24)
              { x: 540, y: 1045, zoom: 2.24 },
              // 2. CẬN KHỐI PHẬT TỬ CÁNH TRÁI (Thấy rõ từng người quỳ lễ)
              { x: 335, y: 1320, zoom: 1.85 },
              // 3. Toàn cảnh đại điện trang nghiêm ấm cúng (Thấy 200 người)
              { x: 540, y: 1010, zoom: 1.08 },
              // 4. CẬN KHỐI PHẬT TỬ CÁNH PHẢI
              { x: 745, y: 1320, zoom: 1.85 },
              // 5. CẬN CAO kim thân Phật tổ đưa tượng vào trung tâm
              { x: 540, y: 720, zoom: 2.05 },
              // 6. Lối đi giữa nhìn lên hàng danh dự và chánh điện
              { x: 540, y: 1140, zoom: 1.48 },
            ];
            const stageDuration = 12500;
            const rawStage =
              (visualTime / stageDuration) % tourKeyframes.length;
            const idx = Math.floor(rawStage);
            const nextIdx = (idx + 1) % tourKeyframes.length;
            const blend = (1 - Math.cos((rawStage - idx) * Math.PI)) * 0.5;
            const cur = tourKeyframes[idx];
            const nxt = tourKeyframes[nextIdx];

            targetX =
              cur.x +
              (nxt.x - cur.x) * blend +
              Math.sin(visualTime * 0.00009) * 8;
            targetY =
              cur.y +
              (nxt.y - cur.y) * blend -
              ceremonyFocus * 30 +
              Math.cos(visualTime * 0.00008) * 6;
            targetZoom =
              cur.zoom +
              (nxt.zoom - cur.zoom) * blend +
              ceremonyFocus * 0.12 +
              Math.sin(visualTime * 0.00012) * 0.008;

            if (ceremonyFocus) {
              targetX = targetX * 0.3 + 540 * 0.7;
              targetY = targetY * 0.3 + 1045 * 0.7;
              targetZoom = Math.max(targetZoom, 2.25);
            }
          } else {
            // Điều khiển góc máy chủ động theo lựa chọn của người vận hành
            const preset = cameraPresets[mode] ?? cameraPresets.wide;
            targetX = preset.x + Math.sin(visualTime * 0.00008) * 10;
            targetY = preset.y + Math.cos(visualTime * 0.00007) * 6;
            targetZoom = preset.zoom + Math.sin(visualTime * 0.0001) * 0.004;

            if (ceremonyFocus) {
              targetX = targetX * 0.3 + 540 * 0.7;
              targetY = targetY * 0.3 + 1010 * 0.7;
              targetZoom = Math.max(targetZoom, 2.2);
            }
          }

          // Tốc độ lướt chuyển mượt mà: mất khoảng 2.5 - 3s để đến góc mới êm ái, điện ảnh
          const smooth = 1 - Math.exp(-delta * 0.0018);
          this.camX += (targetX - this.camX) * smooth;
          this.camY += (targetY - this.camY) * smooth;
          this.camZoom += (targetZoom - this.camZoom) * smooth;

          this.cameras.main.setZoom(this.camZoom);
          this.cameras.main.centerOn(this.camX, this.camY);

          // Hiệu ứng chiều sâu 2.5D nhẹ nhàng theo nhịp thở của máy quay
          const dx = this.camX - 540;
          const dy = this.camY - 960;
          this.hall.setPosition(540 + dx * 0.18, 960 + dy * 0.18);
          this.altar.setPosition(540 + dx * 0.04, 1028 + dy * 0.04);
          this.light.setPosition(540 + dx * 0.06, 760 + dy * 0.06);
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
        let ceremonyDim = 1.0;
        let ceremonySurge = 0.0;
        if (this.milestoneCeremonyUntil > this.time.now) {
          const mProgress = 1 - (this.milestoneCeremonyUntil - this.time.now) / 6000;
          if (mProgress < 0.22) {
            ceremonyDim = 1 - Math.sin((mProgress / 0.22) * Math.PI * 0.5) * 0.65;
          } else if (mProgress < 0.48) {
            const wave = (mProgress - 0.22) / 0.26;
            ceremonyDim = 0.35 + wave * 0.65;
            ceremonySurge = wave * 0.25;
          } else {
            const fade = 1 - (mProgress - 0.48) / 0.52;
            ceremonySurge = fade * 0.45;
          }
        }
        const lightPulse = this.reducedMotion
          ? 0
          : Math.sin(visualTime * 0.0005) * 0.05;
        const lanternPulse = this.reducedMotion ? 0 : 0.03;
        const userBrightness = typeof state.settings.lanternBrightness === "number"
          ? state.settings.lanternBrightness
          : 0.35;
        const brightFactor = Math.max(0, Math.min(1, userBrightness));

        // Tỷ lệ ánh sáng toàn diện cho chánh điện & bóng đèn lồng:
        // Thay đổi trực tiếp độ sáng của tranh đại điện và bàn thờ:
        // - 0.0: Tắt hẳn bóng / Rất tối (22% ánh sáng nền, huyền ảo tĩnh mịch)
        // - 0.15: Tối trầm mặc (40% ánh sáng nền, ấm áp thiền định)
        // - 0.35: Dịu nhẹ ấm cúng (62% ánh sáng nền, êm mắt chuẩn chùa không còn chói)
        // - 0.60: Vừa phải (78% ánh sáng nền)
        // - 0.90: Sáng rõ (95% ánh sáng nền)
        // - 1.00: Sáng tối đa (100% ánh sáng nền)
        const ambientRatio = 0.22 + brightFactor * 0.78;
        const r = Math.min(255, Math.round(255 * ambientRatio));
        const g = Math.min(255, Math.round(246 * ambientRatio));
        const b = Math.min(255, Math.round(228 * ambientRatio));
        const ambientTint = Phaser.Display.Color.GetColor(r, g, b);

        this.hall.setTint(ambientTint);
        this.altar.setTint(ambientTint);

        if (brightFactor <= 0.01) {
          this.light.setAlpha(0);
          this.lanterns.forEach((l) => l.setAlpha(0));
        } else {
          // Quầng sáng đèn lồng và đèn chánh điện tăng giảm rõ rệt theo độ sáng người dùng chọn
          const lightAlpha =
            (0.06 + brightFactor * 0.54 + lightPulse + glow * 0.2) *
              ceremonyDim +
            ceremonySurge;
          this.light.setAlpha(Math.min(1, Math.max(0, lightAlpha)));

          this.lanterns.forEach((l, i) => {
            const lanternAlpha =
              (0.03 +
                brightFactor * 0.38 +
                (this.reducedMotion
                  ? 0
                  : Math.sin(visualTime * 0.0012 + i) * lanternPulse) +
                glow * 0.15) *
                ceremonyDim +
              ceremonySurge * 0.6;
            l.setAlpha(Math.min(1, Math.max(0, lanternAlpha)));
          });
        }

        // Làm sạch danh sách 3 vị trí danh dự trước bàn thờ nếu đã hết thời gian hành lễ
        this.honorSlots = this.honorSlots.filter((s) => s.until > now);

        for (const v of state.visitors) {
          const art = this.visitors.get(v.id);
          if (!art) continue;
          art.sprite.setTint(ambientTint);
          // Xếp 2 bên (trái/phải), mỗi hàng 8 người dàn ra 2 bên, giữ nguyên hành lang giữa, bỏ hàng đầu tiên (bắt đầu từ y=1196) và kéo dài 10 hàng xuống sát cuối màn hình (y=1790)
          const side = v.slot % 2; // 0: Bên trái, 1: Bên phải
          const sideIdx = Math.floor(v.slot / 2); // 0..99 (mỗi bên 100 người)
          const row = Math.min(9, Math.floor(sideIdx / 10)); // 0..9 (10 hàng kéo dài xuống sát cuối màn hình)
          const col = sideIdx % 10; // 0..9 (10 người mỗi hàng, mở rộng ra 2 bên)
          const aisleHalf = 76 + row * 5; // Giữ nguyên lối đi ở giữa
          const colGap = 38 + row * 0.4;
          const baseX =
            side === 0
              ? 540 - aisleHalf - col * colGap
              : 540 + aisleHalf + col * colGap;
          const baseY = 1196 + row * 66;
          const baseScale = 0.54 + row * 0.034;
          const aisleX = side === 0 ? 524 : 556;

          const honorSlot = capture
            ? undefined
            : this.honorSlots.find((s) => s.visitorId === v.id);
          const targetSpot = honorSlot
            ? ALTAR_SPOTS[honorSlot.spotIndex]
            : { x: baseX, y: baseY, scale: baseScale };

          if (!art.initialized || capture) {
            if (!capture && Math.abs(now - v.joinedAt) < 12000) {
              // Người mới vào đi từ dưới cùng của hành lang giữa đi lên rồi mới rẽ vào chỗ ngồi
              art.curX = aisleX;
              art.curY = 1890;
              art.curScale = 0.88;
            } else {
              art.curX = targetSpot.x;
              art.curY = targetSpot.y;
              art.curScale = targetSpot.scale;
            }
            art.initialized = true;
          } else {
            let wpX = targetSpot.x;
            let wpY = targetSpot.y;
            let wpScale = targetSpot.scale;

            if (honorSlot) {
              // Lên thắp hương / vái lạy: Đi từ hàng ghế ra hành lang giữa trước, rồi mới đi thẳng lên bàn thờ
              if (art.curY > 1095 && Math.abs(art.curX - aisleX) > 16) {
                wpX = aisleX;
                wpY = art.curY;
                wpScale = baseScale;
              } else if (art.curY > targetSpot.y + 24) {
                wpX = aisleX;
                wpY = targetSpot.y;
                wpScale = targetSpot.scale;
              }
            } else {
              // Vào chỗ ngồi (hoặc từ bàn thờ lùi về): Đi dọc hành lang giữa đến đúng hàng ghế rồi mới rẽ vào chỗ ngồi
              if (Math.abs(art.curY - baseY) > 14) {
                if (Math.abs(art.curX - aisleX) > 18 && art.curY < 1100) {
                  wpX = aisleX;
                  wpY = art.curY;
                } else {
                  wpX = aisleX;
                  wpY = baseY;
                }
                wpScale = Phaser.Math.Clamp(
                  0.58 + ((art.curY - 1196) / (1790 - 1196)) * (0.87 - 0.58),
                  0.55,
                  0.88,
                );
              }
            }

            const dxWp = wpX - art.curX;
            const dyWp = wpY - art.curY;
            const distWp = Math.hypot(dxWp, dyWp);
            const walkSpeed = 235;
            const step = Math.min(distWp, (walkSpeed * delta) / 1000);
            if (distWp > 0.5) {
              art.curX += (dxWp / distWp) * step;
              art.curY += (dyWp / distWp) * step;
            }
            art.curScale +=
              (wpScale - art.curScale) * Math.min(1, delta * 0.008);
          }

          const distToTarget = Math.hypot(
            targetSpot.x - art.curX,
            targetSpot.y - art.curY,
          );
          const isWalking = !capture && distToTarget > 8;
          // Hiệu ứng nhịp bước chân nhẹ nhàng khi đang tiến lên bàn thờ hoặc đi dọc hành lang
          const walkBob = isWalking
            ? Math.abs(Math.sin(visualTime * 0.012 + v.slot)) * -6
            : 0;

          const entry = Phaser.Math.Clamp((now - v.joinedAt) / 800, 0, 1),
            exit = Phaser.Math.Clamp((v.expiresAt - now) / 1800, 0, 1),
            offset = -(1 - exit) * 80;
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

          const isCommenting = art.wishTime && (now - art.wishTime < 3500);
          if (honorSlot) {
            art.aura
              .setPosition(drawX, art.curY + 2)
              .setDisplaySize(185 * drawScale, 75 * drawScale)
              .setAlpha(
                (0.48 + Math.sin(visualTime * 0.003) * 0.12) * alpha,
              )
              .setDepth(drawY - 2);
            if (honorSlot.intensity && honorSlot.intensity >= 3) {
              const isGrand = honorSlot.intensity >= 4;
              const haloSize = (isGrand ? 250 : 175) * drawScale;
              art.halo
                .setPosition(drawX, art.curY - 76 * drawScale)
                .setDisplaySize(haloSize, haloSize)
                .setRotation(visualTime * (isGrand ? 0.0022 : 0.0012))
                .setAlpha((isGrand ? 0.92 : 0.68) * alpha)
                .setTint(isGrand ? 0xffdf70 : 0xfff0aa)
                .setDepth(drawY - 1)
                .setVisible(true);
            } else {
              art.halo.setAlpha(0).setVisible(false);
            }
            if (!isWalking && time - honorSlot.lastSmokeAt > 1300) {
              honorSlot.lastSmokeAt = time;
              this.spawnAltarOfferingEffect(
                drawX,
                art.curY,
                honorSlot.action,
              );
            }
            const isGrand = (honorSlot.intensity ?? 1) >= 4;
            const honorLabel = isGrand
              ? `✦ ${v.name} · ĐẠI THÍ CHỦ ✦`
              : `${v.name} · ${HONOR_ACTION_TEXT[honorSlot.action]}`;
            if (art.label.text !== honorLabel) {
              art.label.setText(honorLabel);
              art.label.setStyle({
                fontFamily: '"Be Vietnam Pro"',
                fontSize: isGrand ? "22px" : "20px",
                color: isGrand ? "#fff3a8" : "#ffe8a3",
                backgroundColor: isGrand ? "#4a2c0dfa" : "#3b2310f2",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
              });
            }
          } else if (isCommenting) {
            art.aura
              .setPosition(drawX, art.curY + 2)
              .setDisplaySize(145 * drawScale, 58 * drawScale)
              .setAlpha(0.68 * (1 - (now - art.wishTime!) / 3500) * alpha)
              .setDepth(drawY - 2);
            art.halo.setAlpha(0).setVisible(false);
            if (art.label.text !== v.name) {
              art.label.setText(v.name);
            }
          } else {
            art.aura.setAlpha(0);
            art.halo.setAlpha(0).setVisible(false);
            if (art.label.text !== v.name) {
              art.label.setText(v.name);
              art.label.setStyle({
                fontFamily: '"Be Vietnam Pro"',
                fontSize: "17px",
                color: "#fff0d1",
                backgroundColor: "#24170ecf",
                padding: { left: 6, right: 6, top: 2, bottom: 2 },
              });
            }
          }

          const staggerY = honorSlot || isWalking ? 0 : (col % 2) * 14;
          art.label
            .setPosition(drawX, drawY - 134 * drawScale - staggerY)
            .setScale(Math.min(1, drawScale * 0.92))
            .setAlpha(alpha)
            .setVisible(alpha > 0.05)
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
        if (p.kind === "wish") {
          const sway = Math.sin(age * 0.003) * 16;
          p.image
            .setPosition(p.x + (p.vx * age) / 1000 + sway, p.y + (p.vy * age) / 1000)
            .setAlpha(Math.sin(t * Math.PI) * 0.95)
            .setDisplaySize(p.size * (1 + Math.sin(age * 0.008) * 0.25), p.size * (1 + Math.sin(age * 0.008) * 0.25))
            .setRotation(age * 0.002);
        } else {
          p.image
            .setPosition(
              p.x + (p.vx * age) / 1000 + Math.sin(age * 0.002) * 18,
              p.y + (p.vy * age) / 1000,
            )
            .setAlpha((1 - t) * (p.kind === "smoke" ? 0.22 : 0.85))
            .setDisplaySize(
              p.size * (1 + t * 0.8),
              p.size * (p.kind === "petal" || p.kind === "gold_petal" ? 1.4 : 1) * (1 + t * 0.8),
            )
            .setRotation(p.kind === "petal" || p.kind === "gold_petal" ? t * 3 : 0);
        }
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
