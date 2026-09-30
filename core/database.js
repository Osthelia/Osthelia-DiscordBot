/**
 * Osthelia Discord Bot - Guild configuration storage
 *
 * Persists per-guild settings (log channels, auto role, auto moderation
 * rules, leveling settings) to a JSON file on disk. Config is cached in
 * memory and written back to disk on every update.
 *
 * @package Osthelia\Core
 */

import fs from 'fs';
import { join } from 'path';

const DATA_DIR = join(global.__basedir, 'data', 'guilds');

const DEFAULT_CONFIG = {
    logChannelId: null,
    reportChannelId: null,
    welcomeChannelId: null,
    ticketTranscriptChannelId: null,
    ticketDefaultCategoryId: null,
    ticketClosedCategoryId: null,
    ticketDefaultBannerUrl: null,
    ticketMaxOpenPerMember: 1,
    ticketAddableRoleIds: [],
    autoRoleId: null,
    autoMod: {
        enabled: false,
        exemptRoleIds: [],
        exemptChannelIds: [],
        exemptCategoryIds: [],
        allowedDomains: []
    },
    messageLog: {
        exemptCategoryIds: [],
        includeChannelIds: []
    },
    leveling: {
        enabled: true,
        exemptChannelIds: [],
        roleRewards: []
    },
    ticketPanel: {
        title: null,
        description: null,
        imageUrl: null,
        buttonLabel: null
    }
};

const cache = new Map();

// Guild IDs are Discord snowflakes (digits only), checked here so the
// path built below can never escape DATA_DIR.
function filePath(guildId) {
    if (!/^\d+$/.test(guildId)) {
        throw new Error(`Invalid guild id: ${guildId}`);
    }

    return join(DATA_DIR, `${guildId}.json`);
}

function ensureDataDir() {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(DATA_DIR)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function load(guildId) {
    if (cache.has(guildId)) return cache.get(guildId);

    ensureDataDir();
    const path = filePath(guildId);

    let config = structuredClone(DEFAULT_CONFIG);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(path)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const raw = fs.readFileSync(path, 'utf-8');
        const saved = JSON.parse(raw);
        config = {
            ...config,
            ...saved,
            autoMod: { ...config.autoMod, ...saved.autoMod },
            messageLog: { ...config.messageLog, ...saved.messageLog },
            leveling: { ...config.leveling, ...saved.leveling },
            ticketPanel: { ...config.ticketPanel, ...saved.ticketPanel }
        };
    }

    cache.set(guildId, config);
    return config;
}

function persist(guildId, config) {
    ensureDataDir();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath(guildId), JSON.stringify(config, null, 2));
    cache.set(guildId, config);
}

export default {
    get(guildId) {
        return load(guildId);
    },
    update(guildId, patch) {
        const config = { ...load(guildId), ...patch };
        persist(guildId, config);
        return config;
    },
    updateAutoMod(guildId, patch) {
        const config = load(guildId);
        config.autoMod = { ...config.autoMod, ...patch };
        persist(guildId, config);
        return config;
    },
    updateMessageLog(guildId, patch) {
        const config = load(guildId);
        config.messageLog = { ...config.messageLog, ...patch };
        persist(guildId, config);
        return config;
    },
    updateLeveling(guildId, patch) {
        const config = load(guildId);
        config.leveling = { ...config.leveling, ...patch };
        persist(guildId, config);
        return config;
    },
    updateTicketPanel(guildId, patch) {
        const config = load(guildId);
        config.ticketPanel = { ...config.ticketPanel, ...patch };
        persist(guildId, config);
        return config;
    }
};
