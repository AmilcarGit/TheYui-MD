import { config } from "../config.js";

const { baseUrl, apiKey } = config.apis.edward;

function esUrlTikTok(texto) {
  const pattern = /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\/.+/i;
  return pattern.test(texto);
}

function formatearDuracion(segundos) {
  if (!segundos && segundos !== 0) return "Desconocida";
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60).toString().padStart(2, "0");
  return `${min}:${seg}`;
}

function formatearVistas(vistas) {
  if (!vistas) return "N/A";
  const num = parseInt(vistas);
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatearFecha(fecha) {
  if (!fecha) return "Desconocida";
  try {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (diff < 1) return "Hace menos de un mes";
    if (diff === 1) return "Hace 1 mes";
    if (diff < 12) return `Hace ${diff} meses`;
    const años = Math.floor(diff / 12);
    return `Hace ${años} año${años > 1 ? 's' : ''}`;
  } catch (_) {
    return "Desconocida";
  }
}

export default {
  command: ["tiktok", "tt", "tk"],
  category: "Descargas",
  description: "Busca o descarga videos de TikTok. Usa: tiktok <busqueda> o tiktok <url> o tiktok <número>",
  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const arg = args.join(" ").trim();

    if (!arg) {
      await sock.sendMessage(
        chatId,
        { text: "🌸 Escribe lo que quieres buscar o pega un enlace de TikTok.\nEjemplo: *tiktok* baile  o  *tiktok* https://vm.tiktok.com/..." },
        { quoted: msg }
      );
      return;
    }

    if (!global.tiktokCache) global.tiktokCache = new Map();

    if (esUrlTikTok(arg)) {
      await descargarTikTok(sock, chatId, msg, arg);
      return;
    }

    const numero = parseInt(arg);
    if (!isNaN(numero) && numero > 0) {
      const resultados = global.tiktokCache.get(chatId);
      if (!resultados || resultados.length === 0) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No hay resultados de búsqueda previos. Usa *tiktok <busqueda>* primero." },
          { quoted: msg }
        );
        return;
      }
      const index = numero - 1;
      if (index >= resultados.length) {
        await sock.sendMessage(
          chatId,
          { text: `❌ Solo hay ${resultados.length} resultado(s). Elige un número entre 1 y ${resultados.length}.` },
          { quoted: msg }
        );
        return;
      }
      const video = resultados[index];
      await descargarPorResultado(sock, chatId, msg, video);
      return;
    }

    await buscarTikTok(sock, chatId, msg, arg);
  }
};

async function buscarTikTok(sock, chatId, msg, query) {
  try {
    await sock.sendMessage(
      chatId,
      { text: `🦋 Buscando *${query}* en TikTok...` },
      { quoted: msg }
    );

    const searchUrl = `${baseUrl}/api/search/tiktok?apiKey=${apiKey}&query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const resultados = searchData.result || searchData.data || searchData.results || [];
    if (!resultados || resultados.length === 0) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No encontré videos para esa búsqueda." },
        { quoted: msg }
      );
      return;
    }

    global.tiktokCache.set(chatId, resultados);

    const max = Math.min(resultados.length, 5);
    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `  🎥 *RESULTADOS DE TIKTOK*\n`;
    texto += `  _${query}_\n`;
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    for (let i = 0; i < max; i++) {
      const video = resultados[i];
      const duracion = formatearDuracion(video.duration);
      const vistas = formatearVistas(video.views);
      const autor = video.author || video.uploader || "Desconocido";
      const titulo = video.title || "Sin título";
      texto += `${i + 1}. *${titulo.slice(0, 40)}*\n`;
      texto += `   👤 ${autor}  ⏱️ ${duracion}  👁️ ${vistas}\n\n`;
    }

    texto += `🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 Para descargar escribe: *tiktok <número>*\n`;
    texto += `🌹 Ejemplo: *tiktok 1*\n`;
    texto += `📌 También puedes pegar un enlace directo.`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  } catch (err) {
    console.error("❌ Error en búsqueda TikTok:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al buscar en TikTok." },
      { quoted: msg }
    );
  }
}

async function descargarPorResultado(sock, chatId, msg, video) {
  try {
    const url = video.url || video.video_url || video.link;
    if (!url) {
      await sock.sendMessage(
        chatId,
        { text: "❌ El video seleccionado no tiene enlace válido." },
        { quoted: msg }
      );
      return;
    }
    await descargarTikTok(sock, chatId, msg, url);
  } catch (err) {
    console.error("❌ Error descargando por resultado:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al descargar el video." },
      { quoted: msg }
    );
  }
}

async function descargarTikTok(sock, chatId, msg, url) {
  try {
    await sock.sendMessage(
      chatId,
      { text: `🎥 Descargando video de TikTok...` },
      { quoted: msg }
    );

    const downloadUrl = `${baseUrl}/api/download/tiktok?apiKey=${apiKey}&url=${encodeURIComponent(url)}`;
    const downloadRes = await fetch(downloadUrl);
    const downloadData = await downloadRes.json();

    const info = downloadData.result;

    if (!downloadData.status || !info || !info.download_url) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No pude descargar el video. Verifica el enlace." },
        { quoted: msg }
      );
      return;
    }

    const titulo = info.title || info.desc || "Video de TikTok";
    const duracion = formatearDuracion(info.duration);
    const autor = info.author || info.username || "Desconocido";
    const vistas = formatearVistas(info.views);
    const likes = info.likes ? new Intl.NumberFormat().format(info.likes) : "N/A";

    if (info.thumbnail) {
      const caption = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
      caption += `  🎥 *TIKTOK DESCARGADO*\n`;
      caption += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;
      caption += `📌 *${titulo.slice(0, 50)}*\n`;
      caption += `👤 ${autor}\n`;
      caption += `⏱️ Duración: ${duracion}\n`;
      caption += `👁️ Vistas: ${vistas}\n`;
      caption += `👍 Likes: ${likes}\n\n`;
      caption += `_Enviando video..._ 🌸`;

      await sock.sendMessage(
        chatId,
        {
          image: { url: info.thumbnail },
          caption: caption,
        },
        { quoted: msg }
      );
    }

    const videoBuffer = await fetch(info.download_url);
    const videoArrayBuffer = await videoBuffer.arrayBuffer();
    const buffer = Buffer.from(videoArrayBuffer);

    await sock.sendMessage(
      chatId,
      {
        video: buffer,
        caption: `📹 *${titulo.slice(0, 60)}*\n👤 ${autor}\n✨ TheYui-MD — Tu waifu inteligente`,
        fileName: `tiktok_${Date.now()}.mp4`,
        mimetype: "video/mp4",
      },
      { quoted: msg }
    );
  } catch (err) {
    console.error("❌ Error descargando TikTok:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al descargar el video de TikTok." },
      { quoted: msg }
    );
  }
}