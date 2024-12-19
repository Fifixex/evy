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
}
