function formatearDuracion(segundos) {
  if (!segundos && segundos !== 0) return "Desconocida";
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${seg}`;
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

const API_BASE = "https://dv-yer-api.online/ytmp4";
const API_KEY = "dvyer673989047548";

function extraerCampo(obj, nombres) {
  for (const nombre of nombres) {
    const valor = nombre.split(".").reduce((acc, key) => acc?.[key], obj);
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return null;
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
        { text: "🦋 Envía el enlace del video de YouTube.\nEjemplo: *video* https://youtu.be/abc123" },
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

      const downloadUrl = `${API_BASE}?mode=link&url=${encodeURIComponent(url)}&quality=360p&apikey=${API_KEY}`;
      const downloadRes = await fetch(downloadUrl);

      if (!downloadRes.ok) {
        await sock.sendMessage(
          chatId,
          { text: `❌ La API de descarga respondió con error (${downloadRes.status}). Intenta de nuevo más tarde.` },
          { quoted: msg }
        );
        return;
      }

      const downloadData = await downloadRes.json();

      if (downloadData.ok === false) {
        console.log("⚠️ dv-yer-api devolvió ok:false:", JSON.stringify(downloadData));
        await sock.sendMessage(
          chatId,
          { text: `❌ La API no pudo procesar ese video: ${downloadData.error || downloadData.message || "sin detalle"}` },
          { quoted: msg }
        );
        return;
      }

      const videoLink = extraerCampo(downloadData, [
        "download_url",
        "url",
        "stream_url",
        "download_url_full",
        "result.download_url",
        "data.url",
      ]);

      const titulo = extraerCampo(downloadData, ["title", "result.title", "data.title"]) || "Video sin título";

      const duracionSegundos = extraerCampo(downloadData, [
        "duration",
        "result.duration",
        "data.duration",
      ]);

      const thumbnail = extraerCampo(downloadData, ["thumbnail", "result.thumbnail", "data.thumbnail"]);
      const calidad = extraerCampo(downloadData, ["quality", "quality_requested"]) || "360p";

      if (!videoLink) {
        console.log("⚠️ Respuesta de dv-yer-api sin campo de descarga reconocido:", JSON.stringify(downloadData));
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ No pude leer el enlace de descarga en la respuesta de la API. " +
              "El formato de esa API no coincide con lo esperado (revisa la consola del bot para ver la respuesta cruda).",
          },
          { quoted: msg }
        );
        return;
      }

      const duracion = duracionSegundos ? formatearDuracion(duracionSegundos) : null;
      const lineaDuracion = duracion ? `║  ⏱️  Duración: ${duracion}\n` : "";

      if (thumbnail) {
        const caption = `╔═══════════════════╗
║  🎬 *VIDEO LISTO*      ║
╠════════════════════╣
║  📌 Título: ${titulo.slice(0, 40)}${titulo.length > 40 ? "…" : ""}
${lineaDuracion}║  📊 Calidad: ${calidad}
║  ───────────────────────
║  ${barraProgreso(100)} 100%
║  ✅ Verificando y enviando video...
╚═════════════════════════╝
⚡ TheYui-MD · Tecnología de vanguardia`;

        await sock.sendMessage(
          chatId,
          {
            image: { url: thumbnail },
            caption: caption,
          },
          { quoted: msg }
        );
      }

      await sock.sendMessage(
        chatId,
        { text: "📥 Descargando el archivo para verificarlo antes de enviarlo..." },
        { quoted: msg }
      );

      const videoRes = await fetch(videoLink);

      if (!videoRes.ok) {
        await sock.sendMessage(
          chatId,
          { text: `❌ El servidor de descarga respondió con error (${videoRes.status}). Intenta de nuevo más tarde.` },
          { quoted: msg }
        );
        return;
      }

      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
      const firmaValida = videoBuffer.slice(0, 32).includes("ftyp");

      if (videoBuffer.length < 50 * 1024 || !firmaValida) {
        await sock.sendMessage(
          chatId,
          {
            text:
              `❌ El archivo que devolvió la API está incompleto o dañado (${(videoBuffer.length / 1024).toFixed(0)} KB). ` +
              `No lo voy a enviar para que no te llegue roto. Prueba con otro video o más tarde.`,
          },
          { quoted: msg }
        );
        return;
      }

      await sock.sendMessage(
        chatId,
        {
          document: videoBuffer,
          mimetype: "video/mp4",
          fileName: `${titulo.slice(0, 60)}.mp4`,
          caption: `📹 *${titulo}*\n${duracion ? `⏱️ ${duracion} · ` : ""}📦 ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB\n\n✨ *TheYui-MD* — Más que un bot, una leyenda.`,
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
