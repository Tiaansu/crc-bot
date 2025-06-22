import '@/config';
import '@sapphire/plugin-subcommands/register';

import {
    ApplicationCommandRegistries,
    RegisterBehavior,
} from '@sapphire/framework';

import * as colorette from 'colorette';
import { inspect } from 'util';

inspect.defaultOptions.depth = 1;
colorette.createColors({ useColor: true });

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
    RegisterBehavior.BulkOverwrite,
);
