const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const config = require('./settings.json');
const express = require('express');

const app = express();

// Express server to keep bot alive in platforms like Choreo
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Express server started on port ${PORT}`);
});

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account']['username'],
    password: config['bot-account']['password'],
    auth: config['bot-account']['type'],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  // ⭐⭐⭐ KEEPALIVE FIX ⭐⭐⭐
  if (bot.settings) {
    bot.settings.chatLengthLimit = 256;
    bot.settings.checkTimeoutInterval = 60000; // Prevent out-of-order keepalive kicks
  }

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('\x1b[33m[AfkBot] Bot has joined the server\x1b[0m');

    // AUTO AUTH
    if (config.utils['auto-auth'].enabled) {
      const password = config.utils['auto-auth'].password;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);
    }

    // CHAT MESSAGE SPAMMER
    if (config.utils['chat-messages'].enabled) {
      const messages = config.utils['chat-messages']['messages'];
      const delay = config.utils['chat-messages']['repeat-delay'];

      if (config.utils['chat-messages'].repeat) {
        let i = 0;
        setInterval(() => {
          bot.chat(`${messages[i]}`);
          i = (i + 1) % messages.length;
        }, delay * 1000);
      } else {
        messages.forEach(msg => bot.chat(msg));
      }
    }

    // ANTI-AFK
    if (config.utils['anti-afk'].enabled) {
      setInterval(() => {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);

        const dirs = ['forward', 'back', 'left', 'right'];
        const randDir = dirs[Math.floor(Math.random() * dirs.length)];

        bot.setControlState(randDir, true);
        setTimeout(() => bot.setControlState(randDir, false), 2000);

      }, 15000);
    }

    // RANDOM WALKING
    const mcData = require('minecraft-data')(bot.version);
    const moves = new Movements(bot, mcData);

    function moveRandomly() {
      const x = bot.entity.position.x + (Math.random() * 6 - 3);
      const z = bot.entity.position.z + (Math.random() * 6 - 3);
      bot.pathfinder.setMovements(moves);
      bot.pathfinder.setGoal(new GoalBlock(Math.floor(x), bot.entity.position.y, Math.floor(z)));
    }
    setInterval(moveRandomly, 30000);

    // MOVE TO SPECIFIC POSITION
    if (config.position.enabled) {
      const pos = config.position;
      bot.pathfinder.setMovements(moves);
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    }
  });

  // CHAT LOG
  bot.on('chat', (username, msg) => {
    if (config.utils['chat-log']) {
      console.log(`[Chat] <${username}> ${msg}`);
    }
  });

  // DEATH HANDLER
  bot.on('death', () => {
    console.log('\x1b[33m[AfkBot] Bot died and respawned\x1b[0m');
  });

  // AUTO RECONNECT
  bot.on('end', () => {
    console.log("\x1b[31m[ERROR] Bot disconnected! Reconnecting in 10 seconds...\x1b[0m");
    setTimeout(() => createBot(), 10000);
  });

  // KICKED EVENT
  bot.on('kicked', reason => {
    console.log(`\x1b[33m[AfkBot] Bot was kicked. Reason: ${reason}\x1b[0m`);
  });

  // ERROR EVENT
  bot.on('error', err => {
    console.log(`\x1b[31m[ERROR] ${err.message}\x1b[0m`);
  });
}

createBot();
