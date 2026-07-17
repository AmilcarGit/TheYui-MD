# 💕🌹👑 TheYui-MD

<a href='https://postimg.cc/3kC1TF51' target='_blank'><img src='https://i.postimg.cc/7ZjWSKKF/IMG-20260710-WA0011.jpg' border='0' alt='IMG-20260710-WA0011'></a>

Bot de WhatsApp **sin prefijo**, construido sobre [Baileys](https://github.com/WhiskeySockets/Baileys), con carga dinámica de plugins, sistema de subbots, economía interna y moderación de grupos.

> Creado por **AmilcarGit**

---

## ✨ Características

- **Sin prefijo**: los comandos se detectan directamente por la primera palabra del mensaje, sin necesidad de `!`, `/` ni `.`
- **Sistema de plugins dinámico**: cada comando vive en su propio archivo dentro de `plugins/`, se cargan automáticamente al iniciar
- **Subbots**: los usuarios pueden vincular su propio número como subbot desde el bot principal
- **Economía interna** con saldo, banco, trabajo, recompensa diaria y transferencias
- **Moderación de grupos**: antilink con expulsión automática, bienvenida/despedida, promover/degradar/expulsar admins
- **Filtros reutilizables**: `ownerOnly`, `adminOnly`, `groupOnly`, `requiereBotAdmin` para proteger comandos sensibles
- Manejo de errores robusto (no se cae el proceso ante errores no controlados)

---

## 📋 Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Una cuenta de WhatsApp para vincular al bot (número principal o número dedicado)

---

## 🚀 Instalación

```bash
termux-setup-storage
apt update
apt upgrade -y
pkg install -y git nodejs ffmpeg imagemagick
git clone https://github.com/AmilcarGit/TheYui-MD.git
cd TheYui-MD
npm install
npm start
```

Al iniciar por primera vez, el bot mostrará un **código de vinculación (pairing code)** o **QR** en consola. Escanéalo/ingrésalo desde WhatsApp → Dispositivos vinculados.

---

## ⚙️ Configuración

Toda la configuración del bot vive en `config.js`:

```js
export const config = {
  botName: "TheYui-MD",
  creator: "AmilcarGit",
  ownerNumber: "5219XXXXXXXX",   // tu número, sin '+' ni espacios
  sessionFolder: "./session",
  pluginsFolder: "./plugins",

  newsletterJid: "...",

  apis: {
    edward: {
      baseUrl: "...",
      apiKey: "...",
    },
  },
};
```

> ⚠️ **No subas tu `config.js` con datos reales a un repositorio público.** Usa una copia local o variables de entorno para el número del dueño y las API keys.

---

## 📜 Lista de comandos

Todos los comandos se escriben **sin prefijo**, tal cual aparecen abajo.

### 🌐 Información
| Comando | Descripción |
|---|---|
| `menu` / `help` / `ayuda` | Muestra el menú de comandos |
| `ping` / `speed` | Muestra la velocidad de respuesta del bot |
| `infobot` / `botinfo` / `estado` | Estado completo del bot: memoria, plugins, subbots |
| `apistatus` / `estadoapi` | Estado de la API conectada |
| `perfil` / `profile` | Muestra tu perfil o el de alguien mencionado |

### 👥 Grupo (requiere ser admin del grupo)
| Comando | Descripción |
|---|---|
| `antilink on` / `antilink off` | Activa/desactiva el borrado + expulsión automática por enlaces |
| `welcome on` / `welcome off` | Activa/desactiva mensajes de bienvenida y despedida |
| `kick` / `expulsar` | Expulsa a un miembro (mencionando o respondiendo) |
| `promote` / `ascender` | Asciende a un miembro a administrador |
| `demote` / `degradar` | Baja a un admin a miembro normal |
| `grupoinfo` / `infogrupo` | Info del grupo: nombre, descripción, miembros, admins |
| `bot` | Configuración general del bot en el grupo |

### 💰 Economía
| Comando | Descripción |
|---|---|
| `saldo` / `balance` / `bal` | Muestra tu efectivo y banco |
| `diario` / `daily` | Reclama tu recompensa diaria (cada 24h) |
| `trabajar` / `work` | Trabaja para ganar Yui (cada 1h) |
| `depositar <monto>` | Deposita Yui en el banco |
| `retirar <monto>` | Retira Yui del banco |
| `transferir <monto>` / `pagar` / `dar` | Transfiere Yui a otro usuario |
| `topricos` / `ranking` | Top de usuarios con más Yui |

### 🎨 Multimedia y diversión
| Comando | Descripción |
|---|---|
| `sticker` / `s` | Convierte una imagen/video en sticker |
| `play <canción>` / `mp3` | Busca y envía audio desde YouTube |
| `video <link>` / `mp4` | Descarga un video desde un link de YouTube |
| `abrazo` / `hug` | Envía/da un abrazo anime |
| `kiss` / `beso` | Envía/da un beso anime |
| `cuddle` / `acurrucar` | Imagen de anime acurrucándose |
| `waifu` | Imagen aleatoria de waifu |

### 🔑 Dueño del bot (owner)
| Comando | Descripción |
|---|---|
| `subbot` / `serbot` | Vincula un número como subbot |
| `subbots` | Lista los subbots activos |
| `delsubbot` | Elimina un subbot |
| `crearcodigo` / `newcode` | Crea un código de regalo para la API |
| `update` / `gitpull` / `up` | Actualiza el bot desde el repositorio |
| `limpiar` / `clean` | Limpia archivos temporales y libera memoria |

---

## 🧩 Crear un plugin nuevo

Cada plugin es un archivo `.js` dentro de `plugins/` con esta forma básica:

```js
export default {
  command: ["saludo", "hola"],
  description: "Responde con un saludo",
  category: "info",

  // Filtros opcionales
  ownerOnly: false,
  adminOnly: false,
  groupOnly: false,

  async execute(sock, msg, args, context) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "¡Hola! 👋",
    });
  },
};
```

El `pluginLoader.js` lo detecta y carga automáticamente al reiniciar el bot, no hace falta registrarlo en ningún otro lado.

---

## 🛡️ Nota sobre el modo sin prefijo

Al no usar prefijo, cualquier palabra suelta que coincida con un `command` de un plugin puede activarlo. Ten cuidado al nombrar comandos nuevos para evitar que se disparen con palabras comunes de una conversación normal.

---
### Si Bas  a usar esta Base para tu Bot 🔭 
PORFAVOR DEJAR CRÉDITOS AL CREADOR Y EVITAR PROBLEMAS🧸

## 📄 Licencia

MIT © AmilcarGit
