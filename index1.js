const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const STAFF_ROLE_ID = '1482548940384501900';
const OWNER_ROLE_ID = '1514801783585767534';

const CLIENT_ID = '1515359848680652891';
const GUILD_ID = '1512371111059390596';

const claimedTickets = new Set();

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

const commands = [
    new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close the current ticket')
].map(command => command.toJSON());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('clientReady', async () => {
    console.log(`${client.user.tag} connected`);

    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log('✅ Slash command /close registered.');
    } catch (error) {
        console.error('❌ Failed to register slash command:');
        console.error(error);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.trim() === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Open a Ticket')
            .setDescription('Choose a reason below to open a ticket.')
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
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'close') {
            if (!interaction.channel.name.endsWith('-ticket')) {
                return interaction.reply({
                    content: '❌ This command can only be used inside a ticket.',
                    ephemeral: true
                });
            }

            claimedTickets.delete(interaction.channel.id);

            await interaction.reply('🔒 Ticket will be closed in 5 seconds...');

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);

            return;
        }
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === 'claim_ticket') {
        if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
            return interaction.reply({
                content: '❌ Only owners can claim tickets.',
                ephemeral: true
            });
        }

        if (!interaction.channel.name.endsWith('-ticket')) {
            return interaction.reply({
                content: '❌ This button can only be used inside a ticket.',
                ephemeral: true
            });
        }

        if (claimedTickets.has(interaction.channel.id)) {
            return interaction.reply({
                content: '❌ This ticket has already been claimed.',
                ephemeral: true
            });
        }

        claimedTickets.add(interaction.channel.id);

        return interaction.reply({
            content: `✅ Ticket claimed by ${interaction.user}`
        });
    }

    if (interaction.customId === 'close_ticket') {
        claimedTickets.delete(interaction.channel.id);

        await interaction.reply('🔒 Ticket will be closed in 5 seconds...');

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
    const channelName = `${id.replaceAll('_', '-')}-ticket`;

    const existing = interaction.guild.channels.cache.find(
        c => c.topic === interaction.user.id
    );

    if (existing) {
        return interaction.reply({
            content: `You already have an open ticket: ${existing}`,
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
                id: OWNER_ROLE_ID,
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
            `Welcome ${interaction.user}\n\n` +
            `**Reason:** ${nomProduit}\n\n` +
            `Please explain your request here. A staff member will assist you shortly.`
        )
        .setColor('#2b2d31');

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('claim_ticket')
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
        content: `${interaction.user} <@&${OWNER_ROLE_ID}>`,
        embeds: [embed],
        components: [buttonRow]
    });

    await interaction.reply({
        content: `✅ Ticket created: ${ticketChannel}`,
        ephemeral: true
    });
});

client.login(process.env.TOKEN);