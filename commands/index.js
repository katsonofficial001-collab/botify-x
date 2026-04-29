const fs = require('fs');
const path = require('path');

const commands = {};

for (const file of fs.readdirSync(__dirname)) {
  if (file === 'index.js' || !file.endsWith('.js')) continue;
  const cmd = require(path.join(__dirname, file));
  if (!cmd?.name || typeof cmd.execute !== 'function') continue;
  commands[cmd.name.toLowerCase()] = cmd;
  if (Array.isArray(cmd.aliases)) {
    for (const alias of cmd.aliases) {
      commands[String(alias).toLowerCase()] = cmd;
    }
  }
}

module.exports = commands;
