/**
 * Osthelia Discord Bot - Message create event
 *
 * Entry point for auto moderation checks and the leveling system.
 *
 * @package Osthelia\Events
 */

export default {
    type: 'messageCreate',
    async callback(message) {
        if (!message.guild || message.author.bot) return;

        const deleted = await Osthelia.autoModeration.handleMessage(message);
        if (deleted) return;

        await Osthelia.leveling.handleMessage(message);
    }
};
