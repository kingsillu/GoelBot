const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const config = require('./settings.json');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot is arrived');
});

app.listen(8000, () => {});

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

  bot.once('spawn', () => {
    if (config.utils['auto-auth'].enabled) {
      const password = config.utils['auto-auth'].password;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);
    }

    if (config.utils['chat-messages'].enabled) {
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

    function moveRandomly() {
      const x = bot.entity.position.x + (Math.random() * 4 - 2);
      const z = bot.entity.position.z + (Math.random() * 4 - 2);
      bot.pathfinder.setGoal(new GoalBlock(Math.floor(x), bot.entity.position.y, Math.floor(z)));
    }
    setInterval(moveRandomly, 30000); // Every 30 seconds

    const pos = config.position;
    if (config.position.enabled) {
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    }
  });

  bot.on('chat', (username, message) => {
    if (config.utils['chat-log']) {
      console.log(`[ChatLog] <${username}> ${message}`);
    }
  });

  bot.on('death', () => {});

  // ✅ Auto-Reconnect
  bot.on('end', () => {
    setTimeout(() => createBot(), 10000);
  });

  bot.on('kicked', () => {});

  bot.on('error', () => {});
}

createBot();
