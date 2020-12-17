import { Gameboy1bpp } from './Gameboy1bpp';

export class Gameboy1bppCol extends Gameboy1bpp
{
	tileWidth  = 2;
	tileHeight = 2;
	depth      = 1;

	next()
	{
		if(this.inputPos >= this.inputBuffer.length)
		{
			return;
		}

		const byte = this.inputBuffer[this.inputPos++];

		const maxTilesX = Math.floor(this.width / this.tileWidth);

		const bits = [
			(byte & 0b00000001) >> 0
			, (byte & 0b00000010) >> 1
			, (byte & 0b00000100) >> 2
			, (byte & 0b00001000) >> 3
			, (byte & 0b00010000) >> 4
			, (byte & 0b00100000) >> 5
			, (byte & 0b01000000) >> 6
			, (byte & 0b10000000) >> 7
		];

		const tileArea = this.tileWidth * this.tileHeight;

		for(const j in bits)
		{
			const currentTile  = Math.floor(this.outputPos / tileArea);

			const currentTileX = currentTile % maxTilesX;
			const currentTileY = Math.floor(currentTile / maxTilesX);

			const tileOffset   = this.outputPos % this.tileWidth**2;

			const tileOffsetX  = Math.floor(tileOffset / this.tileWidth);
			const tileOffsetY  = tileOffset % this.tileHeight;

			const fromOriginX = (currentTileX * this.tileWidth)  + tileOffsetX;
			const fromOriginY = (currentTileY * this.tileHeight) + tileOffsetY;

			const address = 4 * (this.width * fromOriginY + fromOriginX);

			this.outputBuffer[address+0] = bits[j] ? 255 : 0;
			this.outputBuffer[address+1] = bits[j] ? 255 : 0;
			this.outputBuffer[address+2] = bits[j] ? 255 : 0;
			this.outputBuffer[address+3] = bits[j] ? 255 : 255;

			this.outputPos++;
		}

		return this.outputPos * 4 < this.outputBuffer.length;
	}
}
