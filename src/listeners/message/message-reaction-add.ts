import { handleReactionRole } from '@/utils/handle-reaction-role';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { type MessageReaction, type User } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageReactionAdd,
})
export class BotListener extends Listener<typeof Events.MessageReactionAdd> {
    public async run(reaction: MessageReaction, user: User) {
        return await handleReactionRole(reaction, user, 'add');
    }
}
