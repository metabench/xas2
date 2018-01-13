/**
 * Created by James on 17/10/2016.
 */


// XAS2 encodes single pieces of data

// For numeric data. String handling convers hex strings to numbers.
//  Does not encode strings.


// Best to keep XAS2 simple for that, and have something else to encode sequences of XAS2 or other data types.
//  Could do further extensions to address space that allow string encoding.

// For unsigned integers and 0
// ---------------------------

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

// Bug fixes put in after failure and further testing.

const max_1 = 251;
const max_2 = Math.pow(2, 16) + max_1 - 1;     // 252
const max_3 = Math.pow(2, 32) + max_2 - 1;     // 253
const max_4 = Math.pow(2, 48) + max_3 - 1;     // 254

// Something to store a string, saying how long the string is as well?
//  [str][xas2 number length][string itself in hex]

// We can make use of quite a lot of 48 bit keys using JavaScript numbers
//  Could even use a higher number, 52 or 53 bits

// For the moment, it looks like plenty can be done using JavaScript numbers.
var is_array = Array.isArray;

// An array of different values to put together as a buffer of xas2 encoded items?

var tof = (obj, t1) => {
    var res = t1 || typeof obj;

    if (res === 'number' || res === 'string' || res === 'function' || res === 'boolean') {
        return res;
    }

    if (res === 'object') {

        if (typeof obj !== 'undefined') {

            if (obj === null) {
                return 'null';
			}
			
            if (obj.__type) {
                return obj.__type;
            } else {
                

                // Inline array test, earlier on?

                if (obj instanceof Date) {
                    return 'date';
                }


                if (is_array(obj)) {
                    //res = 'array';
                    //return res;
                    return 'array';
                } else {

                    if (obj instanceof RegExp) res = 'regex';

                    // For running inside Node.
                    //console.log('twin ' + typeof window);
                    if (typeof window === 'undefined') {
                        //console.log('obj.length ' + obj.length);
                        if (obj instanceof Buffer) res = 'buffer';

                        //if (obj instanceof Stream.Readable) res = 'readable_stream';
                        //if (obj instanceof Stream.Writable) res = 'writable_stream';
                    }


                }
                //console.log('res ' + res);
                return res;

            }
        } else {
            return 'undefined';
        }

    }

    return res;
};

class XAS2 {
	'constructor'(spec) {
		var b;
		var t_spec = tof(spec);
		if (t_spec === 'number') {
			if (spec <= max_1) {
				b = Buffer.alloc(1);
				//console.log('spec', spec);
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

            // Looks like we never write the number 255.
            //  That could be used for going into a further address space.
            //  Could make xas3, which allows for strings to be encoded as well.
            //   


		}
		if (t_spec === 'string') {
			b = Buffer.from(spec, 'hex');
		}
		if (spec instanceof Buffer) {
			b = spec;
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

var xas2 = function (spec) {
    var t_spec = tof(spec);

    if (t_spec === 'array') {
        var res = new Array(spec.length), total_length = 0;
        spec.forEach((v, i) => {
            res[i] = xas2(v).buffer;
            total_length = total_length + res[i].length;
        });
        // then join all the buffers together?

        var buf = Buffer.concat(res, total_length);
        return buf;



    } else {
        return new XAS2(spec);
    }


	
}
xas2.XAS2 = XAS2;
xas2.read = function(buffer, pos) {
	var res;
	if (arguments.length === 1) {
		pos = 0;
	}

	//console.log('buffer.length', buffer.length);
	//console.log('pos', pos);
	//console.log('buffer', buffer);

	var i8 = buffer.readUInt8(pos);
	pos = pos + 1;
	if (i8 <= max_1) {

		if (arguments.length === 1) {
			res = i8;
		} else {
			res = [i8, pos];
		}
		//console.log('arguments.length', arguments.length);

		
	} else {
		//console.log('i8', i8);
		
		var i_res;

		if (i8 === 252) {
			i_res = buffer.readUInt16BE(pos) + max_1;
			pos = pos + 2;
		} else if (i8 === 253) {
			i_res = buffer.readUInt32BE(pos) + max_2;
			pos = pos + 4;
		} else if (i8 === 254) {
			i_res = buffer.readUIntBE(pos, 6) + max_3;
			pos = pos + 6;
		}

		if (arguments.length === 1) {
			res = i_res;
		} else {
			res = [i_res, pos];
		}
		//console.log('arguments.length', arguments.length);
		
		
	}
	return res;
}

// Single read of a value...


if (require.main === module) {
	//var number = 252;
	//console.log('number', number);

	//var key1 = new XAS2(number);
	//console.log('key1.hex', key1.hex);
	//console.log('key1.length', key1.length);

	//var key2 = xas2(key1.hex);
	//console.log('key2.length', key1.length);
	//console.log('key2.number', key1.number);

	//console.log('key2.buffer', key2.buffer);

	console.log('max_1', max_1);
	console.log('max_2', max_2);
	console.log('max_3', max_3);
	console.log('max_4', max_4);

	var max = Number.MAX_SAFE_INTEGER;
	var x, b, n;
	console.log('max', max);

	// 4295033081
	for (var c = 4295033000; c < max; c++) {
		
		try {
			//console.log("entering try block");
			//throw "thrown message";
			x = xas2(c);
			b = x.buffer;
			n = xas2.read(b);

			if (c !== n) {
				console.log('c, n', c, n);
				//throw 'stop';
				process.abort();
			} else {
				//console.log('c', c);
			}
			
			//console.log("this message is never seen");
		}
		catch (e) {
			console.log("entering catch block");
			console.log(e);
			console.log('c', c);
			console.log("leaving catch block");
		}
		finally {
			//console.log("entering and leaving the finally block");
		}
	}

} else {
	//console.log('required as a module');
}


// Make xas2 a function?
//  no need to use new then, give it a number or hex string and it will construct.

module.exports = xas2;