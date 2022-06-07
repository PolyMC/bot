import { MessageEmbed } from 'discord.js';
const reg = /https\:\/\/mclo.gs\/.*/g;

type analyzer = (text: string) => Array<string> | null;
const javaAnalyzer: analyzer = (text) => {
  if (text.includes('This instance is not compatible with Java version')) {
    const xp =
      /Please switch to one of the following Java versions for this instance:[\r\n]+([^\r\n]+)/g;

    let ver: string;
    const m = text.match(xp);
    if (!m || !m[0]) {
      ver = '';
    } else {
      ver = m[0].split('\n')[1];
    }

    return [
      'WrongJavaVersion',
      `Please switch to the following: \`${ver}\`\nFor more information, type \`!java\``,
    ];
  }
  return null;
};

const analyzers: analyzer[] = [javaAnalyzer];

export async function parseLog(s: string): Promise<MessageEmbed | null> {
  const r = s.match(reg);
  if (r == null || !r[0]) return null;
  const link = r[0]; // for now only first url
  const id = link.replace('https://mclo.gs/', '');
  if (!id) return null;
  const apiUrl = 'https://api.mclo.gs/1/raw/' + id;
  let log: string;
  try {
    const f = await fetch(apiUrl);
    if (f.status != 200) {
      throw 'nope';
    }
    log = await f.text();
  } catch (_) {
    return null;
  }
  const embed = new MessageEmbed()
    .setTitle('Log analyzer')
    .setColor('DARK_GREEN')
    .setDescription(`Analyzing ${link} [${apiUrl}] [ID: ${id}]`);
  for (let i in analyzers) {
    const analyzer = analyzers[i];
    const out = analyzer(log);
    if (out) embed.addField(out[0], out[1]);
  }
  if (embed.fields[0]) return embed;
  else {
    embed.addField('Analyze failed', 'No issues found automatically');
    return embed;
  }
}
