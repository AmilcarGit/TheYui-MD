import { config } from "../config.js";
import { registrarManejador } from "../interactiveManager.js";
import { descargarPorResultado } from "./descargas-tiktok.js";

const { baseUrl, apiKey } = config.apis.edward;
const MAX_RESULTADOS = 8;
const TIEMPO_EXPIRACION_MS = 5 * 60 * 1000;

const busquedasPendientes = new Map();

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

function obtenerMiniatura(video) {
  return (
    video.thumbnail ||
    video.cover ||
    video.image ||
    video.video_thumbnail ||
    video.origin_cover ||
    null
  );
}

registrarManejador("tiktokselect", async (sock, msg, context, rowId) => {
  const { chatId, sender } = context;
  const [, chatKey, indiceStr] = rowId.split(":");
  const indice = parseInt(indiceStr, 10);

  const pendiente = busquedasPendientes.get(chatKey);

  if (!pendiente || Date.now() > pendiente.expira) {
    await sock.sendMessage(
      chatId,
      { text: "⌛ Esta búsqueda ya expiró, vuelve a usar *tiktoksearch* para buscar de nuevo." },
      { quoted: msg }
    );
    return;
  }

  if (pendiente.solicitante !== sender) {
    await sock.sendMessage(
      chatId,
      { text: "⚠️ Solo quien pidió la búsqueda puede elegir una opción." },
      { quoted: msg }
    );
    return;
  }

  const video = pendiente.resultados[indice];
  if (!video) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Esa opción ya no es válida." },
      { quoted: msg }
    );
    return;
  }

  busquedasPendientes.delete(chatKey);

  await descargarPorResultado(sock, chatId, msg, video, sender);
});

export default {
  command: ["tiktoksearch", "ttsearch"],
  category: "Descargas",
  description: "Busca videos de TikTok y descárgalos con un toque (costo: 15 Yui). Uso: tiktoksearch <búsqueda>",
  run: async (sock, msg, args, context) => {
    const { chatId, sender } = context;
    const query = args.join(" ").trim();

    if (!query) {
      await sock.sendMessage(
        chatId,
        { text: "🌸 Escribe lo que quieres buscar en TikTok.\nEjemplo: *tiktoksearch* baile" },
        { quoted: msg }
      );
      return;
    }

    try {
      await sock.sendMessage(
        chatId,
        { text: `🔎 Buscando *${query}* en TikTok...` },
        { quoted: msg }
      );

      const searchUrl = `${baseUrl}/api/search/tiktok?apiKey=${apiKey}&query=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      let resultados = searchData.result || searchData.data || searchData.results || [];
      if (!Array.isArray(resultados)) {
        resultados = resultados ? [resultados] : [];
      }
      resultados = resultados.slice(0, MAX_RESULTADOS);

      if (resultados.length === 0) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No encontré videos para esa búsqueda." },
          { quoted: msg }
        );
        return;
      }

      const chatKey = `${chatId}_${sender}_${Date.now()}`;
      busquedasPendientes.set(chatKey, {
        resultados,
        solicitante: sender,
        expira: Date.now() + TIEMPO_EXPIRACION_MS,
      });

      for (let i = 0; i < resultados.length; i++) {
        const video = resultados[i];
        const miniatura = obtenerMiniatura(video);
        const titulo = video.title || "Sin título";
        const autor = video.author?.nickname || video.author || video.uploader || "Desconocido";
        const duracion = formatearDuracion(video.duration);
        const vistas = formatearVistas(video.views || video.stats?.plays);

        const caption =
          `🎥 *${i + 1}.* ${titulo.slice(0, 60)}\n` +
          `👤 ${autor}  ⏱️ ${duracion}  👁️ ${vistas}`;

        try {
          if (miniatura) {
            await sock.sendMessage(
              chatId,
              { image: { url: miniatura }, caption },
              { quoted: msg }
            );
          } else {
            await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
          }
        } catch (err) {
          console.error(`❌ No se pudo enviar la miniatura ${i + 1} de TikTok:`, err);
        }
      }

      const filas = resultados.map((video, i) => ({
        title: (video.title || `Resultado ${i + 1}`).slice(0, 60),
        description: `⏱️ ${formatearDuracion(video.duration)} · 👁️ ${formatearVistas(video.views || video.stats?.plays)}`,
        rowId: `tiktokselect:${chatKey}:${i}`,
      }));

      await sock.sendMessage(
        chatId,
        {
          text: `Elige el video que quieras descargar 👇\n💵 Costo por descarga: 15 Yui`,
          footer: "TheYui-MD 💕",
          title: "🎥 Resultados de TikTok",
          buttonText: "Ver opciones",
          sections: [
            {
              title: "Resultados",
              rows: filas,
            },
          ],
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ Error en tiktoksearch:", err);
      await sock.sendMessage(
        chatId,
        { text: "❌ Ocurrió un error buscando en TikTok." },
        { quoted: msg }
      );
    }
  },
};
