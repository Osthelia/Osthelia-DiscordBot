/**
 * Osthelia Discord Bot - Ban add event
 *
 * @package Osthelia\Events
 */

import { AuditLogEvent } from 'discord.js';

export default {
    type: 'guildBanAdd',
    async callback(ban) {
        const entry = await Osthelia.auditLog.findEntry(ban.guild, ban.user.id, AuditLogEvent.MemberBanAdd);

        await Osthelia.moderationLog.memberBanned(
            ban.guild,
            ban.user,
            entry ? entry.executor : null,
            entry ? entry.reason : ban.reason
        );
    }
};
