import type { APIEmbed, APIEmbedField } from 'discord.js';
import { ellipsis } from './ellipsis';

const EMBED_TITLE_LIMIT = 256;
const EMBED_DESCRIPTION_LIMIT = 4_096;
const EMBED_FOOTER_TEXT_LIMIT = 2_048;
const EMBED_AUTHOR_NAME_LIMIT = 256;
const EMBED_FIELD_LIMIT = 25;
const EMBED_FIELD_NAME_LIMIT = 256;
const EMBED_FIELD_VALUE_LIMIT = 1_024;

export function addFields(embed: APIEmbed, ...data: APIEmbedField[]): APIEmbed {
    return {
        ...embed,
        fields: [...(embed.fields ?? []), ...data],
    };
}

export function truncateEmbed(embed: APIEmbed): APIEmbed {
    return {
        ...embed,
        description: embed.description
            ? ellipsis(embed.description, EMBED_DESCRIPTION_LIMIT)
            : undefined,
        title: embed.title
            ? ellipsis(embed.title, EMBED_TITLE_LIMIT)
            : undefined,
        author: embed.author
            ? {
                  ...embed.author,
                  name: ellipsis(embed.author.name, EMBED_AUTHOR_NAME_LIMIT),
              }
            : undefined,
        footer: embed.footer
            ? {
                  ...embed.footer,
                  text: ellipsis(embed.footer.text, EMBED_FOOTER_TEXT_LIMIT),
              }
            : undefined,
        fields: embed.fields
            ? embed.fields
                  .map((field) => ({
                      ...field,
                      name: ellipsis(field.name, EMBED_FIELD_NAME_LIMIT),
                      value: ellipsis(field.value, EMBED_FIELD_VALUE_LIMIT),
                  }))
                  .slice(0, EMBED_FIELD_LIMIT)
            : [],
    } as const;
}
