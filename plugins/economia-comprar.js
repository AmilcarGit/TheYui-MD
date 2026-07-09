import { obtenerUsuario, quitarSaldo, formatearMonto, agregarItem, tieneItem } from "../economyDB.js";

const ITEMS = [
  {
    id: "stickers_pack",
    nombre: "Pack de Stickers de Yui",
    precio: 500,
    emoji: "🎀"
  },
  {
    id: "foto_waifu",
    nombre: "Foto Waifu Personalizada",
    precio: 1000,
    emoji: "🌸"
  },
  {
    id: "rol_waifu",
    nombre: "Rol Waifu en el grupo",
    precio: 2000,
    emoji: "💕"
  },
  {
    id: "cancion_dedicada",
    nombre: "Canción Dedicada",
    precio: 1500,
    emoji: "🎵"
  },
  {
    id: "super_sticker",
    nombre: "Super Sticker Animado",
    precio: 800,
    emoji: "✨"
  },
  {
    id: "mensaje_amor",
    nombre: "Mensaje de Amor Personalizado",
    precio: 300,
    emoji: "💌"
  }
];

export default {
  command: ["comprar", "buy"],
  category: "Economia",
  description: "Compra un item de la tienda usando tu dinero. Uso: comprar <ID>",
  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const id = args[0]?.toLowerCase();

    if (!id) {
      return await sock.sendMessage(
        chatId,
        { text: "🌸 Escribe el ID del item que quieres comprar.\nEjemplo: *comprar stickers_pack*\nUsa *tienda* para ver la lista." },
        { quoted: msg }
      );
    }

    const item = ITEMS.find(i => i.id === id);
    if (!item) {
      return await sock.sendMessage(
        chatId,
        { text: `❌ No existe el item con ID "${id}". Usa *tienda* para ver los disponibles.` },
        { quoted: msg }
      );
    }

    const usuario = obtenerUsuario(numero);
    if (usuario.saldo < item.precio) {
      return await sock.sendMessage(
        chatId,
        {
          text: `❌ No tienes suficiente dinero.\n💵 Necesitas: ${formatearMonto(item.precio)}\n💵 Tu saldo: ${formatearMonto(usuario.saldo)}`
        },
        { quoted: msg }
      );
    }

    if (tieneItem(numero, item.id)) {
      return await sock.sendMessage(
        chatId,
        {
          text: `⚠️ Ya tienes *${item.nombre}* en tu inventario. No puedes comprarlo dos veces.`,
          mentions: [sender]
        },
        { quoted: msg }
      );
    }

    quitarSaldo(numero, item.precio);
    agregarItem(numero, item.id);

    await sock.sendMessage(
      chatId,
      {
        text: `✅ *Compra exitosa*\n\n${item.emoji} Has comprado *${item.nombre}*\n💵 Gastaste: ${formatearMonto(item.precio)}\n\n💕 ¡Gracias por tu compra! Disfruta tu nuevo item.`,
        mentions: [sender]
      },
      { quoted: msg }
    );
  }
};