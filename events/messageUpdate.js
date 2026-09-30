/**
 * Osthelia Discord Bot - Message update event
 *
 * @package Osthelia\Events
 */

export default {
    type: 'messageUpdate',
    async callback(oldMessage, newMessage) {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        await Osthelia.moderationLog.messageEdit(oldMessage, newMessage);
    }
};
