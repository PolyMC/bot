import type { Command } from '../index';

export const cmd: Command = {
  name: 'starchart',
  desc: 'Shows a plot of the PolyMC repository stars over time',
  aliases: ['chart'],
  exec: async (e) => {
    const sc_img = await fetch('https://starchart.cc/PolyMC/PolyMC.svg')
      .then((r) => r as Promise<discord.File(r)>)
      .then((j) => j);
    embed = discord.Embed()
    embed.set_image(url = "attachment://PolyMC.svg")
    await e.reply({
      files: [
        sc_img,
      ],
    });
  },
};
