/**
 * Osthelia Discord Bot - Ticket storage
 *
 * Persists ticket types (with their staff roles, ping roles and optional
 * form questions) and ticket instances (open or closed channels) in the
 * shared SQLite database.
 *
 * @package Osthelia\Core
 */

import db from './sqlite.js';

const upsertTypeStmt = db.prepare(`
    INSERT INTO ticket_types (guild_id, id, label, emoji, description, category_id, enabled, image_url, message)
    VALUES (@guildId, @id, @label, @emoji, @description, @categoryId, @enabled, @imageUrl, @message)
    ON CONFLICT(guild_id, id) DO UPDATE SET
        label = @label, emoji = @emoji, description = @description,
        category_id = @categoryId, enabled = @enabled, image_url = @imageUrl, message = @message
`);
const getTypeRowStmt = db.prepare('SELECT * FROM ticket_types WHERE guild_id = ? AND id = ?');
const listTypeRowsStmt = db.prepare('SELECT * FROM ticket_types WHERE guild_id = ? ORDER BY rowid');
const deleteTypeStmt = db.prepare('DELETE FROM ticket_types WHERE guild_id = ? AND id = ?');

const addRoleStmt = db.prepare('INSERT OR IGNORE INTO ticket_type_roles (guild_id, type_id, role_id, kind) VALUES (?, ?, ?, ?)');
const removeRoleStmt = db.prepare('DELETE FROM ticket_type_roles WHERE guild_id = ? AND type_id = ? AND role_id = ? AND kind = ?');
const listRolesStmt = db.prepare('SELECT role_id AS roleId, kind FROM ticket_type_roles WHERE guild_id = ? AND type_id = ?');
const deleteRolesForTypeStmt = db.prepare('DELETE FROM ticket_type_roles WHERE guild_id = ? AND type_id = ?');

const listQuestionsStmt = db.prepare('SELECT position, label, style, required FROM ticket_type_questions WHERE guild_id = ? AND type_id = ? ORDER BY position');
const insertQuestionStmt = db.prepare('INSERT INTO ticket_type_questions (guild_id, type_id, position, label, style, required) VALUES (?, ?, ?, ?, ?, ?)');
const deleteQuestionsForTypeStmt = db.prepare('DELETE FROM ticket_type_questions WHERE guild_id = ? AND type_id = ?');
const countQuestionsStmt = db.prepare('SELECT COUNT(*) AS total FROM ticket_type_questions WHERE guild_id = ? AND type_id = ?');

const insertTicketStmt = db.prepare(`
    INSERT INTO tickets (channel_id, guild_id, number, type_id, type_label, opener_id, status, created_at)
    VALUES (@channelId, @guildId, @number, @typeId, @typeLabel, @openerId, 'open', @createdAt)
`);
const getTicketStmt = db.prepare('SELECT * FROM tickets WHERE channel_id = ?');
const listOpenByMemberStmt = db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND opener_id = ? AND status = 'open'");
const setTypeStmt = db.prepare('UPDATE tickets SET type_id = ?, type_label = ? WHERE channel_id = ?');
const setAnswersStmt = db.prepare('UPDATE tickets SET answers_json = ? WHERE channel_id = ?');
const setMessageStmt = db.prepare('UPDATE tickets SET message_id = ? WHERE channel_id = ?');
const setClaimStmt = db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?');
const closeTicketStmt = db.prepare("UPDATE tickets SET status = 'closed', closed_at = ?, closed_by = ?, close_reason = ? WHERE channel_id = ?");
const reopenTicketStmt = db.prepare("UPDATE tickets SET status = 'open', closed_at = NULL, closed_by = NULL, close_reason = NULL WHERE channel_id = ?");
const deleteTicketStmt = db.prepare('DELETE FROM tickets WHERE channel_id = ?');

const bumpCounterStmt = db.prepare(`
    INSERT INTO ticket_counters (guild_id, value) VALUES (?, 1)
    ON CONFLICT(guild_id) DO UPDATE SET value = value + 1
`);
const getCounterStmt = db.prepare('SELECT value FROM ticket_counters WHERE guild_id = ?');

function normalizeType(row, guildId) {
    if (!row) return null;

    const roles = listRolesStmt.all(guildId, row.id);

    return {
        id: row.id,
        label: row.label,
        emoji: row.emoji,
        description: row.description,
        categoryId: row.category_id,
        imageUrl: row.image_url,
        message: row.message,
        enabled: Boolean(row.enabled),
        staffRoleIds: roles.filter(role => role.kind === 'staff').map(role => role.roleId),
        pingRoleIds: roles.filter(role => role.kind === 'ping').map(role => role.roleId),
        form: listQuestionsStmt.all(guildId, row.id).map(question => ({
            label: question.label,
            style: question.style,
            required: Boolean(question.required)
        }))
    };
}

function normalizeTicket(row) {
    if (!row) return null;

    return {
        channelId: row.channel_id,
        guildId: row.guild_id,
        messageId: row.message_id,
        number: row.number,
        typeId: row.type_id,
        typeLabel: row.type_label,
        openerId: row.opener_id,
        claimedBy: row.claimed_by,
        status: row.status,
        createdAt: row.created_at,
        closedAt: row.closed_at,
        closedBy: row.closed_by,
        closeReason: row.close_reason,
        answers: row.answers_json ? JSON.parse(row.answers_json) : []
    };
}

export default {
    listTypes(guildId) {
        return listTypeRowsStmt.all(guildId).map(row => normalizeType(row, guildId));
    },
    getType(guildId, typeId) {
        return normalizeType(getTypeRowStmt.get(guildId, typeId), guildId);
    },
    upsertType(guildId, type) {
        upsertTypeStmt.run({
            guildId,
            id: type.id,
            label: type.label,
            emoji: type.emoji ?? null,
            description: type.description ?? null,
            categoryId: type.categoryId ?? null,
            enabled: type.enabled ? 1 : 0,
            imageUrl: type.imageUrl ?? null,
            message: type.message ?? null
        });
    },
    deleteType(guildId, typeId) {
        deleteRolesForTypeStmt.run(guildId, typeId);
        deleteQuestionsForTypeStmt.run(guildId, typeId);
        deleteTypeStmt.run(guildId, typeId);
    },
    addRole(guildId, typeId, roleId, kind) {
        addRoleStmt.run(guildId, typeId, roleId, kind);
    },
    removeRole(guildId, typeId, roleId, kind) {
        removeRoleStmt.run(guildId, typeId, roleId, kind);
    },
    questionCount(guildId, typeId) {
        return countQuestionsStmt.get(guildId, typeId).total;
    },
    addQuestion(guildId, typeId, question) {
        const position = countQuestionsStmt.get(guildId, typeId).total;
        insertQuestionStmt.run(guildId, typeId, position, question.label, question.style, question.required ? 1 : 0);
    },
    removeQuestion(guildId, typeId, position) {
        const questions = listQuestionsStmt.all(guildId, typeId).filter(question => question.position !== position);
        deleteQuestionsForTypeStmt.run(guildId, typeId);
        questions.forEach((question, index) => {
            insertQuestionStmt.run(guildId, typeId, index, question.label, question.style, question.required);
        });
    },
    clearQuestions(guildId, typeId) {
        deleteQuestionsForTypeStmt.run(guildId, typeId);
    },
    nextTicketNumber(guildId) {
        bumpCounterStmt.run(guildId);
        return getCounterStmt.get(guildId).value;
    },
    createTicket(ticket) {
        insertTicketStmt.run(ticket);
        return normalizeTicket(getTicketStmt.get(ticket.channelId));
    },
    getTicket(channelId) {
        return normalizeTicket(getTicketStmt.get(channelId));
    },
    listOpenByMember(guildId, openerId) {
        return listOpenByMemberStmt.all(guildId, openerId).map(normalizeTicket);
    },
    setType(channelId, typeId, typeLabel) {
        setTypeStmt.run(typeId, typeLabel, channelId);
    },
    setAnswers(channelId, answers) {
        setAnswersStmt.run(JSON.stringify(answers), channelId);
    },
    setMessage(channelId, messageId) {
        setMessageStmt.run(messageId, channelId);
    },
    setClaim(channelId, userId) {
        setClaimStmt.run(userId, channelId);
    },
    closeTicket(channelId, closedBy, reason) {
        closeTicketStmt.run(Date.now(), closedBy, reason || null, channelId);
    },
    reopenTicket(channelId) {
        reopenTicketStmt.run(channelId);
    },
    deleteTicket(channelId) {
        deleteTicketStmt.run(channelId);
    }
};
