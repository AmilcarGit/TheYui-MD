import { formatearMonto } from "../economyDB.js";

const ITEMS = [
  {
    id: "stickers_pack",
    nombre: "Pack de Stickers de Yui",
    precio: 500,
    descripcion: "Un pack de 10 stickers exclusivos de Yui",
    emoji: "🎀"
  },
  {
    id: "foto_waifu",
    nombre: "Foto Waifu Personalizada",
    precio: 1000,
    descripcion: "Una imagen de tu waifu favorita generada por IA",
    emoji: "🌸"
  },
  {
    id: "rol_waifu",
    nombre: "Rol Waifu en el grupo",
    precio: 2000,
    descripcion: "Obtén un rol especial de waifu en el grupo",
    emoji: "💕"
  },
  {
    id: "cancion_dedicada",
    nombre: "Canción Dedicada",
    precio: 1500,
    descripcion: "Te envío una canción de tu artista favorito",
    emoji: "🎵"
  },
  {
    id: "super_sticker",
    nombre: "Super Sticker Animado",
    precio: 800,
    descripcion: "Un sticker animado exclusivo de Yui",
    emoji: "✨"
  },
  {
    id: "mensaje_amor",
    nombre: "Mensaje de Amor Personalizado",
    precio: 300,
    descripcion: "Te envío un mensaje de amor especial para ti",
    emoji: "💌"
  }
];

export default {
  command: ["tienda", "shop"],
  category: "Economia",
  description: "Muestra la tienda de Yui con todos los items disponibles.",
  run: async (sock, msg, args, context) => {
    const { chatId } = context;

    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `  🛍️ *TIENDA DE YUI* 🛍️\n`;
    texto += `  _Compra items exclusivos con tu dinero_ 💵\n`;
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    for (const item of ITEMS) {
      texto += `${item.emoji} *${item.nombre}*\n`;
      texto += `   💵 Precio: ${formatearMonto(item.precio)}\n`;
      texto += `   📝 ${item.descripcion}\n`;
      texto += `   🔑 ID: ${item.id}\n\n`;
    }

    texto += `🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 Para comprar escribe: *comprar <ID>*\n`;
    texto += `🌹 Ejemplo: *comprar stickers_pack*\n`;
    texto += `📌 También puedes ver tu inventario con: *inventario*`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  }
};