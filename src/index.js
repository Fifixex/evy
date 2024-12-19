import 'dotenv/config'
import { Client } from './client/index.js'
import { PREFIX } from './config.js'
import { snowflake } from './utils.js'

// GUILD_MESSAGES (1 << 9) + DIRECT_MESSAGES (1 << 12) = 4608
const client = new Client({ intents: 4608 })

client.on('message', async (message) => {
	if (!message.content.startsWith(PREFIX)) return
	const args = message.content.slice(PREFIX.length).trim().split(/ +/)
	const command = args.shift()

	switch (command) {
		case 'help':
			await message.delete()
			return message.reply({
				mobile_network_type: 'unknown',
				content: '',
				nonce: snowflake(),
				tts: false,
				message_reference: {
					guild_id: '1289777798130569348',
					channel_id: '1289777798130569351',
					message_id: '1319111623641661532',
					type: 1,
				},
				flags: 0,
			})
	}
})

client.login(process.env.DISCORD_TOKEN)
