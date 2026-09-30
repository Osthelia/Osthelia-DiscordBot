/**
 * Osthelia Discord Bot - Slash command deployment script
 *
 * Registers every command found in interactions/ with Discord. Run with
 * `npm run deploy` after adding or changing a command.
 *
 * @package Osthelia\Scripts
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { REST, Routes } from 'discord.js';

global.__basedir = join(dirname(fileURLToPath(import.meta.url)), '..');

const { default: loader } = await import('../core/loader.js');

const commands = await loader.loadInteractions();
const payload = Array.from(commands.values())
    .filter(({ cmd }) => 'execute' in cmd)
    .map(({ cmd }) => cmd.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

console.log(`Deploying ${payload.length} commands...`);

const data = await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: payload }
);

console.log(`Deployed ${data.length} commands.`);
