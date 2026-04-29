#!/usr/bin/env node
const { loadUsers, isExpired } = require('../utils/access');

const data = loadUsers();
if (!data.users.length) {
  console.log('No users registered.');
  process.exit(0);
}

console.log('\nRegistered users:\n');
for (const u of data.users) {
  const status = isExpired(u) ? 'EXPIRED' : 'ACTIVE';
  console.log(`  • ${u.username.padEnd(20)} [${status}]  expires ${u.expiresAt}`);
}
console.log('');
