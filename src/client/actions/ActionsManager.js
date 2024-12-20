//@ts-check
import { MessageCreateAction } from './MessageCreate.js'

export class ActionsManager {
	injectedChannel = Symbol('@evy/actions.injectedChannel')

	constructor(client) {
		this.client = client
		this.register(MessageCreateAction)
	}
	register(Action) {
		this[Action.name.replace(/Action$/, '')] = new Action(this.client)
	}
}
