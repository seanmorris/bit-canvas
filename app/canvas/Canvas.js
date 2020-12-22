import { Mixin }  from 'curvature/base/Mixin';
import { View }   from 'curvature/base/View';

import { Invert } from '../processor/Invert';
import { Menu }   from '../menu/Menu';

import { Panelable } from '../panel/Panelable';
import { Panel }     from '../panel/Panel';

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

		this.args.height = args.height || 128;
		this.args.width  = args.width  || 128;
		this.args.scale  = args.scale  || 2;

		this.args.tileArea = 1;
		this.args.offset   = 0;
		this.scrollDelta   = 1;

		this.args.decoder  = args.decoder || 'gameboy';
		this.args.showSettings = false;

		this.args.input = args.input || false;

		this.args.firstByte = '0000';

		Object.assign(this.panel.args, {
			widget:  this
			, title: args.title || args.input && args.input.name || 'Canvas'
		});
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
			this.args.offset -= this.args.width * this.depth;
		}
		else if(event.deltaY > 1)
		{
			this.args.offset += this.args.width * this.depth;
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
			else if(event.shiftKey)
			{
				this.args.offset += this.args.width  * this.depth * 2;
			}
			else
			{
				this.args.offset += this.args.width * this.depth;
			}

			this.drawDots();
		}
		else if(event.key === 'ArrowUp')
		{
			if(event.ctrlKey)
			{
				this.args.offset -= this.depth;
			}
			else if(event.shiftKey)
			{
				this.args.offset -= this.args.width  * this.depth * 2;
			}
			else
			{
				this.args.offset -= this.args.width * this.depth;
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
			else if(event.shiftKey)
			{
				this.args.offset += this.tileArea * (this.depth / 8) * 2;
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
			else if(event.shiftKey)
			{
				this.args.offset -= this.tileArea * (this.depth / 8) * 2;
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

			let formatter = null;

			switch(this.args.decoder)
			{
				case 'bytes':
					formatter = BytePerPixel;
					break;
				case 'bits':
					formatter = BitPerPixel;
					break;
				case 'gameboy':
					formatter = Gameboy2bpp;
					break;
				case 'gameboy-1bit':
					formatter = Gameboy1bpp;
					break;
				case 'gameboy-1bit-cols':
					formatter = Gameboy1bppCol;
					break;
			}

			this.format(formatter, bytes)
		});
	};

	format(formatter, bytes)
	{
		const canvas  = this.tags.canvas;
		const context = canvas.getContext('2d');

		const inputBuffer  = bytes.slice(this.args.offset);
		const output       = context.createImageData(this.args.width, this.args.height);
		const outputBuffer = output.data;

		const pixels = new formatter(
			inputBuffer
			, outputBuffer
			, this.args.width
		);

		this.tileArea = pixels.tileWidth * pixels.tileHeight;
		this.depth    = pixels.depth;

		while( pixels.next() );

		requestAnimationFrame(
			()=>context.putImageData(output, 0, 0)
		);
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

	save(event)
	{

	}

	run(event)
	{
		const rootPanel = this.args.panel;

		const input = this;
		const menu  = new Menu({input, panel: rootPanel}, this);

		rootPanel.panels.add(menu.panel);
	}

	hex(x)
	{
		return Number(x).toString(16).padStart(4, '0');
	}
}

Mixin.to(Canvas, Panelable);
