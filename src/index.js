const Discord = require('discord.js');
const config = require('../config.json');
const client = new Discord.Client();

client.login(config.BOT_TOKEN);
const prefix = '!';

const waitForAnswer = (message, filter) =>
  message.channel
    .awaitMessages(filter, {
      max: 1,
      time: 50000,
    })
    .catch(() => {
      message.author.send('Timeout');
    });

async function askQuestion(message, questionStr, filter) {
  const questionMessage = await message.author.send(questionStr);
  const collected = await waitForAnswer(questionMessage, filter);
  const answer = collected.first().content;
  return answer;
}

client.on('message', async function (message) {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    message.reply(
      'Voici les fonctions que tu peux lancer :\n - !help\n - !event',
    );
  } else if (command === 'event') {
    const filter = (collected) => collected.author.id === message.author.id;
    const title = await askQuestion(
      message,
      'Dis moi le titre de ton event',
      filter,
    );
    const date = await askQuestion(
      message,
      'Dis moi la date de ton event (yyyy-MM-dd)',
      filter,
    );
    const rolesStr = await askQuestion(
      message,
      'Donne moi les roles que tu souhaites demander (role1/role2/role3)',
      filter,
    );
    const roles = rolesStr.split('/');
    const eventEmbed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(title)
      // .setURL('https://discord.js.org/')
      .setAuthor(message.author.username)
      // .setDescription('Some description here')
      // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
      // .setTimestamp()
      .setFooter(`Date de l'event ${new Date(date).toLocaleDateString()}`);
    roles.forEach((role) => {
      eventEmbed.addField(role, "Pas encore d'inscrits");
    });
    const eventMessage = await message.reply(eventEmbed);

    // Handle signing up through the reactions
    const responseCollector = eventMessage.createReactionCollector((reaction) =>
      ['1️⃣', '2️⃣', '3️⃣'].includes(reaction.emoji.name),
    );
    responseCollector.on('collect', async (reaction) => {
      let roleIndex;
      switch (reaction.emoji.name) {
        case '1️⃣': {
          roleIndex = 0;
          break;
        }
        case '2️⃣': {
          roleIndex = 1;
          break;
        }
        case '3️⃣': {
          roleIndex = 2;
          break;
        }

        default: {
          console.error(
            `Unrecognised non-filtered reaction used: '${reaction}'`,
          );
        }
      }
      const eventReactionList = eventMessage.reactions.resolve(reaction);

      // Update role field
      const usersWithRole = await eventReactionList.users.fetch();
      const usersWithRoleNameList = usersWithRole
        .mapValues((user) => user.username)
        .array()
        .join(', ');

      // Replace previous field with a new field
      const previousRoleField = eventEmbed.fields[roleIndex];
      eventEmbed.spliceFields(roleIndex, 1, {
        name: previousRoleField.name,
        value: usersWithRoleNameList,
      });

      // Replace embed with new content
      await eventMessage.edit(eventEmbed);
    });
  }
});
