import { resolverParticipante } from "../middlewares.js";
import { obtenerUsuario, formatearMonto, obtenerRanking } from "../economyDB.js";

export default {
  command: ["perfil", "profile"],
  category: "Info",
  description: "Muestra tu perfil completo o el de un usuario mencionado.",

  run: async (sock, msg, args, context) => {
    const { sender, chatId } = context;

    let objetivo = sender;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      objetivo = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      objetivo = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const numero = objetivo.split("@")[0].split(":")[0];

    let fotoUrl = null;
    try {
      fotoUrl = await sock.profilePictureUrl(objetivo, "image");
    } catch (e) {
      fotoUrl = null;
    }

    const esGrupo = chatId.endsWith("@g.us");
    let esAdminEnGrupo = null;
    let nombreContacto = null;

    try {
      const contacto = await sock.contacts[objetivo];
      if (contacto) {
        nombreContacto = contacto.name || contacto.notify || null;
      }
    } catch (_) {}

    if (esGrupo) {
      try {
        const participante = await resolverParticipante(sock, chatId, numero);
        esAdminEnGrupo = Boolean(participante?.admin);
      } catch (e) {
        esAdminEnGrupo = null;
      }
    }

    const usuario = obtenerUsuario(numero);
    const saldo = usuario.saldo || 0;
    const banco = usuario.banco || 0;
    const total = saldo + banco;
    const items = usuario.inventario || [];
    const efectos = usuario.efectos || [];
    const fechaRegistro = usuario.ultimoDaily ? new Date(usuario.ultimoDaily).toLocaleDateString("es-HN") : "Desconocida";

    const ranking = obtenerRanking(10);
    const posicion = ranking.findIndex(u => u.numero === numero) + 1;
    const rango = posicion > 0 ? `#${posicion}` : "No rankeado";

    let texto = `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n`;
    texto += `  ✨ *PERFIL DE YUI* ✨\n`;
    if (nombreContacto) {
      texto += `  _${nombreContacto}_\n`;
    }
    texto += `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸\n\n`;

    texto += `╭─🎀 *INFORMACIÓN* 🎀\n`;
    texto += `│ 📱 Número: @${numero}\n`;
    if (nombreContacto) texto += `│ 📛 Nombre: ${nombreContacto}\n`;
    texto += `│ 📅 Registro: ${fechaRegistro}\n`;
    if (esGrupo && esAdminEnGrupo !== null) {
      texto += `│ 👑 Admin: ${esAdminEnGrupo ? "Sí ✅" : "No"}\n`;
    }
    texto += `╰────────────────\n\n`;

    texto += `╭─💰 *ECONOMÍA* 💰\n`;
    texto += `│ 💵 Efectivo: ${formatearMonto(saldo)}\n`;
    texto += `│ 🏦 Banco: ${formatearMonto(banco)}\n`;
    texto += `│ 💎 Total: ${formatearMonto(total)}\n`;
    texto += `│ 🏆 Ranking: ${rango}\n`;
    texto += `╰────────────────\n\n`;

    texto += `╭─🎁 *INVENTARIO* 🎁\n`;
    if (items.length === 0) {
      texto += `│ 📭 Sin items aún.\n`;
    } else {
      const agrupado = {};
      for (const id of items) {
        agrupado[id] = (agrupado[id] || 0) + 1;
      }
      for (const [id, cant] of Object.entries(agrupado)) {
        const nombreItem = id.replace(/_/g, " ").toUpperCase();
        texto += `│ ${id.includes("vip") ? "👑" : id.includes("suerte") ? "🍀" : "🎁"} ${nombreItem} x${cant}\n`;
      }
    }
    texto += `╰────────────────\n\n`;

    texto += `╭─✨ *EFECTOS ACTIVOS* ✨\n`;
    if (efectos.length === 0) {
      texto += `│ ❌ Sin efectos activos.\n`;
    } else {
      const mapaEfectos = {
        interes_basico: "📈 Interés Básico (+50/h)",
        interes_plus: "📊 Interés Plus (+200/h)",
        vip_oro: "👑 VIP Oro (x2)",
        vip_platino: "💎 VIP Platino (x3)",
        socio: "🤝 Socio (+50/trabajo)",
        suerte: "🍀 Suerte (x1.5)",
        enfriamiento_menos: "☕ Café (enfriamiento -30%)",
      };
      for (const efecto of efectos) {
        const nombre = mapaEfectos[efecto] || efecto;
        texto += `│ ✅ ${nombre}\n`;
      }
    }
    texto += `╰────────────────\n\n`;

    texto += `🦋┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈🦋\n`;
    texto += `💕 _Tu waifu siempre contigo_ 🌹`;

    if (fotoUrl) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: fotoUrl },
          caption: texto,
          mentions: [objetivo],
        },
        { quoted: msg }
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: texto + `\n\n_Sin foto de perfil pública._`,
          mentions: [objetivo],
        },
        { quoted: msg }
      );
    }
  }
};