/**
 * Osthelia Discord Bot - Interaction create event
 *
 * Dispatches incoming slash commands, context menu commands, buttons,
 * select menus and modals to their registered handlers.
 *
 * @package Osthelia\Events
 */

/* eslint-disable security/detect-object-injection */

async function dispatch(interaction, commandName, handler) {
    const command = Osthelia.commands.get(commandName);
    if (!command || !command.cmd[handler]) {
        console.log(`No handler '${handler}' found for '${commandName}'.`);
        return;
    }

    try {
        await command.cmd[handler](interaction);
    } catch (err) {
        console.error(`Error while executing '${handler}' for '${commandName}':`, err);

        const errorReply = { content: 'An error occurred while processing your request.', ephemeral: true };
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(errorReply);
            } else {
                await interaction.reply(errorReply);
            }
        } catch {
            // Interaction may no longer be reachable, ignore.
        }
    }
}

export default {
    type: 'interactionCreate',
    async callback(interaction) {
        if (interaction.isAutocomplete()) {
            const command = Osthelia.commands.get(interaction.commandName);
            if (!command || !command.cmd.autocomplete) return;

            try {
                await command.cmd.autocomplete(interaction);
            } catch (err) {
                console.error(`Error while executing 'autocomplete' for '${interaction.commandName}':`, err);
            }
        } else if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            await dispatch(interaction, interaction.commandName, 'execute');
        } else if (interaction.isButton()) {
            await dispatch(interaction, interaction.customId.split('_')[0], 'button');
        } else if (interaction.isStringSelectMenu()) {
            await dispatch(interaction, interaction.customId.split('_')[0], 'select');
        } else if (interaction.isModalSubmit()) {
            await dispatch(interaction, interaction.customId.split('_')[0], 'modal');
        }
    }
};
