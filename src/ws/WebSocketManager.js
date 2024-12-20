//@ts-check
import WebSocket from 'ws'
import { once } from 'node:events'
import { GATEWAY_URL } from '../config.js'
import { ImportantGatewayOpcodes } from './constants.js'
import { GatewayOpcodes } from 'discord-api-types/v10'

export class WebSocketManager extends WebSocket {
	#token = null

	constructor(options) {
		super(GATEWAY_URL)
		this.#token = options.token ?? null
		this.intents = options.intents
	}

	async connect() {
		const controller = new AbortController()
		let promise
		promise = Promise.race([
			once(this, 'ready', { signal: controller.signal }),
			once(this, 'resumed', { signal: controller.signal }),
		])
		void this._internalConnect()

		try {
			await promise
		} catch (error) {
			throw error
		} finally {
			controller.abort()
		}
	}

	async _internalConnect() {
		this.binaryType = 'arraybuffer'
		this.onmessage = (event) => {
			void this.onMessage(event.data, event.data instanceof ArrayBuffer)
		}

		this.onopen = () => this.identify()
		this.onclose = () => this.connect()
		this.onerror = () => void this.close()
	}

	async identify() {
		const data = {
			token: this.#token,
			intents: this.intents,
			properties: {
				$os: 'linux',
				$browser: 'my-library',
				$device: 'my-library',
			},
		}

		await this.send({
			op: GatewayOpcodes.Identify,
			// eslint-disable-next-line id-length
			d: data,
		})
	}

	setToken(token) {
		if (this.#token) throw new Error('Token has already been set')
		this.#token = token
	}

	destroy() {
		this.close()
	}

	async onMessage(data, isBinary) {
		console.debug(data)
	}

	async send(payload) {
		if (ImportantGatewayOpcodes.has(payload.op)) {
			super.send(JSON.stringify(payload))
			return
		}
		super.send(payload)
	}
}
