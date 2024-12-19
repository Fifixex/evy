//@ts-check

import { BASE_URL, GATEWAY_URL } from '../config.js'
import { BaseClient } from './BaseClient.js'
import WebSocket from 'ws'

class Message {
	constructor(client, data) {
		this.client = client
		this.message = data
	}

	async reply(content) {
		await this.client.sendMessage(this.message.channel_id, { ...content })
	}

	async delete() {
		await this.client.deleteMessage(this.message.channel_id, this.message.id)
	}
	get content() {
		return this.message.content
	}
}

/**
 * The main hub for interacting with the Discord API.
 */
export class Client extends BaseClient {
	/**
	 * @param options Options for the client
	 */
	constructor(options) {
		super(options)
		if (options.intents === undefined) throw Error('Intents undefined!')

		this.intents = options.intents
		this.token = options.token || process.env.DISCORD_TOKEN

		if (!this.token) throw new Error('No token provided')
	}

	async login(token = this.token) {
		if (!token || typeof token !== 'string') throw 'Token invalid!'

		this.token = token.replace(/^(Bot|Bearer)\s*/i, '')
		console.log(`Logging in with token: ${this._censoredToken}`)

		await this.connect()
		return this.token
	}

	async connect() {
		this.ws = new WebSocket(GATEWAY_URL)
		this.ws.on('open', () => this.identify())
		this.ws.on('close', () => this.connect())
		this.ws.on('error', () => this.ws?.close())

		this.ws.on('message', (data) => {
			const message = JSON.parse(data)
			if (message.op === 0 && message.t === 'MESSAGE_CREATE') {
				this.emit('message', new Message(this, message.d))
			}
		})
	}

	identify() {
		this.ws?.send(
			JSON.stringify({
				op: 2,
				d: {
					token: this.token,
					intents: this.intents,
					properties: {
						$os: 'linux',
						$browser: 'my-library',
						$device: 'my-library',
					},
				},
			}),
		)
	}

	async destroy() {
		if (this.ws) {
			this.ws.close()
		}
		this.token = null
	}

	async sendMessage(channelId, payload) {
		const response = await fetch(`${BASE_URL}/channels/${channelId}/messages`, {
			method: 'POST',
			headers: {
				Authorization: this.token,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		})

		return response.json()
	}

	async deleteMessage(channelId, messageId) {
		await fetch(`${BASE_URL}/channels/${channelId}/messages/${messageId}`, {
			method: 'DELETE',
			headers: {
				Authorization: this.token,
				'Content-Type': 'application/json',
			},
		})
	}
	/**
	 * Partially censored client token for debug logging purposes.
	 * @type {?string}
	 * @readonly
	 * @private
	 */
	get _censoredToken() {
		if (!this.token) return null

		return this.token
			.split('.')
			.map((val, i) => (i > 1 ? val.replace(/./g, '*') : val))
			.join('.')
	}
}
