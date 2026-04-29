const config = require('../utils/config');
const commands = require('../commands');
const { handleAntilink, handleAntiStatusMention } = require('./group');
const { handleViewOnceReply } = require('./viewonce');
const { handleStatusReply } = require('./statussaver');

function extractText(msg) {
  const m = msg.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  );
}

async function handleMessages(sock, { messages, type }) {
  if (type !== 'notify') return;

  for (const msg of messages) {
    try {
      if (!msg.message) continue;
      if (msg.key && msg.key.remoteJid === 'status@broadcast') continue;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const body = extractText(msg);

      // Group safety filters first
      if (isGroup) {
        if (await handleAntiStatusMention(sock, msg)) continue;
        if (await handleAntilink(sock, msg, body)) continue;
      }

      // Status saver (reply to a status with text/emoji)
      if (await handleStatusReply(sock, msg)) continue;

      // View-once unlocker (reply to a view-once with any text/emoji)
      if (await handleViewOnceReply(sock, msg)) continue;

      // Commands
      if (body && body.startsWith(config.prefix)) {
        const args = body.slice(config.prefix.length).trim().split(/\s+/);
        const name = (args.shift() || '').toLowerCase();
        const command = commands[name];
        if (command) {
          await command.execute(sock, msg, args, body);
        }
      }
    } catch (err) {
      console.error('[bot] message handler error:', err);
    }
  }
}

module.exports = { handleMessages };
