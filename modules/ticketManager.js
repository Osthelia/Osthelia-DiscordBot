/**
 * Osthelia Discord Bot - Ticket system logic
 *
 * The panel posted with `/ticket-config panel send` has a single "Open a
 * ticket" button. Clicking it creates a channel with no category yet and
 * drops a FAQ message in it (a select menu of the configured ticket
 * types), deleted once a category is picked. Picking one from that FAQ
 * (after an optional form) is what assigns the ticket its type: staff
 * roles get access, the channel moves to that type's category (or stays
 * in the default one) and the ticket's own header message with the
 * Claim/Add a role/Close the ticket buttons is sent.
 *
 * Access to a ticket's staff actions is controlled per ticket type,
 * through that type's staff roles (or anyone with Manage Server).
 *
 * @package Osthelia\Modules
 */

import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ChannelType,
    PermissionFlagsBits,
    MessageFlags,
    AttachmentBuilder
} from 'discord.js';

const COLOR = 0x5865F2;
const CLOSED_COLOR = 0xED4245;
const TRANSCRIPT_FETCH_PAGES = 5;

// Close can carry a reason (from /ticket close) that needs to survive the
// confirmation round trip. Kept in memory only, one pending reason per
// channel, popped as soon as it is used or replaced.
const pendingCloseReasons = new Map();

function stashCloseReason(channelId, reason) {
    if (reason) pendingCloseReasons.set(channelId, reason);
    else pendingCloseReasons.delete(channelId);
}

function popCloseReason(channelId) {
    const reason = pendingCloseReasons.get(channelId) || null;
    pendingCloseReasons.delete(channelId);
    return reason;
}

function slugify(label) {
    const cleaned = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return cleaned.slice(0, 32) || 'type';
}

function sanitizeChannelNamePart(input) {
    const cleaned = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return cleaned || 'user';
}

function buildChannelName(number, username) {
    return `ticket-${number}-${sanitizeChannelNamePart(username)}`.slice(0, 90);
}

function isStaff(member, type) {
    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
    if (!type) return false;

    return type.staffRoleIds.some(roleId => member.roles.cache.has(roleId));
}

function getTicketContext(channelId, guildId) {
    const ticket = Osthelia.ticketData.getTicket(channelId);
    if (!ticket || ticket.guildId !== guildId) return null;

    return { ticket, type: ticket.typeId ? Osthelia.ticketData.getType(guildId, ticket.typeId) : null };
}

function buildOpenPanelContainer(config) {
    const panel = config.ticketPanel;
    const bannerUrl = panel.imageUrl || config.ticketDefaultBannerUrl || null;
    const container = new ContainerBuilder().setAccentColor(COLOR);

    if (bannerUrl) {
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl))
        );
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${panel.title || 'Support'}`));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        panel.description || 'Click the button below to open a ticket. Our staff will be with you shortly.'
    ));

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticketPanel_open')
                .setLabel(panel.buttonLabel || 'Open a ticket')
                .setStyle(ButtonStyle.Primary)
        )
    );

    return container;
}

function buildFaqEmbed() {
    return new EmbedBuilder()
        .setTitle('What do you need?')
        .setColor(COLOR)
        .setDescription('Pick a category below to let us know what this ticket is about.');
}

function buildFaqRow(types) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('ticketFaq')
        .setPlaceholder('Select a category')
        .addOptions(types.map(type => {
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(type.label)
                .setValue(type.id);

            if (type.description) option.setDescription(type.description.slice(0, 100));
            if (type.emoji) option.setEmoji(type.emoji);

            return option;
        }));

    return new ActionRowBuilder().addComponents(menu);
}

function buildControlsRow(status) {
    if (status === 'closed') {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticketActions_reopen').setLabel('Reopen').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticketActions_delete').setLabel('Delete').setStyle(ButtonStyle.Danger)
        );
    }

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticketActions_claim').setLabel('Claim').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticketActions_add').setLabel('Add a role').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ticketActions_close').setLabel('Close the ticket').setStyle(ButtonStyle.Danger)
    );
}

// The ticket's own header message (banner, title, its type's message,
// Claim/Add/Close or Reopen/Delete buttons) is Components V2, not an
// embed, to match the container style of the reference panel design.
// Once a message is sent with the IS_COMPONENTS_V2 flag it can only ever
// be edited with more V2 components, so claim/close/reopen rebuild this
// same container from the ticket's stored data rather than patching
// fields in place. The type's message supports a {member} placeholder,
// replaced with a mention of the ticket opener (pings them).
function buildTicketHeaderContainer({ ticket, type, openerMention, status, config }) {
    const display = type || { label: ticket.typeLabel || 'Ticket', message: null, imageUrl: null, emoji: null };
    const bannerUrl = display.imageUrl || (config && config.ticketDefaultBannerUrl) || null;
    const container = new ContainerBuilder().setAccentColor(status === 'closed' ? CLOSED_COLOR : COLOR);

    if (bannerUrl) {
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl))
        );
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${display.emoji ? `${display.emoji} ` : ''}${display.label}`));

    if (display.message) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(display.message.replace(/\{member\}/g, openerMention)));
    }

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent([
        `**Opened by:** ${openerMention}`,
        `**Status:** ${status === 'closed' ? 'Closed' : 'Open'}`,
        `**Claimed by:** ${ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Nobody yet'}`
    ].join('\n')));

    for (const answer of ticket.answers) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${answer.label}**\n${answer.value || '*No answer*'}`));
    }

    if (status === 'closed') {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [`**Closed by:** <@${ticket.closedBy}>`, `**Reason:** ${ticket.closeReason || 'No reason provided'}`].join('\n')
        ));
    }

    container.addActionRowComponents(buildControlsRow(status));

    return container;
}

function buildConfirmRow(kind) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticketConfirm_${kind}-yes`).setLabel(`Confirm ${kind}`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`ticketConfirm_${kind}-no`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );
}

function buildPendingOverwrites(guild, openerId, clientId) {
    return [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
            id: openerId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks
            ]
        },
        {
            id: clientId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.EmbedLinks
            ]
        }
    ];
}

async function getControlMessage(channel, ticket) {
    if (!ticket.messageId) return null;

    return channel.messages.fetch(ticket.messageId).catch(() => null);
}

async function sendTranscript(guild, channel, ticket) {
    const config = Osthelia.database.get(guild.id);
    if (!config.ticketTranscriptChannelId) return;

    const transcriptChannel = await guild.channels.fetch(config.ticketTranscriptChannelId).catch(() => null);
    if (!transcriptChannel) return;

    const lines = [];
    let before;

    for (let page = 0; page < TRANSCRIPT_FETCH_PAGES; page++) {
        const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
        if (!batch || batch.size === 0) break;

        for (const message of batch.values()) {
            const timestamp = new Date(message.createdTimestamp).toISOString();
            lines.push(`[${timestamp}] ${message.author.tag}: ${message.content || '*No text content*'}`);
        }

        before = batch.last().id;
        if (batch.size < 100) break;
    }

    lines.reverse();

    const attachment = new AttachmentBuilder(Buffer.from(lines.join('\n') || 'No messages.', 'utf-8'), {
        name: `ticket-${ticket.number}-transcript.txt`
    });

    const embed = new EmbedBuilder()
        .setTitle(`Transcript for ticket #${ticket.number}`)
        .setColor(COLOR)
        .setTimestamp()
        .addFields(
            { name: 'Type', value: ticket.typeLabel || 'None', inline: true },
            { name: 'Opened by', value: `<@${ticket.openerId}>`, inline: true },
            { name: 'Closed by', value: ticket.closedBy ? `<@${ticket.closedBy}>` : 'Unknown', inline: true }
        );

    await transcriptChannel.send({ embeds: [embed], files: [attachment] }).catch(() => null);
}

// Actual close/delete logic, only ever reached after a confirmation
// button, so permission checks here are the defensive second layer, not
// the primary gate (that is promptCloseConfirm / promptDeleteConfirm).
async function performCloseTicket(interaction, reason) {
    const ctx = getTicketContext(interaction.channelId, interaction.guildId);
    if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });

    const isOpener = ctx.ticket.openerId === interaction.user.id;
    if (!isOpener && !isStaff(interaction.member, ctx.type)) {
        return interaction.reply({ content: 'You cannot close this ticket.', flags: MessageFlags.Ephemeral });
    }
    if (ctx.ticket.status === 'closed') {
        return interaction.reply({ content: 'This ticket is already closed.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    Osthelia.ticketData.closeTicket(interaction.channelId, interaction.user.id, reason);
    const updatedTicket = Osthelia.ticketData.getTicket(interaction.channelId);
    const config = Osthelia.database.get(interaction.guildId);

    if (config.ticketClosedCategoryId && interaction.channel.parentId !== config.ticketClosedCategoryId) {
        await interaction.channel.setParent(config.ticketClosedCategoryId, { lockPermissions: false }).catch(() => null);
    }

    await interaction.channel.permissionOverwrites.edit(ctx.ticket.openerId, { SendMessages: false }).catch(() => null);

    const controlMessage = await getControlMessage(interaction.channel, updatedTicket);
    if (controlMessage) {
        const container = buildTicketHeaderContainer({ ticket: updatedTicket, type: ctx.type, openerMention: `<@${updatedTicket.openerId}>`, status: 'closed', config });
        await controlMessage.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    await interaction.editReply('Ticket closed.');
    await sendTranscript(interaction.guild, interaction.channel, updatedTicket);
}

async function performDeleteTicket(interaction) {
    const ctx = getTicketContext(interaction.channelId, interaction.guildId);
    if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
    if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });

    await interaction.reply({ content: 'Deleting this ticket channel...', flags: MessageFlags.Ephemeral });
    Osthelia.ticketData.deleteTicket(interaction.channelId);
    await interaction.channel.delete(`Ticket deleted by ${interaction.user.tag}`).catch(() => null);
}

export default {
    slugify,
    buildOpenPanelContainer,
    async createPendingTicket(interaction) {
        const guild = interaction.guild;
        const opener = interaction.user;
        const config = Osthelia.database.get(guild.id);

        const openTickets = Osthelia.ticketData.listOpenByMember(guild.id, opener.id);
        if (openTickets.length >= config.ticketMaxOpenPerMember) {
            const links = openTickets.map(ticket => `<#${ticket.channelId}>`).join(', ');
            return interaction.reply({ content: `You already have ${openTickets.length} open ticket(s) (limit ${config.ticketMaxOpenPerMember}): ${links}`, flags: MessageFlags.Ephemeral });
        }

        const types = Osthelia.ticketData.listTypes(guild.id).filter(type => type.enabled);
        if (types.length === 0) {
            return interaction.reply({ content: 'No ticket categories are configured yet, ask an administrator to set one up.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const number = Osthelia.ticketData.nextTicketNumber(guild.id);
        const channel = await guild.channels.create({
            name: buildChannelName(number, opener.username),
            type: ChannelType.GuildText,
            parent: config.ticketDefaultCategoryId || undefined,
            topic: `Ticket #${number} | Opened by ${opener.tag}`,
            permissionOverwrites: buildPendingOverwrites(guild, opener.id, guild.members.me.id)
        }).catch(() => null);

        if (!channel) {
            return interaction.editReply('Failed to create the ticket channel. Check that I have the Manage Channels permission.');
        }

        Osthelia.ticketData.createTicket({
            channelId: channel.id,
            guildId: guild.id,
            number,
            typeId: null,
            typeLabel: null,
            openerId: opener.id,
            createdAt: Date.now()
        });

        await channel.send({ content: `${opener}`, embeds: [buildFaqEmbed()], components: [buildFaqRow(types)] }).catch(() => null);
        await interaction.editReply(`Your ticket has been created: ${channel}`);
    },
    async resolveTicketType(interaction, type, answers = []) {
        const ticket = Osthelia.ticketData.getTicket(interaction.channelId);
        if (!ticket || ticket.guildId !== interaction.guildId) {
            return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        }
        if (ticket.typeId) {
            return interaction.reply({ content: 'This ticket already has a category.', flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.channel;
        const config = Osthelia.database.get(interaction.guildId);
        const targetCategoryId = type.categoryId || config.ticketDefaultCategoryId || null;

        if (targetCategoryId && channel.parentId !== targetCategoryId) {
            await channel.setParent(targetCategoryId, { lockPermissions: false }).catch(() => null);
        }

        for (const roleId of type.staffRoleIds) {
            await channel.permissionOverwrites.edit(roleId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                ManageMessages: true,
                AttachFiles: true,
                EmbedLinks: true
            }).catch(() => null);
        }

        await channel.setTopic(`Ticket #${ticket.number} | ${type.label} | Opened by ${interaction.user.tag}`).catch(() => null);
        Osthelia.ticketData.setType(channel.id, type.id, type.label);
        Osthelia.ticketData.setAnswers(channel.id, answers);

        if (interaction.message) {
            await interaction.message.delete().catch(() => null);
        }

        const updatedTicket = Osthelia.ticketData.getTicket(channel.id);
        const container = buildTicketHeaderContainer({ ticket: updatedTicket, type, openerMention: `<@${ticket.openerId}>`, status: 'open', config });
        const pingText = [`<@${ticket.openerId}>`, ...type.pingRoleIds.map(roleId => `<@&${roleId}>`)].join(' ');

        const sent = await channel.send({
            components: [new TextDisplayBuilder().setContent(pingText), container],
            flags: MessageFlags.IsComponentsV2
        }).catch(() => null);
        if (sent) Osthelia.ticketData.setMessage(channel.id, sent.id);

        return interaction.reply({ content: `This ticket is now set up for **${type.label}**.`, flags: MessageFlags.Ephemeral });
    },
    async promptAddRole(interaction) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });

        const config = Osthelia.database.get(interaction.guildId);
        const roles = config.ticketAddableRoleIds
            .map(roleId => interaction.guild.roles.cache.get(roleId))
            .filter(Boolean);

        if (roles.length === 0) {
            return interaction.reply({ content: 'No addable roles configured, ask an administrator to set some with `/ticket-config addable-role add`.', flags: MessageFlags.Ephemeral });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticketAddRole')
            .setPlaceholder('Select a role to add')
            .addOptions(roles.slice(0, 25).map(role => new StringSelectMenuOptionBuilder().setLabel(role.name).setValue(role.id)));

        return interaction.reply({ content: 'Pick a role to give access to this ticket.', components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
    },
    async claimTicket(interaction) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const newClaimedBy = ctx.ticket.claimedBy === interaction.user.id ? null : interaction.user.id;
        Osthelia.ticketData.setClaim(interaction.channelId, newClaimedBy);
        const updatedTicket = Osthelia.ticketData.getTicket(interaction.channelId);
        const config = Osthelia.database.get(interaction.guildId);

        const controlMessage = await getControlMessage(interaction.channel, updatedTicket);
        if (controlMessage) {
            const container = buildTicketHeaderContainer({ ticket: updatedTicket, type: ctx.type, openerMention: `<@${updatedTicket.openerId}>`, status: 'open', config });
            await controlMessage.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }

        await interaction.channel.send(
            newClaimedBy ? `${interaction.user} claimed this ticket.` : `${interaction.user} unclaimed this ticket.`
        ).catch(() => null);

        return interaction.editReply(newClaimedBy ? 'You claimed this ticket.' : 'You unclaimed this ticket.');
    },
    async promptCloseConfirm(interaction, reason) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });

        const isOpener = ctx.ticket.openerId === interaction.user.id;
        if (!isOpener && !isStaff(interaction.member, ctx.type)) {
            return interaction.reply({ content: 'You cannot close this ticket.', flags: MessageFlags.Ephemeral });
        }
        if (ctx.ticket.status === 'closed') {
            return interaction.reply({ content: 'This ticket is already closed.', flags: MessageFlags.Ephemeral });
        }

        stashCloseReason(interaction.channelId, reason);

        return interaction.reply({ content: 'Are you sure you want to close this ticket?', components: [buildConfirmRow('close')], flags: MessageFlags.Ephemeral });
    },
    async confirmClose(interaction) {
        await performCloseTicket(interaction, popCloseReason(interaction.channelId));
    },
    async promptDeleteConfirm(interaction) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });

        return interaction.reply({
            content: 'Are you sure you want to permanently delete this ticket channel? This cannot be undone.',
            components: [buildConfirmRow('delete')],
            flags: MessageFlags.Ephemeral
        });
    },
    async confirmDelete(interaction) {
        await performDeleteTicket(interaction);
    },
    async reopenTicket(interaction) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });
        if (ctx.ticket.status === 'open') return interaction.reply({ content: 'This ticket is already open.', flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        Osthelia.ticketData.reopenTicket(interaction.channelId);
        const updatedTicket = Osthelia.ticketData.getTicket(interaction.channelId);
        const config = Osthelia.database.get(interaction.guildId);

        const targetCategoryId = (ctx.type && ctx.type.categoryId) || config.ticketDefaultCategoryId || null;
        if (targetCategoryId && interaction.channel.parentId !== targetCategoryId) {
            await interaction.channel.setParent(targetCategoryId, { lockPermissions: false }).catch(() => null);
        }

        await interaction.channel.permissionOverwrites.edit(ctx.ticket.openerId, { SendMessages: true }).catch(() => null);

        const controlMessage = await getControlMessage(interaction.channel, updatedTicket);
        if (controlMessage) {
            const container = buildTicketHeaderContainer({ ticket: updatedTicket, type: ctx.type, openerMention: `<@${updatedTicket.openerId}>`, status: 'open', config });
            await controlMessage.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }

        await interaction.editReply('Ticket reopened.');
    },
    async renameTicket(interaction, name) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });

        await interaction.channel.setName(sanitizeChannelNamePart(name).slice(0, 90)).catch(() => null);
        return interaction.reply({ content: 'Ticket renamed.', flags: MessageFlags.Ephemeral });
    },
    async grantAccess(interaction, target) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });

        await interaction.channel.permissionOverwrites.edit(target.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        return interaction.reply(`${target} has been added to this ticket.`);
    },
    async revokeAccess(interaction, target) {
        const ctx = getTicketContext(interaction.channelId, interaction.guildId);
        if (!ctx) return interaction.reply({ content: 'This is not a ticket channel.', flags: MessageFlags.Ephemeral });
        if (!isStaff(interaction.member, ctx.type)) return interaction.reply({ content: 'You cannot manage this ticket.', flags: MessageFlags.Ephemeral });

        if (target.id === ctx.ticket.openerId) {
            return interaction.reply({ content: 'You cannot remove the ticket opener.', flags: MessageFlags.Ephemeral });
        }

        await interaction.channel.permissionOverwrites.delete(target.id);

        return interaction.reply(`${target} has been removed from this ticket.`);
    }
};
