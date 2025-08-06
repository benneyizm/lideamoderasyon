const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sıfırla')
    .setDescription('Bir kullanıcının mesaj ve ses süresi verilerini sıfırlar.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Verileri sıfırlanacak kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Sıfırlama sebebi')
        .setRequired(true)),
  
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak için yetkin yok!', ephemeral: true });
    }

    const user = interaction.options.getUser('kullanıcı');
    const reason = interaction.options.getString('sebep');

    let data;
    try {
      data = JSON.parse(fs.readFileSync('./stock.json', 'utf8'));
    } catch {
      data = {};
    }

    data[user.id] = { messages: 0, voiceTime: 0 };

    fs.writeFileSync('./stock.json', JSON.stringify(data, null, 2));

    const logChannelId = 'LOG_CHANNEL_ID'; // Kendi log kanal ID'n ile değiştir veya boş bırak
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('Veri Sıfırlama')
        .setColor('Red')
        .addFields(
          { name: 'Kullanıcı', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Sebep', value: reason, inline: true },
          { name: 'Sıfırlayan', value: interaction.user.tag, inline: true },
          { name: 'Tarih', value: new Date().toLocaleString() }
        );
      logChannel.send({ embeds: [embed] });
    }

    interaction.reply({ content: `${user.tag} kullanıcısının verileri sıfırlandı. Sebep: ${reason}`, ephemeral: true });
  }
};
