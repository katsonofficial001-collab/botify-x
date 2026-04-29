const path = require('path');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} = require('@whiskeysockets/baileys');

const config = require('../utils/config');
const { handleMessages } = require('./messages');
const { handleGroupParticipantsUpdate } = require('./group');

const baileysLogger = pino({ level: 'silent' });

let reconnectAttempts = 0;

async function startBot() {
  const authPath = path.join(__dirname, '..', 'auth');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: baileysLogger,
    printQRInTerminal: false,
    mobile: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    browser: ['Botify X', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true,
  });

  // Pairing-code flow (no QR)
  if (!sock.authState.creds.registered) {
    const phone = (process.env.BOT_PHONE_NUMBER || '').replace(/[^0-9]/g, '');
    if (!phone) {
      console.error(
        '[bot] BOT_PHONE_NUMBER is not set in .env. Cannot request pairing code.'
      );
    } else {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phone);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log('\n========================================');
          console.log(`  ${config.name} — pairing code`);
          console.log(`  Phone:  ${phone}`);
          console.log(`  Code:   ${formatted}`);
          console.log(
            '  In WhatsApp: Settings → Linked Devices → Link with phone number'
          );
          console.log('========================================\n');
        } catch (err) {
          console.error('[bot] Failed to request pairing code:', err);
        }
      }, 3000);
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      reconnectAttempts = 0;
      console.log(`[bot] ✓ ${config.name} ${config.version} connected.`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        console.error(
          '[bot] Logged out from WhatsApp. Delete the auth/ folder and re-pair.'
        );
        return;
      }

      reconnectAttempts += 1;
      const delay = Math.min(30000, 2000 * reconnectAttempts);
      console.log(
        `[bot] Connection closed (code ${statusCode}). Reconnecting in ${delay}ms...`
      );
      setTimeout(() => {
        startBot().catch((e) => console.error('[bot] reconnect error:', e));
      }, delay);
    }
  });

  sock.ev.on('messages.upsert', async (payload) => {
    try {
      await handleMessages(sock, payload);
    } catch (err) {
      console.error('[bot] messages.upsert error:', err);
    }
  });

  sock.ev.on('group-participants.update', async (update) => {
    try {
      await handleGroupParticipantsUpdate(sock, update);
    } catch (err) {
      console.error('[bot] group-participants.update error:', err);
    }
  });

  return sock;
}

module.exports = { startBot };
