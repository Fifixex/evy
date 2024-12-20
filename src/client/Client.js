//@ts-check

import { BaseClient } from './BaseClient.js'
import { ActionsManager } from './actions/ActionsManager.js'
import { WebSocketManager } from '../ws/WebSocketManager.js'
import PacketHandlers from './handlers/index.js'

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

		this.actions = new ActionsManager(this)

		const wsOptions = {
			...options.ws,
			intents: options.intents,
			token: null,
		}

		this.ws = new WebSocketManager(wsOptions)
		this.intents = options.intents

		Reflect.defineProperty(this, 'token', { writable: true })

		if (!this.token && 'DISCORD_TOKEN' in process.env)
			this.token = process.env.DISCORD_TOKEN
		else if (options.ws.token) this.token = options.ws.token
		else this.token = null

		this._attachEvents()
	}

	async login(token = this.token) {
		if (!token || typeof token !== 'string') throw 'Token invalid!'

		this.token = token.replace(/^(Bot|Bearer)\s*/i, '')
		console.debug(`Logging in with token: ${this._censoredToken}`)

		this.ws.setToken(this.token)

		try {
			await this.ws.connect()
			return this.token
		} catch (error) {
			this.destroy()
			throw error
		}
	}

	destroy() {
		super.destroy()
		this.ws.destroy()
		this.token = null
	}

	_handlePacket(packet, shardId) {
		if (PacketHandlers[packet.t]) {
			PacketHandlers[packet.t](this, packet, shardId)
		}
	}

	_attachEvents() {
		this.ws.on('debug', (message, shardId) =>
			this.emit(
				'debug',
				`[WS => ${typeof shardId === 'number' ? `Shard ${shardId}` : 'Manager'}] ${message}`,
			),
		)
		this.ws.on('dispatch', this._handlePacket.bind(this))
		this.ws.on('ready', (data) => console.log(data))
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
