const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const P = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs-extra");
const path = require("path");
const toml = require("toml");
const readline = require("readline");
const { loadCommands } = require("../functions/loadcmds");
const { getSenders } = require("../functions/senders");

const configPath = path.join(__dirname, "../../settings/configure.toml");
const config = toml.parse(fs.readFileSync(configPath, "utf-8"));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startKing() {
    const authPath = path.join(__dirname, "../authkeys");
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    if (!client.authState.creds.registered) {
        const phoneNumber = await question("Digite o número do WhatsApp (ex: 5511999999999): ");
        const pairingCode = await client.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ""));
        console.log(`Seu código de pareamento é: ${pairingCode}`);
    }

    client.ev.on("creds.update", saveCreds);

    const commands = loadCommands(path.join(__dirname, "../commands"));

    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (shouldReconnect) startKing();
        } else if (connection === "open") {
            console.log(`Conexão aberta com sucesso!`);
            console.log(`${commands.size} comandos carregados.`);
            
            if (config.nome_bot) {
                setTimeout(async () => {
                    try {
                        await client.updateProfileName(config.nome_bot);
                    } catch (e) {}
                }, 5000);
            }
        }
    });

    client.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const type = Object.keys(msg.message)[0];
        const body = (type === "conversation") ? msg.message.conversation : 
                     (type === "extendedTextMessage") ? msg.message.extendedTextMessage.text : 
                     (type === "imageMessage") ? msg.message.imageMessage.caption : 
                     (type === "videoMessage") ? msg.message.videoMessage.caption : "";

        const prefix = config.prefixo || "!";
        const isCmd = body.startsWith(prefix);
        const commandName = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : null;
        const args = body.trim().split(/ +/).slice(1);
        const king = getSenders(client, msg);

        if (isCmd && commandName) {
            const cmd = commands.get(commandName);
            if (cmd) {
                try {
                    await cmd.execute(client, msg, args, king, config);
                } catch (e) {
                    console.error(e);
                }
            } else {
                await king.kingreact("🫪");
            }
        }
    });
}

startKing();

//Created by R.Santos; Contato: +5562982053713