/**
 * Osthelia Discord Bot - Global namespace aggregator
 *
 * Combines the core helpers into a single global namespace, exposed as
 * `Osthelia` and accessible from every event and interaction handler.
 *
 * @package Osthelia\Core
 */

import database from './database.js';
import levelData from './levelData.js';
import ticketData from './ticketData.js';
import loader from './loader.js';
import auditLog from './auditLog.js';
import moderationLog from '../modules/moderationLog.js';
import autoModeration from '../modules/autoModeration.js';
import moderationActions from '../modules/moderationActions.js';
import leveling from '../modules/leveling.js';
import rankCard from '../modules/rankCard.js';
import joinCard from '../modules/joinCard.js';
import ticketManager from '../modules/ticketManager.js';

export default {
    database,
    levelData,
    ticketData,
    loader,
    auditLog,
    moderationLog,
    autoModeration,
    moderationActions,
    leveling,
    rankCard,
    joinCard,
    ticketManager
};
