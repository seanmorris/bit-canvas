import { View }   from 'curvature/base/View';
import { Menu }   from '../menu/Menu';
import { Panel }  from '../panel/Panel';
import { Invert } from '../processor/Invert';

import { BytePerPixel } from '../format/BytePerPixel';
import { BitPerPixel  } from '../format/BitPerPixel';

import { Gameboy1bpp } from '../format/Gameboy1bpp';
import { Gameboy2bpp } from '../format/Gameboy2bpp';

import { Gameboy1bppCol } from '../format/Gameboy1bppCol';

export class Canvas extends View
{
	template = require('./canvas.html');

	constructor(args, parent)
	{
		super(args, parent);

		this.args.height = this.args.height || 128;
		this.args.width  = this.args.width  || 128;
		this.args.scale  = this.args.scale  || 2;

		this.args.tileArea = 1;
		this.args.offset   = 0;
		this.scrollDelta   = 1;

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

			this.args.buffer = new Uint8Array(v.buffer);

			this.onTimeout(0, () => {
				this.drawDots(this.args.buffer);
			});
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

	keydown(event)
	{
		if(event.key === 'PageDown')
		{
			this.args.offset += this.args.width * this.args.height * (this.depth / 8);
			this.drawDots();
		}
		else if(event.key === 'PageUp')
		{
			this.args.offset -= this.args.width * this.args.height * (this.depth / 8);

			if(this.args.offset < 0)
			{
				this.args.offset = 0;
			}

			this.drawDots();
		}
		else if(event.key === 'ArrowDown')
		{
			if(event.ctrlKey)
			{
				this.args.offset += this.depth;
			}
			else
			{
				this.args.offset += this.scrollDelta;
			}

			this.drawDots();
		}
		else if(event.key === 'ArrowUp')
		{
			if(event.ctrlKey)
			{
				this.args.offset -= this.depth;
			}
			else
			{
				this.args.offset -= this.scrollDelta;
			}

			if(this.args.offset < 0)
			{
				this.args.offset = 0;
			}
			this.drawDots();
		}
		else if(event.key === 'ArrowRight')
		{
			if(event.ctrlKey)
			{
				this.args.offset++;
			}
			else
			{
				this.args.offset += this.tileArea * (this.depth / 8);
			}

			this.drawDots();
		}
		else if(event.key === 'ArrowLeft')
		{
			if(event.ctrlKey)
			{
				this.args.offset--;
			}
			else
			{
				this.args.offset -= this.tileArea * (this.depth / 8);
			}

			if(this.args.offset < 0)
			{
				this.args.offset = 0;
			}
			this.drawDots();
		}
		else if(event.key === 'Home')
		{
			this.args.offset = 0;
			this.drawDots();
		}
		else if(event.key === 'End')
		{
			this.args.offset = this.args.buffer.length;
			this.drawDots();
		}
	}

	drawDots(bytes = undefined)
	{
		if(this.willDraw)
		{
			cancelAnimationFrame(this.willDraw);
		}

		this.willDraw = requestAnimationFrame(()=>{
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
				case 'gameboy-1bit-cols':
					this.nin1bitCols(bytes);
					break;
				case 'bits':
					this.bitPerPixel(bytes);
					break;
			}
		});
	};

	nin1bitCols(bytes)
	{
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		const inputBuffer  = bytes.slice(this.args.offset);
		const output       = context.createImageData(this.args.width, this.args.height);
		const outputBuffer = output.data;

		const pixels = new Gameboy1bppCol(
			inputBuffer
			, outputBuffer
			, this.args.width
		);

		this.scrollDelta = this.args.width * pixels.depth;
		this.tileArea    = pixels.tileWidth * pixels.tileHeight;
		this.depth       = pixels.depth;

		while( pixels.next() );

		requestAnimationFrame(
			()=>context.putImageData(output, 0, 0)
		);
	}

	nin1bit(bytes)
	{
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		const inputBuffer  = bytes.slice(this.args.offset);
		const output       = context.createImageData(this.args.width, this.args.height);
		const outputBuffer = output.data;

		const pixels = new Gameboy1bpp(
			inputBuffer
			, outputBuffer
			, this.args.width
		);

		this.scrollDelta = this.args.width;
		this.tileArea    = pixels.tileWidth * pixels.tileHeight;
		this.depth       = pixels.depth;

		while( pixels.next() );

		requestAnimationFrame(
			()=>context.putImageData(output, 0, 0)
		);

		return;
	}

	nin2bit(bytes)
	{
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		const inputBuffer  = bytes.slice(this.args.offset);
		const output       = context.createImageData(this.args.width, this.args.height);
		const outputBuffer = output.data;

		const pixels = new Gameboy2bpp(
			inputBuffer
			, outputBuffer
			, this.args.width
		);

		this.scrollDelta = this.args.width * pixels.depth;
		this.tileArea    = pixels.tileWidth * pixels.tileHeight;
		this.depth       = pixels.depth;

		while( pixels.next() );

		requestAnimationFrame(
			()=>context.putImageData(output, 0, 0)
		);

		// const render = () => {
		// 	context.putImageData(output, 0, 0);
		// 	if(pixels.next())
		// 	{
		// 		requestAnimationFrame(() => render());
		// 	}
		// }

		// render();
	}

	bytePerPixel(bytes)
	{
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		const inputBuffer  = bytes.slice(this.args.offset);
		const output       = context.createImageData(this.args.width, this.args.height);
		const outputBuffer = output.data;

		const pixels = new BytePerPixel(
			inputBuffer
			, outputBuffer
			, this.args.width
		);

		this.scrollDelta = this.args.width * pixels.depth;
		this.tileArea    = pixels.tileWidth * pixels.tileHeight;
		this.depth       = pixels.depth;

		while( pixels.next() );

		requestAnimationFrame(
			()=>context.putImageData(output, 0, 0)
		);
	}

	bitPerPixel(bytes)
	{
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		const inputBuffer  = bytes.slice(this.args.offset);
		const output       = context.createImageData(this.args.width, this.args.height);
		const outputBuffer = output.data;

		const pixels = new BitPerPixel(
			inputBuffer
			, outputBuffer
			, this.args.width
		);

		this.scrollDelta = this.args.width * pixels.depth;
		this.tileArea    = pixels.tileWidth * pixels.tileHeight;
		this.depth       = pixels.depth;

		while( pixels.next() );

		requestAnimationFrame(
			()=>context.putImageData(output, 0, 0)
		);

		return;

		this.scrollDelta = 8;

		// const canvas  = this.tags.canvas;
		// const context = canvas.getContext('2d');
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

		rootPanel.panels.add(menuPanel);
	}

	hex(x)
	{
		return Number(x).toString(16).padStart(4, '0');
	}
}
