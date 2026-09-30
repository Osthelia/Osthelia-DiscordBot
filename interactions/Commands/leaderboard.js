/**
 * Osthelia Discord Bot - Leaderboard command
 *
 * Shows the top members by XP for the server.
 *
 * @package Osthelia\Interactions\Commands
 */

import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the server XP leaderboard'),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const entries = Osthelia.leveling.getLeaderboard(interaction.guildId, 10);

        if (entries.length === 0) {
            return interaction.editReply('No one has earned XP in this server yet.');
        }

        const description = entries
            .map(entry => `**#${entry.rank}** <@${entry.userId}> Level ${entry.level} (${entry.xp} XP)`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('XP leaderboard')
            .setColor(0x5865F2)
            .setDescription(description);

        return interaction.editReply({ embeds: [embed] });
    }
};
