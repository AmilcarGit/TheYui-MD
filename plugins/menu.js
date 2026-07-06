import { config } from "../config.js";

const MENU_IMAGE = "https://files.catbox.moe/1farsq.webp";

let imagenMenuCache = null;

async function obtenerImagenMenu() {
  if (imagenMenuCache) return imagenMenuCache;

  try {
    const respuesta = await fetch(MENU_IMAGE);
    const buffer = Buffer.from(await respuesta.arrayBuffer());
    imagenMenuCache = buffer;
    return buffer;
  } catch (err) {
    
    return null;
  }
}

const ICONOS_CATEGORIA = {
  General: "💎",
  Grupo: "👑",
  Descargas: "🔥",
  Owner: "⚡",
  Otros: "✨",
};

export default {
  command: ["menu", "help", "ayuda"],
  category: "General",
  description: "Muestra el menú de comandos ordenado por categorías.",
  run: async (sock, msg, args, context) => {
    const { sender, chatId, allPlugins } = context;

    const categorias = {};
    for (const plugin of allPlugins) {
      const categoria = plugin.category || "Otros";
      if (!categorias[categoria]) categorias[categoria] = [];
      categorias[categoria].push(plugin);
    }

    const fecha = new Date().toLocaleString("es-HN", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const totalComandos = allPlugins.reduce(
      (acc, p) => acc + p.command.length,
      0
    );
    const numero = sender.split("@")[0].split(":")[0];

    let texto = `🔥 「 *${config.botName.toUpperCase()}* 」 🔥\n`;
    texto += `╭─────────────────────╮\n`;
    texto += `│ 👑 *Creador:* ${config.creator}\n`;
    texto += `│ 💎 *Usuario:* @${numero}\n`;
    texto += `│ 🕐 *Fecha:* ${fecha}\n`;
    texto += `│ ⚡ *Comandos:* ${totalComandos}\n`;
    texto += `│ 📦 *Plugins:* ${allPlugins.length}\n`;
    texto += `╰─────────────────────╯\n`;

    const nombresCategorias = Object.keys(categorias).sort();

    for (const categoria of nombresCategorias) {
      const icono = ICONOS_CATEGORIA[categoria] || "✨";
      texto += `\n╭─❀ ${icono} *${categoria.toUpperCase()}* ❀\n`;
      for (const plugin of categorias[categoria]) {
        const comandoPrincipal = plugin.command[0];
        texto += `│ ➤ *${comandoPrincipal}*\n`;
        texto += `│   ${plugin.description || "Sin descripción"}\n`;
      }
      texto += `╰──────────────\n`;
    }

    texto += `\n💎 _${config.botName} no usa prefijo — escribe el comando directo._`;
    texto += `\n🔥 _Hecho con orgullo por ${config.creator}._ 👑`;

    const imagen = await obtenerImagenMenu();

    if (imagen) {
      await sock.sendMessage(
        chatId,
        {
          image: imagen,
          caption: texto,
          mentions: [sender],
        },
        { quoted: msg }
      );
    } else {
      
      await sock.sendMessage(
        chatId,
        {
          text: texto,
          mentions: [sender],
        },
        { quoted: msg }
      );
    }
  },
};
