/**
 * Osthelia Discord Bot - Application entry point
 *
 * Bootstraps the Discord client and loads the event handlers.
 *
 * @package Osthelia
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
global.__basedir = dirname(__filename);

const { default: Osthelia } = await import('./core/index.js');
global.Osthelia = Osthelia;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
});

Osthelia.client = client;
Osthelia.commands = new Map();

await Osthelia.loader.loadEvents(client);

process.on('uncaughtException', err => {
    console.error(err);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await client.destroy();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await client.destroy();
    process.exit(0);
});

await client.login(process.env.DISCORD_TOKEN);
