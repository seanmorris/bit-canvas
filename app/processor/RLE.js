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

		const buffer  = new Uint8Array(1176);

		this.bufferA = new Uint8Array(buffer.buffer, 392*0, 392);
		this.bufferB = new Uint8Array(buffer.buffer, 392*1, 392);
		this.bufferC = new Uint8Array(buffer.buffer, 392*2, 392);

		this.args.offset = 221830;

		this.buffer = buffer;
	}

	run()
	{
		const rootPanel = this.args.panel;

		const title  = 'RLE+Delta Decoded ' + this.args.inputName;
		const widget = new Canvas({
			buffer: this.buffer, panel: rootPanel, title
			, width: 56, height: 168, scale: 4
			, decoder: 'gameboy-1bit'
			, module: 'rle'
		});

		widget.panel = rootPanel;

		rootPanel.args.panels.push(new Panel({title, widget}));

		this.outputWidget = widget;

		const buffer = this.args.input.args.buffer.slice(this.args.offset);

		const bits  = new BitArray(buffer);
		const xSize = bits.next(4) * 8;
		const ySize = bits.next(4);
		const size  = xSize * ySize;

		const buffers = [new BitArray(this.bufferB), new BitArray(this.bufferC)];

		const order = bits.next();

		const bufB  = buffers[order];
		const bufC  = buffers[order ^ 1];

		widget.addEventListener('attached', ()=>{
			this.fillBuffer(bufB, bits, size).then(()=>{

				this.outputWidget.drawDots();
				let mode = bits.next();

				if(mode === 1)
				{
					mode = 1 + bits.next();
				}

				console.log('MODE ' + mode);

				this.fillBuffer(bufC, bits, size).then(()=>{
					if(mode === 0)
					{
						this.deltaFill(bufB).then(()=>{
							return this.deltaFill(bufB);
						}).then(()=>{
							this.copy(new BitArray(this.bufferB), new BitArray(this.bufferA));
							this.copy(new BitArray(this.bufferC), new BitArray(this.bufferB));
							this.empty(new BitArray(this.bufferC));
							this.outputWidget.drawDots();
						});
					}
					else if(mode === 1)
					{
						this.deltaFill(bufB).then(()=>{
							this.xorFill(bufB, bufC);
							this.copy(new BitArray(this.bufferB), new BitArray(this.bufferA));
							this.copy(new BitArray(this.bufferC), new BitArray(this.bufferB));
							this.empty(new BitArray(this.bufferC));
							this.outputWidget.drawDots();
						});
					}
					else if(mode == 2)
					{
						this.deltaFill(bufB).then(()=>{
							return this.deltaFill(bufC);
						}).then(()=>{
							this.xorFill(bufB, bufC);
							this.outputWidget.drawDots();
							this.copy(new BitArray(this.bufferB), new BitArray(this.bufferA));
							this.copy(new BitArray(this.bufferC), new BitArray(this.bufferB));
							this.empty(new BitArray(this.bufferC));
							this.outputWidget.drawDots();
						});
					}
				});

			});
		}, {once:true});
	}

	fillBuffer(buffer, bits, size)
	{
		return new Promise(accept => {

			const bitSize = size * 8;
			let i = 0;
			// console.log('GET MODE');
			let mode = bits.next();

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
					if(i % (56 * 1) === 0)
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
			buffer.set(i++, 0);
			buffer.set(i++, 0);
		}

		// console.log(
		// 	'repeat 00 %d times, %s, %s, %s, %s'
		// 	, m
		// 	, ii
		// 	, read
		// 	, n.toString(2).padStart(ii+1, '0')
		// 	, a.toString(2).padStart(ii+1, '0')
		// );

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

			buffer.set(i++, b1);
			buffer.set(i++, b2);
		}

		// console.log(fill.length, fill.join(','))

		return i;
	}

	deltaFill(bits)
	{
		let i = 0, lastBit = 0;
		const max = bits.length;

		return new Promise(accept => {
			const fill = () => {
				if(i % 56 === 0)
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
					if(i % (56 * 2) === 0)
					{
						setTimeout(() => fill(), 50);
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
		const width        = 56;

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
		const width  = 56;
		const pEven  = pixel % 2 === 0;
		const xOff   = Math.floor(pixel / width);
		const xEven  = xOff % 2 == 0;
		const yOff   = pixel % width;

		const result = (xOff * 2 + yOff * width) + (pEven ? 0:-55);

		// console.log(pixel, xOff, yOff, result);

		return result;
	}

	copy(bitsA, bitsB)
	{
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
