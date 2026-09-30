/**
 * Osthelia Discord Bot - Leveling data storage
 *
 * Persists per-guild, per-member XP and last message timestamp in the
 * shared SQLite database.
 *
 * @package Osthelia\Core
 */

import db from './sqlite.js';

const getStmt = db.prepare(`
    SELECT xp, last_message_at AS lastMessageAt, last_content AS lastContent
    FROM levels WHERE guild_id = ? AND user_id = ?
`);

const upsertStmt = db.prepare(`
    INSERT INTO levels (guild_id, user_id, xp, last_message_at, last_content)
    VALUES (@guildId, @userId, @xp, @lastMessageAt, @lastContent)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
        xp = @xp, last_message_at = @lastMessageAt, last_content = @lastContent
`);

const allStmt = db.prepare(`
    SELECT user_id AS userId, xp, last_message_at AS lastMessageAt, last_content AS lastContent
    FROM levels WHERE guild_id = ?
`);

export default {
    getMember(guildId, userId) {
        const row = getStmt.get(guildId, userId);
        return row ? { ...row } : { xp: 0, lastMessageAt: 0, lastContent: '' };
    },
    setMember(guildId, userId, data) {
        upsertStmt.run({
            guildId,
            userId,
            xp: data.xp,
            lastMessageAt: data.lastMessageAt,
            lastContent: data.lastContent
        });
    },
    getAllMembers(guildId) {
        const members = {};
        for (const row of allStmt.all(guildId)) {
            members[row.userId] = { xp: row.xp, lastMessageAt: row.lastMessageAt, lastContent: row.lastContent };
        }

        return members;
    }
};
