/**
 * Osthelia Discord Bot - Ban remove event
 *
 * @package Osthelia\Events
 */

import { AuditLogEvent } from 'discord.js';

export default {
    type: 'guildBanRemove',
    async callback(ban) {
        const entry = await Osthelia.auditLog.findEntry(ban.guild, ban.user.id, AuditLogEvent.MemberBanRemove);

        await Osthelia.moderationLog.memberUnbanned(ban.guild, ban.user, entry ? entry.executor : null);
    }
};
