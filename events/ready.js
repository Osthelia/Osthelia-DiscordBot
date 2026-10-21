/**
 * Osthelia Discord Bot - Client ready event
 *
 * Loads every interaction handler into memory once the client is
 * connected. Command registration with Discord is a separate, explicit
 * step (see scripts/deployCommands.js) so restarts do not re-deploy.
 *
 * @package Osthelia\Events
 */

import heartbeat from '../core/heartbeat.js';

export default {
    type: 'clientReady',
    once: true,
    async callback(client) {
        Osthelia.commands = await Osthelia.loader.loadInteractions();
        heartbeat.start(client);

        console.log(`Connected as ${client.user.tag}`);
        console.log(`Loaded ${Osthelia.commands.size} interactions.`);
    }
};
