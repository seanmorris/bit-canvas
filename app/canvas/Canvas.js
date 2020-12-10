import { View } from 'curvature/base/View';

export class Canvas extends View
{
	template = require('./canvas.html');

	constructor(args, parent)
	{
		super(args, parent);

		this.args.width  = 128;
		this.args.height = 128;
		this.args.offset = 0;
		this.args.scale  = 1;

		this.file = false;
	}

	onAttached()
	{
		const canvasStyle = {
			'--scale':    this.args.scale
			, '--width':  this.args.width
			, '--height': this.args.height
		};

		this.args.bindTo('offset', (v,k) => {
			this.args.offset = v;
			this.file && this.drawDots(this.file);
		});

		this.args.bindTo('scale', (v,k) => {
			canvasStyle['--scale'] = v;
			this.tags.canvas.style(canvasStyle);
			this.file && this.drawDots(this.file);
		});

		this.args.bindTo('width', (v,k) => {
			canvasStyle['--width'] = v;
			this.tags.canvas.style(canvasStyle);
			this.tags.canvas.width = v;
			this.file && this.drawDots(this.file);
		});

		this.args.bindTo('height', (v,k) => {
			canvasStyle['--height'] = v;
			this.tags.canvas.style(canvasStyle);
			this.tags.canvas.height = v;
			this.file && this.drawDots(this.file);
		});

		this.args.bindTo('input', v => {
			v && this.drawDots(v);
			this.file = v;
		});
	}

	wheel(event)
	{
		event.preventDefault();

		if(event.deltaY < 1 && this.args.offset > 0)
		{
			this.args.offset = Number(this.args.offset) - 1;
		}
		else if(event.deltaY > 1)
		{
			this.args.offset = Number(this.args.offset) + 1;
		}

		if(0 > this.args.offset)
		{
			this.args.offset = 0;
		}
	}

	drawDots(file)
	{
		const reader = new FileReader();

		reader.readAsArrayBuffer(file);

		reader.onload = () => {
			const bytes = new Uint8Array(reader.result);
			this.nin2bit(bytes);
		};
	};

	nin2bit(bytes)
	{
		const pallet  = [
			[0xFF, 0xFF, 0xFF]
			, [0x44, 0x44, 0x44]
			, [0x88, 0x88, 0x88]
			, [0x00, 0x00, 0x00]
		];
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		let o = 0;

		const maxTilesX = Math.floor(this.args.width / 8);

		const height = Math.ceil(this.args.height / 8) * 8;
		const offset = this.args.offset;
		const width  = this.args.width;

		const pixels = context.createImageData(
			maxTilesX * 8, context.canvas.height
		);

		const pixelsList = []

		for(let i = 0; i < bytes.length; i += 2)
		{
			const byteA = bytes[i];
			const byteB = bytes[i+1];

			if(o < offset * (maxTilesX * 8) * 8)
			{
				o++;
				continue;
			}

			if(o > (height * width) + (offset * (maxTilesX * 64)))
			{
				break;
			}

			const bitPairs = [
				(((byteA & 0b10000000) << 1) | (byteB & 0b10000000)) >> 7
				, (((byteA & 0b01000000) << 1) | (byteB & 0b01000000)) >> 6
				, (((byteA & 0b00100000) << 1) | (byteB & 0b00100000)) >> 5
				, (((byteA & 0b00010000) << 1) | (byteB & 0b00010000)) >> 4
				, (((byteA & 0b00001000) << 1) | (byteB & 0b00001000)) >> 3
				, (((byteA & 0b00000100) << 1) | (byteB & 0b00000100)) >> 2
				, (((byteA & 0b00000010) << 1) | (byteB & 0b00000010)) >> 1
				, (((byteA & 0b00000001) << 1) | (byteB & 0b00000001)) >> 0
			];

			for(const j in bitPairs)
			{
				const ii = o - offset * maxTilesX * 64;

				const currentTile  = Math.floor(ii / 64);
				const currentTileX = currentTile % maxTilesX;
				const currentTileY = Math.floor(currentTile / maxTilesX);
				const fromTile     = ii % 64;
				const fromTileY    = Math.floor(fromTile / 8);
				const fromTileX    = fromTile % 8;

				if(!pixelsList[currentTileY])
				{
					pixelsList[currentTileY] = context.createImageData(
						maxTilesX * 8, 8
					);
				}

				const ppixels = pixelsList[currentTileY];

				const fromOriginX = (currentTileX * 8) + fromTileX;
				const fromOriginY = fromTileY;

				const address = 4 * (maxTilesX * 8 * fromOriginY + fromOriginX);

				pixels.data[address+0] = pallet[ bitPairs[j] ][0];
				pixels.data[address+1] = pallet[ bitPairs[j] ][1];
				pixels.data[address+2] = pallet[ bitPairs[j] ][2];
				pixels.data[address+3] = 255;

				ppixels.data[address+0] = pallet[ bitPairs[j] ][0];
				ppixels.data[address+1] = pallet[ bitPairs[j] ][1];
				ppixels.data[address+2] = pallet[ bitPairs[j] ][2];
				ppixels.data[address+3] = 127;

				o++;
			}
		}

		for(const p in pixelsList)
		{
			context.putImageData(pixelsList[p], 0, p*8);
		}

		// context.putImageData(pixels, 0, 0);
	}

	bytePerPixel(bytes)
	{
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');
		const height  = Math.ceil(bytes.length / context.canvas.width);
		const pixels  = context.createImageData(
			context.canvas.width, context.canvas.height
		);

		let i = 0;
		let o = 0;

		for(const byte of bytes)
		{
			if(i++ < this.args.offset * this.args.width)
			{
				continue;
			}

			if(i > (this.args.height * this.args.width) + (this.args.offset * this.args.width))
			{
				break;
			}

			pixels.data[o++] = byte;
			pixels.data[o++] = byte;
			pixels.data[o++] = byte;
			pixels.data[o++] = 255;
		}

		context.putImageData(pixels, 0, 0);
	}
}
