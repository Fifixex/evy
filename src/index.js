import 'dotenv/config'
import { Client } from './client/index.js'
import { GatewayIntentBits } from 'discord-api-types/v10'

const client = new Client({
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds],
})

client.on('messageCreate', (message) => {
	if (message.content === 'ping') {
		console.log('pong')
	}
})

client.login(process.env.DISCORD_TOKEN)
