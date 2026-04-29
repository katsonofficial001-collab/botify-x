const config = require('../utils/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  description: 'Show all commands',
  async execute(sock, msg) {
    const p = config.prefix;
    const text =
`╭━━〔 *${config.name}* 〕━━┈⊷
┃ Version : *${config.version}*
┃ Prefix  : *${p}*
╰━━━━━━━━━━━━━━━┈⊷

╭─❒ *GENERAL*
│ ${p}menu
│ ${p}version
│ ${p}gpt <question>
╰────────┈⊷

╭─❒ *GROUP*
│ ${p}tagall [message]
│ ${p}poststatus  (reply to media/text)
╰────────┈⊷

╭─❒ *AUTO FEATURES*
│ • Antilink in groups
│ • Anti-status-mention in groups
│ • Welcome / Goodbye messages
│ • View-once unlocker  (reply to view-once with any emoji)
│ • Status saver        (reply to a status with text/emoji)
╰────────┈⊷

> Powered by Botify X`;

    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  },
};
