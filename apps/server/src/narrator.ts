import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { WebSocket } from "ws";
import type { Announcement } from "../../../packages/shared/src/index.ts";

const execute = promisify(execFile);
export type SynthRunner = (
  text: string,
  signal: AbortSignal,
) => Promise<Buffer>;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function edgeNeuralSynthesis(
  text: string,
  signal: AbortSignal,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const token = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    const ticks =
      Math.floor((Date.now() / 1000 + 11644473600) / 300) * 300 * 1e7;
    const gec = createHash("sha256")
      .update(ticks.toFixed(0) + token)
      .digest("hex")
      .toUpperCase();
    const reqId = randomUUID().replace(/-/g, "");
    const muid = randomUUID().replace(/-/g, "").toUpperCase();
    const url = `wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key=${token}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=1-132.0.2957.140&ConnectionId=${reqId}`;

    const ws = new WebSocket(url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0",
        Cookie: `muid=${muid};`,
      },
      handshakeTimeout: 6000,
    });

    const chunks: Buffer[] = [];
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };
    const onAbort = () => fail(new Error("aborted"));
    signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => fail(new Error("edge-tts-timeout")), 8000);

    ws.on("open", () => {
      ws.send(
        'Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}',
      );
      ws.send(
        `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN"><voice name="vi-VN-HoaiMyNeural"><prosody rate="-5%" pitch="+0Hz">${escapeXml(text)}</prosody></voice></speak>`,
      );
    });

    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        const buf = Buffer.isBuffer(data)
          ? data
          : Buffer.from(data as ArrayBuffer);
        if (buf.length >= 2) {
          const headerLen = buf.readUInt16BE(0);
          if (buf.length > 2 + headerLen) {
            chunks.push(buf.subarray(2 + headerLen));
          }
        }
      } else if (data.toString().includes("Path:turn.end")) {
        const audio = Buffer.concat(chunks);
        if (!audio.length) {
          fail(new Error("edge-tts-empty"));
          return;
        }
        if (!settled) {
          settled = true;
          cleanup();
          resolve(audio);
        }
      }
    });

    ws.on("error", (err) =>
      fail(err instanceof Error ? err : new Error(String(err))),
    );
    ws.on("close", () => {
      if (!settled) fail(new Error("edge-tts-closed-early"));
    });
  });
}

async function googleTtsSynthesis(
  text: string,
  signal: AbortSignal,
): Promise<Buffer> {
  const urls = [
    `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=vi&dt=t&q=${encodeURIComponent(text)}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(text)}`,
  ];
  let lastError: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      });
      if (!res.ok) throw new Error(`google-tts-http-${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 256) return buf;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("google-tts-failed");
}

async function macSaySynthesis(
  text: string,
  signal: AbortSignal,
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "temple-voice-"));
  try {
    const path = join(dir, "voice.wav");
    await execute(
      "/usr/bin/say",
      [
        "-v",
        "Linh",
        "-r",
        "165",
        "-o",
        path,
        "--data-format=LEI16@22050",
        text,
      ],
      { timeout: 15000, signal },
    );
    return await readFile(path);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function nativeSynthesis(
  text: string,
  signal: AbortSignal,
): Promise<Buffer> {
  if (process.platform === "darwin") {
    try {
      return await macSaySynthesis(text, signal);
    } catch {
      /* fallback to AI TTS below */
    }
  }
  try {
    return await edgeNeuralSynthesis(text, signal);
  } catch {
    return await googleTtsSynthesis(text, signal);
  }
}

export class Narrator {
  private cache = new Map<string, Buffer>();
  private pending = new Map<string, Promise<Buffer>>();
  private tail: Promise<void> = Promise.resolve();
  private controller = new AbortController();
  private closed = false;
  private availability?: Promise<boolean>;
  constructor(
    private runner: SynthRunner = nativeSynthesis,
    private probe?: () => Promise<boolean>,
  ) {}
  async status() {
    this.availability ??= this.probe
      ? this.probe().catch(() => false)
      : (async () => {
          if (process.platform === "darwin") {
            try {
              const { stdout } = await execute("/usr/bin/say", ["-v", "?"], {
                timeout: 5000,
              });
              if (/^Linh\s/m.test(stdout)) return true;
            } catch {
              /* fallback to AI TTS */
            }
          }
          return true;
        })();
    const available = !this.closed && (await this.availability);
    return {
      available,
      voice:
        process.platform === "darwin"
          ? ("Linh" as const)
          : ("Hoài My AI (Edge Neural / Google TTS)" as const),
      detail: available
        ? process.platform === "darwin"
          ? "Giọng Linh sẵn sàng."
          : "Giọng AI Hoài My (Edge Neural / Google TTS) sẵn sàng."
        : "Giọng đọc không khả dụng trên máy này.",
    };
  }
  async audio(announcement: Announcement): Promise<Buffer> {
    if (this.closed) throw new Error("unavailable");
    const cached = this.cache.get(announcement.id);
    if (cached) return cached;
    const existing = this.pending.get(announcement.id);
    if (existing) return existing;
    if (this.pending.size >= 12) throw new Error("queue-full");
    const job = this.tail.then(async () => {
      if (this.closed) throw new Error("unavailable");
      const result = await this.runner(
        announcement.text,
        this.controller.signal,
      );
      if (this.closed) throw new Error("unavailable");
      this.cache.set(announcement.id, result);
      if (this.cache.size > 32)
        this.cache.delete(this.cache.keys().next().value!);
      return result;
    });
    this.tail = job.then(
      () => {},
      () => {},
    );
    this.pending.set(announcement.id, job);
    try {
      return await job;
    } finally {
      this.pending.delete(announcement.id);
    }
  }
  async close() {
    this.closed = true;
    this.controller.abort();
    await this.tail;
    this.cache.clear();
  }
}
