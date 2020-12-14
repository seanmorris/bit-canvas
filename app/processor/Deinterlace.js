import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';
import { BitArray } from 'pokemon-parser/BitArray';


import { Processor } from '../Processor';

export class Deinterlace extends Processor
{
	template = require('./deinterlace.html');

	constructor(args,parent)
	{
		super(args, parent);
	}

	run()
	{
		const rootPanel = this.args.panel;

		const offset = Number(this.args.offset);
		const length = 56**2;
		const input  = new BitArray(this.args.input.args.buffer);

		const output = new Uint8Array(length);

		for(let i = 0; i < input.length / 2; i++)
		{
			const b1 = input.get(this.pixelToRowPixel(i));
			const b2 = input.get(this.pixelToRowPixel(i)+56**2);
			const b  = b1 << 1 | b2;

			const pallet = [255,64,128,0];

			output[i] = pallet[b];
		}

		const title  = 'Deinterlaced ' + this.args.inputName;
		const widget = new Canvas({
			buffer: output, panel: rootPanel, title
			, width: 56, height: 56, scale: 4, decoder: 'bytes'
		});

		widget.panel = rootPanel;

		rootPanel.args.panels.push(new Panel({title, widget}));
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
}
