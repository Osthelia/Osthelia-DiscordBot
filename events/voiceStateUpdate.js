/**
 * Osthelia Discord Bot - Voice state update event
 *
 * Logs voice channel joins, leaves and switches.
 *
 * @package Osthelia\Events
 */

export default {
    type: 'voiceStateUpdate',
    async callback(oldState, newState) {
        const member = newState.member;

        if (!oldState.channel && newState.channel) {
            await Osthelia.moderationLog.voiceJoin(member, newState.channel);
        } else if (oldState.channel && !newState.channel) {
            await Osthelia.moderationLog.voiceLeave(member, oldState.channel);
        } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            await Osthelia.moderationLog.voiceMove(member, oldState.channel, newState.channel);
        }
    }
};
