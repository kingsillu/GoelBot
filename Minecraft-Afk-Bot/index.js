const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const config = require('./settings.json');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot is arrived');
});

app.listen(8000, () => {
  console.log('server started');
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

  bot.loadPlugin(pathfinder);
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);

  if (bot.settings) {
    bot.settings.colorsEnabled = false;
  }

  bot.once('spawn', () => {
    console.log('\x1b[33m[AfkBot] Bot joined the server\x1b[0m');

    if (config.utils['auto-auth'].enabled) {
      console.log('[INFO] Started auto-auth module');
      const password = config.utils['auto-auth'].password;

      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);

      console.log(`[Auth] Authentication commands executed.`);
    }

    if (config.utils['chat-messages'].enabled) {
      console.log('[INFO] Started chat-messages module');
      const messages = config.utils['chat-messages']['messages'];

      if (config.utils['chat-messages'].repeat) {
        let i = 0;
        let delay = config.utils['chat-messages']['repeat-delay'];

        setInterval(() => {
          bot.chat(`${messages[i]}`);
          i = (i + 1) % messages.length;
        }, delay * 1000);
      } else {
        messages.forEach((msg) => bot.chat(msg));
      }
    }

    // ✅ FIXED: Bot Random Movement
    function moveRandomly() {
      const x = bot.entity.position.x + (Math.random() * 4 - 2);
      const z = bot.entity.position.z + (Math.random() * 4 - 2);
      bot.pathfinder.setGoal(new GoalBlock(Math.floor(x), bot.entity.position.y, Math.floor(z)));

      console.log(`🚶 Moving to: ${x}, ${bot.entity.position.y}, ${z}`);
    }
    setInterval(moveRandomly, 30000); // Every 30 seconds

    // ✅ FIXED: Anti-AFK System Improved
    if (config.utils['anti-afk'].enabled) {
      setInterval(() => {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);

        bot.setControlState('left', Math.random() < 0.5);
        bot.setControlState('right', Math.random() < 0.5);
        bot.setControlState('forward', Math.random() < 0.5);
        bot.setControlState('back', Math.random() < 0.5);
      }, 15000); // Every 15 seconds
    }

    const pos = config.position;
    if (config.position.enabled) {
      console.log(`\x1b[32m[Afk Bot] Moving to (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`);
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    }
  });

  bot.on('chat', (username, message) => {
    if (config.utils['chat-log']) {
      console.log(`[ChatLog] <${username}> ${message}`);
    }
  });

  bot.on('goal_reached', () => {
    console.log(`\x1b[32m[AfkBot] Bot arrived at target location. ${bot.entity.position}\x1b[0m`);
  });

  bot.on('death', () => {
    console.log(`\x1b[33m[AfkBot] Bot died and respawned at ${bot.entity.position}\x1b[0m`);
  });

  // ✅ FIXED: Auto-Reconnect
  bot.on('end', () => {
    console.log("\x1b[31m[ERROR] Bot disconnected! Reconnecting in 10 seconds...\x1b[0m");
    setTimeout(() => createBot(), 10000); // Reconnect after 10 sec
  });

  bot.on('kicked', (reason) => {
    console.log(`\x1b[33m[AfkBot] Bot was kicked from the server. Reason: ${reason}\x1b[0m`);
  });

  bot.on('error', (err) => {
    console.log(`\x1b[31m[ERROR] ${err.message}\x1b[0m`);
  });
}

createBot();
