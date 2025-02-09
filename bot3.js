const mineflayer = require("mineflayer");
const readline = require("readline");
const FlayerCaptcha = require("FlayerCaptcha");
const express = require("express"); // Добавляем Express.js

const bot = mineflayer.createBot({
    host: "mc.funtime.su",
    port: 25565,
    username: "Auto1click",
    version: "1.16.5",
});

let autoclickerActive = false;
let isSneaking = false;
let autoEat = true;
let showChat = true;
let autoLeave = false;
let loopInterval = null;
let attackInterval = null;
let whitelist = ["Auto1click", "pakistan_3332", "pas"]; 

const hostileMobs = [
    "zombie", "skeleton", "creeper", "spider", "enderman", "witch", 
    "wither", "blaze", "ghast", "zombified_piglin", "stray", "drowned", 
    "husk", "phantom", "guardian", "evoker", "ravager", "vindicator", 
    "zoglin", "wither_skeleton",
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on("line", (input) => {
    const args = input.split(" ");
    const command = args[0];

    switch (command) {
        case "on":
            startAutoClicker();
            break;
        case "off":
            stopAutoClicker();
            break;
        case "sit":
            toggleSneak();
            break;
        case "eat":
            autoEat = !autoEat;
            console.log(`Авто-еда: ${autoEat ? "ВКЛЮЧЕНА" : "ВЫКЛЮЧЕНА"}`);
            break;
        case "chat":
            showChat = !showChat;
            console.log(`Отображение чата: ${showChat ? "ВКЛЮЧЕНО" : "ВЫКЛЮЧЕНО"}`);
            break;
        case "autoleave":
            autoLeave = !autoLeave;
            console.log(`Авто-выход: ${autoLeave ? "ВКЛЮЧЕН" : "ВЫКЛЮЧЕН"}`);
            break;
        case "slot":
            bot.setQuickBarSlot(parseInt(args[1]));
            break;
        case "say":
            bot.chat(args.slice(1).join(" "));
            break;
        case "loop":
            startLoop(args.slice(1, -1).join(" "), parseInt(args[args.length - 1]));
            break;
        case "stoploop":
            stopLoop();
            break;
        case "players":
            console.log(`Игроков в зоне прогрузки: ${Object.keys(bot.players).length}`);
            break;
        case "help":
            showCommands();
            break;
        case "exit":
            process.exit();
            break;
        default:
            console.log("Неизвестная команда. Введите help для списка.");
    }
});

function showCommands() {
    console.log(`
        Доступные команды:
        - on: Включить автокликер
        - off: Выключить автокликер
        - sit: Переключить приседание
        - eat: Включить/выключить авто-еду
        - chat: Включить/выключить чат
        - autoleave: Включить/выключить авто-выход
        - slot [0-8]: Сменить слот
        - say [текст]: Написать в чат
        - loop [текст] [мс]: Повторять сообщение
        - stoploop: Остановить цикл
        - players: Показать игроков
        - help: Список команд
        - exit: Выйти
    `);
}

// ----- ОБРАБОТЧИК СООБЩЕНИЙ В ЧАТЕ -----
bot.on("message", (message) => {
    if (showChat) console.log(`[CHAT] ${message.toAnsi()}`);
});

function toggleSneak() {
    isSneaking = !isSneaking;
    bot.setControlState("sneak", isSneaking);
    console.log(`Приседание: ${isSneaking ? "ВКЛЮЧЕНО" : "ВЫКЛЮЧЕНО"}`);
}

function startAutoClicker() {
    if (autoclickerActive) return;
    autoclickerActive = true;
    console.log("🔫 Автокликер ВКЛЮЧЕН");

    attackInterval = setInterval(() => {
        const target = bot.nearestEntity(
            (entity) =>
                hostileMobs.includes(entity.name) &&
                bot.entity.position.distanceTo(entity.position) < 5
        );

        if (target) {
            bot.attack(target);
            console.log(`🗡️ Бью ${target.name}`);
        }
    }, 2500);
}

function stopAutoClicker() {
    if (!autoclickerActive) return;
    autoclickerActive = false;
    clearInterval(attackInterval);
    console.log("❌ Автокликер ВЫКЛЮЧЕН");
}

// ---- СЕРВЕР ДЛЯ UPTIMEROBOT (чтобы бот работал 24/7) ----
const app = express();

app.get("/", (req, res) => {
    res.send("I'm alive!");
});

app.listen(3000, () => {
    console.log("✅ Express сервер запущен на порту 3000.");
});
// --------------------------------------------------------

const captcha = new FlayerCaptcha(bot);
captcha.on("success", async (image, viewDirection) => {
    await image.toFile("captcha.png");
    console.log("Captcha saved");
});
