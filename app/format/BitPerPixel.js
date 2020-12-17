import { Format } from '../Format';

export class BitPerPixel extends Format
{
	depth = 1;

	next()
	{
		if(this.inputPos >= this.inputBuffer.length)
		{
			return;
		}

		const byte = this.inputBuffer[this.inputPos++];

		const bits = [
			(byte & 0b10000000) >> 7
			, (byte & 0b01000000) >> 6
			, (byte & 0b00100000) >> 5
			, (byte & 0b00010000) >> 4
			, (byte & 0b00001000) >> 3
			, (byte & 0b00000100) >> 2
			, (byte & 0b00000010) >> 1
			, (byte & 0b00000001) >> 0
		];

		for(const bit of bits)
		{
			const address = this.outputPos * 4;

			this.outputBuffer[ address + 0 ] = bit * 255;
			this.outputBuffer[ address + 1 ] = bit * 255;
			this.outputBuffer[ address + 2 ] = bit * 255;
			this.outputBuffer[ address + 3 ] = 255;

			this.outputPos++;
		}

		return this.outputPos * 4 < this.outputBuffer.length;
	}
}
