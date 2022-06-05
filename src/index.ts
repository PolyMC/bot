import {
  Client,
  Intents,
  Message,
  MessageEmbed,
  MessageEmbedOptions,
} from 'discord.js';

import * as BuildConfig from './constants';
import { filterMessage } from './filters';
import { green, bold, blue, underline, yellow } from 'kleur/colors';
import * as parser from 'discord-command-parser';
import fs from 'fs';
import path, { dirname } from 'path';
import { SuccessfulParsedMessage } from 'discord-command-parser';
import dotenv from 'dotenv';
dotenv.config();

export interface Command {
  name: string;
  aliases?: Array<string>;
  desc?: string;
  examples?: Array<string>;
  exec(
    m: Message,
    p: SuccessfulParsedMessage<Message<boolean>>
  ): Promise<Message> | Promise<any> | any;
}

type Commands = Array<Command>;
export let commands: Commands = [];

interface Tag {
  name: string;
  aliases?: Array<string>;
  text?: string;
  embed?: MessageEmbedOptions;
}

type Tags = Array<Tag>;
export const tags: Tags = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tags.json'), 'utf8')
);

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_BANS,
  ],
});

const dir = fs.readdirSync(path.join(__dirname, '/commands'));
for (const i in dir) {
  const cmdName = dir[i];
  const cmd: Command = require(path.join(__dirname, '/commands/', cmdName)).cmd;
  commands.push(cmd);
}

client.once('ready', async () => {
  console.log(green('Discord bot ready!'));

  if (process.env.NODE_ENV !== 'development')
    console.warn(yellow(bold('Running in production mode!')));

  console.log(
    'Invite link:',
    blue(
      underline(
        client.generateInvite({
          scopes: ['bot'],
          permissions: ['ADMINISTRATOR'],
        })
      )
    )
  );

  const POLYMC_GUILD = await client.guilds.fetch(BuildConfig.GUILD_ID);

  client.on('messageCreate', async (e) => {
    if (!e.content) return;
    if (!e.channel.isText()) return;
    if (e.author === client.user) return;

    if (
      process.env.NODE_ENV === 'development' &&
      e.channelId !== BuildConfig.DEBUG_CHANNEL_ID
    ) {
      return;
    } else if (
      process.env.NODE_ENV !== 'development' &&
      e.channelId === BuildConfig.DEBUG_CHANNEL_ID
    ) {
      return;
    }

    const filtered = await filterMessage(e);
    if (!filtered) {
      return;
    }

    const parsed = parser.parse(e, '!', {
      allowBots: true,
    });

    if (!parsed.success) return;
    const cmd = commands.find(
      (c) => c.name == parsed.command || c.aliases?.includes(parsed.command)
    );

    if (!cmd) {
      const tag = tags.find(
        (t) => t.name == parsed.command || t.aliases?.includes(parsed.command)
      );
      if (tag) {
        if (tag.text) {
          e.reply(tag.text);
          return;
        } else if (tag.embed) {
          const em = new MessageEmbed(tag.embed);
          e.reply({ embeds: [em] });
          return;
        }
      }
      return;
    }
    try {
      await cmd.exec(e, parsed);
    } catch (err: any) {
      // ts moment
      const em = new MessageEmbed()
        .setTitle('Error')
        .setColor('RED')
        .setDescription(err);
      e.reply({ embeds: [em] });
    }
  });
});

client.login(process.env.DISCORD_TOKEN);
