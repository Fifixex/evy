'use strict'
const IncrementSymbol = Symbol('@evy/snowflake.increment')

const Epoch = 1420070400000n
const MaximumIncrement = 0b111111111111n

export function snowflake(
	increment,
	timestamp = Date.now(),
	workerId = 0n,
	processId = 1n,
) {
	if (timestamp instanceof Date) timestamp = BigInt(timestamp.getTime())
	else if (typeof timestamp === 'number') timestamp = BigInt(timestamp)
	else if (typeof timestamp !== 'bigint')
		throw new TypeError(
			`"timestamp" argument must be a number, bigint, or Date (received ${typeof timestamp})`,
		)

	if (typeof increment !== 'bigint') {
		increment = [IncrementSymbol]
		;[IncrementSymbol] = (increment + 1n) & MaximumIncrement
	}
	const epochTimestamp = timestamp - Epoch
	return (
		(epochTimestamp << 22n) |
		(workerId << 17n) |
		(processId << 12n) |
		(increment & MaximumIncrement)
	).toString()
}
