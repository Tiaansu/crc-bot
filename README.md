# crc-bot

CRC Bot is a Discord bot made for my friend's roblox community. It is a Grow A Garden stock bot with few moderation features. It is written in Typescript with Sapphirejs and Bun. It uses Supabase, PostgreSQL and Drizzle for the database. It also uses Docker to run the bot.

## How-to-run
1. Install bun if you don't have it yet.
2. Install dependencies
```
bun install
```
3. Run
```
bun start # or bun dev
```

## Environment variables
```env
BOT_OWNER_IDS="" # A comma separated string of discord user ids
SERVER_ADMIN_IDS="" # A comma separated string of discord user ids

GUILD_ID=""
TRADING_CHANNEL_ID=""
LOGS_CHANNEL_ID=""
WFL_LOUNGE_CHANNEL_ID=""

DISCORD_TOKEN=""
DISCORD_WEBHOOK="" # Used to log errors

DATABASE_URL=""

JSTUDIO_API_KEY="" # https://api.joshlei.com/
```
