#!/usr/bin/env node
const { addUser } = require('../utils/access');

const [, , username, password, daysStr] = process.argv;

if (!username || !password) {
  console.log('Usage: npm run add-user -- <username> <password> [days=30]');
  process.exit(1);
}

const days = parseInt(daysStr, 10) || 30;

try {
  const user = addUser(username, password, days);
  console.log(`✓ Added user "${username}" — expires ${user.expiresAt}`);
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
