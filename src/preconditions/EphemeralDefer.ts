import { ApplyOptions } from '@sapphire/decorators';
import { Precondition, type AsyncPreconditionResult, type PreconditionOptions } from '@sapphire/framework';
import { MessageFlags, type CommandInteraction, type ContextMenuCommandInteraction } from 'discord.js';

@ApplyOptions<PreconditionOptions>({
    name: 'EphemeralDefer',
})
export class DeferPrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction): AsyncPreconditionResult {
        return await this.run(interaction);
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction): AsyncPreconditionResult {
        return await this.run(interaction);
    }

    private async run(interaction: CommandInteraction | ContextMenuCommandInteraction): AsyncPreconditionResult {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        return await this.ok();
    }
}
