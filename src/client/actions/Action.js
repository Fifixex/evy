//@ts-check

export default class GenericAction {
	constructor(client) {
		this.client = client
	}

	handle(data) {
		return data
	}

	getPayload(data, manager, id, partialType, cache) {
		return this.client.options.partials.includes(partialType)
			? manager._add(data, cache)
			: manager.cache.get(id)
	}

	getChannel(data) {
		const payloadData = {}
		const id = data.channel_id ?? data.id

		if (!('recipients' in data)) {
			// Try to resolve the recipient, but do not add the client user.
			const recipient = data.author ?? data.user ?? { id: data.user_id }
			if (recipient.id !== this.client.user.id)
				payloadData.recipients = [recipient]
		}

		if (id !== undefined) payloadData.id = id

		return (
			data[this.client.actions.injectedChannel] ??
			this.getPayload(
				{ ...data, ...payloadData },
				this.client.channels,
				id,
				'Channel',
			)
		)
	}
}
