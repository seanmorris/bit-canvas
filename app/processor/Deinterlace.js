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

		Object.assign(this.panel.args, {title: 'Deinterlace'});
	}

	run()
	{
		const rootPanel = this.args.panel;
		const sideSize  = this.args.input.args.width;

		const offset = Number(this.args.offset);
		const length = sideSize**2;
		const input  = new BitArray(this.args.input.args.buffer);

		const output = new Uint8Array(length);

		for(let i = 0; i < input.length / 2; i++)
		{
			const b1 = input.get(this.pixelToRowPixel(i));
			const b2 = input.get(this.pixelToRowPixel(i)+sideSize**2);
			const b  = b1 << 1 | b2;

			const pallet = [255,128,196,64];

			output[i] = pallet[b];
		}

		const title  = 'Deinterlaced ' + this.args.inputName;

		const widget = new Canvas({
			buffer: output, panel: rootPanel, title
			, width: sideSize, height: sideSize, scale: 4, decoder: 'bytes'
		});

		rootPanel.panels.add(widget.panel);

		this.remove();
	}

	pixelToRowPixel(pixel)
	{
		const width  = this.args.input.args.width;
		const pEven  = pixel % 2 === 0;
		const xOff   = Math.floor(pixel / width);
		const xEven  = xOff % 2 == 0;
		const yOff   = pixel % width;

		const result = (xOff * 2 + yOff * width) + (pEven ? 0:-(width-1));

		return result;
	}
}
