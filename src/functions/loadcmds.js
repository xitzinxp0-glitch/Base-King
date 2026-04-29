const fs = require("fs");
const path = require("path");

const loadCommands = (dir) => {
    const commands = new Map();
    const readCommands = (directory) => {
        if (!fs.existsSync(directory)) return;
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                readCommands(fullPath);
            } else if (file.endsWith(".js")) {
                try {
                    delete require.cache[require.resolve(fullPath)];
                    const command = require(fullPath);
                    if (command.name) {
                        commands.set(command.name, command);
                    }
                } catch (e) {
                    console.error(`Erro ao carregar comando ${file}:`, e);
                }
            }
        }
    };
    readCommands(dir);
    return commands;
};

module.exports = { loadCommands };
//Created by R.Santos; Contato: +5562982053713