/**
 * Created by James on 17/10/2016.
 */


// For unsigned integers

// XAS Extended Address Space technique                            XAS2
//  Single byte value,
//  0-251 - The value itself
//  252   - See the next 2 bytes (16 bits) for the address         Could then have a wider address space in these places too - because it won't be lower values. In a 16 bit address space,
//  253   - See the next 4 bytes (32 bits) for the address         we would not find addresses that would fit into the 8 bit address space. That means the lowest values within the 16 bit address space
//  254   - See the next 6 bytes (48 bits) for the address         could be made to be directly proceeding on from the previous. Meaning that all 16 bit addresses refer to addresses higher in memory
//  255   - See the next 8 bytes (64 bits) for the address         than the number says. This would get repeated further on. It would make it computationally more expensive to encode and decode numbers.
//



// Advantages: While parsing data, such as records, it can recognise the number and if the number is finished.
//             Small representations of numbers can be made efficiently, but with expandability in case they become big numbers


// 64 bit addresses are very tricky in JavaScript as it can't normally hold 64 bit integers.

// Want to be able to get efficiently sized keys out of numbers
//  Want to be able to tell how many bytes will be needed to represent a number
//  Want to be able to read a number from a position in a buffer, and also know how far to move the pointer onwards, or to have that done.


//console.log(251);

const max_1 = 251;
const max_2 = Math.pow(2, 16) + max_1;     // 252
const max_3 = Math.pow(2, 32) + max_2;     // 253
const max_4 = Math.pow(2, 48) + max_3;     // 254


/*
console.log('max_1', max_1);
console.log('max_2', max_2);
console.log('max_3', max_3);
console.log('max_4', max_4);





console.log('     ', Number.MAX_SAFE_INTEGER, 'Number.MAX_SAFE_INTEGER');
// The maximum safe integer is still a very large number


console.log(Math.pow(2, 32), '2^32');
console.log(Math.pow(2, 48), '2^48');
*/


// We can make use of quite a lot of 48 bit keys using JavaScript numbers
//  Could even use a higher number, 52 or 53 bits

// For the moment, it looks like plenty can be done using JavaScript numbers.


class XAS2 {
	'constructor'(spec) {
		var b;
		var t_spec = typeof spec;
		if (t_spec === 'number') {
			if (spec <= max_1) {
				b = Buffer.alloc(1);
				b.writeUInt8(spec, 0);
			} else if (spec <= max_2) {
				b = Buffer.alloc(3);
				b.writeUInt8(252, 0);
				b.writeUInt16BE(spec - max_1, 1);
			} else if (spec <= max_3) {
				b = Buffer.alloc(5);
				b.writeUInt8(253, 0);
				b.writeUInt32BE(spec - max_2, 1);
			} else if (spec <= max_4) {
				b = Buffer.alloc(7);
				b.writeUInt8(254, 0);
				b.writeUIntBE(spec - max_3, 1, 6);
			}
		}
		if (t_spec === 'string') {
			b = Buffer.from(spec, 'hex');
		}
		this._buffer = b;
	}
	get length() {
		return this._buffer.length;
	}
	get hex() {
		return this._buffer.toString('hex');
	}
	get number() {
		var l = this.length, b = this._buffer;
		if (l === 1) {
			return b.readUInt8(0);
		} else if (l === 3) {
			return b.readUInt16BE(1) + max_1;
		} else if (l === 5) {
			return b.readUInt32BE(1) + max_2;
		} else if (l === 7) {
			return b.readUIntBE(1, 6) + max_3;
		}
	}
	get buffer() {
		return this._buffer;
	}

}


if (require.main === module) {
	var number = 252;
	console.log('number', number);

	var key1 = new XAS2(number);
	console.log('key1.hex', key1.hex);
	console.log('key1.length', key1.length);

	var key2 = new XAS2(key1.hex);
	console.log('key2.length', key1.length);
	console.log('key2.number', key1.number);

	console.log('key2.buffer', key2.buffer);




} else {
	//console.log('required as a module');
}

module.exports = XAS2;