#!/usr/bin/env node
const { removeUser } = require('../utils/access');

const [, , username] = process.argv;

if (!username) {
  console.log('Usage: npm run remove-user -- <username>');
  process.exit(1);
}

const removed = removeUser(username);
if (removed) {
  console.log(`✓ Removed user "${username}"`);
} else {
  console.log(`No user named "${username}" found.`);
  process.exit(1);
}
