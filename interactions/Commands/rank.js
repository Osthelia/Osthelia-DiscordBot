/**
 * Osthelia Discord Bot - Rank command
 *
 * Shows a member's level card (avatar, level, rank and XP progress).
 *
 * @package Osthelia\Interactions\Commands
 */

import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Show your level card')
        .addUserOption(option => option
            .setName('member')
            .setDescription('Member to look up')
            .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const target = interaction.options.getUser('member') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        const rankData = Osthelia.leveling.getRank(interaction.guildId, target.id);
        const card = await Osthelia.rankCard.build(member, rankData);

        return interaction.editReply({ files: [card] });
    }
};
