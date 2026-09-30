/**
 * Osthelia Discord Bot - Server configuration command
 *
 * Administrator only command used to configure the moderation log
 * channel, the report channel, the auto role, the auto moderation rules,
 * the message edit/delete log exclusions and the leveling system for the
 * guild.
 *
 * @package Osthelia\Interactions\Commands
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure the bot for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommandGroup(group => group
            .setName('channel')
            .setDescription('Set a channel used by the bot')
            .addSubcommand(sub => sub
                .setName('logs')
                .setDescription('Set the moderation log channel')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Target channel')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('reports')
                .setDescription('Set the message report channel')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Target channel')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('welcome')
                .setDescription('Set the channel where the join image is posted')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Target channel')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true))))
        .addSubcommandGroup(group => group
            .setName('role')
            .setDescription('Set a role used by the bot')
            .addSubcommand(sub => sub
                .setName('auto')
                .setDescription('Set the role given to new members')
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Role to assign on join')
                    .setRequired(true))))
        .addSubcommandGroup(group => group
            .setName('automod')
            .setDescription('Configure the anti link auto moderation')
            .addSubcommand(sub => sub
                .setName('toggle')
                .setDescription('Enable or disable auto moderation')
                .addBooleanOption(option => option
                    .setName('state')
                    .setDescription('On or off')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('exempt-role')
                .setDescription('Allow a role to bypass the link filter')
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Role to exempt')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('exempt-channel')
                .setDescription('Allow a channel to bypass the link filter')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Channel to exempt')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('exempt-category')
                .setDescription('Allow every channel in a category to bypass the link filter')
                .addChannelOption(option => option
                    .setName('category')
                    .setDescription('Category to exempt')
                    .addChannelTypes(ChannelType.GuildCategory)
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('allow-domain')
                .setDescription('Allow links to a specific domain')
                .addStringOption(option => option
                    .setName('domain')
                    .setDescription('Domain, for example example.com')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('status')
                .setDescription('Show the current auto moderation settings')))
        .addSubcommandGroup(group => group
            .setName('message-log')
            .setDescription('Configure exclusions for the message edit/delete logs')
            .addSubcommand(sub => sub
                .setName('exclude-category')
                .setDescription('Stop logging message edits and deletions for a category')
                .addChannelOption(option => option
                    .setName('category')
                    .setDescription('Category to exclude')
                    .addChannelTypes(ChannelType.GuildCategory)
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('include-channel')
                .setDescription('Keep logging a channel even if its category is excluded')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Channel to keep logging')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('status')
                .setDescription('Show the current message log exclusions')))
        .addSubcommandGroup(group => group
            .setName('level')
            .setDescription('Configure the leveling system')
            .addSubcommand(sub => sub
                .setName('toggle')
                .setDescription('Enable or disable the leveling system')
                .addBooleanOption(option => option
                    .setName('state')
                    .setDescription('On or off')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('exempt-channel')
                .setDescription('Stop members from earning XP in a channel')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Channel to exempt')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('role-reward-add')
                .setDescription('Give a role automatically when a member reaches a level')
                .addIntegerOption(option => option
                    .setName('level')
                    .setDescription('Level required')
                    .setRequired(true)
                    .setMinValue(1))
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Role to award')
                    .setRequired(true)))
            .addSubcommand(sub => sub
                .setName('role-reward-remove')
                .setDescription('Remove a level role reward')
                .addIntegerOption(option => option
                    .setName('level')
                    .setDescription('Level to remove the reward from')
                    .setRequired(true)
                    .setMinValue(1)))
            .addSubcommand(sub => sub
                .setName('status')
                .setDescription('Show the current leveling settings'))),
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup();
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (group === 'channel' && sub === 'logs') {
            const channel = interaction.options.getChannel('channel');
            Osthelia.database.update(guildId, { logChannelId: channel.id });
            return interaction.reply({ content: `Moderation logs will be sent to ${channel}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'channel' && sub === 'reports') {
            const channel = interaction.options.getChannel('channel');
            Osthelia.database.update(guildId, { reportChannelId: channel.id });
            return interaction.reply({ content: `Message reports will be sent to ${channel}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'channel' && sub === 'welcome') {
            const channel = interaction.options.getChannel('channel');
            Osthelia.database.update(guildId, { welcomeChannelId: channel.id });
            return interaction.reply({ content: `Join images will be sent to ${channel}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'role' && sub === 'auto') {
            const role = interaction.options.getRole('role');
            Osthelia.database.update(guildId, { autoRoleId: role.id });
            return interaction.reply({ content: `New members will now receive ${role}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'automod' && sub === 'toggle') {
            const state = interaction.options.getBoolean('state');
            Osthelia.database.updateAutoMod(guildId, { enabled: state });
            return interaction.reply({ content: `Auto moderation is now ${state ? 'enabled' : 'disabled'}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'automod' && sub === 'exempt-role') {
            const role = interaction.options.getRole('role');
            const config = Osthelia.database.get(guildId);
            const exemptRoleIds = [...new Set([...config.autoMod.exemptRoleIds, role.id])];
            Osthelia.database.updateAutoMod(guildId, { exemptRoleIds });
            return interaction.reply({ content: `${role} can now post links anywhere.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'automod' && sub === 'exempt-channel') {
            const channel = interaction.options.getChannel('channel');
            const config = Osthelia.database.get(guildId);
            const exemptChannelIds = [...new Set([...config.autoMod.exemptChannelIds, channel.id])];
            Osthelia.database.updateAutoMod(guildId, { exemptChannelIds });
            return interaction.reply({ content: `Links are now allowed in ${channel}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'automod' && sub === 'exempt-category') {
            const category = interaction.options.getChannel('category');
            const config = Osthelia.database.get(guildId);
            const exemptCategoryIds = [...new Set([...config.autoMod.exemptCategoryIds, category.id])];
            Osthelia.database.updateAutoMod(guildId, { exemptCategoryIds });
            return interaction.reply({ content: `Links are now allowed in every channel under **${category.name}**.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'automod' && sub === 'allow-domain') {
            const domain = interaction.options.getString('domain').toLowerCase();
            const config = Osthelia.database.get(guildId);
            const allowedDomains = [...new Set([...config.autoMod.allowedDomains, domain])];
            Osthelia.database.updateAutoMod(guildId, { allowedDomains });
            return interaction.reply({ content: `Links to ${domain} are now allowed.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'automod' && sub === 'status') {
            const config = Osthelia.database.get(guildId);
            const embed = new EmbedBuilder()
                .setTitle('Auto moderation settings')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Enabled', value: config.autoMod.enabled ? 'Yes' : 'No' },
                    { name: 'Exempt roles', value: config.autoMod.exemptRoleIds.map(id => `<@&${id}>`).join(', ') || 'None' },
                    { name: 'Exempt channels', value: config.autoMod.exemptChannelIds.map(id => `<#${id}>`).join(', ') || 'None' },
                    { name: 'Exempt categories', value: config.autoMod.exemptCategoryIds.map(id => `<#${id}>`).join(', ') || 'None' },
                    { name: 'Allowed domains', value: config.autoMod.allowedDomains.join(', ') || 'None' }
                );

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (group === 'message-log' && sub === 'exclude-category') {
            const category = interaction.options.getChannel('category');
            const config = Osthelia.database.get(guildId);
            const exemptCategoryIds = [...new Set([...config.messageLog.exemptCategoryIds, category.id])];
            Osthelia.database.updateMessageLog(guildId, { exemptCategoryIds });
            return interaction.reply({ content: `Message edits and deletions will no longer be logged for channels under **${category.name}**.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'message-log' && sub === 'include-channel') {
            const channel = interaction.options.getChannel('channel');
            const config = Osthelia.database.get(guildId);
            const includeChannelIds = [...new Set([...config.messageLog.includeChannelIds, channel.id])];
            Osthelia.database.updateMessageLog(guildId, { includeChannelIds });
            return interaction.reply({ content: `${channel} will keep being logged even if its category is excluded.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'message-log' && sub === 'status') {
            const config = Osthelia.database.get(guildId);
            const embed = new EmbedBuilder()
                .setTitle('Message log exclusions')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Excluded categories', value: config.messageLog.exemptCategoryIds.map(id => `<#${id}>`).join(', ') || 'None' },
                    { name: 'Always logged channels', value: config.messageLog.includeChannelIds.map(id => `<#${id}>`).join(', ') || 'None' }
                );

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (group === 'level' && sub === 'toggle') {
            const state = interaction.options.getBoolean('state');
            Osthelia.database.updateLeveling(guildId, { enabled: state });
            return interaction.reply({ content: `Leveling is now ${state ? 'enabled' : 'disabled'}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'level' && sub === 'exempt-channel') {
            const channel = interaction.options.getChannel('channel');
            const config = Osthelia.database.get(guildId);
            const exemptChannelIds = [...new Set([...config.leveling.exemptChannelIds, channel.id])];
            Osthelia.database.updateLeveling(guildId, { exemptChannelIds });
            return interaction.reply({ content: `No more XP will be earned in ${channel}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'level' && sub === 'role-reward-add') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');
            const config = Osthelia.database.get(guildId);
            const roleRewards = [...config.leveling.roleRewards.filter(reward => reward.level !== level), { level, roleId: role.id }];
            Osthelia.database.updateLeveling(guildId, { roleRewards });
            return interaction.reply({ content: `${role} will now be given at level ${level}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'level' && sub === 'role-reward-remove') {
            const level = interaction.options.getInteger('level');
            const config = Osthelia.database.get(guildId);
            const roleRewards = config.leveling.roleRewards.filter(reward => reward.level !== level);
            Osthelia.database.updateLeveling(guildId, { roleRewards });
            return interaction.reply({ content: `Removed the role reward for level ${level}.`, flags: MessageFlags.Ephemeral });
        }

        if (group === 'level' && sub === 'status') {
            const config = Osthelia.database.get(guildId);
            const roleRewards = config.leveling.roleRewards
                .sort((a, b) => a.level - b.level)
                .map(reward => `Level ${reward.level}: <@&${reward.roleId}>`)
                .join('\n') || 'None';

            const embed = new EmbedBuilder()
                .setTitle('Leveling settings')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Enabled', value: config.leveling.enabled ? 'Yes' : 'No' },
                    { name: 'Exempt channels', value: config.leveling.exemptChannelIds.map(id => `<#${id}>`).join(', ') || 'None' },
                    { name: 'Role rewards', value: roleRewards }
                );

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};
