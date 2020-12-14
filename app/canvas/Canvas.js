import { View }   from 'curvature/base/View';
import { Menu }   from '../menu/Menu';
import { Panel }  from '../panel/Panel';
import { Invert } from '../processor/Invert';

export class Canvas extends View
{
	template = require('./canvas.html');

	constructor(args, parent)
	{
		super(args, parent);

		this.args.height  = this.args.height || 128;
		this.args.width   = this.args.width  || 128;
		this.args.scale   = this.args.scale  || 2;
		this.args.offset  = 0;
		this.scrollDelta  = 1;

		this.args.decoder  = args.decoder || 'gameboy';
		this.args.showSettings = false;

		this.args.buffer = this.args.buffer || false;

		this.args.firstByte = '0000';
	}

	onRendered()
	{
		const canvasStyle = {
			'--scale':    this.args.scale
			, '--width':  this.args.width
			, '--height': this.args.height
		};

		this.args.bindTo('offset', (v,k) => {
			if(!this.args.buffer || !this.tags.canvas)
			{
				return;
			}

			this.drawDots(this.args.buffer);
		}, {wait: 0});

		this.args.bindTo('scale', (v,k) => {
			if(this.tags.canvas)
			{
				canvasStyle['--scale'] = v;
				this.tags.canvas.style(canvasStyle);
			}

			if(this.args.buffer)
			{
				this.drawDots(this.args.buffer);
			}
		}, {wait: 0});

		this.args.bindTo('width', (v,k) => {

			v = Number(v);

			if(this.tags.canvas)
			{
				canvasStyle['--width'] = v;
				this.tags.canvas.width = v;
				this.tags.canvas.style(canvasStyle);
			}

			if(this.args.buffer)
			{
				this.drawDots(this.args.buffer);
			}
		}, {wait: 0});

		this.args.bindTo('height', (v,k) => {

			v = Number(v);

			if(this.tags.canvas)
			{
				canvasStyle['--height'] = v;
				this.tags.canvas.height = v;
				this.tags.canvas.style(canvasStyle);
			}

			if(this.args.buffer)
			{
				this.drawDots(this.args.buffer);
			}

		}, {wait: 0});

		this.args.bindTo('input', v => {
			if(!v)
			{
				return;
			}

			this.args.filename = v.name;

			const reader = new FileReader();
			reader.readAsArrayBuffer(v);

			reader.onload = () => {
				this.args.buffer = new Uint8Array(reader.result);
				this.onTimeout(0, () => {
					this.drawDots(this.args.buffer);
				});
			};
		});

		this.args.bindTo('decoder', v => {

			if(!this.args.buffer)
			{
				return;
			}

			this.drawDots(this.args.buffer);

		}, {frame: true});
	}

	wheel(event)
	{
		event.preventDefault();

		if(event.deltaY < 1 && this.args.offset > 0)
		{
			this.args.offset = Number(this.args.offset) - this.scrollDelta;
		}
		else if(event.deltaY > 1)
		{
			this.args.offset = Number(this.args.offset) + this.scrollDelta;
		}

		if(0 > this.args.offset)
		{
			this.args.offset = 0;
		}
	}

	drawDots(bytes = undefined)
	{
		if(bytes === undefined)
		{
			bytes = this.args.buffer;
		}

		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		requestAnimationFrame(()=>context.clearRect(0, 0, canvas.width, canvas.height));

		switch(this.args.decoder)
		{
			case 'bytes':
				this.bytePerPixel(bytes);
				break;
			case 'gameboy':
				this.nin2bit(bytes);
				break;
			case 'gameboy-1bit':
				this.nin1bit(bytes);
				break;
			case 'bits':
				this.bitPerPixel(bytes);
				break;
		}
	};

	nin1bitCols(bytes)
	{
		this.scrollDelta = 1;

		const tilesize = 8;

		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		const width  = this.args.width;
		const height = Math.floor(this.args.height / width);

		let o = 0;

		const pixelsList = [];

		for(let i = 0; i < bytes.length; i += 1)
		{
			const byte = bytes[i];
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

			if(!pixelsList[currentTileY])
			{
				pixelsList[currentTileY] = context.createImageData(
					maxTilesX * 8, 8
				);
			}

			for(const j in bits)
			{
				// const
			}
		}

		for(const p in pixelsList)
		{
			requestAnimationFrame(()=>context.putImageData(pixelsList[p], 0, p*8));
		}
	}

	nin1bit(bytes)
	{
		this.scrollDelta = 1;

		const tilesize = 2;
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');


		const maxTilesX = Math.floor(this.args.width / tilesize);

		const offset = this.args.offset;
		const width  = this.args.width;

		const pixelsList = [];

		this.args.firstByte = offset * width;

		let o = 0;
		for(let i = 0; i < bytes.length; i += 1)
		{
			const byte = bytes[i];
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

			for(const j in bits)
			{
				const bit = bits[j];

				const currentTile  = Math.floor(o / tilesize**2);

				const currentTileX = currentTile % maxTilesX;
				const currentTileY = Math.floor(currentTile / maxTilesX);

				const tileOffset   = o % tilesize**2;

				const tileOffsetX  = Math.floor(tileOffset / tilesize);
				const tileOffsetY  = tileOffset % tilesize;

				if(!pixelsList[currentTileY])
				{
					pixelsList[currentTileY] = context.createImageData(
						width, tilesize
					);
				}

				const pixels = pixelsList[currentTileY];

				const fromOriginX = (currentTileX * tilesize) + tileOffsetX;
				const fromOriginY = tileOffsetY;

				const address = 4 * (width * fromOriginY + fromOriginX);

				pixels.data[address+0] = bits[j] ? 255 : 0;
				pixels.data[address+1] = bits[j] ? 255 : 0;
				pixels.data[address+2] = bits[j] ? 255 : 0;
				pixels.data[address+3] = bits[j] ? 255 : 255;

				o++;
			}
		}

		for(const p in pixelsList)
		{
			requestAnimationFrame(()=>context.putImageData(pixelsList[p], 0, p*tilesize));
		}
	}

	nin2bit(bytes)
	{
		this.scrollDelta = 1;

		const pallet  = [
			[0xFF, 0xFF, 0xFF]
			, [0x44, 0x44, 0x44]
			, [0xCC, 0xCC, 0xCC]
			, [0x00, 0x00, 0x00]
		];
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');
		let o = 0;

		const maxTilesX = Math.floor(this.args.width / 8);

		const height = Math.ceil(this.args.height / 8) * 8;
		const offset = this.args.offset;
		const width  = this.args.width;

		const pixelsList = [];

		this.args.firstByte = offset * (maxTilesX) * 16;

		for(let i = 0; i < bytes.length; i += 2)
		{
			const byteA = bytes[i];
			const byteB = bytes[i+1];

			if(o < offset * (maxTilesX) * 8)
			{
				o++;
				continue;
			}

			if(o > (height * width) + (offset * (maxTilesX * 8)))
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
				const ii = o - offset * maxTilesX * 8;

				const currentTile  = Math.floor(ii / 64);
				const currentTileX = currentTile % maxTilesX;
				const currentTileY = Math.floor(currentTile / maxTilesX);
				const fromTile     = ii % 64;
				const fromTileY    = Math.floor(fromTile / 8);
				const fromTileX    = fromTile % 8;
				const fromOriginX = (currentTileX * 8) + fromTileX;
				const fromOriginY = fromTileY;

				if(!pixelsList[currentTileY])
				{
					pixelsList[currentTileY] = context.createImageData(
						maxTilesX * 8, 8
					);
				}

				const pixels = pixelsList[currentTileY];

				const address = 4 * (maxTilesX * 8 * fromOriginY + fromOriginX);

				pixels.data[address+0] = pallet[ bitPairs[j] ][0];
				pixels.data[address+1] = pallet[ bitPairs[j] ][1];
				pixels.data[address+2] = pallet[ bitPairs[j] ][2];
				pixels.data[address+3] = 255;

				o++;
			}
		}

		for(const p in pixelsList)
		{
			requestAnimationFrame(()=>context.putImageData(pixelsList[p], 0, p*8));
		}
	}

	bytePerPixel(bytes)
	{
		this.scrollDelta = 8;

		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');
		let i = 0;

		this.args.firstByte = this.args.offset * this.args.width;

		const pixelsList = [];
		const pixelCounts = []

		for(const byte of bytes.slice(this.args.firstByte))
		{
			const renderRow  = Math.floor(i / this.args.width);
			const renderBand = Math.floor(renderRow / 8);
			const rowOffset  = Math.floor(this.args.offset / this.args.width);

			i++;

			if(i > (this.args.height * this.args.width) + rowOffset)
			{
				break;
			}

			if(!pixelsList[renderBand])
			{
				pixelsList[renderBand] = context.createImageData(
					context.canvas.width, 8
				);

				pixelCounts[renderBand] = 0;
			}

			const pixels = pixelsList[renderBand];

			pixels.data[ pixelCounts[renderBand]++ ] = byte;
			pixels.data[ pixelCounts[renderBand]++ ] = byte;
			pixels.data[ pixelCounts[renderBand]++ ] = byte;
			pixels.data[ pixelCounts[renderBand]++ ] = 255;

		}

		for(const p in pixelsList)
		{
			requestAnimationFrame(()=>context.putImageData(pixelsList[p], 0, p*8));
		}

		// context.putImageData(pixels, 0, 0);
	}

	bitPerPixel(bytes)
	{
		this.scrollDelta = 8;

		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');
		let i = 0;
		let o = 0;

		this.args.firstByte = 8 * this.args.offset * this.args.width;

		const pixelCounts = [];
		const pixelsList  = [];

		bytes:for(const byte of bytes)
		{
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

			bits:for(const bit of bits)
			{

				const renderRow  = Math.floor(o / this.args.width);
				const renderBand = Math.floor(renderRow / 8);
				const rowOffset  = Math.floor(this.args.offset / this.args.width);

				if(!pixelsList[renderBand])
				{
					pixelsList[renderBand] = context.createImageData(
						context.canvas.width, 8
					);

					pixelCounts[renderBand] = 0;
				}

				if(i < this.args.offset * this.args.width)
				{
					i++;
					continue;
				}

				i++;

				if(o > this.args.height * this.args.width)
				{
					break bytes;
				}

				o++;

				const pixels = pixelsList[renderBand];

				pixels.data[ pixelCounts[renderBand]++ ] = bit * 255;
				pixels.data[ pixelCounts[renderBand]++ ] = bit * 255;
				pixels.data[ pixelCounts[renderBand]++ ] = bit * 255;
				pixels.data[ pixelCounts[renderBand]++ ] = 255;
			}
		}

		for(const p in pixelsList)
		{
			requestAnimationFrame(()=>context.putImageData(pixelsList[p], 0, p*8));
		}
	}

	toggleSettings()
	{
		this.args.showSettings = !this.args.showSettings;
	}

	zoomIn()
	{
		this.args.scale++;
	}

	zoomOut()
	{
		this.args.scale--;
	}

	run(event)
	{
		const rootPanel  = this.args.panel;
		const input      = this;
		const menuPanel  = new Panel({
			title: 'Select a Processor'
			, widget: new Menu({input, panel: rootPanel})
			, left: event.clientX + 'px'
			, top: event.clientY + 'px'
		});

		rootPanel.args.panels.push(menuPanel);
	}

	hex(x)
	{
		return Number(x).toString(16).padStart(4, '0');
	}
}
