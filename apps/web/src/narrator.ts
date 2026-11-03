import type { Announcement } from "../../../packages/shared/src/index.ts";

const MAX_QUEUE = 500;
const TIMEOUT_MS = 15_000;

function getPriority(kind: Announcement["kind"]): number {
  if (kind === "notice") return 4; // Ưu tiên 1 (cao nhất): Thông báo của chùa
  if (kind === "gift") return 3;   // Ưu tiên 2: Người tặng quà (lưu lại đọc cho bằng hết)
  if (kind === "prayer") return 2; // Ưu tiên 3: Người cầu mong (lưu lại đọc cho bằng hết)
  return 1;                        // Ưu tiên 4: Người vào xem live (join, follow, share)
}

/** Serial local WAV playback on the dedicated voice bus with prioritized queue. */
export class Narrator {
  private queue: Announcement[] = [];
  private seen = new Set<string>();
  private sessionId = "";
  private serverOffset = 0;
  private running = false;
  private stopped = false;
  private controller?: AbortController;
  private source?: AudioBufferSourceNode;
  private task = 0;
  private currentItem?: Announcement;

  constructor(
    private context: AudioContext,
    private voice: GainNode,
    private setDucked: (ducked: boolean) => void,
  ) {}

  seed(sessionId: string, announcements: Announcement[], serverTime: number) {
    this.sessionId = sessionId;
    this.serverOffset = serverTime - Date.now();
    this.remember(announcements);
  }

  update(
    sessionId: string,
    announcements: Announcement[],
    serverTime: number,
    enabled: boolean,
  ) {
    this.serverOffset = serverTime - Date.now();
    if (sessionId !== this.sessionId) {
      this.sessionId = sessionId;
      this.clear();
      this.seen.clear();
      this.remember(announcements);
      return;
    }
    const incoming = announcements.filter((item) => !this.seen.has(item.id));
    this.remember(incoming);
    if (!enabled || this.stopped) return;
    const now = this.serverNow();

    for (const item of incoming) {
      const priority = getPriority(item.kind);
      // Quà và cầu nguyện có hạn đợi tối đa 60s, chào mừng 20s
      const maxAge = priority >= 2 ? 1_800_000 : 15_000;
      const age = now - item.at;
      if (item.sessionId === sessionId && age >= 0 && age <= maxAge) {
        this.enqueue(item);
      }
    }

    void this.pump();
  }

  private enqueue(item: Announcement) {
    const priority = getPriority(item.kind);

    // Người vào xem live (priority === 1): KHÔNG LƯU DỒN, đến lúc đọc thấy ai thì đọc người đó
    // Nếu trong hàng đợi đã có 1 người join/vào xem đang đợi, thay thế bằng người mới nhất này!
    if (priority === 1) {
      const existingJoinIdx = this.queue.findIndex((q) => getPriority(q.kind) === 1);
      if (existingJoinIdx !== -1) {
        this.queue[existingJoinIdx] = item;
        return;
      }
    }

    // Chèn item theo thứ tự ưu tiên: 4 (Thông báo chùa) > 3 (Quà) > 2 (Cầu nguyện) > 1 (Người vào)
    // Cùng mức ưu tiên thì giữ nguyên thứ tự đến trước (FIFO)
    // Không ngắt câu đang đọc dở, chỉ ưu tiên đưa lên đầu hàng đợi để đọc ngay sau khi câu hiện tại kết thúc
    let insertIdx = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (getPriority(this.queue[i].kind) < priority) {
        insertIdx = i;
        break;
      }
    }
    this.queue.splice(insertIdx, 0, item);

    // Đảm bảo không tích tụ quá 1 thông báo người vào live (priority 1) trong hàng đợi
    const lowPriorityCount = this.queue.filter((q) => getPriority(q.kind) === 1).length;
    if (lowPriorityCount > 1) {
      for (let i = this.queue.length - 1; i >= 0; i--) {
        if (getPriority(this.queue[i].kind) === 1) {
          this.queue.splice(i, 1);
          break;
        }
      }
    }

    // Nếu vượt quá MAX_QUEUE, chỉ drop priority 1 (không bao giờ drop notice, gift, prayer)
    if (this.queue.length > MAX_QUEUE) {
      for (let i = this.queue.length - 1; i >= 0; i--) {
        if (getPriority(this.queue[i].kind) === 1) {
          this.queue.splice(i, 1);
          break;
        }
      }
    }
  }

  clear() {
    this.queue = [];
    this.currentItem = undefined;
    this.task++;
    this.controller?.abort();
    this.controller = undefined;
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    this.source = undefined;
    this.setDucked(false);
  }

  destroy() {
    this.stopped = true;
    this.clear();
  }

  private remember(items: Announcement[]) {
    for (const item of items) this.seen.add(item.id);
    if (this.seen.size > 512)
      this.seen = new Set(items.slice(-256).map((item) => item.id));
  }

  private serverNow() {
    return Date.now() + this.serverOffset;
  }

  private async pump() {
    if (this.running || this.stopped) return;
    this.running = true;
    try {
      while (this.queue.length && !this.stopped) {
        const item = this.queue.shift()!;
        const priority = getPriority(item.kind);
        const maxAge = priority >= 2 ? 1_800_000 : 15_000;
        if (this.serverNow() - item.at > maxAge) continue;
        await this.play(item);
      }
    } finally {
      this.running = false;
      if (this.queue.length && !this.stopped) void this.pump();
    }
  }

  private async play(item: Announcement) {
    this.currentItem = item;
    const task = ++this.task;
    const controller = (this.controller = new AbortController());
    const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    const priority = getPriority(item.kind);
    const maxAge = priority >= 2 ? 1_800_000 : 15_000;

    try {
      const response = await fetch(
        `/api/narration/${encodeURIComponent(item.id)}.wav`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error(`Narration HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (
        controller.signal.aborted ||
        task !== this.task ||
        this.serverNow() - item.at > maxAge
      )
        return;
      const buffer = await this.context.decodeAudioData(bytes);
      if (
        controller.signal.aborted ||
        task !== this.task ||
        this.serverNow() - item.at > maxAge
      )
        return;
      if (this.context.state !== "running") return;
      const source = this.context.createBufferSource();
      this.source = source;
      source.buffer = buffer;
      source.connect(this.voice);
      this.setDucked(true);
      await new Promise<void>((resolve, reject) => {
        source.onended = () => resolve();
        controller.signal.addEventListener(
          "abort",
          () => {
            try {
              source.stop();
            } catch {
              /* already stopped */
            }
            reject(
              new DOMException(
                "Narration timed out or was cancelled",
                "AbortError",
              ),
            );
          },
          { once: true },
        );
        source.start();
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        console.warn("Local narration unavailable", error);
    } finally {
      window.clearTimeout(timeout);
      if (this.controller === controller) this.controller = undefined;
      if (this.source) {
        this.source.disconnect();
        this.source = undefined;
      }
      this.setDucked(false);
      if (this.currentItem === item) this.currentItem = undefined;
    }
  }
}
