    require('dotenv').config();
    const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
    const express = require('express');
    const app = express();

    app.get('/', (req, res) => {
    res.send('Bot aktif!');
    });

    app.listen(3000, () => {
    console.log('Uptime için web sunucusu çalışıyor.');
    });
    const { joinVoiceChannel } = require('@discordjs/voice');
    const fs = require('fs');
    const path = require('path');
    const https = require('https');
    const istatistikPath = path.join(__dirname, 'istatistik.json');
    let istatistik = {};
    if (fs.existsSync(istatistikPath)) {
        istatistik = JSON.parse(fs.readFileSync(istatistikPath, 'utf8'));
    }

    // Çekiliş verilerini saklamak için
    const cekilisPath = path.join(__dirname, 'cekilis.json');
    let cekilisVerileri = {};
    if (fs.existsSync(cekilisPath)) {
        cekilisVerileri = JSON.parse(fs.readFileSync(cekilisPath, 'utf8'));
    }

    function saveCekilis() {
        fs.writeFileSync(cekilisPath, JSON.stringify(cekilisVerileri, null, 2));
    }

    // Davet istatistiklerini saklamak için
    const davetPath = path.join(__dirname, 'davet.json');
    let davetVerileri = {};
    if (fs.existsSync(davetPath)) {
        davetVerileri = JSON.parse(fs.readFileSync(davetPath, 'utf8'));
    }

    function saveDavet() {
        fs.writeFileSync(davetPath, JSON.stringify(davetVerileri, null, 2));
    }
    function saveStats() {
        fs.writeFileSync(istatistikPath, JSON.stringify(istatistik, null, 2));
    }

    // Ticket sistemi fonksiyonları
    async function createTicket(interaction, category = 'Genel') {
        const guild = interaction.guild;
        const user = interaction.user;
        
        // Kullanıcının zaten açık ticket'ı var mı kontrol et
        if (activeTickets.has(user.id)) {
            return interaction.reply({ 
                content: '❌ Zaten açık bir ticket\'ın var! Mevcut ticket\'ını kullan.', 
                ephemeral: true 
            });
        }
        
        try {
            // Kategori bilgilerini belirle
            let categoryInfo = {
                emoji: '🎫',
                color: '#00ff00',
                description: 'Genel destek talebi',
                requirements: 'Sorununuzu detaylı açıklayın'
            };
            
            switch(category) {
                case 'Kullanıcı Şikayet':
                    categoryInfo = {
                        emoji: '👤',
                        color: '#e74c3c',
                        description: 'Kullanıcılar hakkında şikayet bildirimleri',
                        requirements: 'Şikayet ettiğiniz kullanıcının adını ve şikayet nedenini detaylı açıklayın'
                    };
                    break;
                case 'Öneriler':
                    categoryInfo = {
                        emoji: '💡',
                        color: '#9b59b6',
                        description: 'Sunucu geliştirme önerileri ve öneriler',
                        requirements: 'Önerinizi detaylı bir şekilde açıklayın'
                    };
                    break;
                case 'Çekiliş Ödülü':
                    categoryInfo = {
                        emoji: '🎁',
                        color: '#f39c12',
                        description: 'Çekiliş ödüllerini almak için destek',
                        requirements: 'Çekiliş adını ve kazandığınız ödülü belirtin'
                    };
                    break;
                case 'Diğer':
                    categoryInfo = {
                        emoji: '📝',
                        color: '#95a5a6',
                        description: 'Diğer konular için destek',
                        requirements: 'Sorununuzu detaylı bir şekilde belirtiniz'
                    };
                    break;
            }
            
            // Ticket kanalı oluştur
            const permissionOverwrites = [
                {
                    id: guild.id, // @everyone
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id, // Ticket açan kullanıcı
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: supportRoleID, // Destek ekibi
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages,
                    ],
                },
            ];

            // Kullanıcı Şikayet kategorisi için özel izin ekle
            if (category === 'Kullanıcı Şikayet') {
                permissionOverwrites.push({
                    id: '1400120284916351137', // Özel kullanıcı ID'si
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                });
            }

            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: ticketCategoryID,
                permissionOverwrites: permissionOverwrites,
            });
            
            // Ticket'ı aktif listeye ekle
            activeTickets.set(user.id, ticketChannel.id);
            
            // Hoş geldin embed'i oluştur
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`${categoryInfo.emoji} ${category} Ticket`)
                .setDescription(`Merhaba **${user.tag}**!\n\n**Kategori:** ${category}\n**Açıklama:** ${categoryInfo.description}\n\n**Gereksinimler:** ${categoryInfo.requirements}\n\n**Lütfen sorununuzu detaylı bir şekilde açıklayın.**`)
                .setColor(categoryInfo.color)
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });
            
            // Kapatma butonu
            const closeButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Ticket\'ı Kapat')
                        .setStyle(ButtonStyle.Danger)
                );
            
            await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeButton] });
            
            // Kullanıcıya onay mesajı gönder
            await interaction.reply({ 
                content: `✅ ${category} ticket'ı başarıyla oluşturuldu! <#${ticketChannel.id}>`, 
                ephemeral: true 
            });
            
            // Destek ekibine bildirim gönder
            const notificationEmbed = new EmbedBuilder()
                .setTitle('🆕 Yeni Ticket')
                .setDescription(`**${user.tag}** tarafından **${category}** kategorisinde yeni bir ticket açıldı.\n\n**Kanal:** <#${ticketChannel.id}>\n**Kategori:** ${category}`)
                .setColor(categoryInfo.color)
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });
            
            await ticketChannel.send({ 
                content: `<@&${supportRoleID}>`, 
                embeds: [notificationEmbed] 
            });
            
        } catch (error) {
            console.error('Ticket oluşturma hatası:', error);
            await interaction.reply({ 
                content: '❌ Ticket oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 
                ephemeral: true 
            });
        }
    }

    async function closeTicket(interaction, reason = 'Sebep belirtilmedi') {
        const channel = interaction.channel;
        const user = interaction.user;
        
        // Bu kanalın bir ticket olduğunu kontrol et
        if (!channel.name.startsWith('ticket-')) {
            return interaction.reply({ 
                content: '❌ Bu kanal bir ticket kanalı değil!', 
                ephemeral: true 
            });
        }
        
        try {
            // Kapatma embed'i oluştur
            const closeEmbed = new EmbedBuilder()
                .setTitle('🔒 Ticket Kapatıldı')
                .setDescription(`Bu ticket **${user.tag}** tarafından kapatıldı.\n\n**Sebep:** ${reason}`)
                .setColor('#ff0000')
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });
            
            await channel.send({ embeds: [closeEmbed] });
            
            // 5 saniye sonra kanalı sil
            setTimeout(async () => {
                try {
                    await channel.delete();
                    
                    // Aktif ticket listesinden kaldır
                    for (const [userId, channelId] of activeTickets.entries()) {
                        if (channelId === channel.id) {
                            activeTickets.delete(userId);
                            break;
                        }
                    }
                } catch (error) {
                    console.error('Ticket kanalı silinirken hata:', error);
                }
            }, 5000);
            
            await interaction.reply({ 
                content: '✅ Ticket 5 saniye sonra kapatılacak.', 
                ephemeral: true 
            });
            
        } catch (error) {
            console.error('Ticket kapatma hatası:', error);
            await interaction.reply({ 
                content: '❌ Ticket kapatılırken bir hata oluştu.', 
                ephemeral: true 
            });
        }
    }

    const TOKEN = process.env.DISCORD_TOKEN;
    const CLIENT_ID = process.env.CLIENT_ID;
    const GUILD_ID = process.env.GUILD_ID;
    const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

    // Ticket sistemi için değişkenler
    const ticketCategoryID = process.env.TICKET_CATEGORY_ID || '1398603908112322602'; // Ticket kategorisi ID'si
    const supportRoleID = process.env.SUPPORT_ROLE_ID || '1401227942498930760'; // Destek ekibi rolü ID'si
    const activeTickets = new Map(); // Aktif ticket'ları takip etmek için

    const commands = [
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Bir kullanıcıyı sunucudan banlar.')
            .addUserOption(option => option.setName('kullanici').setDescription('Banlanacak kullanıcı').setRequired(true))
            .addStringOption(option => option.setName('sebep').setDescription('Ban sebebi').setRequired(false)),
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Bir kullanıcıyı sunucudan atar.')
            .addUserOption(option => option.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true))
            .addStringOption(option => option.setName('sebep').setDescription('Atılma sebebi').setRequired(false)),
        new SlashCommandBuilder()
            .setName('sil')
            .setDescription('Belirtilen kadar mesajı siler.')
            .addIntegerOption(option => option.setName('miktar').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true)),
        new SlashCommandBuilder()
            .setName('cekilis')
            .setDescription('Çekiliş başlatır.')
            .addStringOption(option => option.setName('sure').setDescription('Çekiliş süresi (örn: 10s, 5m, 1h)').setRequired(true))
            .addStringOption(option => option.setName('odul').setDescription('Çekiliş ödülü').setRequired(true)),
        new SlashCommandBuilder()
            .setName('status')
            .setDescription('Botun durumunu değiştirir.')
            .addStringOption(option =>
                option.setName('durum')
                    .setDescription('Durum seç (online, idle, dnd, invisible)')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Çevrimiçi', value: 'online' },
                        { name: 'Boşta', value: 'idle' },
                        { name: 'Rahatsız Etmeyin', value: 'dnd' },
                        { name: 'Görünmez', value: 'invisible' }
                    )
            ),
        new SlashCommandBuilder()
            .setName('yardim')
            .setDescription('Tüm komutların açıklamalarını gösterir.'),
        new SlashCommandBuilder()
            .setName('timeout')
            .setDescription('Bir kullanıcıya belirli bir süre timeout (susturma) uygular.')
            .addUserOption(option => option.setName('kullanici').setDescription('Timeout uygulanacak kullanıcı').setRequired(true))
            .addStringOption(option => option.setName('sure').setDescription('Süre (örn: 10s, 5m, 1h, 1d)').setRequired(true)),
        new SlashCommandBuilder()
            .setName('rololustur')
            .setDescription('Yeni bir rol oluşturur.')
            .addStringOption(option => option.setName('isim').setDescription('Rol ismi').setRequired(true))
            .addStringOption(option => option.setName('renk').setDescription('Rol rengi (hex, örn: #ff0000)').setRequired(false)),
        new SlashCommandBuilder()
            .setName('toplurol')
            .setDescription('Belirtilen rolü sunucudaki herkese verir.')
            .addRoleOption(option => option.setName('rol').setDescription('Verilecek rol').setRequired(true)),
        new SlashCommandBuilder()
            .setName('kilitle')
            .setDescription('Bulunduğun kanalı kilitler (herkesin mesaj atmasını engeller).'),
        new SlashCommandBuilder()
            .setName('kilitaç')
            .setDescription('Bulunduğun kanalı açar (herkes mesaj atabilir).'),
        new SlashCommandBuilder()
            .setName('profil')
            .setDescription('Kullanıcı istatistiklerini gösterir.')
            .addUserOption(option => option.setName('kullanici').setDescription('Profilini görmek istediğin kullanıcı').setRequired(false)),
        new SlashCommandBuilder()
            .setName('sifirla')
            .setDescription('Kullanıcının istatistiklerini sıfırlar.')
            .addUserOption(option => option.setName('kullanici').setDescription('İstatistikleri sıfırlanacak kullanıcı').setRequired(true))
            .addStringOption(option => option.setName('sebep').setDescription('Sıfırlama sebebi').setRequired(false)),
        new SlashCommandBuilder()
            .setName('untimeout')
            .setDescription('Kullanıcının timeoutunu kaldırır.')
            .addUserOption(option => option.setName('kullanici').setDescription('Timeoutu kaldırılacak kullanıcı').setRequired(true)),
        new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Kullanıcının banını kaldırır.')
            .addUserOption(option => option.setName('kullanici').setDescription('Banı kaldırılacak kullanıcı').setRequired(true)),
        new SlashCommandBuilder()
            .setName('yazitura')
            .setDescription('Yazı tura atar.'),
        new SlashCommandBuilder()
            .setName('slowmode')
            .setDescription('Kanalın slowmode süresini ayarlar.')
            .addIntegerOption(option => option.setName('saniye').setDescription('Slowmode süresi (0-21600 saniye)').setRequired(true)),
        new SlashCommandBuilder()
            .setName('sayisifirla')
            .setDescription('Sayı saymaca oyununu sıfırlar.'),
        new SlashCommandBuilder()
            .setName('kelimesifirla')
            .setDescription('Kelime türetmece oyununu sıfırlar.'),
        new SlashCommandBuilder()
            .setName('ticket-setup')
            .setDescription('Ticket sistemi kurulum mesajını gönderir.'),
        new SlashCommandBuilder()
            .setName('ticket-close')
            .setDescription('Aktif ticket kanalını kapatır.')
            .addStringOption(option => option.setName('sebep').setDescription('Kapatma sebebi').setRequired(false)),
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Botun ping değerini gösterir.'),
        new SlashCommandBuilder()
            .setName('reroll')
            .setDescription('Çekiliş için yeni kazanan seçer.')
            .addStringOption(option => option.setName('mesaj_id').setDescription('Çekiliş mesajının ID\'si (boş bırakırsan son çekiliş kullanılır)').setRequired(false)),
        new SlashCommandBuilder()
            .setName('sunucu-bilgi')
            .setDescription('Sunucu hakkında detaylı bilgileri gösterir.'),
        new SlashCommandBuilder()
            .setName('ship')
            .setDescription('İki kullanıcı arasındaki uyumu ölçer.')
            .addUserOption(option => option.setName('kullanici').setDescription('Ship yapılacak kullanıcı (boş bırakırsan rastgele seçilir)').setRequired(false)),
        new SlashCommandBuilder()
            .setName('renk-rol')
            .setDescription('Renk rolleri sistemini aktif eder.')
            .addChannelOption(option => option.setName('kanal').setDescription('Renk rolleri kanalı').setRequired(true)),
        new SlashCommandBuilder()
            .setName('kayıt-setup')
            .setDescription('Kayıt sistemi kurulum mesajını gönderir.')
            .addChannelOption(option => option.setName('kanal').setDescription('Kayıt kanalı').setRequired(true)),
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    (async () => {
        try {
            console.log('Slash komutları yükleniyor...');
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands },
            );
            console.log('Slash komutları başarıyla yüklendi!');
        } catch (error) {
            console.error(error);
        }
    })();

    function parseTime(str) {
        // Kısa format: 20s, 5m, 2h, 1d
        let match = str.match(/^([0-9]+)(s|m|h|d)$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            if (unit === 's') return value * 1000;
            if (unit === 'm') return value * 60 * 1000;
            if (unit === 'h') return value * 60 * 60 * 1000;
            if (unit === 'd') return value * 24 * 60 * 60 * 1000;
            return null;
        }
        
        // Uzun format: 20 saniye, 5 dakika, 2 saat, 1 gün
        match = str.match(/^([0-9]+)\s*(saniye|dakika|saat|gün)$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            if (unit === 'saniye') return value * 1000;
            if (unit === 'dakika') return value * 60 * 1000;
            if (unit === 'saat') return value * 60 * 60 * 1000;
            if (unit === 'gün') return value * 24 * 60 * 60 * 1000;
            return null;
        }
        
        return null;
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMessageReactions
        ],
        partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER']
    });

    client.on('ready', async () => {
        console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
        
        // Reaksiyon cache'ini temizle
        client.channels.cache.forEach(channel => {
            if (channel.messages) {
                channel.messages.cache.forEach(message => {
                    message.reactions.cache.clear();
                });
            }
        });
        
        // Türkçe kelime listesini yükle
        console.log('🔄 Türkçe kelime listesi yükleniyor...');
        await turkceKelimeleriYukle();
        
        try {
            const guild = await client.guilds.fetch(GUILD_ID);
            const channel = await guild.channels.fetch(VOICE_CHANNEL_ID);
            if (channel && channel.type === 2) { // 2 = GUILD_VOICE
                joinVoiceChannel({
                    channelId: channel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: false
                });
                console.log('Bot sesli kanala katıldı.');
            } else {
                console.log('Sesli kanal bulunamadı veya tip yanlış.');
            }
        } catch (err) {
            console.error('Bot sesli kanala katılamadı:', err);
        }
        
        // Bot aktivitesini ayarla
        client.user.setActivity("Lidea Moderasyon /yardim", {
            type: 1,
            url: "https://www.twitch.tv/benneyiminyo"
        });
    });

    client.on('interactionCreate', async interaction => {
        // Button interaction handler
        if (interaction.isButton()) {
            const buttonId = interaction.customId;
            
            if (buttonId.startsWith('renk_')) {
                const renkRolleri = {
                    'renk_kirmizi': { name: 'Kırmızı', color: '#ff0000', id: '1402566760754053200' },
                    'renk_yesil': { name: 'Yeşil', color: '#00ff00', id: '1402566698309255248' },
                    'renk_mavi': { name: 'Mavi', color: '#3498db', id: '1402566550283882517' },
                    'renk_sari': { name: 'Sarı', color: '#ffff00', id: '1402566554561810522' },
                    'renk_mor': { name: 'Mor', color: '#800080', id: '1402566316338053220' },
                    'renk_turuncu': { name: 'Turuncu', color: '#ffa500', id: '1402566312147947551' },
                    'renk_beyaz': { name: 'Beyaz', color: '#ffffff', id: '1402566321048125500' },
                    'renk_kahverengi': { name: 'Kahverengi', color: '#8b4513', id: '1402565741689045064' },
                    'renk_pembe': { name: 'Pembe', color: '#ff69b4', id: '1402565751906238514' }
                };

                const renk = renkRolleri[buttonId];
                if (renk) {
                    try {
                        const guild = interaction.guild;
                        const member = interaction.member;
                        
                        // Önce eski renk rollerini kaldır
                        const eskiRenkRolleri = Object.values(renkRolleri).map(r => r.id);
                        for (const rolId of eskiRenkRolleri) {
                            const rol = guild.roles.cache.get(rolId);
                            if (rol && member.roles.cache.has(rol.id)) {
                                await member.roles.remove(rol);
                            }
                        }
                        
                        // Yeni rolü ekle
                        const rol = guild.roles.cache.get(renk.id);
                        if (rol) {
                            await member.roles.add(rol);
                            
                            // Kullanıcıya DM gönder
                            try {
                                const embed = new EmbedBuilder()
                                    .setTitle('🎨 Renk Rolü Eklendi!')
                                    .setDescription(`**${renk.name}** rengi başarıyla eklendi!`)
                                    .setColor(renk.color)
                                    .setTimestamp()
                                    .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });
                                
                                await interaction.user.send({ embeds: [embed] });
                            } catch (error) {
                                // DM kapalıysa sessizce geç
                            }
                            
                            await interaction.reply({ content: `✅ **${renk.name}** rengi başarıyla eklendi!`, ephemeral: true });
                        } else {
                            await interaction.reply({ content: `❌ Rol bulunamadı: ${renk.name}`, ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Renk rolü eklenirken hata:', error);
                        await interaction.reply({ content: '❌ Rol eklenirken bir hata oluştu!', ephemeral: true });
                    }
                }
                return;
            }
            
            if (buttonId.startsWith('kayit_')) {
                const cinsiyetRolleri = {
                    'kayit_erkek': { name: 'Erkek', id: '1400903855889322124' },
                    'kayit_kadin': { name: 'Kadın', id: '1400780419137409095' }
                };
                
                const kayitsizRolId = '1400780414335057991';

                const cinsiyet = cinsiyetRolleri[buttonId];
                if (cinsiyet) {
                    try {
                        const guild = interaction.guild;
                        const member = interaction.member;
                        
                        // Önce eski cinsiyet rollerini kaldır
                        const eskiCinsiyetRolleri = Object.values(cinsiyetRolleri).map(r => r.id);
                        for (const rolId of eskiCinsiyetRolleri) {
                            const rol = guild.roles.cache.get(rolId);
                            if (rol && member.roles.cache.has(rol.id)) {
                                await member.roles.remove(rol);
                            }
                        }
                        
                        // Kayıtsız rolünü kaldır
                        const kayitsizRol = guild.roles.cache.get(kayitsizRolId);
                        if (kayitsizRol && member.roles.cache.has(kayitsizRol.id)) {
                            await member.roles.remove(kayitsizRol);
                        }
                        
                        // Yeni rolü ekle
                        const rol = guild.roles.cache.get(cinsiyet.id);
                        if (rol) {
                            await member.roles.add(rol);
                            
                            // Kullanıcıya DM gönder
                            try {
                                const embed = new EmbedBuilder()
                                    .setTitle('👤 Kayıt Tamamlandı!')
                                    .setDescription(`**${cinsiyet.name}** rolü başarıyla eklendi!\nKayıtsız rolü kaldırıldı.`)
                                    .setColor(0x00BFFF)
                                    .setTimestamp()
                                    .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });
                                
                                await interaction.user.send({ embeds: [embed] });
                            } catch (error) {
                                // DM kapalıysa sessizce geç
                            }
                            
                            await interaction.reply({ content: `✅ **${cinsiyet.name}** rolü başarıyla eklendi!\nKayıtsız rolü kaldırıldı.`, ephemeral: true });
                        } else {
                            await interaction.reply({ content: `❌ Rol bulunamadı: ${cinsiyet.name}`, ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Cinsiyet rolü eklenirken hata:', error);
                        await interaction.reply({ content: '❌ Rol eklenirken bir hata oluştu!', ephemeral: true });
                    }
                }
                return;
            }
            
            // Ticket butonları
            if (buttonId === 'create_ticket') {
                await createTicket(interaction);
                return;
            }

            if (buttonId === 'ticket_hesap') {
                await createTicket(interaction, 'Kullanıcı Şikayet');
                return;
            }

            if (buttonId === 'ticket_oneri') {
                await createTicket(interaction, 'Öneriler');
                return;
            }

            if (buttonId === 'ticket_cekilis') {
                await createTicket(interaction, 'Çekiliş Ödülü');
                return;
            }

            if (buttonId === 'ticket_diger') {
                await createTicket(interaction, 'Diğer');
                return;
            }

            if (buttonId === 'close_ticket') {
                await closeTicket(interaction);
                return;
            }
        }
        
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === 'ban') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
                return interaction.reply({ content: 'Ban yetkin yok!', ephemeral: true });
            const user = interaction.options.getUser('kullanici');
            const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
            await member.ban({ reason });
            interaction.reply(`${user.tag} banlandı! Sebep: ${reason}`);
        }

        if (interaction.commandName === 'kick') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
                return interaction.reply({ content: 'Kick yetkin yok!', ephemeral: true });
            const user = interaction.options.getUser('kullanici');
            const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
            await member.kick(reason);
            interaction.reply(`${user.tag} atıldı! Sebep: ${reason}`);
        }

        if (interaction.commandName === 'sil') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
                return interaction.reply({ content: 'Mesaj silme yetkin yok!', ephemeral: true });
            const amount = interaction.options.getInteger('miktar');
            if (amount < 1 || amount > 100)
                return interaction.reply({ content: '1 ile 100 arasında bir sayı gir!', ephemeral: true });
            const deleted = await interaction.channel.bulkDelete(amount, true);
            interaction.reply({ content: `${deleted.size} mesaj silindi!`, ephemeral: true });
        }

        if (interaction.commandName === 'cekilis') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }

            const sure = interaction.options.getString('sure');
            const odul = interaction.options.getString('odul');
            const zaman = parseTime(sure);

            if (!zaman) {
                return interaction.reply({ content: '❌ Geçerli süre gir (örnek: 10s, 5m, 1h veya 10 saniye, 5 dakika, 2 saat)', ephemeral: true });
            }

            const embed = {
                title: '🎉 Çekiliş Başladı! 🎉',
                description: `Ödül: **${odul}**\nSüre: **${sure}**\n🎉 ile katıl!`,
                color: 0x3498db,
                timestamp: new Date(Date.now() + zaman)
            };

            const msg = await interaction.channel.send({ embeds: [embed] });
            await msg.react('🎉');

            // Çekiliş verilerini sakla
            cekilisVerileri[interaction.guildId] = {
                messageId: msg.id,
                channelId: interaction.channelId,
                odul: odul,
                sure: sure,
                baslangicZamani: Date.now(),
                bitisZamani: Date.now() + zaman
            };
            saveCekilis();

            await interaction.reply({ content: `Çekiliş başlatıldı! [Mesajı görmek için tıkla.](${msg.url})`, ephemeral: true });

            setTimeout(async () => {
                const m = await interaction.channel.messages.fetch(msg.id);
                const reaction = m.reactions.cache.get('🎉');
                if (!reaction) return interaction.channel.send('❌ Katılım olmadı, çekiliş iptal edildi.');

                const users = (await reaction.users.fetch()).filter(u => !u.bot).map(u => u.id);
                if (users.length < 1) return interaction.channel.send('❌ Katılım olmadı, çekiliş iptal edildi.');

                const winner = users[Math.floor(Math.random() * users.length)];
                interaction.channel.send(`🎉 Tebrikler <@${winner}>! **${odul}** kazandın!`);

                // Kazanana DM gönder
                try {
                    const user = await interaction.client.users.fetch(winner);
                    user.send(`🎉 Tebrikler! **${interaction.guild.name}** sunucusundaki çekilişi kazandınız lütfen sunucudan ticket açınız.\nÖdülünüz: **${odul}**`);
                } catch (e) {
                    console.log('DM gönderilemedi:', e.message);
                }
            }, zaman);
        }

        if (interaction.commandName === 'reroll') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }

            const mesajId = interaction.options.getString('mesaj_id');
            let targetMesajId = mesajId;
            let targetChannelId = interaction.channelId;

            // Eğer mesaj ID verilmemişse, son çekilişi kullan
            if (!targetMesajId) {
                const sonCekilis = cekilisVerileri[interaction.guildId];
                if (!sonCekilis) {
                    return interaction.reply({ content: '❌ Bu sunucuda henüz çekiliş yapılmamış!', ephemeral: true });
                }
                targetMesajId = sonCekilis.messageId;
                targetChannelId = sonCekilis.channelId;
            }
            
            try {
                const channel = await interaction.guild.channels.fetch(targetChannelId);
                const mesaj = await channel.messages.fetch(targetMesajId);
                const reaction = mesaj.reactions.cache.get('🎉');
                
                if (!reaction) {
                    return interaction.reply({ content: '❌ Bu mesajda çekiliş reaksiyonu bulunamadı!', ephemeral: true });
                }

                const users = (await reaction.users.fetch()).filter(u => !u.bot).map(u => u.id);
                
                if (users.length < 1) {
                    return interaction.reply({ content: '❌ Bu çekilişe katılım olmamış!', ephemeral: true });
                }

                const yeniKazanan = users[Math.floor(Math.random() * users.length)];
                
                const embed = new EmbedBuilder()
                    .setTitle('🎉 Yeni Kazanan! 🎉')
                    .setDescription(`**Yeni kazanan:** <@${yeniKazanan}>\n\nÇekiliş mesajı: [Tıkla](${mesaj.url})`)
                    .setColor(0x00ff00)
                    .setTimestamp()
                    .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });

                interaction.reply({ embeds: [embed], ephemeral: false });

                // Yeni kazananı DM'den bilgilendir
                try {
                    const user = await interaction.client.users.fetch(yeniKazanan);
                    user.send(`🎉 Tebrikler! **${interaction.guild.name}** sunucusundaki çekilişin yeni kazananı oldunuz!`);
                } catch (e) {
                    console.log('DM gönderilemedi:', e.message);
                }

            } catch (error) {
                if (!targetMesajId) {
                    return interaction.reply({ content: '❌ Son çekiliş mesajı bulunamadı!', ephemeral: true });
                } else {
                    return interaction.reply({ content: '❌ Mesaj bulunamadı veya geçersiz mesaj ID\'si!', ephemeral: true });
                }
            }
        }

        if (interaction.commandName === 'sunucu-bilgi') {
            const guild = interaction.guild;
            const owner = await guild.fetchOwner();
            const createdAt = new Date(guild.createdAt);
            const memberCount = guild.memberCount;
            const roleCount = guild.roles.cache.size;
            const channelCount = guild.channels.cache.size;
            const boostLevel = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount;
            const verificationLevel = guild.verificationLevel;
            const explicitContentFilter = guild.explicitContentFilter;

            // Tarih formatını Türkçe'ye çevir
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            const formattedDate = createdAt.toLocaleDateString('tr-TR', options);

            // Doğrulama seviyesini Türkçe'ye çevir
            const verificationLevels = {
                0: 'Yok',
                1: 'Düşük',
                2: 'Orta',
                3: 'Yüksek',
                4: 'Çok Yüksek'
            };

            // İçerik filtresi seviyesini Türkçe'ye çevir
            const contentFilterLevels = {
                0: 'Devre Dışı',
                1: 'Sadece Rolü Olmayan Üyeler',
                2: 'Tüm Üyeler'
            };

                    const embed = new EmbedBuilder()
                .setTitle(`📊 ${guild.name} Sunucu Bilgileri`)
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .setColor(0x3498db)
                .addFields(
                    { name: '👑 Sunucu Sahibi', value: `${owner.user.tag}`, inline: true },
                    { name: '📅 Oluşturulma Tarihi', value: formattedDate, inline: true },
                    { name: '🆔 Sunucu ID', value: guild.id, inline: true },
                    { name: '👥 Üye Sayısı', value: `${memberCount} üye`, inline: true },
                    { name: '🎭 Rol Sayısı', value: `${roleCount} rol`, inline: true },
                    { name: '📺 Kanal Sayısı', value: `${channelCount} kanal`, inline: true },
                    { name: '🚀 Boost Seviyesi', value: `Seviye ${boostLevel} (${boostCount} boost)`, inline: true },
                    { name: '🛡️ İçerik Filtresi', value: contentFilterLevels[explicitContentFilter] || 'Bilinmiyor', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });

            // Sunucu banner'ı varsa ekle
            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ size: 1024 }));
            }

            interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (interaction.commandName === 'renk-rol') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }

            const kanal = interaction.options.getChannel('kanal');
            
            // Renk rolleri embed'i oluştur
            const embed = new EmbedBuilder()
                .setTitle('🎨 Renk Rolleri')
                .setDescription('Aşağıdaki butonlara tıklayarak istediğiniz rengi seçebilirsiniz!\n\n**Mevcut Renkler:**')
                .setColor(0xFFD700)
                .addFields(
                    { name: '🔴 Kırmızı', value: 'Kırmızı renk rolü', inline: true },
                    { name: '🟢 Yeşil', value: 'Yeşil renk rolü', inline: true },
                    { name: '🔵 Mavi', value: 'Mavi renk rolü', inline: true },
                    { name: '🟡 Sarı', value: 'Sarı renk rolü', inline: true },
                    { name: '🟣 Mor', value: 'Mor renk rolü', inline: true },
                    { name: '🟠 Turuncu', value: 'Turuncu renk rolü', inline: true },
                    { name: '⚪ Beyaz', value: 'Beyaz renk rolü', inline: true },
                    { name: '🟤 Kahverengi', value: 'Kahverengi renk rolü', inline: true },
                    { name: '💖 Pembe', value: 'Pembe renk rolü', inline: true }
                )
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();



            // Hemen interaction'a yanıt ver
            try {
                await interaction.deferReply({ ephemeral: true });
            } catch (error) {
                console.error('Interaction defer hatası:', error);
            }
            
            // Renk butonlarını oluştur
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('renk_kirmizi')
                        .setLabel('🔴 Kırmızı')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('renk_yesil')
                        .setLabel('🟢 Yeşil')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('renk_mavi')
                        .setLabel('🔵 Mavi')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('renk_sari')
                        .setLabel('🟡 Sarı')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('renk_mor')
                        .setLabel('🟣 Mor')
                        .setStyle(ButtonStyle.Primary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('renk_turuncu')
                        .setLabel('🟠 Turuncu')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('renk_beyaz')
                        .setLabel('⚪ Beyaz')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('renk_kahverengi')
                        .setLabel('🟤 Kahverengi')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('renk_pembe')
                        .setLabel('💖 Pembe')
                        .setStyle(ButtonStyle.Primary)
                );

            // Renk rolleri mesajını oluştur
            const renkMesaji = await kanal.send({ 
                embeds: [embed], 
                components: [row1, row2] 
            });
            
            // Renk rolleri mesajını sakla (gelecekte kullanmak için)
            console.log(`Renk rolleri mesajı oluşturuldu: ${renkMesaji.id}`);
            
            // Interaction'a yanıt ver
            try {
                await interaction.editReply({ content: `✅ Renk rolleri sistemi ${kanal} kanalında aktif edildi!` });
            } catch (error) {
                console.error('Interaction edit reply hatası:', error);
                // Eğer interaction artık geçerli değilse, kanala mesaj gönder
                try {
                    await kanal.send('✅ Renk rolleri sistemi aktif edildi!');
                } catch (sendError) {
                    console.error('Kanal mesajı gönderilemedi:', sendError);
                }
            }
        }

        if (interaction.commandName === 'kayıt-setup') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }

            const kanal = interaction.options.getChannel('kanal');
            
            // Kayıt sistemi embed'i oluştur
            const embed = new EmbedBuilder()
                .setTitle('👤 Kayıt Sistemi')
                .setDescription('Aşağıdaki butonlara tıklayarak cinsiyetinizi seçebilirsiniz!\n\n**Cinsiyet Seçenekleri:**')
                .setColor(0x00BFFF)
                .addFields(
                    { name: '👨 Erkek', value: 'Erkek cinsiyeti seçildi.', inline: true },
                    { name: '👩 Kadın', value: 'Kadın cinsiyeti seçildi.', inline: true }
                )
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            // Hemen interaction'a yanıt ver
            try {
                await interaction.deferReply({ ephemeral: true });
            } catch (error) {
                console.error('Interaction defer hatası:', error);
            }
            
            // Cinsiyet butonlarını oluştur
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('kayit_erkek')
                        .setLabel('👨 Erkek')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('kayit_kadin')
                        .setLabel('👩 Kadın')
                        .setStyle(ButtonStyle.Primary)
                );

            // Kayıt mesajını oluştur
            const kayitMesaji = await kanal.send({ 
                embeds: [embed], 
                components: [row] 
            });
            
            // Kayıt mesajını sakla (gelecekte kullanmak için)
            console.log(`Kayıt sistemi mesajı oluşturuldu: ${kayitMesaji.id}`);
            
            // Interaction'a yanıt ver
            try {
                await interaction.editReply({ content: `✅ Kayıt sistemi ${kanal} kanalında aktif edildi!` });
            } catch (error) {
                console.error('Interaction edit reply hatası:', error);
                // Eğer interaction artık geçerli değilse, kanala mesaj gönder
                try {
                    await kanal.send('✅ Kayıt sistemi aktif edildi!');
                } catch (sendError) {
                    console.error('Kanal mesajı gönderilemedi:', sendError);
                }
            }
        }

        if (interaction.commandName === 'status') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const durum = interaction.options.getString('durum');
            client.user.setStatus(durum);
            try {
                await interaction.reply({ content: `Botun durumu \"${durum}\" olarak ayarlandı!`, ephemeral: true });
            } catch (error) {
                console.error('Status interaction reply hatası:', error);
            }
        }

        if (interaction.commandName === 'yardim') {
            const embed = new EmbedBuilder()
                .setTitle('📘 Komut Listesi')
                .setDescription(
                    '**GENEL KOMUTLAR**\n' +
                    '`/yardim` → Komut listesini gösterir\n' +
                    '`/ping` → Botun ping değerini gösterir\n' +
                    '`/profil [@kullanıcı]` → Profil görmeyi sağlar\n' +
                    '`/sunucu-bilgi` → Sunucu hakkında detaylı bilgileri gösterir\n\n' +

                    '**EĞLENCE KOMUTLARI**\n' +
                    '`/ship [@kullanıcı]` → İki kullanıcı arasındaki uyumu ölçer\n' +
                    '`/sayisifirla` → Sayı saymaca oyununu sıfırlar\n' +
                    '`/kelimesifirla` → Kelime türetmece oyununu sıfırlar\n' +
                    '`/yazitura` → Yazı tura atar\n\n' +

                    '**YETKİLİ KOMUTLARI**\n' +
                    '`/sil <sayı>` → Mesaj siler (Yetki gerekli)\n' +
                    '`/ban @kullanıcı [sebep]` → Kullanıcıyı banlar\n' +
                    '`/kick @kullanıcı [sebep]` → Kullanıcıyı atar\n' +
                    '`/unban @kullanıcı` → Kullanıcının banını kaldırır\n' +
                    '`/timeout @kullanıcı <süre>` → Kullanıcıyı susturur\n' +
                    '`/untimeout @kullanıcı` → Kullanıcının timeoutunu kaldırır\n' +
                                    '`/cekilis <süre> <ödül>` → Çekiliş başlatır\n' +
                    '`/reroll [mesaj_id]` → Çekiliş için yeni kazanan seçer (mesaj ID boşsa son çekiliş kullanılır)\n' +
                    '`/rololustur <isim> <renk>` → Yeni rol oluşturur\n' +
                    '`/toplurol <rol>` → Herkese rol verir\n' +
                    '`/sifirla @kullanıcı [sebep]` → Kullanıcının istatistiklerini sıfırlar\n' +
                    '`/kilitle` → Kanalı kilitler\n' +
                    '`/kilitaç` → Kanalı açar\n' +
                    '`/slowmode <saniye>` → Kanalın slowmode süresini ayarlar\n' +
                    '`/status <online/idle/dnd/invisible>` → Bot durumunu değiştirir\n' +
                    '`/renk-rol` → Renk rolleri sistemini aktif eder\n' +
                    '`/kayıt-setup` → Kayıt sistemi kurulum mesajını gönderir\n'
                )
                .setColor(0x3498db)
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (interaction.commandName === 'timeout') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const user = interaction.options.getUser('kullanici');
            const sure = interaction.options.getString('sure');
            const zaman = parseTime(sure);

            if (!zaman || zaman < 5000 || zaman > 28 * 24 * 60 * 60 * 1000) {
                return interaction.reply({ content: '❌ Süre 5 saniye ile 28 gün arasında olmalı! (örn: 10s, 5m, 1h, 1d veya 10 saniye, 5 dakika, 2 saat, 1 gün)', ephemeral: true });
            }

            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

            try {
                await member.timeout(zaman);
                try {
                    await interaction.reply({ content: `${user.tag} kullanıcısı ${sure} boyunca susturuldu!`, ephemeral: false });
                } catch (replyError) {
                    console.error('Timeout interaction reply hatası:', replyError);
                }
            } catch (e) {
                try {
                    await interaction.reply({ content: `❌ Timeout uygulanamadı: ${e.message}`, ephemeral: true });
                } catch (replyError) {
                    console.error('Timeout error interaction reply hatası:', replyError);
                }
            }
        }

        if (interaction.commandName === 'rololustur') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const isim = interaction.options.getString('isim');
            let renk = interaction.options.getString('renk');
            const renkler = {
                "kırmızı": "#ff0000",
                "mavi": "#3498db",
                "yeşil": "#00ff00",
                "sarı": "#ffff00",
                "turuncu": "#ffa500",
                "mor": "#800080",
                "pembe": "#ff69b4",
                "beyaz": "#ffffff",
                "siyah": "#000000",
                "gri": "#808080"
            };
            if (renk) {
                renk = renkler[renk.toLowerCase()] || renk;
                if (!/^#([0-9A-Fa-f]{6})$/.test(renk)) {
                    return interaction.reply({ content: '❌ Renk kodu geçersiz! (örn: #ff0000 veya turuncu)', ephemeral: true });
                }
            }
            try {
                const rol = await interaction.guild.roles.create({
                    name: isim,
                    color: renk || undefined,
                    reason: `Rol ${interaction.user.tag} tarafından oluşturuldu.`
                });
                interaction.reply({ content: `✅ <@&${rol.id}> rolü başarıyla oluşturuldu!`, ephemeral: false });
            } catch (e) {
                interaction.reply({ content: `❌ Rol oluşturulamadı: ${e.message}`, ephemeral: true });
            }
        }

        if (interaction.commandName === 'toplurol') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const rol = interaction.options.getRole('rol');
            await interaction.reply({ content: `Rol dağıtımı başlatıldı, lütfen bekle...`, ephemeral: true });
            let basarili = 0, basarisiz = 0;
            const members = await interaction.guild.members.fetch();
            for (const member of members.values()) {
                if (!member.user.bot && !member.roles.cache.has(rol.id)) {
                    try {
                        await member.roles.add(rol);
                        basarili++;
                    } catch {
                        basarisiz++;
                    }
                }
            }
            interaction.followUp({ content: `✅ Rol dağıtımı tamamlandı!\nBaşarılı: ${basarili}\nBaşarısız: ${basarisiz}`, ephemeral: false });
        }

        if (interaction.commandName === 'kilitle') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const channel = interaction.channel;
            try {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
                interaction.reply({ content: '🔒 Kanal kilitlendi! Artık herkes mesaj atamaz.', ephemeral: false });
            } catch (e) {
                interaction.reply({ content: `❌ Kanal kilitlenemedi: ${e.message}`, ephemeral: true });
            }
        }

        if (interaction.commandName === 'kilitaç') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const channel = interaction.channel;
            try {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
                interaction.reply({ content: '🔓 Kanal açıldı! Artık herkes mesaj atabilir.', ephemeral: false });
            } catch (e) {
                interaction.reply({ content: `❌ Kanal açılamadı: ${e.message}`, ephemeral: true });
            }
        }

        if (interaction.commandName === 'profil') {
            const user = interaction.options.getUser('kullanici') || interaction.user;
            const id = user.id;
            if (!istatistik[id]) istatistik[id] = { mesaj: 0, ses: 0, sesGiris: null };
            
            // Eğer şu an seste ise, aktif süreyi de ekle
            let toplamSes = istatistik[id].ses;
            if (istatistik[id].sesGiris) {
                toplamSes += Date.now() - istatistik[id].sesGiris;
            }
            
            function formatSure(ms) {
                const saniye = Math.floor(ms / 1000) % 60;
                const dakika = Math.floor(ms / (1000 * 60)) % 60;
                const saat = Math.floor(ms / (1000 * 60 * 60));
                return `${saat} saat, ${dakika} dakika, ${saniye} saniye`;
            }
            
            // Davet istatistiklerini al
            let davetSayisi = 0;
            let cikanSayisi = 0;
            let fakeSayisi = 0;
            
            // Davet verilerini kontrol et
            if (!davetVerileri[interaction.guildId]) {
                davetVerileri[interaction.guildId] = {};
            }
            // Kullanıcının davet verisi yoksa yeni veri oluşturma, sadece 0 göster
            
            try {
                // Sadece saklanan verileri kullan, API'den alma
                if (davetVerileri[interaction.guildId] && davetVerileri[interaction.guildId][user.id]) {
                    // Saklanan veriler varsa onları kullan
                    davetSayisi = davetVerileri[interaction.guildId][user.id].davet;
                    cikanSayisi = davetVerileri[interaction.guildId][user.id].cikan;
                    fakeSayisi = davetVerileri[interaction.guildId][user.id].fake;
                } else {
                    // Saklanan veri yoksa sadece 0 göster
                    davetSayisi = 0;
                    cikanSayisi = 0;
                    fakeSayisi = 0;
                }
                
            } catch (error) {
                console.error('Davet istatistikleri alınamadı:', error);
                // Hata durumunda varsayılan değerler
                davetSayisi = 0;
                cikanSayisi = 0;
                fakeSayisi = 0;
            }
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Kullanıcı Profili')
                .setDescription(`**${user.tag}** kullanıcısının istatistikleri`)
                .addFields(
                    { name: '💬 Toplam Mesaj', value: `**${istatistik[id].mesaj}**`, inline: true },
                    { name: '🎧 Toplam Ses Süresi', value: `**${formatSure(toplamSes)}**`, inline: true },
                    { name: '📅 Hesap Oluşturma', value: `**${user.createdAt.toLocaleDateString('tr-TR')}**`, inline: true },
                    { name: '🎯 Toplam Davet', value: `**${davetSayisi}** kişi`, inline: true },
                    { name: '🚪 Çıkan Kişi', value: `**${cikanSayisi}** kişi`, inline: true },
                    { name: '🤖 Fake Hesaplar', value: `**${fakeSayisi}** hesap`, inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(0x3498db)
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: interaction.client.user.displayAvatarURL() });
            
            interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (interaction.commandName === 'sifirla') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const user = interaction.options.getUser('kullanici');
            const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
            const id = user.id;
            
            // İstatistikleri sıfırla
            if (istatistik[id]) {
                istatistik[id] = { mesaj: 0, ses: 0, sesGiris: null };
                saveStats();
            }
            
            // Davet istatistiklerini sıfırla
            if (!davetVerileri[interaction.guildId]) {
                davetVerileri[interaction.guildId] = {};
            }
            
            // Kullanıcının davet verilerini tamamen sil
            if (davetVerileri[interaction.guildId][user.id]) {
                delete davetVerileri[interaction.guildId][user.id];
            }
            
            // Dosyayı kaydet
            saveDavet();
            
            // Dosyayı tekrar oku ve kontrol et
            try {
                if (fs.existsSync(davetPath)) {
                    const currentData = JSON.parse(fs.readFileSync(davetPath, 'utf8'));
                    
                    if (currentData[interaction.guildId] && currentData[interaction.guildId][user.id]) {
                        delete currentData[interaction.guildId][user.id];
                        fs.writeFileSync(davetPath, JSON.stringify(currentData, null, 2));
                    }
                }
            } catch (error) {
                console.error('Dosya silme hatası:', error);
            }
            
            interaction.reply({ content: `✅ ${user.tag} kullanıcısının istatistikleri ve davet verileri sıfırlandı!\nSebep: ${sebep}`, ephemeral: false });
        }

        if (interaction.commandName === 'ship') {
            const user1 = interaction.user;
            const user2 = interaction.options.getUser('kullanici');
            
            let targetUser;
            if (user2) {
                // Belirtilen kullanıcı ile ship
                targetUser = user2;
            } else {
                // Rastgele kullanıcı seç
                const members = interaction.guild.members.cache.filter(member => !member.user.bot);
                const randomMember = members.random();
                if (!randomMember || randomMember.id === user1.id) {
                    return interaction.reply({ content: '❌ Rastgele kullanıcı bulunamadı!', ephemeral: true });
                }
                targetUser = randomMember.user;
            }
            
            // Aynı kişi ile ship yapılamaz
            if (user1.id === targetUser.id) {
                return interaction.reply({ content: '❌ Kendinle ship yapamazsın!', ephemeral: true });
            }
            
            // Ship yüzdesi hesapla (rastgele)
            const shipPercentage = Math.floor(Math.random() * 101); // 0-100 arası rastgele
            
            // Ship mesajı oluştur
            let shipMessage = '';
            let shipEmoji = '';
            
            if (shipPercentage >= 90) {
                shipMessage = '💕 Mükemmel uyum! Evlenin! 💕';
                shipEmoji = '💕';
            } else if (shipPercentage >= 80) {
                shipMessage = '💖 Harika bir çift! 💖';
                shipEmoji = '💖';
            } else if (shipPercentage >= 70) {
                shipMessage = '💝 Çok güzel bir uyum! 💝';
                shipEmoji = '💝';
            } else if (shipPercentage >= 60) {
                shipMessage = '💗 İyi bir uyum var! 💗';
                shipEmoji = '💗';
            } else if (shipPercentage >= 50) {
                shipMessage = '💙 Orta seviye uyum! 💙';
                shipEmoji = '💙';
            } else if (shipPercentage >= 40) {
                shipMessage = '💚 Biraz uyum var! 💚';
                shipEmoji = '💚';
            } else if (shipPercentage >= 30) {
                shipMessage = '💛 Zayıf bir uyum! 💛';
                shipEmoji = '💛';
            } else if (shipPercentage >= 20) {
                shipMessage = '💔 Çok az uyum! 💔';
                shipEmoji = '💔';
            } else {
                shipMessage = '💀 Hiç uyum yok! 💀';
                shipEmoji = '💀';
            }
            
            const embed = new EmbedBuilder()
                .setTitle('💘 Ship Testi 💘')
                .setDescription(`${user1} 💕 ${targetUser}`)
                .addFields(
                    { name: '💝 Uyum Yüzdesi', value: `${shipEmoji} **${shipPercentage}%** ${shipEmoji}`, inline: false },
                    { name: '💭 Sonuç', value: shipMessage, inline: false }
                )
                .setThumbnail('https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif')
                .setColor(0xff69b4)
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: interaction.client.user.displayAvatarURL() });
            
            interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (interaction.commandName === 'untimeout') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const user = interaction.options.getUser('kullanici');
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
            
            try {
                await member.timeout(null);
                interaction.reply({ content: `✅ ${user.tag} kullanıcısının timeoutu kaldırıldı!`, ephemeral: false });
            } catch (e) {
                interaction.reply({ content: `❌ Timeout kaldırılamadı: ${e.message}`, ephemeral: true });
            }
        }

        if (interaction.commandName === 'unban') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const user = interaction.options.getUser('kullanici');
            
            try {
                await interaction.guild.members.unban(user.id);
                interaction.reply({ content: `✅ ${user.tag} kullanıcısının banı kaldırıldı!`, ephemeral: false });
            } catch (e) {
                interaction.reply({ content: `❌ Ban kaldırılamadı: ${e.message}`, ephemeral: true });
            }
        }

        if (interaction.commandName === 'yazitura') {
            const sonuc = Math.random() < 0.5 ? 'YAZI' : 'TURA';
            const embed = new EmbedBuilder()
                .setTitle('🪙 Yazı Tura 🪙')
                .setDescription(`**${interaction.user.tag}** parayı attı!\n\n🎯 **Sonuç:** ${sonuc}`)
                .setColor(0xffd700)
                .setThumbnail('https://cdn.discordapp.com/emojis/1101133526548660224.webp?size=96&quality=lossless')
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: interaction.client.user.displayAvatarURL() });
            
            interaction.reply({ embeds: [embed], ephemeral: false });
        }

        if (interaction.commandName === 'slowmode') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            const saniye = interaction.options.getInteger('saniye');
            
            if (saniye < 0 || saniye > 21600) {
                return interaction.reply({ content: '❌ Slowmode süresi 0-21600 saniye arasında olmalı!', ephemeral: true });
            }
            
            try {
                await interaction.channel.setRateLimitPerUser(saniye);
                if (saniye === 0) {
                    interaction.reply({ content: '✅ Slowmode kapatıldı!', ephemeral: false });
                } else {
                    interaction.reply({ content: `✅ Slowmode ${saniye} saniye olarak ayarlandı!`, ephemeral: false });
                }
            } catch (e) {
                interaction.reply({ content: `❌ Slowmode ayarlanamadı: ${e.message}`, ephemeral: true });
            }
        }

        if (interaction.commandName === 'sayisifirla') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            
            currentNumber = 0;
            lastUserId = null;
            
            interaction.reply({ content: '✅ Sayı saymaca oyunu sıfırlandı! Artık 1\'den başlayabilirsiniz.', ephemeral: false });
        }

        if (interaction.commandName === 'kelimesifirla') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            
            currentWord = '';
            lastWordUserId = null;
            
            interaction.reply({ content: '✅ Kelime türetmece oyunu sıfırlandı! Artık yeni bir kelime ile başlayabilirsiniz.', ephemeral: false });
        }

        // Ticket sistemi komutları
        if (interaction.commandName === 'ticket-setup') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🎫 Destek Ticket Sistemi')
                .setDescription('Aşağıdaki kategorilerden birini seçerek destek ekibimizle iletişime geçebilirsin.\n\n**Not:** Her kullanıcı aynı anda sadece bir ticket açabilir.')
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_hesap')
                    .setLabel('👤 Kullanıcı Şikayet')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👤'),
                new ButtonBuilder()
                    .setCustomId('ticket_oneri')
                    .setLabel('💡 Öneriler')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💡')
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_cekilis')
                    .setLabel('🎁 Çekiliş Ödülü')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎁'),
                new ButtonBuilder()
                    .setCustomId('ticket_diger')
                    .setLabel('📝 Diğer')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝')
            );

            await interaction.reply({ embeds: [embed], components: [row1, row2] });
        }

        if (interaction.commandName === 'ticket-close') {
            const yetkiliRolID = '1401227942498930760';
            if (!interaction.member.roles.cache.has(yetkiliRolID)) {
                return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
            }
            
            const reason = interaction.options.getString('sebep') || 'Yetkili tarafından kapatıldı';
            await closeTicket(interaction, reason);
        }

        if (interaction.commandName === 'ping') {
            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setDescription(`**Bot Ping:** ${client.ws.ping}ms\n**API Latency:** ${Date.now() - interaction.createdTimestamp}ms`)
                .setColor(0x00ff00)
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: client.user.displayAvatarURL() });
            
            interaction.reply({ embeds: [embed], ephemeral: false });
        }
    });



    // Otomatik hoşgeldin sistemi ve davet takibi
    client.on('guildMemberAdd', async member => {
        const welcomeChannelId = '1399722587373830294';
        const channel = member.guild.channels.cache.get(welcomeChannelId);
        
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('Lidea Bot')
                .setDescription(`**${member.user.tag}** sunucumuza hoşgeldin! #⚝LİDEA`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(0xff6b35)
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: member.client.user.displayAvatarURL() });
            
            channel.send({ embeds: [embed] });
        }
        
        // Davet takibi
        try {
            const guildId = member.guild.id;
            const userId = member.user.id;
            
            // Davet verilerini kontrol et
            if (!davetVerileri[guildId]) {
                davetVerileri[guildId] = {};
            }
            
            // Discord API'den davet bilgilerini al
            try {
                const invites = await member.guild.invites.fetch();
                let davetEden = null;
                let maxUses = 0;
                
                // En çok kullanılan davet linkini bul
                for (const [code, invite] of invites) {
                    if (invite.uses > maxUses && invite.inviter) {
                        maxUses = invite.uses;
                        davetEden = invite.inviter.id;
                    }
                }
                
                if (davetEden) {
                    // Davet verilerini kontrol et
                    if (!davetVerileri[guildId][davetEden]) {
                        davetVerileri[guildId][davetEden] = {
                            davet: 0,
                            cikan: 0,
                            fake: 0,
                            davetEttikleri: []
                        };
                    }
                    
                    // Davet edenin verilerini güncelle
                    davetVerileri[guildId][davetEden].davet += 1;
                    
                    if (!davetVerileri[guildId][davetEden].davetEttikleri) {
                        davetVerileri[guildId][davetEden].davetEttikleri = [];
                    }
                    davetVerileri[guildId][davetEden].davetEttikleri.push(userId);
                }
            } catch (error) {
                console.error('Davet eden bulunamadı:', error);
            }
            
            saveDavet();
            
        } catch (error) {
            console.error('Davet verileri güncellenirken hata:', error);
        }
    });

    // Görüşürüz sistemi
    client.on('guildMemberRemove', async member => {
        console.log(`${member.user.tag} sunucudan ayrıldı!`);
        const welcomeChannelId = '1399722587373830294';
        const channel = member.guild.channels.cache.get(welcomeChannelId);
        
        if (channel) {
            console.log('Kanal bulundu, mesaj gönderiliyor...');
            const embed = new EmbedBuilder()
                .setTitle('Lidea Bot')
                .setDescription(`**${member.user.tag}** sunucumuzdan ayrıldı! Umarız tekrar görüşürüz!`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Created by benneyim', iconURL: member.client.user.displayAvatarURL() });
            
            try {
                await channel.send({ embeds: [embed] });
                console.log('Görüşürüz mesajı gönderildi!');
            } catch (error) {
                console.error('Görüşürüz mesajı gönderilemedi:', error);
            }
        } else {
            console.log('Kanal bulunamadı!');
        }
    });

    // Sayı saymaca oyunu için değişkenler
    let currentNumber = 0;
    let lastUserId = null;

    // Kelime türetmece oyunu için değişkenler
    let currentWord = '';
    let lastWordUserId = null;

    // Türkçe kelime listesi için değişkenler
    let turkceKelimeler = [];
    let kelimeListesiYuklendi = false;

    // Gelişmiş kelime API'si için fonksiyonlar
    async function kelimeAPIdenCek(kelime) {
        try {
            // TDK API'si (Türk Dil Kurumu) - Optimize edilmiş
            const tdkUrl = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(kelime)}`;
            
            return new Promise((resolve, reject) => {
                const request = https.get(tdkUrl, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            // TDK'da kelime varsa true döner
                            if (response && response.length > 0) {
                                console.log(`✅ TDK API: "${kelime}" kelimesi bulundu`);
                                resolve(true);
                            } else {
                                console.log(`❌ TDK API: "${kelime}" kelimesi bulunamadı`);
                                resolve(false);
                            }
                        } catch (error) {
                            // JSON parse hatası durumunda false döner
                            console.log(`❌ TDK API: "${kelime}" için JSON parse hatası`);
                            resolve(false);
                        }
                    });
                });
                
                // Timeout ekle (5 saniye)
                request.setTimeout(5000, () => {
                    console.log(`⏰ TDK API: "${kelime}" için timeout`);
                    request.destroy();
                    resolve(false);
                });
                
                request.on('error', (error) => {
                    console.error(`❌ TDK API hatası: ${error.message}`);
                    resolve(false);
                });
            });
        } catch (error) {
            console.error('Kelime API kontrolü hatası:', error);
            return false;
        }
    }

    // Alternatif kelime API'si (Wiktionary)
    async function wiktionaryKelimeKontrol(kelime) {
        try {
            const url = `https://tr.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(kelime)}`;
            
            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    if (res.statusCode === 200) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).on('error', (error) => {
                    console.error('Wiktionary API hatası:', error.message);
                    resolve(false);
                });
            });
        } catch (error) {
            console.error('Wiktionary kontrolü hatası:', error);
            return false;
        }
    }

    // GitHub'dan Türkçe kelime listesini yükle
    async function turkceKelimeleriYukle() {
        try {
            // Birden fazla kaynaktan kelime listesi al
            const kaynaklar = [
                'https://raw.githubusercontent.com/mertemin/turkish-words/master/words.txt',
                'https://raw.githubusercontent.com/ahmetkotan/turkish-word-list/master/words.txt',
                'https://raw.githubusercontent.com/ozan/turkish-word-list/master/words.txt'
            ];
            
            let tumKelimeler = new Set();
            
            for (const kaynak of kaynaklar) {
                try {
                    const kelimeler = await new Promise((resolve, reject) => {
                        https.get(kaynak, (res) => {
                            let data = '';
                            
                            res.on('data', (chunk) => {
                                data += chunk;
                            });
                            
                            res.on('end', () => {
                                try {
                                    const kelimeler = data.split('\n')
                                        .map(kelime => kelime.trim().toLowerCase())
                                        .filter(kelime => 
                                            kelime.length >= 2 && 
                                            kelime.length <= 15 && 
                                            /^[a-zçğıöşü]+$/.test(kelime) &&
                                            !kelime.includes(' ') &&
                                            !kelime.includes('-') &&
                                            !kelime.includes('_')
                                        );
                                    resolve(kelimeler);
                                } catch (error) {
                                    resolve([]);
                                }
                            });
                        }).on('error', (error) => {
                            console.error(`${kaynak} kaynağından kelime alınamadı:`, error.message);
                            resolve([]);
                        });
                    });
                    
                    kelimeler.forEach(kelime => tumKelimeler.add(kelime));
                    
                } catch (error) {
                    console.error(`${kaynak} kaynağı işlenirken hata:`, error);
                }
            }
            
            // Temel kelimeleri de ekle
            const temelKelimeler = [
                'elma', 'armut', 'muz', 'portakal', 'mandalina', 'kiraz', 'çilek', 'üzüm', 'karpuz', 'kavun',
                'şeftali', 'kayısı', 'incir', 'ayva', 'böğürtlen', 'ahududu', 'dut', 'vişne', 'ananas', 'mango',
                'domates', 'salatalık', 'patlıcan', 'kabak', 'havuç', 'patates', 'soğan', 'sarımsak', 'biber', 'marul',
                'kedi', 'köpek', 'kuş', 'balık', 'tavşan', 'hamster', 'kaplumbağa', 'tavuk', 'ördek', 'kaz',
                'ekmek', 'peynir', 'zeytin', 'bal', 'reçel', 'çorba', 'pilav', 'makarna', 'salata', 'kebap',
                'su', 'çay', 'kahve', 'süt', 'meyve suyu', 'limonata', 'kola', 'ayran', 'şerbet', 'komposto',
                'kırmızı', 'mavi', 'yeşil', 'sarı', 'turuncu', 'mor', 'pembe', 'kahverengi', 'siyah', 'beyaz',
                'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on',
                'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar', 'ocak', 'şubat', 'mart',
                'Türkiye', 'Almanya', 'Fransa', 'İngiltere', 'İtalya', 'İspanya', 'Rusya', 'Çin', 'Japonya', 'Amerika',
                'doktor', 'mühendis', 'avukat', 'öğretmen', 'hemşire', 'pilot', 'gazeteci', 'ressam', 'müzisyen', 'şarkıcı',
                'anne', 'baba', 'kardeş', 'dede', 'nene', 'amca', 'dayı', 'teyze', 'hala', 'kuzen',
                'ev', 'oda', 'mutfak', 'banyo', 'salon', 'yatak', 'dolap', 'halı', 'perde', 'lamba',
                'elbise', 'gömlek', 'pantolon', 'etek', 'ceket', 'kazak', 'tişört', 'şort', 'ayakkabı', 'çorap',
                'futbol', 'basketbol', 'voleybol', 'tenis', 'yüzme', 'koşu', 'bisiklet', 'kayak', 'snowboard', 'sörf',
                'şarkı', 'türkü', 'pop', 'rock', 'jazz', 'klasik', 'folk', 'blues', 'reggae', 'hiphop',
                'dağ', 'deniz', 'orman', 'çöl', 'kutup', 'vadi', 'tepe', 'ada', 'yarımada', 'körfez',
                'güneş', 'ay', 'yıldız', 'bulut', 'yağmur', 'kar', 'rüzgar', 'fırtına', 'gökkuşağı', 'güneş',
                'okul', 'sınıf', 'ders', 'ödev', 'sınav', 'not', 'kitap', 'defter', 'kalem', 'silgi',
                'iş', 'meslek', 'kariyer', 'maaş', 'para', 'bank', 'kredi', 'borç', 'alışveriş', 'market',
                'bilgisayar', 'telefon', 'tablet', 'laptop', 'internet', 'wifi', 'bluetooth', 'usb', 'kamera', 'mikrofon',
                'araba', 'otobüs', 'tren', 'uçak', 'gemi', 'feribot', 'metro', 'tramvay', 'taksi', 'dolmuş',
                'hastane', 'doktor', 'hemşire', 'eczane', 'ilaç', 'tedavi', 'ameliyat', 'muayene', 'kontrol', 'test',
                'mutlu', 'üzgün', 'kızgın', 'korkmuş', 'şaşkın', 'heyecanlı', 'sakin', 'gergin', 'rahat', 'huzurlu',
                'daire', 'kare', 'üçgen', 'dikdörtgen', 'oval', 'yıldız', 'kalp', 'ok', 'çizgi', 'nokta',
                // Daha fazla kelime ekle
                'kitap', 'kalem', 'defter', 'silgi', 'çanta', 'okul', 'sınıf', 'öğretmen', 'öğrenci', 'ders',
                'matematik', 'türkçe', 'tarih', 'coğrafya', 'fizik', 'kimya', 'biyoloji', 'ingilizce', 'almanca', 'fransızca',
                'müzik', 'resim', 'beden', 'din', 'felsefe', 'psikoloji', 'sosyoloji', 'ekonomi', 'hukuk', 'tıp',
                'bilgisayar', 'programlama', 'yazılım', 'donanım', 'internet', 'web', 'uygulama', 'oyun', 'film', 'dizi',
                'spor', 'futbol', 'basketbol', 'voleybol', 'tenis', 'yüzme', 'koşu', 'jimnastik', 'atletizm', 'güreş',
                'yemek', 'kahvaltı', 'öğle', 'akşam', 'çorba', 'pilav', 'et', 'tavuk', 'balık', 'sebze',
                'meyve', 'tatlı', 'çikolata', 'dondurma', 'pasta', 'kurabiye', 'börek', 'poğaça', 'simit', 'ekmek',
                'içecek', 'su', 'çay', 'kahve', 'süt', 'meyve suyu', 'limonata', 'kola', 'ayran', 'şerbet',
                'renk', 'kırmızı', 'mavi', 'yeşil', 'sarı', 'turuncu', 'mor', 'pembe', 'kahverengi', 'siyah',
                'beyaz', 'gri', 'lacivert', 'turkuaz', 'eflatun', 'altın', 'gümüş', 'bronz', 'bej', 'krem',
                'sayı', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on',
                'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan', 'yüz', 'bin',
                'gün', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar',
                'ay', 'ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül',
                'ekim', 'kasım', 'aralık', 'yıl', 'hafta', 'saat', 'dakika', 'saniye', 'sabah', 'öğle',
                'akşam', 'gece', 'gündüz', 'hafta', 'ay', 'yıl', 'mevsim', 'ilkbahar', 'yaz', 'sonbahar', 'kış',
                'ülke', 'Türkiye', 'Almanya', 'Fransa', 'İngiltere', 'İtalya', 'İspanya', 'Rusya', 'Çin', 'Japonya',
                'Amerika', 'Kanada', 'Brezilya', 'Arjantin', 'Mısır', 'Güney Afrika', 'Avustralya', 'Yeni Zelanda', 'Hindistan', 'Pakistan',
                'şehir', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kayseri',
                'Mersin', 'Diyarbakır', 'Samsun', 'Denizli', 'Eskişehir', 'Urfa', 'Malatya', 'Erzurum', 'Van', 'Batman',
                'meslek', 'doktor', 'mühendis', 'avukat', 'öğretmen', 'hemşire', 'pilot', 'gazeteci', 'ressam', 'müzisyen',
                'şarkıcı', 'oyuncu', 'yazar', 'şair', 'mimar', 'diş hekimi', 'veteriner', 'eczacı', 'hemşire', 'teknisyen',
                'aile', 'anne', 'baba', 'kardeş', 'dede', 'nene', 'amca', 'dayı', 'teyze', 'hala', 'kuzen',
                'ev', 'oda', 'mutfak', 'banyo', 'salon', 'yatak', 'dolap', 'halı', 'perde', 'lamba',
                'giysi', 'elbise', 'gömlek', 'pantolon', 'etek', 'ceket', 'kazak', 'tişört', 'şort', 'ayakkabı',
                'çorap', 'şapka', 'eldiven', 'atkı', 'kemer', 'çanta', 'cüzdan', 'saat', 'gözlük', 'takı',
                'ulaşım', 'araba', 'otobüs', 'tren', 'uçak', 'gemi', 'feribot', 'metro', 'tramvay', 'taksi',
                'dolmuş', 'bisiklet', 'motosiklet', 'kamyon', 'kamyonet', 'tır', 'tank', 'helikopter', 'yat', 'jet',
                'sağlık', 'hastane', 'doktor', 'hemşire', 'eczane', 'ilaç', 'tedavi', 'ameliyat', 'muayene', 'kontrol',
                'test', 'röntgen', 'ultrason', 'kan', 'idrar', 'tansiyon', 'ateş', 'öksürük', 'baş ağrısı', 'grip',
                'duygu', 'mutlu', 'üzgün', 'kızgın', 'korkmuş', 'şaşkın', 'heyecanlı', 'sakin', 'gergin', 'rahat',
                'huzurlu', 'endişeli', 'gururlu', 'utangaç', 'cesur', 'korkak', 'cesur', 'kararlı', 'kararsız', 'sabırlı',
                'şekil', 'daire', 'kare', 'üçgen', 'dikdörtgen', 'oval', 'yıldız', 'kalp', 'ok', 'çizgi', 'nokta',
                'küp', 'küre', 'silindir', 'koni', 'piramit', 'prizma', 'elips', 'paralelkenar', 'eşkenar', 'yamuk'
            ];
            
            temelKelimeler.forEach(kelime => tumKelimeler.add(kelime));
            
            turkceKelimeler = Array.from(tumKelimeler);
            kelimeListesiYuklendi = true;
            console.log(`✅ ${turkceKelimeler.length} Türkçe kelime yüklendi!`);
            
        } catch (error) {
            console.error('Kelimeler yüklenirken hata:', error);
            // Fallback olarak temel kelimeleri kullan
            turkceKelimeler = [
                'elma', 'armut', 'muz', 'portakal', 'mandalina', 'kiraz', 'çilek', 'üzüm', 'karpuz', 'kavun',
                'şeftali', 'kayısı', 'incir', 'ayva', 'böğürtlen', 'ahududu', 'dut', 'vişne', 'ananas', 'mango',
                'domates', 'salatalık', 'patlıcan', 'kabak', 'havuç', 'patates', 'soğan', 'sarımsak', 'biber', 'marul',
                'kedi', 'köpek', 'kuş', 'balık', 'tavşan', 'hamster', 'kaplumbağa', 'tavuk', 'ördek', 'kaz',
                'ekmek', 'peynir', 'zeytin', 'bal', 'reçel', 'çorba', 'pilav', 'makarna', 'salata', 'kebap',
                'su', 'çay', 'kahve', 'süt', 'meyve suyu', 'limonata', 'kola', 'ayran', 'şerbet', 'komposto',
                'kırmızı', 'mavi', 'yeşil', 'sarı', 'turuncu', 'mor', 'pembe', 'kahverengi', 'siyah', 'beyaz',
                'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on',
                'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar', 'ocak', 'şubat', 'mart',
                'Türkiye', 'Almanya', 'Fransa', 'İngiltere', 'İtalya', 'İspanya', 'Rusya', 'Çin', 'Japonya', 'Amerika',
                'doktor', 'mühendis', 'avukat', 'öğretmen', 'hemşire', 'pilot', 'gazeteci', 'ressam', 'müzisyen', 'şarkıcı',
                'anne', 'baba', 'kardeş', 'dede', 'nene', 'amca', 'dayı', 'teyze', 'hala', 'kuzen',
                'ev', 'oda', 'mutfak', 'banyo', 'salon', 'yatak', 'dolap', 'halı', 'perde', 'lamba',
                'elbise', 'gömlek', 'pantolon', 'etek', 'ceket', 'kazak', 'tişört', 'şort', 'ayakkabı', 'çorap',
                'futbol', 'basketbol', 'voleybol', 'tenis', 'yüzme', 'koşu', 'bisiklet', 'kayak', 'snowboard', 'sörf',
                'şarkı', 'türkü', 'pop', 'rock', 'jazz', 'klasik', 'folk', 'blues', 'reggae', 'hiphop',
                'dağ', 'deniz', 'orman', 'çöl', 'kutup', 'vadi', 'tepe', 'ada', 'yarımada', 'körfez',
                'güneş', 'ay', 'yıldız', 'bulut', 'yağmur', 'kar', 'rüzgar', 'fırtına', 'gökkuşağı', 'güneş',
                'okul', 'sınıf', 'ders', 'ödev', 'sınav', 'not', 'kitap', 'defter', 'kalem', 'silgi',
                'iş', 'meslek', 'kariyer', 'maaş', 'para', 'bank', 'kredi', 'borç', 'alışveriş', 'market',
                'bilgisayar', 'telefon', 'tablet', 'laptop', 'internet', 'wifi', 'bluetooth', 'usb', 'kamera', 'mikrofon',
                'araba', 'otobüs', 'tren', 'uçak', 'gemi', 'feribot', 'metro', 'tramvay', 'taksi', 'dolmuş',
                'hastane', 'doktor', 'hemşire', 'eczane', 'ilaç', 'tedavi', 'ameliyat', 'muayene', 'kontrol', 'test',
                'mutlu', 'üzgün', 'kızgın', 'korkmuş', 'şaşkın', 'heyecanlı', 'sakin', 'gergin', 'rahat', 'huzurlu',
                'daire', 'kare', 'üçgen', 'dikdörtgen', 'oval', 'yıldız', 'kalp', 'ok', 'çizgi', 'nokta'
            ];
            kelimeListesiYuklendi = true;
            console.log(`✅ Fallback olarak ${turkceKelimeler.length} temel Türkçe kelime yüklendi!`);
        }
    }

    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        const id = message.author.id;
        if (!istatistik[id]) istatistik[id] = { mesaj: 0, ses: 0, sesGiris: null };
        istatistik[id].mesaj++;
        saveStats();

        // Sayı saymaca oyunu - sadece belirli kanalda
        if (message.channel.id === '1400205681306370078') {
            const number = parseInt(message.content);
            
            if (!isNaN(number)) {
                // Aynı kişi üst üste sayı yazamaz
                if (lastUserId === message.author.id) {
                    try {
                        await message.delete();
                        // Uyarı mesajı gönder ve 3 saniye sonra sil
                        const uyari = await message.channel.send(`❌ **${message.author.tag}** sıra sende değil! Başka birinin yazması gerekiyor.`);
                        setTimeout(async () => {
                            try {
                                await uyari.delete();
                            } catch (error) {
                                console.error('Uyarı mesajı silinemedi:', error.message);
                            }
                        }, 3000);
                    } catch (error) {
                        console.error('Mesaj silinemedi:', error.message);
                    }
                    return;
                }

                // İlk sayı 1 olmalı
                if (currentNumber === 0 && number !== 1) {
                    try {
                        await message.delete();
                    } catch (error) {
                        console.error('Mesaj silinemedi:', error.message);
                    }
                    return;
                }

                // Doğru sayı kontrolü
                if (number === currentNumber + 1) {
                    currentNumber = number;
                    lastUserId = message.author.id;
                    // Doğru sayı için tik ekle
                    try {
                        await message.react('✅');
                    } catch (error) {
                        console.error('Tik eklenemedi:', error.message);
                    }
                } else {
                    // Yanlış sayı - mesajı sil
                    try {
                        await message.delete();
                    } catch (error) {
                        console.error('Mesaj silinemedi:', error.message);
                    }
                }
            } else {
                // Harf veya başka bir şey yazıldı - mesajı sil
                try {
                    await message.delete();
                } catch (error) {
                    console.error('Mesaj silinemedi:', error.message);
                }
            }
        }

        // Kelime türetmece oyunu - sadece belirli kanalda
        if (message.channel.id === '1400488848550793397') {
            const word = message.content.trim().toLowerCase();
            
            // Küfür ve uygunsuz kelimeler listesi
            const yasakliKelimeler = [
                'yarrak', 'am', 'amcık', 'amcik', 'orospu', 'orospu', 'piç', 'pic', 'siktir', 'siktir', 'sikeyim', 'sikeyim',
                'göt', 'got', 'götveren', 'gotveren', 'pezevenk', 'pezevenk', 'ibne', 'ibne', 'oç', 'oc', 'oç', 'oc',
                'ananı', 'ananı', 'ananı', 'ananı', 'babani', 'babani', 'babani', 'babani', 'siktir', 'siktir',
                'amına', 'amina', 'amına', 'amina', 'götüne', 'gotune', 'götüne', 'gotune', 'sik', 'sik',
                'amcık', 'amcik', 'amcık', 'amcik', 'orospu', 'orospu', 'piç', 'pic', 'siktir', 'siktir',
                'anan', 'anan', 'babam', 'babam', 'siktir', 'siktir', 'amına', 'amina', 'götüne', 'gotune',
                'tatatata', 'asdasdasd', 'qweqweqwe', 'zxcvbnm', 'falanfilan', 'random', 'deneme', 'test'
            ];
            
            // Kelime listesi henüz yüklenmemişse oyunu devre dışı bırak
            if (!kelimeListesiYuklendi) {
                try {
                    await message.delete();
                    const uyari = await message.channel.send(`⚠️ Kelime listesi henüz yükleniyor, lütfen biraz bekleyin...`);
                    setTimeout(async () => {
                        try {
                            await uyari.delete();
                        } catch (error) {
                            console.error('Uyarı mesajı silinemedi:', error.message);
                        }
                    }, 3000);
                } catch (error) {
                    console.error('Mesaj silinemedi:', error.message);
                }
                return;
            }
            
            // Sadece harflerden oluşan, yasaklı olmayan ve Türkçe kelime listesinde bulunan kelimeler kabul edilir
            if (/^[a-zçğıöşü]+$/.test(word) && word.length >= 2 && !yasakliKelimeler.includes(word)) {
                // Önce yerel kelime listesinde kontrol et
                let kelimeGecerli = turkceKelimeler.includes(word);
                
                // Eğer yerel listede yoksa, TDK API'den kontrol et (daha güvenilir)
                if (!kelimeGecerli) {
                    try {
                        // TDK API'den kontrol et (daha hızlı ve güvenilir)
                        kelimeGecerli = await kelimeAPIdenCek(word);
                        
                        // TDK'da bulunamazsa Wiktionary'den kontrol et (fallback)
                        if (!kelimeGecerli) {
                            console.log(`TDK'da bulunamadı, Wiktionary deneniyor: ${word}`);
                            kelimeGecerli = await wiktionaryKelimeKontrol(word);
                        }
                        
                        // Eğer herhangi bir API'de bulunduysa yerel listeye ekle
                        if (kelimeGecerli) {
                            turkceKelimeler.push(word);
                            console.log(`✅ Yeni kelime API'den eklendi: ${word}`);
                        }
                    } catch (error) {
                        console.error('API kontrolü sırasında hata:', error);
                        kelimeGecerli = false;
                    }
                }
                
                if (kelimeGecerli) {
                    // Aynı kişi üst üste kelime yazamaz
                    if (lastWordUserId === message.author.id) {
                        try {
                            await message.delete();
                            // Uyarı mesajı gönder ve 3 saniye sonra sil
                            const uyari = await message.channel.send(`❌ **${message.author.tag}** sıra sende değil! Başka birinin yazması gerekiyor.`);
                            setTimeout(async () => {
                                try {
                                    await uyari.delete();
                                } catch (error) {
                                    console.error('Uyarı mesajı silinemedi:', error.message);
                                }
                            }, 3000);
                        } catch (error) {
                            console.error('Mesaj silinemedi:', error.message);
                        }
                        return;
                    }

                    // İlk kelime kontrolü
                    if (currentWord === '') {
                        currentWord = word;
                        lastWordUserId = message.author.id;
                        // İlk kelime için tik ekle
                        try {
                            await message.react('✅');
                        } catch (error) {
                            console.error('Tik eklenemedi:', error.message);
                        }
                    } else {
                        // Son harf kontrolü
                        const lastChar = currentWord.slice(-1);
                        if (word.startsWith(lastChar)) {
                            currentWord = word;
                            lastWordUserId = message.author.id;
                            // Doğru kelime için tik ekle
                            try {
                                await message.react('✅');
                            } catch (error) {
                                console.error('Tik eklenemedi:', error.message);
                            }
                        } else {
                            // Yanlış kelime - mesajı sil
                            try {
                                await message.delete();
                            } catch (error) {
                                console.error('Mesaj silinemedi:', error.message);
                            }
                        }
                    }
                } else {
                    // Kelime onaylanmadı - mesajı sil
                    try {
                        await message.delete();
                        // Kısa bir uyarı mesajı gönder ve 3 saniye sonra sil
                        const uyari = await message.channel.send(`❌ **${message.author.tag}** "${word}" kelimesi onaylanmadı! Lütfen geçerli bir Türkçe kelime yazın.`);
                        setTimeout(async () => {
                            try {
                                await uyari.delete();
                            } catch (error) {
                                console.error('Uyarı mesajı silinemedi:', error.message);
                            }
                        }, 3000);
                    } catch (error) {
                        console.error('Mesaj silinemedi:', error.message);
                    }
                }
            } else {
                // Yasaklı kelime veya geçersiz format - mesajı sil
                try {
                    await message.delete();
                } catch (error) {
                    console.error('Mesaj silinemedi:', error.message);
                }
            }
        }
    });

    client.on('voiceStateUpdate', (oldState, newState) => {
        const id = newState.id;
        if (!istatistik[id]) istatistik[id] = { mesaj: 0, ses: 0, sesGiris: null };
        // Sese girdi
        if (!oldState.channelId && newState.channelId) {
            istatistik[id].sesGiris = Date.now();
        }
        // Sesten çıktı
        if (oldState.channelId && !newState.channelId && istatistik[id].sesGiris) {
            const sure = Date.now() - istatistik[id].sesGiris;
            istatistik[id].ses += sure;
            istatistik[id].sesGiris = null;
            saveStats();
        }
    });

    // Kullanıcı çıktığında davet verilerini güncelle
    client.on('guildMemberRemove', async (member) => {
        try {
            const guildId = member.guild.id;
            const userId = member.user.id;
            
            // Davet verilerini kontrol et
            if (!davetVerileri[guildId]) {
                davetVerileri[guildId] = {};
            }
            
            // Davet eden kişiyi bul
            let davetEden = null;
            
            for (const [inviterId, data] of Object.entries(davetVerileri[guildId])) {
                if (data.davet > 0 && data.davetEttikleri) {
                    // Bu kullanıcının davet ettiği kişiler arasında çıkan kişi var mı kontrol et
                    if (data.davetEttikleri.includes(userId)) {
                        davetEden = inviterId;
                        break;
                    }
                }
            }
            
            if (davetEden) {
                // Davet edenin toplam davetini azalt
                davetVerileri[guildId][davetEden].davet = Math.max(0, davetVerileri[guildId][davetEden].davet - 1);
                davetVerileri[guildId][davetEden].cikan += 1;
                
                // Davet ettikleri listesinden çıkan kişiyi kaldır
                if (davetVerileri[guildId][davetEden].davetEttikleri) {
                    davetVerileri[guildId][davetEden].davetEttikleri = 
                        davetVerileri[guildId][davetEden].davetEttikleri.filter(id => id !== userId);
                }
            } else {
                // Davet eden bulunamadıysa tüm kullanıcıların çıkan sayısını artır
                for (const [inviterId, data] of Object.entries(davetVerileri[guildId])) {
                    if (data.davet > 0) {
                        data.cikan += 1;
                    }
                }
            }
            
            saveDavet();
            
        } catch (error) {
            console.error('Davet verileri güncellenirken hata:', error);
        }
    });





    // BOM oyunu için değişkenler
    let bomCurrentNumber = 1;
    let bomChannelId = '1400487727774040174';
    let bomActive = true;
    let bomCurrentRoundUsers = new Set(); // Bu round'da yazmış kullanıcıları takip etmek için

    // BOM oyunu için messageCreate eventi
    client.on('messageCreate', async message => {
        // Sadece belirtilen kanalda ve bot mesajı değilse çalışsın
        if (message.channel.id === bomChannelId && !message.author.bot && bomActive) {
            const content = message.content.trim();
            
            // Bu kullanıcı bu round'da zaten yazmış mı kontrol et
            if (bomCurrentRoundUsers.has(message.author.id)) {
                await message.react('❌');
                await message.channel.send(`💥 **OYUN SIFIRLANDI!**\n\n❌ **${message.author.username}** zaten yazmış!\n\n🔄 **Oyun yeniden başlıyor!**`);
                bomCurrentNumber = 1;
                bomCurrentRoundUsers.clear();
                return;
            }
            
            // Doğru cevap kontrolü
            let expectedAnswer;
            if (bomCurrentNumber % 5 === 0) {
                expectedAnswer = 'BOM';
            } else {
                expectedAnswer = bomCurrentNumber.toString();
            }
            
            // Kullanıcının cevabını kontrol et
            if (content === expectedAnswer) {
                // Doğru cevap - devam et
                bomCurrentRoundUsers.add(message.author.id);
                bomCurrentNumber++;
                
                // 5'in katı olan sayılarda özel mesaj
                if (bomCurrentNumber % 5 === 0) {
                    await message.react('✅');
                    await message.channel.send(`🎯 **Sıra:** ${bomCurrentNumber} - **BOM** yazmalısın!`);
                }
            } else {
                // Yanlış cevap - oyunu sıfırla
                await message.react('❌');
                await message.channel.send(`💥 **OYUN SIFIRLANDI!**\n\n❌ **${message.author.username}** yanlış cevap verdi!\n\n📝 **Doğru cevap:** ${expectedAnswer}\n🎯 **Sıra:** ${bomCurrentNumber}\n\n🔄 **Oyun yeniden başlıyor!**`);
                
                // Oyunu sıfırla
                bomCurrentNumber = 1;
                bomCurrentRoundUsers.clear();
            }
        }
    });

    client.login(TOKEN);
