/**
 * Osthelia Discord Bot - Ping command
 *
 * Sanity check command used to confirm the bot is online and responsive.
 *
 * @package Osthelia\Interactions\Commands
 */

import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check that the bot is responding'),
    async execute(interaction) {
        await interaction.reply(`Pong! Latency: ${Date.now() - interaction.createdTimestamp}ms`);
    }
};
