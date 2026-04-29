const config = require('../utils/config');

module.exports = {
  name: 'version',
  aliases: ['v'],
  description: 'Show bot version',
  async execute(sock, msg) {
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: `${config.name} ${config.version}` },
      { quoted: msg }
    );
  },
};
