//@ts-check
import Action from './Action.js'

export class MessageCreateAction extends Action {
	handle(data) {
		const client = this.client
		const channel = this.getChannel({
			id: data.channel_id,
			author: data.author,
			...('guild_id' in data && { guild_id: data.guild_id }),
		})

		const existing = channel.messages.cache.get(data.id)
		if (existing && existing.author?.id !== this.client.user.id)
			return { message: existing }
		const message = existing ?? channel.messages._add(data)

		client.emit('messageCreate', message)

		return { message }
	}
}
