/**
 * Osthelia Discord Bot - Member join event
 *
 * Logs the join, sends the join image to the configured welcome channel
 * and assigns the configured auto role, if any.
 *
 * @package Osthelia\Events
 */

async function sendWelcomeImage(member, config) {
    if (!config.welcomeChannelId) return;

    const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
    if (!channel) return;

    const image = await Osthelia.joinCard.build(member);
    await channel.send({ files: [image] }).catch(() => null);
}

export default {
    type: 'guildMemberAdd',
    async callback(member) {
        await Osthelia.moderationLog.memberJoin(member);

        const config = Osthelia.database.get(member.guild.id);

        await sendWelcomeImage(member, config);

        if (!config.autoRoleId) return;

        await member.roles.add(config.autoRoleId).catch(err => {
            console.error(`Could not assign auto role to ${member.user.tag}:`, err);
        });
    }
};
