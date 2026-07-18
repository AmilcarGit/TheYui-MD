import { actualizarConfigGrupo, obtenerConfigGrupo } from "../groupSettings.js";

export default {
  command: ["setwelcome"],
  category: "Grupo",
  description:
    "Personaliza el mensaje de bienvenida. Uso: setwelcome <texto> (usa {user}, {grupo}, {total}). setwelcome reset para volver al mensaje por defecto.",
  groupOnly: true,
  adminOnly: true,

  run: async (sock, msg, args, context) => {
    const { chatId } = context;
    const opcion = args[0]?.toLowerCase();

    if (opcion === "reset" || opcion === "borrar") {
      actualizarConfigGrupo(chatId, { bienvenidaCustom: null });
      return await sock.sendMessage(
        chatId,
        { text: "✅ Bienvenida restaurada al mensaje por defecto (aleatorio)." },
        { quoted: msg }
      );
    }

    const texto = args.join(" ").trim();

    if (!texto) {
      const actual = obtenerConfigGrupo(chatId);
      return await sock.sendMessage(
        chatId,
        {
          text:
            `╭─「 🌸 *SETWELCOME* 」\n` +
            `│ Uso: *setwelcome <texto>*\n` +
            `│\n` +
            `│ Variables disponibles:\n` +
            `│ • {user} — menciona al nuevo\n` +
            `│ • {grupo} — nombre del grupo\n` +
            `│ • {total} — total de miembros\n` +
            `│\n` +
            `│ *setwelcome reset* — volver al default\n` +
            `╰────────────────\n\n` +
            (actual.bienvenidaCustom
              ? `📋 Mensaje actual:\n${actual.bienvenidaCustom}`
              : `📋 Actualmente usando mensajes por defecto (aleatorios).`),
        },
        { quoted: msg }
      );
    }

    actualizarConfigGrupo(chatId, { bienvenidaCustom: texto });

    await sock.sendMessage(
      chatId,
      {
        text:
          `✅ Mensaje de bienvenida actualizado.\n\n` +
          `📋 Vista previa:\n${texto
            .replace(/{user}/g, "@usuario")
            .replace(/{grupo}/g, "Este Grupo")
            .replace(/{total}/g, "50")}`,
      },
      { quoted: msg }
    );
  },
};
