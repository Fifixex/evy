//@ts-check
import Action from './Action.js'

export class MessageCreateAction extends Action {
	handle(data) {
		const client = this.client
		client.emit('messageCreate', data)
	}
}
