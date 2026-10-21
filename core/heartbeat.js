/**
 * Osthelia Discord Bot - Push monitoring heartbeat
 *
 * Periodically calls the UptimeRobot heartbeat URL so the monitor can raise
 * an alert when the pings stop. Pings are only sent while the gateway
 * connection is ready, so a bot that is running but disconnected is
 * reported as down.
 *
 * @package Osthelia\Core
 */

import { Status } from 'discord.js';

const DEFAULT_INTERVAL_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 10000;

let timer = null;

async function ping(client, url) {
    if (client.ws.status !== Status.Ready) return;

    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        if (!res.ok) console.error(`Heartbeat rejected: HTTP ${res.status}`);
    } catch (err) {
        console.error('Heartbeat failed:', err.message);
    }
}

export default {
    start(client) {
        const url = process.env.UPTIMEROBOT_PUSH_URL;
        if (!url || timer) return;

        const seconds = Number(process.env.UPTIMEROBOT_PUSH_INTERVAL) || DEFAULT_INTERVAL_SECONDS;

        ping(client, url);
        timer = setInterval(() => ping(client, url), seconds * 1000);
        timer.unref();

        console.log(`Push monitoring enabled (every ${seconds}s).`);
    },

    stop() {
        clearInterval(timer);
        timer = null;
    }
};
