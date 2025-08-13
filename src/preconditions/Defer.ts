import { ApplyOptions } from '@sapphire/decorators';
import { Precondition, type AsyncPreconditionResult, type PreconditionOptions } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';

@ApplyOptions<PreconditionOptions>({
    name: 'Defer',
})
export class DeferPrecondition extends Precondition {
    public override async chatInputRun(interaction: CommandInteraction): AsyncPreconditionResult {
        return await this.run(interaction);
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction): AsyncPreconditionResult {
        return await this.run(interaction);
    }

    private async run(interaction: CommandInteraction | ContextMenuCommandInteraction): AsyncPreconditionResult {
        await interaction.deferReply();
        return await this.ok();
    }
}
