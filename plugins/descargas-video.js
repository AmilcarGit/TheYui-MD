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

function bytesToMB(bytes) {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2) + " MB";
}

function barraProgreso(porcentaje = 100, largo = 15) {
  const llenos = Math.round((porcentaje / 100) * largo);
  return "▓".repeat(llenos) + "░".repeat(largo - llenos);
}

function mensajeCargando() {
  const estados = [
    "🔄 Inicializando motores de descarga...",
    "🔍 Analizando enlace de YouTube...",
    "📡 Conectando con el servidor...",
    "⚡ Procesando paquete de video...",
    "🎯 Preparando archivo para envío...",
  ];
  return estados[Math.floor(Math.random() * estados.length)];
}

function esLinkYouTube(url) {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
  return pattern.test(url);
}

export default {
  command: ["video", "ytvideo", "mp4"],
  category: "Descargas",
  description: "Descarga un video de YouTube desde un enlace. Uso: video <link de YouTube>",
  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const url = args[0]?.trim();

    if (!url) {
      await sock.sendMessage(
        chatId,
        { text: "❀ Envía el enlace del video de YouTube.\nEjemplo: *video* https://youtu.be/abc123" },
        { quoted: msg }
      );
      return;
    }

    if (!esLinkYouTube(url)) {
      await sock.sendMessage(
        chatId,
        { text: "❌ El enlace no es válido. Solo se aceptan URLs de YouTube." },
        { quoted: msg }
      );
      return;
    }

    try {
      await sock.sendMessage(
        chatId,
        { text: `╔═══════════════════╗\n║  🚀 THEYUI-MD · DOWNLOADER    ║\n╚═══════════════════╝\n\n${mensajeCargando()}` },
        { quoted: msg }
      );

      const downloadUrl = `${baseUrl}/api/download/ytvideo?url=${encodeURIComponent(url)}&apiKey=${apiKey}`;
      const downloadRes = await fetch(downloadUrl);
      const downloadData = await downloadRes.json();

      const info = downloadData.result;

      if (!downloadData.status || !info || !info.download_url) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No pude descargar el video. Verifica que el enlace sea válido." },
          { quoted: msg }
        );
        return;
      }

      const titulo = info.title || "Video sin título";
      const duracion = formatearDuracion(info.duration);
      const tamaño = bytesToMB(info.size);
      const vistas = info.views ? new Intl.NumberFormat().format(info.views) : "N/A";
      const likes = info.likes ? new Intl.NumberFormat().format(info.likes) : "N/A";

      if (info.thumbnail) {
        const caption = `╔═══════════════════╗
║  🎬 *VIDEO LISTO*      ║
╠════════════════════╣
║  📌 Título: ${titulo.slice(0, 40)}${titulo.length > 40 ? "…" : ""}
║  ⏱️  Duración: ${duracion}
║  📦 Tamaño: ${tamaño}
║  👁️  Vistas: ${vistas}
║  👍 Likes: ${likes}
║  📊 Calidad: ${info.quality || "Media"}
║  ───────────────────────
║  ${barraProgreso(100)} 100%
║  ✅ Enviando video...
╚═════════════════════════╝
⚡ TheYui-MD · Tecnología de vanguardia`;

        await sock.sendMessage(
          chatId,
          {
            image: { url: info.thumbnail },
            caption: caption,
          },
          { quoted: msg }
        );
      }

      await sock.sendMessage(
        chatId,
        {
          video: { url: info.download_url },
          caption: `📹 *${titulo}*\n⏱️ ${duracion} · 📦 ${tamaño}\n\n✨ *TheYui-MD* — Más que un bot, una leyenda.`,
          fileName: `${titulo.slice(0, 60)}.mp4`,
          mimetype: "video/mp4",
        },
        { quoted: msg }
      );
    } catch (err) {
      console.log("❌ Error en el comando video:", err);
      await sock.sendMessage(
        chatId,
        { text: "❌ Ocurrió un error al procesar el video." },
        { quoted: msg }
      );
    }
  },
};