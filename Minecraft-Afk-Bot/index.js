const mineflayer = require("mineflayer");
const express = require("express");
const config = require("./settings.json");

const app = express();
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
});

function createBot() {
  const bot = mineflayer.createBot({
    username: config["bot-account"].username,
    password: config["bot-account"].password,
    auth: config["bot-account"].type,
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  // ⭐ KEEPALIVE FIX (Most Important)
  bot.on("packet", (data, meta) => {
    if (meta.name === "keep_alive") {
      try {
        bot._client.write("keep_alive", { keepAliveId: data.keepAliveId });
      } catch {}
    }
  });

  // ⭐ Reduce lag (Low CPU + Low RAM)
  if (bot.settings) {
    bot.settings.chatLengthLimit = 256;
    bot.settings.checkTimeoutInterval = 60000;
  }

  // ⭐ When bot joins
  bot.once("spawn", () => {
    console.log("[Bot] Joined server successfully!");

    // AUTO LOGIN / REGISTER
    if (config.utils["auto-auth"].enabled) {
      const pass = config.utils["auto-auth"].password;
      setTimeout(() => {
        bot.chat(`/register ${pass} ${pass}`);
        bot.chat(`/login ${pass}`);
      }, 800);
    }

    // AUTO CHAT MESSAGES
    if (config.utils["chat-messages"].enabled) {
      const msgs = config.utils["chat-messages"].messages;
      const sec = config.utils["chat-messages"]["repeat-delay"];

      if (config.utils["chat-messages"].repeat) {
        let i = 0;
        setInterval(() => {
          bot.chat(msgs[i]);
          i = (i + 1) % msgs.length;
        }, sec * 1000);
      } else {
        msgs.forEach((m) => bot.chat(m));
      }
    }

    // ⭐ LIGHTWEIGHT ANTI-AFK (NO CPU HEAVY MOVEMENT)
    if (config.utils["anti-afk"].enabled) {
      setInterval(() => {
        try {
          bot.setControlState("jump", true);
          setTimeout(() => bot.setControlState("jump", false), 150);
        } catch {}
      }, 20000); // Jump every 20s – ultra safe, ultra light
    }
  });

  // CHAT LOG
  bot.on("chat", (u, msg) => {
    if (config.utils["chat-log"]) {
      console.log(`[${u}] ${msg}`);
    }
  });

  // ON DEATH
  bot.on("death", () => {
    console.log("[Bot] Died and respawned!");
  });

  // AUTO RECONNECT
  bot.on("end", () => {
    console.log("[Bot] Disconnected. Reconnecting in 5 seconds...");
    setTimeout(createBot, 5000);
  });

  bot.on("kicked", (reason) => {
    console.log("[Bot] Kicked:", reason);
  });

  bot.on("error", (err) => {
    console.log("[Bot Error]", err.message);
  });
}

createBot();
