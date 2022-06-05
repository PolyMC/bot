import * as BuildConfig from './constants';
import { Message } from 'discord.js';
<<<<<<< HEAD
=======
import Filter from 'bad-words';
>>>>>>> 46c9f4cecf92728e4bdb4b5b71d1948e4d7b7702
import { isBad } from './badLinks';
import urlRegex from 'url-regex';

// true if message is ok, false if filtered
export async function filterMessage(e: Message): Promise<boolean> {
  // url matcher
  const urlMatches = [...e.content.matchAll(urlRegex())];

  if (urlMatches.length) {
    console.log('Found links in message from', e.author.tag);

    for (const match of urlMatches) {
      console.log('[link]', match[0]);
      if (await isBad(match[0])) {
        await e.reply({
          embeds: [
            {
              title: 'Hold on!',
              description:
                'There seems to be a phishing / malware link in your message.',
              color: 'RED',
            },
          ],
        });

        return false;
      }
    }
  }

  return true;
}
