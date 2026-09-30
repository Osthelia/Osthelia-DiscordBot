/**
 * Osthelia Discord Bot - Audit log lookup helper
 *
 * Gateway events do not carry the moderator responsible for an action, so
 * this looks up the matching audit log entry created just before the
 * event fired.
 *
 * @package Osthelia\Core
 */

const MAX_AGE_MS = 5000;

export default {
    async findEntry(guild, targetId, auditLogEvent) {
        const logs = await guild.fetchAuditLogs({ type: auditLogEvent, limit: 5 }).catch(() => null);
        if (!logs) return null;

        return logs.entries.find(e =>
            e.target?.id === targetId && Date.now() - e.createdTimestamp < MAX_AGE_MS
        ) || null;
    }
};
