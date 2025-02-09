const mineflayer = require("mineflayer");
const readline = require("readline");
const FlayerCaptcha = require("FlayerCaptcha");
const bot = mineflayer.createBot({
    host: "mc.funtime.su",
    port: 25565,
    username: "Auto1click",
    version: "1.16.5", // Указывай версию сервера
});

let autoclickerActive = false;
let isSneaking = false;
let autoEat = false;
let showChat = true;
let autoLeave = false;
let loopInterval = null;
let attackInterval = null;
let whitelist = ["Auto1click", "pakistan_3332"];

const hostileMobs = [
    "zombie",
    "skeleton",
    "creeper",
    "spider",
    "enderman",
    "witch",
    "wither",
    "blaze",
    "ghast",
    "zombified_piglin",
    "stray",
    "drowned",
    "husk",
    "phantom",
    "guardian",
    "evoker",
    "ravager",
    "vindicator",
    "zoglin",
    "wither_skeleton",
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
            console.log(
                `Отображение чата: ${showChat ? "ВКЛЮЧЕНО" : "ВЫКЛЮЧЕНО"}`,
            );
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
            startLoop(
                args.slice(1, -1).join(" "),
                parseInt(args[args.length - 1]),
            );
            break;
        case "stoploop":
            stopLoop();
            break;
        case "players":
            console.log(
                `Игроков в зоне прогрузки: ${Object.keys(bot.players).length}`,
            );
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

function toggleSneak() {
    isSneaking = !isSneaking;
    bot.setControlState("sneak", isSneaking);
    console.log(`Приседание: ${isSneaking ? "ВКЛЮЧЕНО" : "ВЫКЛЮЧЕНО"}`);
}

// ✅ **Фикс: Автокликер теперь работает постоянно**
function startAutoClicker() {
    if (autoclickerActive) return;
    autoclickerActive = true;
    console.log("🔫 Автокликер ВКЛЮЧЕН");

    attackInterval = setInterval(() => {
        const target = bot.nearestEntity(
            (entity) =>
                hostileMobs.includes(entity.name) &&
                bot.entity.position.distanceTo(entity.position) < 5,
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

function startLoop(text, delay) {
    if (loopInterval) clearInterval(loopInterval);
    loopInterval = setInterval(() => bot.chat(text), delay);
}

function stopLoop() {
    if (loopInterval) {
        clearInterval(loopInterval);
        console.log("Цикл сообщений остановлен");
    }
}

function showCommands() {
    console.log(
        `\nДоступные команды:\n- on: Включить автокликер\n- off: Выключить автокликер\n- sit: Переключить приседание\n- eat: Включить/выключить авто-еду\n- chat: Включить/выключить чат\n- autoleave: Включить/выключить авто-выход\n- slot [0-8]: Сменить слот\n- say [текст]: Написать в чат\n- loop [текст] [мс]: Повторять сообщение\n- stoploop: Остановить цикл\n- players: Показать игроков\n- help: Список команд\n- exit: Выйти`,
    );
}

bot.on("message", (message) => {
    if (showChat) console.log(`[CHAT] ${message.toAnsi()}`);
});

// ✅ **Фикс: Бот теперь ест еду из второй руки**
let isConsuming = false;

async function consumeFood(food) {
    if (isConsuming) {
        console.log("Уже производится поедание — пропускаем вызов.");
        return;
    }
    isConsuming = true;

    if (!food) {
        console.log("Еда не найдена.");
        isConsuming = false;
        return;
    }
    if (bot.food >= 20) {
        console.log("Еда уже полная. Поедание не требуется.");
        isConsuming = false;
        return;
    }

    const oldSlot = bot.quickBarSlot;
    console.log("Сохраняем текущий слот:", oldSlot);

    try {
        await bot.equip(food, "off-hand");
        console.log("Еда перемещена во вторую руку (off-hand).");

        await bot.equip(food, "hand");
        console.log("Еда перемещена обратно в основную руку.");

        console.log("Пытаемся съесть еду...");
        await bot.consume(food);
        console.log("Бот успешно съел еду.");
    } catch (err) {
        console.log("Ошибка при поедании:", err);
    } finally {
        try {
            bot.setQuickBarSlot(oldSlot);
            console.log(`Переключились обратно на слот ${oldSlot}.`);
        } catch (e) {
            console.log("Ошибка при переключении слота:", e);
        }
        isConsuming = false;
    }
}

async function tryEat() {
    const items = bot.inventory.items();
    console.log("Проверяем инвентарь:", items);

    const foodNames = [
        "apple",
        "bread",
        "cooked_beef",
        "cooked_porkchop",
        "cooked_rabbit",
    ];

    const food = items.find((item) => foodNames.includes(item.name));

    if (food) {
        console.log(
            `Найдена еда: ${food.name}. Бот пытается её использовать...`,
        );
        await consumeFood(food);
    } else {
        console.log("Еда не найдена в инвентаре.");
    }
}

// Обработчик события изменения здоровья бота.
bot.on("health", async () => {
    if (bot.health < 20 && bot.food < 20 && autoEat) {
        console.log("Здоровье или еда низкие, бот пытается поесть...");
        await tryEat();
    }
});

// ✅ **Фикс: Авто-выход теперь зависит от состояния autoLeave**
bot.on("physicTick", () => {
    if (!autoLeave) return; // Если авто-выход отключен, не выполняем дальнейшие действия

    Object.values(bot.players).forEach((player) => {
        if (
            !whitelist.includes(player.username) &&
            bot.entity.position.distanceTo(player.entity.position) < 100
        ) {
            console.log("Опасность! Ливаем!");
            bot.quit();
            setTimeout(() => bot.connect(), 180000); // Подключаемся снова через 3 минуты
        }
    });
});

// ✅ **Фикс: Авто-выход теперь зависит от состояния autoLeave**
bot.on("physicTick", () => {
    if (!autoLeave) return; // Если авто-выход отключен, не выполняем дальнейшие действия

    Object.values(bot.players).forEach((player) => {
        if (
            !whitelist.includes(player.username) &&
            bot.entity.position.distanceTo(player.entity.position) < 100
        ) {
            console.log("Опасность! Ливаем!");
            bot.quit();
            setTimeout(() => bot.connect(), 180000); // Подключаемся снова через 3 минуты
        }
    });
});

const captcha = new FlayerCaptcha(bot);
captcha.on("success", async (image, viewDirection) => {
    await image.toFile("captcha.png");
    console.log("Captcha saved");
});
