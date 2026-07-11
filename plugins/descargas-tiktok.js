import { config } from "../config.js";
import { obtenerUsuario, quitarSaldo, formatearMonto } from "../economyDB.js";

const { baseUrl, apiKey } = config.apis.edward;
const COSTO_DESCARGA = 15;

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

export default {
  command: ["tiktok", "tt", "tk"],
  category: "Descargas",
  description: "Busca o descarga videos de TikTok (costo: 15 Yui). Usa: tiktok <busqueda> o tiktok <url> o tiktok <número>",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
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
      await descargarTikTok(sock, chatId, msg, arg, sender);
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
      await descargarPorResultado(sock, chatId, msg, video, sender);
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
      const vistas = formatearVistas(video.views || video.stats?.plays);
      const autor = video.author?.nickname || video.author || video.uploader || "Desconocido";
      const titulo = video.title || "Sin título";
      texto += `${i + 1}. *${titulo.slice(0, 40)}*\n`;
      texto += `   👤 ${autor}  ⏱️ ${duracion}  👁️ ${vistas}\n\n`;
    }

    texto += `🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 Para descargar (costo 15 Yui) escribe: *tiktok <número>*\n`;
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

export async function descargarPorResultado(sock, chatId, msg, video, sender) {
  try {
    const url = video.url || video.video_url || video.link || video.permalink;
    if (!url) {
      await sock.sendMessage(
        chatId,
        { text: "❌ El video seleccionado no tiene enlace válido." },
        { quoted: msg }
      );
      return;
    }
    await descargarTikTok(sock, chatId, msg, url, sender);
  } catch (err) {
    console.error("❌ Error descargando por resultado:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al descargar el video." },
      { quoted: msg }
    );
  }
}

async function descargarTikTok(sock, chatId, msg, url, sender) {
  const numero = sender.split("@")[0].split(":")[0];
  const usuario = obtenerUsuario(numero);

  if (usuario.saldo < COSTO_DESCARGA) {
    await sock.sendMessage(
      chatId,
      {
        text: `❌ No tienes suficiente saldo para descargar.\n💵 Costo: ${formatearMonto(COSTO_DESCARGA)}\n💵 Tu saldo: ${formatearMonto(usuario.saldo)}\n\n💕 Gana más Yui con *trabajar* o *diario*.`
      },
      { quoted: msg }
    );
    return;
  }

  try {
    await sock.sendMessage(
      chatId,
      { text: `🎥 Descargando video de TikTok...\n💸 Se te descontarán ${formatearMonto(COSTO_DESCARGA)} por esta descarga.` },
      { quoted: msg }
    );

    const downloadUrl = `${baseUrl}/api/download/tiktok?apiKey=${apiKey}&url=${encodeURIComponent(url)}`;
    
    const downloadRes = await fetch(downloadUrl);
    const downloadData = await downloadRes.json();

    if (!downloadData.status || !downloadData.data || !downloadData.data.media) {
      await sock.sendMessage(
        chatId,
        {
          text: `❌ No pude descargar el video. La API respondió:\n${downloadData.message || downloadData.error || "Error desconocido"}`
        },
        { quoted: msg }
      );
      return;
    }

    const info = downloadData.data;
    const titulo = info.title || "Video de TikTok";
    const duracion = formatearDuracion(info.duration);
    const autor = info.author?.nickname || info.author?.username || "Desconocido";
    const plays = info.stats?.plays || 0;
    const likes = info.stats?.likes || 0;
    const shares = info.stats?.shares || 0;
    const comments = info.stats?.comments || 0;
    const downloadUrlVideo = info.media?.no_watermark || info.media?.watermark;

    if (!downloadUrlVideo) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No se encontró la URL del video." },
        { quoted: msg }
      );
      return;
    }

    quitarSaldo(numero, COSTO_DESCARGA);

    if (info.media?.thumbnail || info.thumbnail) {
      const thumbnail = info.media?.thumbnail || info.thumbnail || info.author?.avatar;
      let caption = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
      caption += `  🎥 *TIKTOK DESCARGADO*\n`;
      caption += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;
      caption += `📌 *${titulo.slice(0, 50)}*\n`;
      caption += `👤 ${autor}\n`;
      caption += `⏱️ Duración: ${duracion}\n`;
      caption += `👁️ Vistas: ${formatearVistas(plays)}\n`;
      caption += `👍 Likes: ${likes.toLocaleString()}\n`;
      caption += `💬 Comentarios: ${comments.toLocaleString()}\n`;
      caption += `🔄 Compartidos: ${shares.toLocaleString()}\n\n`;
      caption += `💵 Costo: ${formatearMonto(COSTO_DESCARGA)}\n`;
      caption += `_Enviando video..._ 🌸`;

      await sock.sendMessage(
        chatId,
        {
          image: { url: thumbnail },
          caption: caption,
        },
        { quoted: msg }
      );
    }

    const videoBuffer = await fetch(downloadUrlVideo);
    const videoArrayBuffer = await videoBuffer.arrayBuffer();
    const buffer = Buffer.from(videoArrayBuffer);

    await sock.sendMessage(
      chatId,
      {
        video: buffer,
        caption: `📹 *${titulo.slice(0, 60)}*\n👤 ${autor}\n💵 Te hemos cobrado ${formatearMonto(COSTO_DESCARGA)} por esta descarga.\n✨ TheYui-MD — Tu waifu inteligente`,
        fileName: `tiktok_${Date.now()}.mp4`,
        mimetype: "video/mp4",
      },
      { quoted: msg }
    );
  } catch (err) {
    console.error("❌ Error descargando TikTok:", err);
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Ocurrió un error al descargar el video de TikTok.\n\n${err.message || "Error desconocido"}`
      },
      { quoted: msg }
    );
  }
}