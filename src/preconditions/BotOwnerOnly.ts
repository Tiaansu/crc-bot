import { ApplyOptions } from '@sapphire/decorators';
import { Precondition } from '@sapphire/framework';
import type {
    CommandInteraction,
    ContextMenuCommandInteraction,
} from 'discord.js';

@ApplyOptions<Precondition.Options>({
    name: 'BotOwnerOnly',
})
export class BotPrecondition extends Precondition {
    public override chatInputRun(
        interaction: CommandInteraction,
    ): Precondition.Result {
        return this.isBotOwner(interaction.user.id);
    }

    public override contextMenuRun(
        interaction: ContextMenuCommandInteraction,
    ): Precondition.Result {
        return this.isBotOwner(interaction.user.id);
    }

    private isBotOwner(userId: string): Precondition.Result {
        return this.container.config.ownerIds.includes(userId)
            ? this.ok()
            : this.error({
                  message: `You are not authorized to use this command.`,
              });
    }
}
