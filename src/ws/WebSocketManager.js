//@ts-check
import WebSocket from 'ws'
import { once } from 'node:events'
import { GATEWAY_URL } from '../config.js'
import { ImportantGatewayOpcodes } from './constants.js'
import { GatewayDispatchEvents, GatewayOpcodes } from 'discord-api-types/v10'

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
			d: data,
		})
	}

	setToken(token) {
		if (this.#token) throw new Error('Token has already been set')
		this.#token = token
	}

	async destroy() {
		this.close()
	}

	async heartbeat(requested = false) {
		if (!requested) return this.destroy()
		await this.send({
			op: GatewayOpcodes.Heartbeat,
			d: null,
		})
	}

	async unpackMessage(data, isBinary) {
		if (!isBinary) {
			try {
				return JSON.parse(data)
			} catch {
				return null
			}
		}

		return null
	}

	async onMessage(data, isBinary) {
		const payload = await this.unpackMessage(data, isBinary)
		if (!payload) return

		switch (payload.op) {
			case GatewayOpcodes.Dispatch: {
				switch (payload.t) {
					case GatewayDispatchEvents.Ready:
						this.emit('ready', payload.d)
						break

					case GatewayDispatchEvents.Resumed: {
						console.debug('Resumed!')
						this.emit('resumed')
						break
					}
					default:
						break
				}

				this.emit('dispatch', payload)
				break
			}

			case GatewayOpcodes.Heartbeat: {
				await this.heartbeat(true)
				break
			}

			case GatewayOpcodes.Reconnect: {
				await this.destroy()
				break
			}

			case GatewayOpcodes.InvalidSession: {
				console.error('Invalid session!')
				this.destroy()
				break
			}
		}
	}

	async send(payload) {
		if (ImportantGatewayOpcodes.has(payload.op)) {
			super.send(JSON.stringify(payload))
			return
		}
		super.send(payload)
	}
}
