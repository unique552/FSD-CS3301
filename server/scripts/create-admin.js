const path = require('node:path');
const readline = require('node:readline/promises');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const connectDatabase = require('../src/config/db');
const User = require('../src/models/User');
const { getJwtSecret } = require('../src/middleware/auth');

function ask(question) {
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return prompt.question(question).finally(() => prompt.close());
}

function askPassword(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Run this command in an interactive terminal to enter the password securely'));
  }

  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let password = '';
    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          process.stdin.setRawMode(false);
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          reject(new Error('Administrator provisioning cancelled'));
          return;
        }
        if (character === '\r' || character === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(password);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          password = password.slice(0, -1);
        } else {
          password += character;
        }
      }
    };

    process.stdin.on('data', onData);
  });
}

async function main() {
  getJwtSecret();
  const fullName = (await ask('Administrator full name: ')).trim();
  const email = (await ask('Administrator email: ')).trim().toLowerCase();
  const password = await askPassword('Administrator password (hidden): ');

  if (!fullName || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid name and email address');
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Administrator password must be 12–72 bytes');
  }

  await connectDatabase();
  const user = await User.create({
    fullName,
    email,
    password: await bcrypt.hash(password, 12),
    role: 'administrator',
  });

  console.log(`Administrator account created for ${user.email}`);
}

main()
  .catch((error) => {
    console.error(`Administrator provisioning failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
  });
