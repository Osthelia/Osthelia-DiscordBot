/**
 * Osthelia Discord Bot - Ticket management command
 *
 * Used from within a ticket channel to close, reopen, claim, rename or
 * manage membership of the ticket. Anyone can close their own ticket,
 * every other action requires a staff role for that ticket's type (or
 * Manage Server). This is the staff facing counterpart to the ticket's
 * own Add/Close buttons, add/remove here accept any member or role
 * rather than only the predefined addable role list.
 *
 * @package Osthelia\Interactions\Commands
 */

import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage the ticket in this channel')
        .addSubcommand(sub => sub
            .setName('close')
            .setDescription('Close this ticket')
            .addStringOption(option => option
                .setName('reason')
                .setDescription('Reason for closing')
                .setRequired(false)
                .setMaxLength(500)))
        .addSubcommand(sub => sub
            .setName('reopen')
            .setDescription('Reopen this ticket'))
        .addSubcommand(sub => sub
            .setName('claim')
            .setDescription('Claim or unclaim this ticket'))
        .addSubcommand(sub => sub
            .setName('rename')
            .setDescription('Rename this ticket channel')
            .addStringOption(option => option
                .setName('name')
                .setDescription('New channel name')
                .setRequired(true)
                .setMaxLength(90)))
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Add a member or role to this ticket')
            .addUserOption(option => option
                .setName('member')
                .setDescription('Member to add')
                .setRequired(false))
            .addRoleOption(option => option
                .setName('role')
                .setDescription('Role to add')
                .setRequired(false)))
        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('Remove a member or role from this ticket')
            .addUserOption(option => option
                .setName('member')
                .setDescription('Member to remove')
                .setRequired(false))
            .addRoleOption(option => option
                .setName('role')
                .setDescription('Role to remove')
                .setRequired(false))),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'close') {
            return Osthelia.ticketManager.promptCloseConfirm(interaction, interaction.options.getString('reason'));
        }

        if (sub === 'reopen') {
            return Osthelia.ticketManager.reopenTicket(interaction);
        }

        if (sub === 'claim') {
            return Osthelia.ticketManager.claimTicket(interaction);
        }

        if (sub === 'rename') {
            return Osthelia.ticketManager.renameTicket(interaction, interaction.options.getString('name'));
        }

        if (sub === 'add' || sub === 'remove') {
            const user = interaction.options.getUser('member');
            const role = interaction.options.getRole('role');

            if ((user && role) || (!user && !role)) {
                return interaction.reply({ content: 'Specify exactly one of member or role.', flags: MessageFlags.Ephemeral });
            }

            const target = role || await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!target) return interaction.reply({ content: 'This member is no longer in the server.', flags: MessageFlags.Ephemeral });

            return sub === 'add' ? Osthelia.ticketManager.grantAccess(interaction, target) : Osthelia.ticketManager.revokeAccess(interaction, target);
        }
    }
};
