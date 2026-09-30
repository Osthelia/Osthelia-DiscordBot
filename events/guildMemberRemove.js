/**
 * Osthelia Discord Bot - Member remove event
 *
 * A removal can be a plain leave, a kick, or the side effect of a ban.
 * The audit log is checked to tell them apart; bans are left to the
 * guildBanAdd event so the member is not logged twice.
 *
 * @package Osthelia\Events
 */

import { AuditLogEvent } from 'discord.js';

export default {
    type: 'guildMemberRemove',
    async callback(member) {
        const banEntry = await Osthelia.auditLog.findEntry(member.guild, member.id, AuditLogEvent.MemberBanAdd);
        if (banEntry) return;

        const kickEntry = await Osthelia.auditLog.findEntry(member.guild, member.id, AuditLogEvent.MemberKick);
        if (kickEntry) {
            await Osthelia.moderationLog.memberKicked(member.guild, member.user, kickEntry.executor, kickEntry.reason);
            return;
        }

        await Osthelia.moderationLog.memberLeave(member);
    }
};
