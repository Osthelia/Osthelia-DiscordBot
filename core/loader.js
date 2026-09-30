/**
 * Osthelia Discord Bot - Event and interaction file loader
 *
 * Walks the events/ and interactions/ directories and imports every
 * module found there, keeping the loading logic in one place instead of
 * duplicating it between the entry point and the ready event.
 *
 * @package Osthelia\Core
 */

import fs from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

function jsFilesIn(path) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.readdirSync(path).filter(file => file.endsWith('.js'));
}

function subDirectoriesIn(path) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.readdirSync(path).filter(entry => fs.lstatSync(join(path, entry)).isDirectory());
}

async function importDefault(filePath) {
    const module = await import(pathToFileURL(filePath).href);
    return module.default || module;
}

export default {
    async loadEvents(client) {
        const eventsPath = join(global.__basedir, 'events');

        for (const file of jsFilesIn(eventsPath)) {
            const event = await importDefault(join(eventsPath, file));

            if (event.once) {
                client.once(event.type, (...args) => event.callback(...args));
            } else {
                client.on(event.type, (...args) => event.callback(...args));
            }
        }
    },
    async loadInteractions() {
        const interactionsPath = join(global.__basedir, 'interactions');
        const commands = new Map();

        for (const typeDir of subDirectoriesIn(interactionsPath)) {
            const typePath = join(interactionsPath, typeDir);

            for (const file of jsFilesIn(typePath)) {
                const command = await importDefault(join(typePath, file));

                if (!command || !('data' in command)) {
                    console.log(`Skipping ${typeDir}/${file}: missing a 'data' property.`);
                    continue;
                }

                const name = command.data.name;
                commands.set(name, { category: typeDir, cmd: command });
            }
        }

        return commands;
    }
};
