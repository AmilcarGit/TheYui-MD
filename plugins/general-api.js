import axios from 'axios';
import { config } from "../config.js";

const API_URL = 'https://dv-edward.onrender.com';
const API_KEY = 'edward';

const MAPA_ESTILO = {
  a: "α", b: "b", c: "c", d: "d", e: "ᧉ", f: "𝖿", g: "g", h: "һ", i: "ꪱ",
  j: "j", k: "k", l: "𝗅", m: "𝗆", n: "𝗇", o: "ᦅ", p: "𝗉", q: "q", r: "ꭇ",
  s: "𝗌", t: "ƚ", u: "𝗎", v: "v", w: "w", x: "x", y: "ᥡ", z: "z",
};

function estilizar(texto) {
  return String(texto)
    .toLowerCase()
    .split("")
    .map((c) => MAPA_ESTILO[c] || c)
    .join("");
}

const MAPA_BOLD = {
  a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶",
  j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿",
  s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
  A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜",
  J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥",
  S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
};

function bold(texto) {
  return String(texto)
    .split("")
    .map((c) => MAPA_BOLD[c] || c)
    .join("");
}

export default {
  command: ["apistatus", "estadoapi", "apiinfo"],
  category: "General",
  description: "Muestra el estado de la API",
  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    await sock.sendMessage(chatId, {
      text: `✰ ${bold("Consultando estado de la API")}...\n` +
            `➮ ⏳ Espera un momento...`
    }, { quoted: msg });

    try {
      const [globalRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/dashboard-global`),
        axios.get(`${API_URL}/api/auth/stats`)
      ]);

      const global = globalRes.data;
      const stats = statsRes.data;

      const uptime = global.uptime
        ? (() => {
            const diff = Math.floor((Date.now() - global.uptime) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
          })()
        : 'N/A';

      const top5 = global.top5?.map((u, i) => 
        `  ${i + 1}. ${u.username} — ${u.total} reqs`
      ).join('\n') || '  ${bold("Sin datos")}';

      let texto = `╾ׄ𖹭ִ╼ᮀ✿ִ╾ᜒ𖹭╼ִ✿╾᩿ׄ𖹭╼ִ✿╾ᮀ𖹭ִ╼ᜒ✿ִ╾ׄ𖹭᩿╼\n`;
      texto += `✰ ${bold("EDWARD API")} ✰\n`;
      texto += `╾ׄ𖹭ִ╼ᮀ✿ִ╾ᜒ𖹭╼ִ✿╾᩿ׄ𖹭╼ִ✿╾ᮀ𖹭ִ╼ᜒ✿ִ╾ׄ𖹭᩿╼\n\n`;

      texto += `➮ ${bold("Estado")} › ✅ ${bold("En línea")}\n`;
      texto += `➮ ${bold("Usuarios")} › ${global.totalUsers || 0}\n`;
      texto += `➮ ${bold("Endpoints")} › ${stats.endpoints || 0}\n`;
      texto += `➮ ${bold("Uptime")} › ${uptime}\n`;
      texto += `➮ ${bold("Requests globales")} › ${global.globalRequests || 0}\n\n`;

      texto += `╾ׄ𖹭ִ╼ᮀ✿ִ╾ᜒ𖹭╼ִ✿╾᩿ׄ𖹭╼ִ✿╾ᮀ𖹭ִ╼ᜒ✿ִ╾ׄ𖹭᩿╼\n`;
      texto += `📊 ${bold("Top 5 Usuarios")}\n`;
      texto += `${top5}\n\n`;

      texto += `✰ ${API_URL}\n`;
      texto += `╾ׄ𖹭ִ╼ᮀ✿ִ╾ᜒ𖹭╼ִ✿╾᩿ׄ𖹭╼ִ✿╾ᮀ𖹭ִ╼ᜒ✿ִ╾ׄ𖹭᩿╼\n`;
      texto += `> ${config.creator} ×͜×`;

      await sock.sendMessage(chatId, {
        text: texto
      }, { quoted: msg });

    } catch (e) {
      await sock.sendMessage(chatId, {
        text: `✰ ${bold("Error al consultar la API")}\n` +
              `➮ ${e.message || "No se pudo conectar con la API"}`
      }, { quoted: msg });
    }
  }
};