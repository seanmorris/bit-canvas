import { Format } from '../Format';

export class Gameboy1bpp extends Format
{
	tileWidth  = 8;
	tileHeight = 8;
	depth      = 1;

	next()
	{
		if(this.inputPos >= this.inputBuffer.length)
		{
			return;
		}

		const palette  = [
			[0xFF, 0xFF, 0xFF]
			, [0x44, 0x44, 0x44]
			, [0xCC, 0xCC, 0xCC]
			, [0x00, 0x00, 0x00]
		];

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

			const tileOffset   = this.outputPos % tileArea;

			const fromTileY    = Math.floor(tileOffset / this.tileWidth);
			const fromTileX    = this.tileWidth - (tileOffset % this.tileWidth);

			const fromOriginX = (currentTileX * this.tileWidth) + fromTileX;
			const fromOriginY = (currentTileY * this.tileHeight) + fromTileY;

			const address = maxTilesX * this.tileWidth * fromOriginY + fromOriginX;

			this.outputBuffer[address * 4 + 0] = palette[ bits[j] ][0];
			this.outputBuffer[address * 4 + 1] = palette[ bits[j] ][1];
			this.outputBuffer[address * 4 + 2] = palette[ bits[j] ][2];
			this.outputBuffer[address * 4 + 3] = 255;

			this.outputPos++;
		}

		return this.outputPos * 4 < this.outputBuffer.length;
	}
}
