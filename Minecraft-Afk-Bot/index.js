const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const config = require('./settings.json');
const express = require('express');

const app = express();

// Express server to keep bot alive in Choreo
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// ✅ Use PORT from environment (for Choreo or other hosts)
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

  bot.loadPlugin(pathfinder);
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);

  if (bot.settings) {
    bot.settings.colorsEnabled = false;
  }

  bot.once('spawn', () => {
    console.log('\x1b[33m[AfkBot] Bot has joined the server\x1b[0m');

    // ✅ Auto Authentication
    if (config.utils['auto-auth'].enabled) {
      const password = config.utils['auto-auth'].password;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);
    }

    // ✅ Chat Messages Module
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
        messages.forEach((msg) => bot.chat(msg));
      }
    }

    // ✅ Anti-AFK System
    if (config.utils['anti-afk'].enabled) {
      setInterval(() => {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        const directions = ['forward', 'back', 'left', 'right'];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        bot.setControlState(randomDir, true);
        setTimeout(() => bot.setControlState(randomDir, false), 2000);
      }, 15000);
    }

    // ✅ Random Movement
    function moveRandomly() {
      const x = bot.entity.position.x + (Math.random() * 6 - 3);
      const z = bot.entity.position.z + (Math.random() * 6 - 3);
      bot.pathfinder.setGoal(new GoalBlock(Math.floor(x), bot.entity.position.y, Math.floor(z)));
    }
    setInterval(moveRandomly, 30000);

    // ✅ Move to a Specific Position
    if (config.position.enabled) {
      const pos = config.position;
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    }
  });

  // ✅ Chat Logging
  bot.on('chat', (username, message) => {
    if (config.utils['chat-log']) {
      console.log(`[Chat] <${username}> ${message}`);
    }
  });

  bot.on('goal_reached', () => {});

  // ✅ Bot Death Event
  bot.on('death', () => {
    console.log(`\x1b[33m[AfkBot] Bot died and respawned\x1b[0m`);
  });

  // ✅ Auto-Reconnect on Disconnect
  bot.on('end', () => {
    console.log("\x1b[31m[ERROR] Bot disconnected! Reconnecting in 10 seconds...\x1b[0m");
    setTimeout(() => createBot(), 10000);
  });

  // ✅ Auto-Reconnect on Kick
  bot.on('kicked', (reason) => {
    console.log(`\x1b[33m[AfkBot] Bot was kicked. Reason: ${reason}\x1b[0m`);
  });

  // ✅ Error Handling
  bot.on('error', (err) => {
    console.log(`\x1b[31m[ERROR] ${err.message}\x1b[0m`);
  });
}

createBot();
