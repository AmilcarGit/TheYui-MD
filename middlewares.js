import { config } from "./config.js";

export function esOwner(numero) {
  return config.ownerNumbers.includes(numero);
}

export async function resolverNumeroReal(sock, sender, msg = null) {
  const crudo = String(sender || "");
  const limpioDirecto = crudo.split("@")[0].split(":")[0].replace(/\D/g, "");

  if (!crudo.endsWith("@lid")) {
    return limpioDirecto;
  }

  const alternativaEnMsg =
    msg?.key?.participantPn ||
    msg?.key?.senderPn ||
    msg?.key?.remoteJidPn ||
    msg?.verifiedBizName;

  if (alternativaEnMsg && !String(alternativaEnMsg).endsWith("@lid")) {
    const numeroDelMsg = String(alternativaEnMsg).split("@")[0].split(":")[0].replace(/\D/g, "");
    if (numeroDelMsg) return numeroDelMsg;
  }

  try {
    const contactos = sock?.contacts || {};

    const directo = contactos[crudo];
    const candidatoDirecto = directo?.id || directo?.jid || directo?.phoneNumber || directo?.pn;
    if (candidatoDirecto && !String(candidatoDirecto).endsWith("@lid")) {
      const numeroReal = String(candidatoDirecto).split("@")[0].split(":")[0].replace(/\D/g, "");
      if (numeroReal) return numeroReal;
    }

    for (const contacto of Object.values(contactos)) {
      const camposLid = [contacto?.lid, contacto?.id, contacto?.jid]
        .filter(Boolean)
        .map((v) => String(v));

      const coincideLid = camposLid.some((v) => v === crudo || v.split("@")[0] === limpioDirecto);
      if (!coincideLid) continue;

      const candidatos = [contacto?.id, contacto?.jid, contacto?.phoneNumber, contacto?.pn]
        .filter(Boolean)
        .map((v) => String(v))
        .filter((v) => !v.endsWith("@lid"));

      if (candidatos[0]) {
        const numeroReal = candidatos[0].split("@")[0].split(":")[0].replace(/\D/g, "");
        if (numeroReal) return numeroReal;
      }
    }
  } catch (_) {}

  return limpioDirecto;
}

/**
 * Verifica si el propio bot es administrador del grupo.
 * Reutiliza la lógica robusta de esAdminDeGrupo (incluye resolución de @lid),
 * pasando el JID del propio bot como "sender".
 */
export async function botEsAdmin(sock, chatId) {
  const botJid = sock.user?.id || "";
  return esAdminDeGrupo(sock, chatId, botJid);
}

/**
 * Determina si un número (sender) es administrador del grupo indicado.
 * Basado en la lógica robusta "checkIsGroupAdmin" de Maneki-neko:
 * intenta varias formas de emparejar al participante antes de rendirse.
 */
export async function esAdminDeGrupo(sock, chatId, sender) {
  const senderNum = String(sender || "").split("@")[0].split(":")[0].replace(/\D/g, "");

  let metadata;
  try {
    metadata = await sock.groupMetadata(chatId);
  } catch (_) {
    return false;
  }

  const participantes = metadata?.participants || [];

  const porId = participantes.find((p) => {
    const pId = String(p.id || "");
    const pNum = pId.split("@")[0].split(":")[0].replace(/\D/g, "");
    return pId === sender || (senderNum && pNum && senderNum === pNum);
  });
  if (porId) return Boolean(porId.admin);

  const porCampoExtra = participantes.find((p) => {
    const candidatos = [p.jid, p.phoneNumber, p.phone, p.pn, p.lid]
      .filter(Boolean)
      .map((v) => String(v).split("@")[0].split(":")[0].replace(/\D/g, ""));
    return senderNum && candidatos.includes(senderNum);
  });
  if (porCampoExtra) return Boolean(porCampoExtra.admin);

  const todosSonLid =
    participantes.length > 0 &&
    participantes.every((p) => String(p.id || "").endsWith("@lid"));

  if (todosSonLid) {
    try {
      const store = sock.store || sock.authState?.store;
      const contactos = store?.contacts || sock.contacts || {};

      for (const [lidKey, contacto] of Object.entries(contactos)) {
        const cNum = String(contacto?.id || contacto?.jid || lidKey || "")
          .split("@")[0]
          .split(":")[0]
          .replace(/\D/g, "");

        if (senderNum && cNum && cNum === senderNum) {
          const lidId = String(lidKey).includes("@") ? lidKey : `${lidKey}@lid`;
          const porStoreLid = participantes.find((p) => String(p.id || "") === lidId);
          if (porStoreLid) return Boolean(porStoreLid.admin);
        }
      }
    } catch (_) {}
  }

  return false;
}

/**
 * Busca a un participante del grupo por número de teléfono, soportando
 * el caso en que WhatsApp identifica a los miembros con @lid en vez del
 * número real (usa la libreta de contactos del bot para resolverlo).
 */
export async function resolverParticipante(sock, chatId, numero) {
  const numeroLimpio = String(numero || "").replace(/\D/g, "");

  let metadata;
  try {
    metadata = await sock.groupMetadata(chatId);
  } catch (_) {
    return null;
  }

  const participantes = metadata?.participants || [];

  const porId = participantes.find((p) => {
    const pNum = String(p.id || "").split("@")[0].split(":")[0].replace(/\D/g, "");
    return numeroLimpio && pNum && numeroLimpio === pNum;
  });
  if (porId) return porId;

  const porCampoExtra = participantes.find((p) => {
    const candidatos = [p.jid, p.phoneNumber, p.phone, p.pn, p.lid]
      .filter(Boolean)
      .map((v) => String(v).split("@")[0].split(":")[0].replace(/\D/g, ""));
    return numeroLimpio && candidatos.includes(numeroLimpio);
  });
  if (porCampoExtra) return porCampoExtra;

  const todosSonLid =
    participantes.length > 0 &&
    participantes.every((p) => String(p.id || "").endsWith("@lid"));

  if (todosSonLid) {
    try {
      const store = sock.store || sock.authState?.store;
      const contactos = store?.contacts || sock.contacts || {};

      for (const [lidKey, contacto] of Object.entries(contactos)) {
        const cNum = String(contacto?.id || contacto?.jid || lidKey || "")
          .split("@")[0]
          .split(":")[0]
          .replace(/\D/g, "");

        if (numeroLimpio && cNum && cNum === numeroLimpio) {
          const lidId = String(lidKey).includes("@") ? lidKey : `${lidKey}@lid`;
          const porStoreLid = participantes.find((p) => String(p.id || "") === lidId);
          if (porStoreLid) return porStoreLid;
        }
      }
    } catch (_) {}
  }

  return null;
}

export async function pasaFiltros(sock, msg, plugin, context) {
  const { chatId, sender } = context;
  const numero = await resolverNumeroReal(sock, sender, msg);
  const esGrupo = chatId.endsWith("@g.us");

  if (plugin.ownerOnly && !esOwner(numero)) {
    await sock.sendMessage(
      chatId,
      { text: "❀ Este comando es exclusivo del *creador* del bot." },
      { quoted: msg }
    );
    return false;
  }

  if (plugin.groupOnly && !esGrupo) {
    await sock.sendMessage(
      chatId,
      { text: "❀ Este comando solo se puede usar *dentro de un grupo*." },
      { quoted: msg }
    );
    return false;
  }

  if (plugin.privateOnly && esGrupo) {
    await sock.sendMessage(
      chatId,
      { text: "❀ Este comando solo se puede usar *en privado*, no en grupos." },
      { quoted: msg }
    );
    return false;
  }

  if (plugin.adminOnly) {
    if (!esGrupo) {
      await sock.sendMessage(
        chatId,
        { text: "❀ Este comando solo se puede usar *dentro de un grupo*." },
        { quoted: msg }
      );
      return false;
    }

    if (!esOwner(numero)) {
      try {
        const esAdmin = await esAdminDeGrupo(sock, chatId, sender);

        if (!esAdmin) {
          await sock.sendMessage(
            chatId,
            { text: "❀ Este comando es solo para *administradores* del grupo." },
            { quoted: msg }
          );
          return false;
        }
      } catch (err) {
        await sock.sendMessage(
          chatId,
          { text: "❌ No pude verificar los admins del grupo, intenta de nuevo." },
          { quoted: msg }
        );
        return false;
      }
    }
  }

  if (plugin.requiereBotAdmin && esGrupo) {
    try {
      const botAdmin = await botEsAdmin(sock, chatId);
      if (!botAdmin) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❀ Necesito ser *administrador* del grupo para poder hacer esto.\n" +
              "Hazme admin y vuelve a intentarlo.",
          },
          { quoted: msg }
        );
        return false;
      }
    } catch (err) {
      await sock.sendMessage(
        chatId,
        { text: "❌ No pude verificar si soy admin del grupo." },
        { quoted: msg }
      );
      return false;
    }
  }

  return true;
}