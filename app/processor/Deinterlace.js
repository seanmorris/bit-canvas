import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';
import { BitArray } from 'pokemon-parser/BitArray';

import { Processor } from '../Processor';

import { Merge } from 'pokemon-parser/decompress/Merge';

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

		const input = this.args.input.args.buffer;
		const merge = new Merge(input, sideSize);

		const output = merge.buffer;

		const title  = 'Deinterlaced ' + this.args.inputName;

		const widget = new Canvas({
			buffer: output, panel: rootPanel, title
			, width: sideSize, height: sideSize, scale: 4, decoder: 'bytes'
		});

		rootPanel.panels.add(widget.panel);

		merge.decompress();

		this.outputWidget = widget;

		this.outputWidget.drawDots();

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
