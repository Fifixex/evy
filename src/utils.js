export function snowflake(workerId = 1, processId = 1, increment = 0) {
	const timestamp = Date.now()
	const binaryTimestamp = (BigInt(timestamp) - BigInt(1420070400000))
		.toString(2)
		.padStart(42, '0')
	const binaryWorkerId = (BigInt(workerId) & BigInt(31))
		.toString(2)
		.padStart(5, '0')
	const binaryProcessId = (BigInt(processId) & BigInt(31))
		.toString(2)
		.padStart(5, '0')
	const binaryIncrement = (BigInt(increment) & BigInt(4095))
		.toString(2)
		.padStart(12, '0')
	const binarySnowflake =
		binaryTimestamp + binaryWorkerId + binaryProcessId + binaryIncrement
	const snowflakeDecimal = BigInt('0b' + binarySnowflake)
	return snowflakeDecimal.toString()
}
