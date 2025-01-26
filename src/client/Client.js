//@ts-check

import { BaseClient } from './BaseClient.js'
import { ActionsManager } from './actions/ActionsManager.js'
import { WebSocketManager } from '../ws/WebSocketManager.js'
import PacketHandlers from './handlers/index.js'

/**
 * The main hub for interacting with the Discord API.
 * Provides methods and properties to manage the WebSocket connection, handle actions,
 * and interface with the Discord API.
 */
export class Client extends BaseClient {
	/**
	 * @param {Object} options Options for the client
	 */
	constructor(options) {
		super(options)

		this._validateOptions()

		/**
		 * Manages client actions and their associated logic.
		 * @type {ActionsManager}
		 */
		this.actions = new ActionsManager(this)

		/**
		 * The combined bitwise value of all provided intents.
		 * @type {number}
		 */
		this.intents = options.intents.reduce((acc, curr) => acc + curr, 0)

		const wsOptions = {
			...options.ws,
			intents: this.intents,
			token: null,
		}

		/**
		 * Manages the WebSocket connection to Discord.
		 * @type {WebSocketManager}
		 */
		this.ws = new WebSocketManager(wsOptions)

		Reflect.defineProperty(this, 'token', { writable: true })

		/**
		 * The client token used for authentication.
		 * @type {?string}
		 */
		this.token = options.ws?.token ?? process.env.DISCORD_TOKEN ?? null

		this._attachEvents()
	}

	/**
	 * Logs the client in using the provided token.
	 *
	 * @param {string | null} [token=this.token] - The authentication token. Defaults to the token set in the constructor.
	 * @returns {Promise<string>} The token used to authenticate the client.
	 * @throws Will throw an error if the token is invalid or the connection fails.
	 */
	async login(token = this.token) {
		if (!token || typeof token !== 'string') {
			throw new Error('Invalid token!')
		}

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

	/**
	 * Destroys the client instance, closing the WebSocket connection and clearing the token.
	 */
	destroy() {
		super.destroy()
		this.ws.destroy()
		this.token = null
	}

	/**
	 * Handles incoming packets from the WebSocket connection.
	 *
	 * @param {Object} packet - The received packet.
	 * @param {number} shardId - The ID of the shard that received the packet.
	 */
	_handlePacket(packet, shardId) {
		if (PacketHandlers[packet.t]) {
			PacketHandlers[packet.t](this, packet, shardId)
		}
	}

	/**
	 * Attaches internal event listeners to the WebSocket manager.
	 * These listeners handle debug messages and dispatch events.
	 *
	 * @private
	 */
	_attachEvents() {
		this.ws.on('debug', (message, shardId) =>
			this.emit(
				'debug',
				`[WS => ${typeof shardId === 'number' ? `Shard ${shardId}` : 'Manager'}] ${message}`,
			),
		)
		this.ws.on('dispatch', this._handlePacket.bind(this))
	}

	/**
	 * Validates the client options.
	 * @param {Object} [options=this.options] Options to validate
	 * @private
	 */
	_validateOptions(options = this.options) {
		if (options.intents === undefined && options.ws?.intents === undefined) {
			throw new Error('Intents must be provided.')
		}
	}
	/**
	 * Partially censored client token for debug logging purposes.
	 * Only the first two segments of the token are visible; the rest are replaced with asterisks.
	 *
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
