const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

const TOKEN = 'TON_TOKEN_BOT';
const STAFF_ROLE_ID = '1482548940384501900';

const produits = [
    ['nitro', 'Nitro'],
    ['server_boost', 'Server Boost'],
    ['compte_roblox', 'Compte Roblox'],
    ['watch_chill', 'Watch Chill'],
    ['fortnite_accounts', 'Fortnite Accounts'],
    ['nba_lifetime', 'NBA Lifetime'],
    ['twitch', 'Twitch'],
    ['discord_aged_accounts', 'Discord Aged Accounts'],
    ['decorations', 'Decorations'],
    ['nord_vpn', 'Nord VPN'],
    ['duolingo', 'Duolingo'],
    ['spotify_premium', 'Spotify Premium'],
    ['mullvad', 'Mullvad'],
    ['chatgpt_plus', 'ChatGPT Plus'],
    ['more', 'More'],
    ['support', 'Support']
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('clientReady', () => {
    console.log(`${client.user.tag} connecté`);
});

client.on('messageCreate', async message => {
    console.log('Message reçu :', message.content);
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Ouvrir un ticket')
            .setDescription('Choisis une raison ci-dessous pour ouvrir un ticket.')
            .setColor('#2b2d31')
            .setFooter({ text: 'Ticket System' });

        const rows = [];

        for (let i = 0; i < produits.length; i += 5) {
            const row = new ActionRowBuilder();

            produits.slice(i, i + 5).forEach(([id, label]) => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_${id}`)
                        .setLabel(label)
                        .setStyle(ButtonStyle.Secondary)
                );
            });

            rows.push(row);
        }

        await message.channel.send({
            embeds: [embed],
            components: rows
        });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 Ticket fermé dans 5 secondes...');
        setTimeout(() => {
            interaction.channel.delete().catch(() => {});
        }, 5000);
        return;
    }

    if (!interaction.customId.startsWith('ticket_')) return;

    const id = interaction.customId.replace('ticket_', '');
    const produit = produits.find(p => p[0] === id);

    if (!produit) return;

    const nomProduit = produit[1];
    const channelName = `ticket-${id.replaceAll('_', '-')}`;

    const existing = interaction.guild.channels.cache.find(
        c => c.topic === interaction.user.id
    );

    if (existing) {
        return interaction.reply({
            content: `Tu as déjà un ticket ouvert : ${existing}`,
            ephemeral: true
        });
    }

    const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        topic: interaction.user.id,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            },
            {
                id: STAFF_ROLE_ID,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.ManageMessages
                ]
            },
            {
                id: client.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ManageChannels
                ]
            }
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket - ${nomProduit}`)
        .setDescription(
            `Bienvenue ${interaction.user}\n\n` +
            `**Raison :** ${nomProduit}\n\n` +
            `Explique ta demande ici. Un membre du staff va te répondre.`
        )
        .setColor('#2b2d31');

    const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Fermer le ticket')
            .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
        content: `${interaction.user} <@&${STAFF_ROLE_ID}>`,
        embeds: [embed],
        components: [closeRow]
    });

    await interaction.reply({
        content: `✅ Ticket créé : ${ticketChannel}`,
        ephemeral: true
    });
});
client.on('messageCreate', message => {
    console.log('MESSAGE:', message.content);

    if (message.content === '!ping') {
        message.reply('pong');
    }
});
client.login(process.env.TOKEN);