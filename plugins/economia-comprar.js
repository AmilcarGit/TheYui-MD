import { obtenerUsuario, quitarSaldo, formatearMonto, agregarItem, tieneItem, agregarEfecto } from "../economyDB.js";

const ITEMS = [
  {
    id: "inversion_basica",
    nombre: "Inversión Básica",
    precio: 1000,
    efecto: "interes_basico"
  },
  {
    id: "inversion_plus",
    nombre: "Inversión Plus",
    precio: 5000,
    efecto: "interes_plus"
  },
  {
    id: "vip_oro",
    nombre: "Pase VIP Oro",
    precio: 10000,
    efecto: "vip_oro"
  },
  {
    id: "vip_platino",
    nombre: "Pase VIP Platino",
    precio: 25000,
    efecto: "vip_platino"
  },
  {
    id: "socio",
    nombre: "Socio Comercial",
    precio: 15000,
    efecto: "socio"
  }
];

export default {
  command: ["comprar", "buy"],
  category: "Economia",
  description: "Compra un item de la tienda. Uso: comprar <ID>",
  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const id = args[0]?.toLowerCase();

    if (!id) {
      return await sock.sendMessage(
        chatId,
        { text: "🌸 Escribe el ID del item que quieres comprar.\nEjemplo: *comprar inversion_basica*\nUsa *tienda* para ver la lista." },
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

    let textoAdicional = "";
    if (item.efecto) {
      agregarEfecto(numero, item.efecto);
      textoAdicional = `\n\n✨ *Efecto activado:* ${item.nombre} aplicado a tu cuenta.`;
    }

    await sock.sendMessage(
      chatId,
      {
        text: `✅ *Compra exitosa*\n\n${item.emoji || "🎁"} Has comprado *${item.nombre}*\n💵 Gastaste: ${formatearMonto(item.precio)}${textoAdicional}\n\n💕 ¡Gracias por tu compra! Disfruta tus beneficios.`,
        mentions: [sender]
      },
      { quoted: msg }
    );
  }
};