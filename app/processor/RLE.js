import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Processor } from '../Processor';

import { BitArray } from 'pokemon-parser/BitArray';

// 1176 byte buffer
// 3 392 byte sub-buffers

export class RLE extends Processor
{
	template = require('./rle.html');
	table1 = [...Array(16)].map((_,i)=> (2 << i) - 1);

	constructor(args,parent)
	{
		super(args, parent);

		this.sideSize = 7;
		this.tileSize = 8;

		this.args.offset = 16658;//220252;

		Object.assign(this.panel.args, {title: 'RLE + Delta'});
	}

	run()
	{
		const bitBuffer = this.args.input.args.buffer.slice(this.args.offset);

		const bits  = new BitArray(bitBuffer);
		let xSize = bits.next(4) || 7;
		let ySize = bits.next(4) || 7;

		xSize *= this.tileSize;

		const size  = xSize * ySize;

		xSize = xSize <= 56 ? xSize : 56;
		ySize = ySize <= 7  ? ySize : 7;

		this.sideSize = ySize;

		this.buffSize = (this.sideSize**2)*this.tileSize;

		const buffer = new Uint8Array(this.buffSize*3);

		this.buffer  = buffer;

		this.bufferA = new Uint8Array(buffer.buffer, this.buffSize*0, this.buffSize);
		this.bufferB = new Uint8Array(buffer.buffer, this.buffSize*1, this.buffSize*2);
		this.bufferC = new Uint8Array(buffer.buffer, this.buffSize*2, this.buffSize*1);

		const rootPanel = this.args.panel;

		const title  = 'RLE+Delta Decoded ' + this.args.inputName;

		const widget = new Canvas({
			buffer: this.buffer, panel: rootPanel, title
			, width: this.sideSize  * this.tileSize
			, height: this.sideSize * this.tileSize * 3
			, scale: 4
			, decoder: 'gameboy-1bit-cols'
			, module: 'rle'
		});

		rootPanel.panels.add(widget.panel);

		this.outputWidget = widget;

		const buffers = [new BitArray(this.bufferB), new BitArray(this.bufferC)];

		const order = bits.next();

		const bufB  = buffers[order];
		const bufC  = buffers[order ^ 1];

		widget.addEventListener('attached', ()=>{
			this.fillBuffer(bufB, bits, xSize, size).then(()=>{

				this.outputWidget.drawDots();
				let mode = bits.next();

				if(mode === 1)
				{
					mode = 1 + bits.next();
				}

				this.fillBuffer(bufC, bits, xSize, size).then(()=>{
					if(mode === 0)
					{
						this.deltaFill(bufB, xSize).then(()=>{
							return this.deltaFill(bufB, xSize);
						}).then(()=>{
							this.copy(new BitArray(this.bufferB), new BitArray(this.bufferA), ySize);
							this.copy(new BitArray(this.bufferC), new BitArray(this.bufferB), ySize);
							this.empty(new BitArray(this.bufferC));
							this.outputWidget.drawDots();
						});
					}
					else if(mode === 1)
					{
						this.deltaFill(bufB, xSize).then(()=>{
							this.xorFill(bufB, bufC);
							this.copy(new BitArray(this.bufferB), new BitArray(this.bufferA), ySize);
							this.copy(new BitArray(this.bufferC), new BitArray(this.bufferB), ySize);
							this.empty(new BitArray(this.bufferC));
							this.outputWidget.drawDots();
						});
					}
					else if(mode == 2)
					{
						this.deltaFill(bufB,xSize).then(()=>{
							return this.deltaFill(bufC,xSize);
						}).then(()=>{
							this.xorFill(bufB, bufC);
							this.outputWidget.drawDots();
							this.copy(new BitArray(this.bufferB), new BitArray(this.bufferA), ySize);
							this.copy(new BitArray(this.bufferC), new BitArray(this.bufferB), ySize);
							this.empty(new BitArray(this.bufferC));
							this.outputWidget.drawDots();
						});
					}
				});

			});
		}, {once:true});

		this.remove();
	}

	fillBuffer(buffer, bits, xSize, size)
	{
		return new Promise(accept => {

			const bitSize = size * 8;
			let mode      = bits.next();

			let i = 0;

			const fill = () =>	{

				if(mode === 0)
				{
					i = this.rleFill(buffer, bits, i);

					mode = 1;
				}
				else if(mode === 1)
				{
					i = this.dataFill(buffer, bits, i);
					mode = 0;
				}

				if(i < bitSize)
				{
					if(i % (this.sideSize * this.tileSize * 1) === 0)
					{
						setTimeout(() => fill(), 100);
						this.outputWidget.drawDots();
					}
					else
					{
						fill();
					}
				}
				else
				{
					return accept();
				}
			}

			fill();
		});

	}

	rleFill(buffer, bits, i)
	{
		let ii = 0;
		let bit = '';
		let read = '';

		while(bit = bits.next())
		{
			read += bit;
			ii++;
		}

		read += bit;

		const n = this.table1[ii];
		const a = bits.next(ii+1);
		const m = n + a;

		for(let j = 0; j < m; j++)
		{
			// buffer.set(i++, 0);
			// buffer.set(i++, 0);
			i++;
			i++;
		}

		return i;
	}

	dataFill(buffer, bits, i)
	{
		const fill = [];

		while(true)
		{
			const b1 = bits.next();
			const b2 = bits.next();

			if(b1 === 0 && b2 === 0)
			{
				break;
			}

			fill.push(b1,b2);

			b1 && buffer.set(i, b1);
			i++;
			b2 && buffer.set(i, b2);
			i++;
		}

		return i;
	}

	deltaFill(bits,xSize)
	{
		let i = 0, lastBit = 0;
		const max = bits.length;

		return new Promise(accept => {
			const fill = () => {
				if(i % (this.sideSize * this.tileSize) === 0)
				{
					lastBit = 0;
				}

				const pixel = this.pixelToRowPixel(i);

				const bit = bits.get(pixel);

				if(bit)
				{
					lastBit = 1 ^ lastBit;
				}

				bits.set(pixel, lastBit);

				i++;

				if(i < max)
				{
					if(i % this.sideSize * this.tileSize === 0)
					{
						setTimeout(() => fill(), 1);
						this.outputWidget.drawDots();
					}
					else
					{
						fill();
					}
				}
				else
				{
					return accept();
				}
			};

			fill();
		});
	}

	tilePixelToPixel(tilePixel)
	{
		const width        = this.sideSize * this.tileSize;

		const oddColumn    = (tilePixel % (width * 2)) >= width;
		const column       = Math.floor(tilePixel / (width * 2));
		const columnOffset = column * (width * 2);
		const inColumn     = tilePixel - columnOffset;

		const pixel = columnOffset + (oddColumn
			? ((inColumn - width) * 2) + 1
			: inColumn * 2
		);

		return pixel;
	}

	pixelToRowPixel(pixel)
	{
		const width  = this.sideSize * this.tileSize;
		const pEven  = pixel % 2 === 0;
		const xOff   = Math.floor(pixel / width);
		const xEven  = xOff % 2 == 0;
		const yOff   = pixel % width;

		const result = (xOff * 2 + yOff * width) + (pEven ? 0:-(width-1));

		return result;
	}

	copy(bitsA, bitsB, ySize)
	{
		const offset = 7 - ySize;

		for(let i = 0; i < bitsA.length; i++)
		{
			const bitA = bitsA.get(i);

			bitsB.set(i, bitA);
		}
	}

	untile()
	{

	}

	empty(bits)
	{
		for(let i = 0; i < bits.length; i++)
		{
			bits.set(i, 0);
		}
	}

	xorFill(bitsA, bitsB)
	{
		for(let i = 0; i < bitsA.length; i++)
		{
			const bitA = bitsA.get(i);
			const bitB = bitsB.get(i);

			bitsB.set(i, bitA^bitB);
		}
	}
}
