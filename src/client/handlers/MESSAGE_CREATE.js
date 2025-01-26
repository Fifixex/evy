export const MessageCreate = (client, packet, _) => {
	client.actions.MessageCreate.handle(packet.d)
}
