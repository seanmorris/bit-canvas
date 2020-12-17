import { Format } from '../Format';

export class BytePerPixel extends Format
{
	depth = 8;

	next()
	{
		if(this.inputPos >= this.inputBuffer.length)
		{
			return;
		}

		const byte = this.inputBuffer[this.inputPos++];

		const address = this.outputPos * 4;

		this.outputBuffer[ address + 0 ] = byte;
		this.outputBuffer[ address + 1 ] = byte;
		this.outputBuffer[ address + 2 ] = byte;
		this.outputBuffer[ address + 3 ] = 255;

		this.outputPos++;

		return address < this.outputBuffer.length;
	}
}
