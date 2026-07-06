import { config } from "../config.js";

const { baseUrl, apiKey } = config.apis.edward;

function formatearDuracion(segundos) {
  if (!segundos && segundos !== 0) return "Desconocida";
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${seg}`;
}

export default {
  command: ["play", "mp3", " musica"],
  category: "Descargas",
  description: "Busca una canción en YouTube y la envía en audio. Uso: play <nombre de la canción>",
  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const query = args.join(" ").trim();

    if (!query) {
      await sock.sendMessage(
        chatId,
        { text: "❀ Escribe el nombre de la canción.\nEjemplo: *play* shape of you" },
        { quoted: msg }
      );
      return;
    }

    try {
      await sock.sendMessage(
        chatId,
        { text: `🔎 Buscando *${query}*...` },
        { quoted: msg }
      );

      const searchUrl = `${baseUrl}/api/search/youtube?apiKey=${apiKey}&query=${encodeURIComponent(
        query
      )}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      const resultados =
        searchData.result || searchData.data || searchData.results || [];
      const primerVideo = Array.isArray(resultados) ? resultados[0] : resultados;

      if (!primerVideo || !primerVideo.url) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No encontré resultados para esa búsqueda." },
          { quoted: msg }
        );
        return;
      }

      const downloadUrl = `${baseUrl}/api/download/ytaudio?url=${encodeURIComponent(
        primerVideo.url
      )}&apiKey=${apiKey}`;
      const downloadRes = await fetch(downloadUrl);
      const downloadData = await downloadRes.json();

      const info = downloadData.result;

      if (!downloadData.status || !info || !info.download_url) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No pude obtener el audio de ese video, intenta con otra canción." },
          { quoted: msg }
        );
        return;
      }

      const titulo = info.title || primerVideo.title || query;
      const duracion = formatearDuracion(info.duration);

      if (info.thumbnail) {
        await sock.sendMessage(
          chatId,
          {
            image: { url: info.thumbnail },
            caption:
              `❀ *${titulo}*\n` +
              `⏱️ Duración: ${duracion}\n\n` +
              `_Enviando audio..._`,
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
      console.log("❌ Error en el comando play:", err);
      await sock.sendMessage(
        chatId,
        { text: "❌ Ocurrió un error buscando o descargando la canción." },
        { quoted: msg }
      );
    }
  },
};