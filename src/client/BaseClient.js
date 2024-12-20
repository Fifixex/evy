import EventEmitter from 'node:events'

export class BaseClient extends EventEmitter {
	constructor(options = {}) {
		super({ captureRejections: true })

		if (typeof options !== 'object' || options === null)
			throw 'Invalid options!'

		this.options = options
	}

	destroy() {
		this.removeAllListeners()
	}

	/**
	 * Increments max listeners by one, if they are not zero.
	 * @private
	 */
	incrementMaxListeners() {
		const maxListeners = this.getMaxListeners()
		if (maxListeners !== 0) {
			this.setMaxListeners(maxListeners + 1)
		}
	}

	/**
	 * Decrements max listeners by one, if they are not zero.
	 * @private
	 */
	decrementMaxListeners() {
		const maxListeners = this.getMaxListeners()
		if (maxListeners !== 0) {
			this.setMaxListeners(maxListeners - 1)
		}
	}
}
