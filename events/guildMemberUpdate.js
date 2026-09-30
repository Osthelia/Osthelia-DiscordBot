/**
 * Osthelia Discord Bot - Member update event
 *
 * Covers two changes worth logging: nickname edits and timeouts (mutes),
 * whether they came from the bot or were applied manually in Discord.
 *
 * @package Osthelia\Events
 */

import { AuditLogEvent } from 'discord.js';

export default {
    type: 'guildMemberUpdate',
    async callback(oldMember, newMember) {
        if (oldMember.nickname !== newMember.nickname) {
            await Osthelia.moderationLog.nicknameChange(newMember, oldMember.nickname, newMember.nickname);
        }

        const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
        const newTimeout = newMember.communicationDisabledUntilTimestamp;

        if (newTimeout && newTimeout !== oldTimeout && newTimeout > Date.now()) {
            const entry = await Osthelia.auditLog.findEntry(newMember.guild, newMember.id, AuditLogEvent.MemberUpdate);

            await Osthelia.moderationLog.memberTimeout(
                newMember.guild,
                newMember.user,
                entry ? entry.executor : null,
                newTimeout,
                entry ? entry.reason : null
            );
        }
    }
};
