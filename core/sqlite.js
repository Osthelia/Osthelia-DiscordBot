/**
 * Osthelia Discord Bot - SQLite connection
 *
 * Single database file shared by every module that needs relational or
 * high write volume storage (leveling XP, ticket types and instances).
 * Guild configuration stays in the per-guild JSON files handled by
 * database.js, this file is only for record style data.
 *
 * @package Osthelia\Core
 */

import fs from 'fs';
import { join } from 'path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = join(global.__basedir, 'data');
const DB_PATH = join(DATA_DIR, 'osthelia.sqlite');

// eslint-disable-next-line security/detect-non-literal-fs-filename
if (!fs.existsSync(DATA_DIR)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// A ticket used to require a type from the moment its channel was
// created. Tickets are now created "pending" (no type yet, filled in
// once the in-channel FAQ is answered), so an older tickets table with
// NOT NULL type columns needs rebuilding. Only ever done on an empty
// table, an in-progress ticket is never dropped.
function migrateTicketsTable() {
    const columns = db.prepare('PRAGMA table_info(tickets)').all();
    if (columns.length === 0) return;

    const typeIdColumn = columns.find(column => column.name === 'type_id');
    if (!typeIdColumn || !typeIdColumn.notnull) return;

    const { count } = db.prepare('SELECT COUNT(*) AS count FROM tickets').get();
    if (count === 0) db.exec('DROP TABLE tickets');
}

function ensureColumn(table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some(existing => existing.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}

migrateTicketsTable();

db.exec(`
    CREATE TABLE IF NOT EXISTS levels (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        xp INTEGER NOT NULL DEFAULT 0,
        last_message_at INTEGER NOT NULL DEFAULT 0,
        last_content TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS ticket_types (
        guild_id TEXT NOT NULL,
        id TEXT NOT NULL,
        label TEXT NOT NULL,
        emoji TEXT,
        description TEXT,
        category_id TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (guild_id, id)
    );

    CREATE TABLE IF NOT EXISTS ticket_type_roles (
        guild_id TEXT NOT NULL,
        type_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        PRIMARY KEY (guild_id, type_id, role_id, kind)
    );

    CREATE TABLE IF NOT EXISTS ticket_type_questions (
        guild_id TEXT NOT NULL,
        type_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        label TEXT NOT NULL,
        style TEXT NOT NULL,
        required INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (guild_id, type_id, position)
    );

    CREATE TABLE IF NOT EXISTS tickets (
        channel_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        message_id TEXT,
        number INTEGER NOT NULL,
        type_id TEXT,
        type_label TEXT,
        opener_id TEXT NOT NULL,
        claimed_by TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at INTEGER NOT NULL,
        closed_at INTEGER,
        closed_by TEXT,
        close_reason TEXT,
        answers_json TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_counters (
        guild_id TEXT PRIMARY KEY,
        value INTEGER NOT NULL DEFAULT 0
    );
`);

ensureColumn('ticket_types', 'image_url', 'TEXT');
ensureColumn('ticket_types', 'message', 'TEXT');
ensureColumn('tickets', 'close_reason', 'TEXT');
ensureColumn('tickets', 'answers_json', 'TEXT');

export default db;
