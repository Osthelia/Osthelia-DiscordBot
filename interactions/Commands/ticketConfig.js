/**
 * Osthelia Discord Bot - Ticket system configuration command
 *
 * Administrator only command used to create and configure ticket types
 * (staff access roles, ping roles, optional form questions, category,
 * banner image, ticket message), the default and closed ticket
 * categories, the fallback banner, the addable role list, the open
 * ticket panel and the transcript channel.
 *
 * @package Osthelia\Interactions\Commands
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } from 'discord.js';

const MAX_QUESTIONS = 5;
const MODAL_LABEL_MAX_LENGTH = 45;

function findType(guildId, id) {
    return Osthelia.ticketData.getType(guildId, id);
}

function typeSummary(type) {
    return `${type.emoji ? `${type.emoji} ` : ''}**${type.label}** (\`${type.id}\`) ${type.enabled ? '' : '*[disabled]*'}`;
}

export default {
    data: new SlashCommandBuilder()
        .setName('ticket-config')
        .setDescription('Configure the ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommandGroup(group => group
            .setName('type')
            .setDescription('Manage ticket types')
            .addSubcommand(sub => sub
                .setName('create')
                .setDescription('Create a new ticket type')
                .addStringOption(option => option
                    .setName('label')
                    .setDescription('Display name, for example Contact the editors')
                    .setRequired(true)
                    .setMaxLength(64))
                .addStringOption(option => option
                    .setName('emoji')
                    .setDescription('Emoji shown next to the type')
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('description')
                    .setDescription('Short blurb shown next to this category in the FAQ picker')
                    .setRequired(false)
                    .setMaxLength(100)))
            .addSubcommand(sub => sub
                .setName('edit')
                .setDescription('Edit a ticket type\'s label, emoji, description, message or banner image')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true)))
            .addSubcommand(sub => sub
                .setName('delete')
                .setDescription('Delete a ticket type')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true)))
            .addSubcommand(sub => sub
                .setName('toggle')
                .setDescription('Enable or disable a ticket type')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addBooleanOption(option => option
                    .setName('state')
                    .setDescription('On or off')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('category')
                .setDescription('Set the category ticket channels move to once this type is chosen')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addChannelOption(option => option
                    .setName('category')
                    .setDescription('Target category, leave unset to keep it in the default ticket category')
                    .addChannelTypes(ChannelType.GuildCategory)
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('list')
                .setDescription('List every ticket type')))
        .addSubcommandGroup(group => group
            .setName('access')
            .setDescription('Manage which roles can see and manage a ticket type')
            .addSubcommand(sub => sub
                .setName('add')
                .setDescription('Give a role access to a ticket type')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Staff role')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('remove')
                .setDescription('Remove a role from a ticket type')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Staff role')
                    .setRequired(true))))
        .addSubcommandGroup(group => group
            .setName('ping')
            .setDescription('Manage which roles are pinged when a ticket of this type opens')
            .addSubcommand(sub => sub
                .setName('add')
                .setDescription('Ping a role when this ticket type opens')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Role to ping')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('remove')
                .setDescription('Stop pinging a role for this ticket type')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Role to stop pinging')
                    .setRequired(true))))
        .addSubcommandGroup(group => group
            .setName('form')
            .setDescription('Manage the optional form shown before a ticket type is chosen')
            .addSubcommand(sub => sub
                .setName('add-question')
                .setDescription(`Add a form question (max ${MAX_QUESTIONS} per type)`)
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addStringOption(option => option
                    .setName('question')
                    .setDescription('Question text')
                    .setRequired(true)
                    .setMaxLength(MODAL_LABEL_MAX_LENGTH))
                .addStringOption(option => option
                    .setName('style')
                    .setDescription('Answer field style, defaults to paragraph')
                    .setRequired(false)
                    .addChoices({ name: 'Short', value: 'short' }, { name: 'Paragraph', value: 'paragraph' }))
                .addBooleanOption(option => option
                    .setName('required')
                    .setDescription('Whether an answer is required, defaults to true')
                    .setRequired(false)))
            .addSubcommand(sub => sub
                .setName('remove-question')
                .setDescription('Remove a form question')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addIntegerOption(option => option
                    .setName('index')
                    .setDescription('Question number, see /ticket-config form list')
                    .setRequired(true)
                    .setMinValue(1)))
            .addSubcommand(sub => sub
                .setName('clear')
                .setDescription('Remove every form question from a ticket type')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true)))
            .addSubcommand(sub => sub
                .setName('list')
                .setDescription('List the form questions for a ticket type')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('Ticket type')
                    .setRequired(true)
                    .setAutocomplete(true))))
        .addSubcommandGroup(group => group
            .setName('panel')
            .setDescription('Configure and send the ticket panel')
            .addSubcommand(sub => sub
                .setName('edit')
                .setDescription('Edit the panel\'s title, description, banner image or button label')
                .addStringOption(option => option
                    .setName('title')
                    .setDescription('Panel title')
                    .setRequired(false)
                    .setMaxLength(256))
                .addStringOption(option => option
                    .setName('description')
                    .setDescription('Panel description')
                    .setRequired(false)
                    .setMaxLength(1000))
                .addStringOption(option => option
                    .setName('image')
                    .setDescription('Banner image URL')
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('button-label')
                    .setDescription('Text shown on the open ticket button')
                    .setRequired(false)
                    .setMaxLength(80)))
            .addSubcommand(sub => sub
                .setName('send')
                .setDescription('Send the ticket panel to a channel')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Target channel')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true))))
        .addSubcommandGroup(group => group
            .setName('addable-role')
            .setDescription('Manage the roles staff can quickly add to a ticket from its Add button')
            .addSubcommand(sub => sub
                .setName('add')
                .setDescription('Add a role to the addable list')
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Role')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('remove')
                .setDescription('Remove a role from the addable list')
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Role')
                    .setRequired(true))))
        .addSubcommand(sub => sub
            .setName('transcript-channel')
            .setDescription('Set the channel closed ticket transcripts are sent to')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('Target channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)))
        .addSubcommand(sub => sub
            .setName('default-category')
            .setDescription('Set the category new tickets sit in until a type is chosen')
            .addChannelOption(option => option
                .setName('category')
                .setDescription('Target category')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)))
        .addSubcommand(sub => sub
            .setName('closed-category')
            .setDescription('Set the category closed tickets move to')
            .addChannelOption(option => option
                .setName('category')
                .setDescription('Target category')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)))
        .addSubcommand(sub => sub
            .setName('banner')
            .setDescription('Set the default banner image used by containers that have no image of their own')
            .addStringOption(option => option
                .setName('url')
                .setDescription('Image URL, or "none" to clear it')
                .setRequired(true)))
        .addSubcommand(sub => sub
            .setName('max-open')
            .setDescription('Set how many tickets a member can have open at once')
            .addIntegerOption(option => option
                .setName('count')
                .setDescription('Maximum open tickets per member')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(25))),
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const types = Osthelia.ticketData.listTypes(interaction.guildId);

        const matches = types
            .filter(type => type.label.toLowerCase().includes(focused) || type.id.includes(focused))
            .slice(0, 25)
            .map(type => ({ name: `${type.label} (${type.id})`, value: type.id }));

        await interaction.respond(matches);
    },
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup();
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (group === 'type' && sub === 'create') {
            const label = interaction.options.getString('label');
            const emoji = interaction.options.getString('emoji');
            const description = interaction.options.getString('description');
            const id = Osthelia.ticketManager.slugify(label);

            if (findType(guildId, id)) {
                return interaction.reply({ content: `A ticket type already uses the id \`${id}\`, pick a different label.`, flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.upsertType(guildId, { id, label, emoji, description, categoryId: null, enabled: true, imageUrl: null });
            return interaction.reply({ content: `Ticket type **${label}** created (id \`${id}\`). Grant staff access with \`/ticket-config access add\`, and set a category with \`/ticket-config type category\` if it should not stay in the default one.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'type' && sub === 'edit') {
            const id = interaction.options.getString('type');
            const type = findType(guildId, id);
            if (!type) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`ticketTypeEditField_${id}`)
                .setPlaceholder('What do you want to edit?')
                .addOptions(
                    { label: 'Label', value: 'label', description: `Current: ${type.label}`.slice(0, 100) },
                    { label: 'Emoji', value: 'emoji', description: `Current: ${type.emoji || 'None'}`.slice(0, 100) },
                    { label: 'Description', value: 'description', description: `Current: ${type.description || 'None'}`.slice(0, 100) },
                    { label: 'Ticket message', value: 'message', description: (type.message ? 'Currently set' : 'Currently none, supports {member}').slice(0, 100) },
                    { label: 'Banner image', value: 'image', description: type.imageUrl ? 'Currently set' : 'Currently none' }
                );

            return interaction.reply({ content: `Editing **${type.label}** (\`${id}\`), pick a field:`, components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
        }

        if (group === 'type' && sub === 'delete') {
            const id = interaction.options.getString('type');
            if (!findType(guildId, id)) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.deleteType(guildId, id);
            return interaction.reply({ content: `Ticket type \`${id}\` deleted. Existing ticket channels for it are unaffected.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'type' && sub === 'toggle') {
            const id = interaction.options.getString('type');
            const state = interaction.options.getBoolean('state');
            const type = findType(guildId, id);
            if (!type) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.upsertType(guildId, { ...type, enabled: state });
            return interaction.reply({ content: `Ticket type **${type.label}** is now ${state ? 'enabled' : 'disabled'}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'type' && sub === 'category') {
            const id = interaction.options.getString('type');
            const category = interaction.options.getChannel('category');
            const type = findType(guildId, id);
            if (!type) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.upsertType(guildId, { ...type, categoryId: category.id });
            return interaction.reply({ content: `**${type.label}** tickets will now move to **${category.name}** once chosen.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'type' && sub === 'list') {
            const types = Osthelia.ticketData.listTypes(guildId);
            if (types.length === 0) {
                return interaction.reply({ content: 'No ticket types configured yet, create one with `/ticket-config type create`.', flags: MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle('Ticket types')
                .setColor(0x5865F2)
                .addFields(types.map(type => ({
                    name: typeSummary(type),
                    value: [
                        `Category: ${type.categoryId ? `<#${type.categoryId}>` : 'Default'}`,
                        `Staff roles: ${type.staffRoleIds.map(roleId => `<@&${roleId}>`).join(', ') || 'None'}`,
                        `Ping roles: ${type.pingRoleIds.map(roleId => `<@&${roleId}>`).join(', ') || 'None'}`,
                        `Form questions: ${type.form.length}`,
                        `Ticket message: ${type.message ? 'Set' : 'None'}`,
                        `Banner image: ${type.imageUrl ? 'Set' : 'None'}`
                    ].join('\n')
                })));

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (group === 'access' && (sub === 'add' || sub === 'remove')) {
            const id = interaction.options.getString('type');
            const role = interaction.options.getRole('role');
            if (!findType(guildId, id)) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            if (sub === 'add') {
                Osthelia.ticketData.addRole(guildId, id, role.id, 'staff');
                return interaction.reply({ content: `${role} can now see and manage \`${id}\` tickets.`, flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.removeRole(guildId, id, role.id, 'staff');
            return interaction.reply({ content: `${role} no longer has access to \`${id}\` tickets.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'ping' && (sub === 'add' || sub === 'remove')) {
            const id = interaction.options.getString('type');
            const role = interaction.options.getRole('role');
            if (!findType(guildId, id)) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            if (sub === 'add') {
                Osthelia.ticketData.addRole(guildId, id, role.id, 'ping');
                return interaction.reply({ content: `${role} will now be pinged when a \`${id}\` ticket opens.`, flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.removeRole(guildId, id, role.id, 'ping');
            return interaction.reply({ content: `${role} will no longer be pinged for \`${id}\` tickets.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'form' && sub === 'add-question') {
            const id = interaction.options.getString('type');
            const question = interaction.options.getString('question');
            const style = interaction.options.getString('style') || 'paragraph';
            const required = interaction.options.getBoolean('required') ?? true;

            if (!findType(guildId, id)) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            if (Osthelia.ticketData.questionCount(guildId, id) >= MAX_QUESTIONS) {
                return interaction.reply({ content: `A ticket type can have at most ${MAX_QUESTIONS} form questions, Discord's modal limit.`, flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.addQuestion(guildId, id, { label: question, style, required });
            return interaction.reply({ content: `Question added to \`${id}\`, choosing this category will now show a form.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'form' && sub === 'remove-question') {
            const id = interaction.options.getString('type');
            const index = interaction.options.getInteger('index');
            if (!findType(guildId, id)) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.removeQuestion(guildId, id, index - 1);
            return interaction.reply({ content: `Removed question ${index} from \`${id}\`.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'form' && sub === 'clear') {
            const id = interaction.options.getString('type');
            if (!findType(guildId, id)) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            Osthelia.ticketData.clearQuestions(guildId, id);
            return interaction.reply({ content: `Every form question was removed from \`${id}\`, it will now resolve instantly.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'form' && sub === 'list') {
            const id = interaction.options.getString('type');
            const type = findType(guildId, id);
            if (!type) {
                return interaction.reply({ content: 'That ticket type does not exist.', flags: MessageFlags.Ephemeral });
            }

            if (type.form.length === 0) {
                return interaction.reply({ content: `\`${id}\` has no form questions, it resolves instantly.`, flags: MessageFlags.Ephemeral });
            }

            const description = type.form
                .map((question, index) => `**${index + 1}.** ${question.label} *(${question.style}, ${question.required ? 'required' : 'optional'})*`)
                .join('\n');

            return interaction.reply({ content: description, flags: MessageFlags.Ephemeral });
        }

        if (group === 'panel' && sub === 'edit') {
            const config = Osthelia.database.get(guildId);
            const patch = {
                title: interaction.options.getString('title') ?? config.ticketPanel.title,
                description: interaction.options.getString('description') ?? config.ticketPanel.description,
                imageUrl: interaction.options.getString('image') ?? config.ticketPanel.imageUrl,
                buttonLabel: interaction.options.getString('button-label') ?? config.ticketPanel.buttonLabel
            };

            Osthelia.database.updateTicketPanel(guildId, patch);
            return interaction.reply({ content: 'Ticket panel updated, re-send it with `/ticket-config panel send` to apply the changes to an existing message.', flags: MessageFlags.Ephemeral });
        }

        if (group === 'panel' && sub === 'send') {
            const channel = interaction.options.getChannel('channel');
            const config = Osthelia.database.get(guildId);
            const container = Osthelia.ticketManager.buildOpenPanelContainer(config);

            await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
            return interaction.reply({ content: `Ticket panel sent to ${channel}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'addable-role' && (sub === 'add' || sub === 'remove')) {
            const role = interaction.options.getRole('role');
            const config = Osthelia.database.get(guildId);

            const ticketAddableRoleIds = sub === 'add'
                ? [...new Set([...config.ticketAddableRoleIds, role.id])]
                : config.ticketAddableRoleIds.filter(roleId => roleId !== role.id);

            Osthelia.database.update(guildId, { ticketAddableRoleIds });
            return interaction.reply({
                content: sub === 'add' ? `${role} can now be added to tickets from the Add button.` : `${role} removed from the addable roles list.`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (sub === 'transcript-channel') {
            const channel = interaction.options.getChannel('channel');
            Osthelia.database.update(guildId, { ticketTranscriptChannelId: channel.id });
            return interaction.reply({ content: `Closed ticket transcripts will be sent to ${channel}.`, flags: MessageFlags.Ephemeral });
        }

        if (sub === 'default-category') {
            const category = interaction.options.getChannel('category');
            Osthelia.database.update(guildId, { ticketDefaultCategoryId: category.id });
            return interaction.reply({ content: `New tickets will now sit under **${category.name}** until a type is chosen (and stay there for types without their own category).`, flags: MessageFlags.Ephemeral });
        }

        if (sub === 'closed-category') {
            const category = interaction.options.getChannel('category');
            Osthelia.database.update(guildId, { ticketClosedCategoryId: category.id });
            return interaction.reply({ content: `Closed tickets will now move to **${category.name}**.`, flags: MessageFlags.Ephemeral });
        }

        if (sub === 'banner') {
            const url = interaction.options.getString('url');
            const ticketDefaultBannerUrl = url.toLowerCase() === 'none' ? null : url;
            Osthelia.database.update(guildId, { ticketDefaultBannerUrl });
            return interaction.reply({ content: ticketDefaultBannerUrl ? 'Default banner image updated.' : 'Default banner image cleared.', flags: MessageFlags.Ephemeral });
        }

        if (sub === 'max-open') {
            const count = interaction.options.getInteger('count');
            Osthelia.database.update(guildId, { ticketMaxOpenPerMember: count });
            return interaction.reply({ content: `Members can now have up to ${count} open ticket(s) at once.`, flags: MessageFlags.Ephemeral });
        }
    }
};
