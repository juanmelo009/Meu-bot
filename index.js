const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const axios = require("axios");

// CONFIG
const DONO = "5521969231249@s.whatsapp.net"; // COLOCA SEU NÚMERO

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({ auth: state });

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("🔑 Escaneie:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("🚀 ULTRA SUPREMO ONLINE");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = msg.key.participant || from;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const prefix = "!";
    if (!texto.startsWith(prefix)) return;

    const args = texto.slice(1).split(" ");
    const comando = args.shift().toLowerCase();

    // ===== MENU =====
    if (comando === "menu") {
      return sock.sendMessage(from, {
        text: `😈 ULTRA SUPREMO

!menu
!ping
!fig
!grupo
!marcar
!kick
!ia
!play
!dono`
      });
    }

    // ===== IA (CHATGPT) =====
    if (comando === "ia") {
      const pergunta = args.join(" ");
      if (!pergunta) return;

      try {
        const res = await axios.get(`https://api.affiliateplus.xyz/api/chatbot?message=${pergunta}&botname=Bot&ownername=Juan`);
        await sock.sendMessage(from, { text: res.data.message });
      } catch {
        await sock.sendMessage(from, { text: "Erro na IA" });
      }
    }

    // ===== PLAY (SIMPLES) =====
    if (comando === "play") {
      const musica = args.join(" ");
      if (!musica) return;

      await sock.sendMessage(from, {
        text: `🎵 Procurando: ${musica}...`
      });
    }

    // ===== FIGURINHA =====
    if (comando === "fig") {
      const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted || !quoted.imageMessage) {
        return sock.sendMessage(from, { text: "Marque uma imagem" });
      }

      const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
      let buffer = Buffer.from([]);

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      await sock.sendMessage(from, { sticker: buffer });
    }

    // ===== GRUPO =====
    if (comando === "grupo") {
      if (!isGroup) return;

      const meta = await sock.groupMetadata(from);
      await sock.sendMessage(from, {
        text: `Grupo: ${meta.subject}\nMembros: ${meta.participants.length}`
      });
    }

    // ===== MARCAR =====
    if (comando === "marcar") {
      if (!isGroup) return;

      const meta = await sock.groupMetadata(from);
      const mentions = meta.participants.map(p => p.id);

      await sock.sendMessage(from, {
        text: "👥 Marcando geral",
        mentions
      });
    }

    // ===== KICK =====
    if (comando === "kick") {
      if (sender !== DONO) return;

      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (!mentioned) return;

      await sock.groupParticipantsUpdate(from, mentioned, "remove");
    }

    // ===== DONO =====
    if (comando === "dono") {
      await sock.sendMessage(from, {
        text: "👑 Dono supremo"
      });
    }

    // ===== PING =====
    if (comando === "ping") {
      await sock.sendMessage(from, { text: "⚡ Ultra rápido!" });
    }
  });
}

startBot();
