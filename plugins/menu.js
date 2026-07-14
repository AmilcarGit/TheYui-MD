
import { config } from "../config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_IMAGE_PATH = path.join(__dirname, "..", "assets", "menu.jpg");

let imagenMenuCache = null;

async function obtenerImagenMenu() {
  if (imagenMenuCache) return imagenMenuCache;
  try {
    imagenMenuCache = fs.readFileSync(MENU_IMAGE_PATH);
    return imagenMenuCache;
  } catch (err) {
    return null;
  }
}

const DIVISOR = "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁";

function formatearUptime(segundos) {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function fila(etiqueta, valor) {
  return `   ${etiqueta.padEnd(12, " ")}  ${valor}`;
}

export default {
  command: ["menu", "help", "ayuda"],
  category: "General",
  description: "Muestra el menú de comandos.",
  run: async (sock, msg, args, context) => {
    const { sender, chatId, allPlugins } = context;

    const categorias = {};
    for (const plugin of allPlugins) {
      const categoria = plugin.category || "Otros";
      if (!categorias[categoria]) categorias[categoria] = [];
      categorias[categoria].push(plugin);
    }
    const nombresCategorias = Object.keys(categorias).sort();

    const fecha = new Date().toLocaleString("es-PE", {
      timeZone: "America/Lima",
      dateStyle: "long",
      timeStyle: "short",
    });
    const totalComandos = allPlugins.reduce((acc, p) => acc + p.command.length, 0);
    const numero = sender.split("@")[0].split(":")[0];
    const uptime = formatearUptime(process.uptime());

    let texto = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    texto += `      ${config.botName.toUpperCase()}\n`;
    texto += `   Asistente inteligente\n`;
    texto += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

    texto += fila("Usuario", `@${numero}`) + "\n";
    texto += fila("Creador", config.creator) + "\n";
    texto += fila("Comandos", totalComandos) + "\n";
    texto += fila("Plugins", allPlugins.length) + "\n";
    texto += fila("Actividad", uptime) + "\n";
    texto += fila("Fecha", fecha) + "\n";

    for (const categoria of nombresCategorias) {
      texto += `\n${DIVISOR}\n\n`;
      texto += ` 📂 *${categoria.toUpperCase()}*\n`;
      texto += `${DIVISOR}\n`;

      categorias[categoria].forEach((plugin) => {
        const comandoPrincipal = plugin.command[0];
        const alias = plugin.command.slice(1).length > 0
          ? ` (${plugin.command.slice(1).join(", ")})`
          : "";
        texto += `\n ◆ *${comandoPrincipal}*${alias}\n`;
        texto += `   ${plugin.description || "Sin descripción"}\n`;
      });
    }

    texto += `\n${DIVISOR}\n`;
    texto += ` ${config.botName}  ·  sin prefijo  ·  escribe directo`;

    const imagen = await obtenerImagenMenu();
    if (imagen) {
      await sock.sendMessage(
        chatId,
        { image: imagen, caption: texto, mentions: [sender] },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(
        chatId,
        { text: texto, mentions: [sender] },
        { quoted: msg }
      );
    }
  },
};
