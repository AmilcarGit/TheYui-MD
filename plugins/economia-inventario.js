import { obtenerInventarioUsuario } from "../economyDB.js";

const ITEMS = [
  { id: "inversion_basica", nombre: "Inversión Básica", emoji: "📈" },
  { id: "inversion_plus", nombre: "Inversión Plus", emoji: "📊" },
  { id: "vip_oro", nombre: "Pase VIP Oro", emoji: "👑" },
  { id: "vip_platino", nombre: "Pase VIP Platino", emoji: "💎" },
  { id: "socio", nombre: "Socio Comercial", emoji: "🤝" },
  { id: "amuleto_suerte", nombre: "Amuleto de la Suerte", emoji: "🍀" },
  { id: "cafe_energetico", nombre: "Café Energético", emoji: "☕" },
  { id: "fabrica_stickers", nombre: "Fábrica de Stickers", emoji: "🏭" },
  { id: "acciones_empresa", nombre: "Acciones de Empresa", emoji: "🏢" },
  { id: "curso_financiero", nombre: "Curso Financiero", emoji: "🎓" },
];

export default {
  command: ["inventario", "inv"],
  category: "Economia",
  description: "Muestra los items que has comprado.",

  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;
    const numero = sender.split("@")[0].split(":")[0];
    const items = obtenerInventarioUsuario(numero);

    if (items.length === 0) {
      return await sock.sendMessage(
        chatId,
        { text: "🎒 Tu inventario está vacío. Usa *tienda* para ver qué puedes comprar." },
        { quoted: msg }
      );
    }

    const conteo = {};
    for (const id of items) {
      conteo[id] = (conteo[id] || 0) + 1;
    }

    let texto = `🎒 *Tu inventario*\n\n`;
    for (const [id, cantidad] of Object.entries(conteo)) {
      const info = ITEMS.find((i) => i.id === id);
      const nombre = info?.nombre || id;
      const emoji = info?.emoji || "🎁";
      texto += `${emoji} ${nombre}${cantidad > 1 ? ` ×${cantidad}` : ""}\n`;
    }

    texto += `\n📦 Total: ${items.length} item(s)`;

    await sock.sendMessage(chatId, { text: texto }, { quoted: msg });
  },
};
