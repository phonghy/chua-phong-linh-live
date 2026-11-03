import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type BlessingCategory = "join" | "gift" | "follow" | "share" | "prayer";

interface BlessingsData {
  join?: string[];
  gift?: string[];
  follow?: string[];
  share?: string[];
  prayer?: string[];
}

let cachedBlessings: BlessingsData | null = null;
let lastMtime = 0;
const lastChosenIndex: Record<string, number> = {};

function loadBlessings(): BlessingsData {
  const filePath = resolve("data/blessings.json");
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf-8");
      cachedBlessings = JSON.parse(content) as BlessingsData;
      return cachedBlessings;
    }
  } catch (err) {
    console.warn("Không thể đọc data/blessings.json, dùng danh sách mặc định:", err);
  }
  return cachedBlessings ?? {};
}

/**
 * Lấy ngẫu nhiên một câu chúc theo danh mục, tránh trùng lặp liên tiếp.
 */
export function getRandomBlessing(category: BlessingCategory): string {
  const data = loadBlessings();
  const list = data[category];
  if (!list || list.length === 0) return "";

  if (list.length === 1) return list[0];

  const last = lastChosenIndex[category] ?? -1;
  let next = Math.floor(Math.random() * list.length);
  // Tránh lặp lại câu vừa đọc nếu danh sách có nhiều hơn 1 câu
  if (next === last) {
    next = (next + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
  }
  lastChosenIndex[category] = next;
  return list[next] ?? "";
}
