/**
 * Osthelia Discord Bot - Moderation actions
 *
 * Shared ban, kick and timeout logic used by the context menu commands.
 * Each action tries to DM the target before it is applied, since a
 * member cannot be reached anymore once banned or kicked. The actual
 * log entry is written by the matching gateway event (guildMemberRemove,
 * guildBanAdd, guildMemberUpdate) so manual and bot actions both end up
 * logged exactly once.
 *
 * @package Osthelia\Modules
 */

async function notify(member, guildName, action, reason, extra = '') {
    const message = `You have been ${action} from **${guildName}**.\nReason: ${reason}${extra}`;
    await member.send(message).catch(() => null);
}

export default {
    async kick(member, reason) {
        await notify(member, member.guild.name, 'kicked', reason);
        await member.kick(reason);
    },
    async ban(member, reason) {
        await notify(member, member.guild.name, 'banned', reason);
        await member.ban({ reason });
    },
    async timeout(member, reason, durationMinutes) {
        const durationMs = durationMinutes * 60 * 1000;

        await notify(member, member.guild.name, 'muted', reason, `\nDuration: ${durationMinutes} minutes`);
        await member.timeout(durationMs, reason);
    }
};
