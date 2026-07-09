import { config } from "../config.js";

const { baseUrl, apiKey } = config.apis.edward;

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
  command: ["play", "mp3", "musica"],
  category: "Descargas",
  description: "Busca canciones en YouTube y las descarga en audio. Usa: play <canción> o play <número>",
  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const arg = args.join(" ").trim();

    if (!arg) {
      await sock.sendMessage(
        chatId,
        { text: "🌸 Escribe el nombre de la canción o el número de una búsqueda anterior.\nEjemplo: *play* shape of you  o  *play* 2" },
        { quoted: msg }
      );
      return;
    }

    if (!global.playCache) global.playCache = new Map();

    const numero = parseInt(arg);
    if (!isNaN(numero) && numero > 0) {
      const resultados = global.playCache.get(chatId);
      if (!resultados || resultados.length === 0) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No hay resultados de búsqueda previos. Usa *play <canción>* primero." },
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
      await descargarAudio(sock, chatId, msg, video);
      return;
    }

    await realizarBusqueda(sock, chatId, msg, arg);
  },
};

async function realizarBusqueda(sock, chatId, msg, query) {
  try {
    await sock.sendMessage(
      chatId,
      { text: `🦋 Buscando *${query}*...` },
      { quoted: msg }
    );

    const searchUrl = `${baseUrl}/api/search/youtube?apiKey=${apiKey}&query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const resultados = searchData.result || searchData.data || searchData.results || [];
    if (!resultados || resultados.length === 0) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No encontré canciones para esa búsqueda." },
        { quoted: msg }
      );
      return;
    }

    global.playCache.set(chatId, resultados);

    const max = Math.min(resultados.length, 5);
    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `  🎵 *RESULTADOS DE BÚSQUEDA*\n`;
    texto += `  _${query}_\n`;
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    for (let i = 0; i < max; i++) {
      const video = resultados[i];
      const duracion = formatearDuracion(video.duration);
      const vistas = formatearVistas(video.views);
      const titulo = video.title || "Sin título";
      texto += `${i + 1}. *${titulo}*\n`;
      texto += `   ⏱️ ${duracion}  👁️ ${vistas}\n\n`;
    }

    texto += `🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 Para descargar escribe: *play <número>*\n`;
    texto += `🌹 Ejemplo: *play 1*`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  } catch (err) {
    console.error("❌ Error en búsqueda play:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al buscar la canción." },
      { quoted: msg }
    );
  }
}

async function descargarAudio(sock, chatId, msg, video) {
  try {
    await sock.sendMessage(
      chatId,
      { text: `🎵 Descargando: *${video.title || "canción"}*...` },
      { quoted: msg }
    );

    const downloadUrl = `${baseUrl}/api/download/ytaudio?url=${encodeURIComponent(video.url)}&apiKey=${apiKey}`;
    const downloadRes = await fetch(downloadUrl);
    const downloadData = await downloadRes.json();

    const info = downloadData.result;

    if (!downloadData.status || !info || !info.download_url) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No pude obtener el audio de esa canción, intenta con otra." },
        { quoted: msg }
      );
      return;
    }

    const titulo = info.title || video.title || "Canción sin título";
    const duracion = formatearDuracion(info.duration);

    if (info.thumbnail) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: info.thumbnail },
          caption:
            `🎵 *${titulo}*\n` +
            `⏱️ Duración: ${duracion}\n\n` +
            `_Enviando audio..._ 🌸`,
        },
        { quoted: msg }
      );
    }

    await sock.sendMessage(
      chatId,
      {
        audio: { url: info.download_url },
        mimetype: "audio/mpeg",
        fileName: `${titulo.slice(0, 60)}.mp3`,
      },
      { quoted: msg }
    );
  } catch (err) {
    console.error("❌ Error en descarga de audio:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Ocurrió un error al descargar el audio." },
      { quoted: msg }
    );
  }
}