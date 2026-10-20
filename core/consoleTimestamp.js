/**
 * Osthelia Discord Bot - Console timestamps
 *
 * Prefixes every console.log/info/warn/error/debug line with the local
 * date and time. Import this module before anything else that logs.
 *
 * @package Osthelia\Core
 */

const pad = n => String(n).padStart(2, '0');

function timestamp() {
    const d = new Date();
    return `[${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
        + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}

for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
    const original = console[method].bind(console);
    console[method] = (...args) => original(timestamp(), ...args);
}
