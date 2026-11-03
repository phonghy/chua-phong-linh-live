if (typeof window !== "undefined") {
  if (!window.crypto) {
    (window as unknown as { crypto: Partial<Crypto> }).crypto = {};
  }
  if (typeof window.crypto.randomUUID !== "function") {
    window.crypto.randomUUID = function randomUUID() {
      if (typeof window.crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`;
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/500.css";
import { Admin } from "./admin";
import { TempleView } from "./TempleView";
import { useTemple } from "./useTemple";
import "./style.css";
function Game() {
  const { client, state } = useTemple();
  const overlay = location.pathname === "/overlay";
  return (
    <main className="standalone">
      <TempleView client={client} state={state} overlay={overlay} />
    </main>
  );
}
function App() {
  return location.pathname === "/game" || location.pathname === "/overlay" ? (
    <Game />
  ) : (
    <Admin />
  );
}
createRoot(document.getElementById("root")!).render(<App />);
