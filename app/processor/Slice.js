import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Processor } from '../Processor';

export class Slice extends Processor
{
	template = require('./slice.html');

	constructor(args,parent)
	{
		super(args, parent);

		Object.assign(this.panel.args, {title: 'Slice'});

		this.args.start = '0x14000';
		this.args.end   = '0x1783F';
	}

	run()
	{
		const rootPanel = this.args.panel;

		const start  = Number(this.args.start);
		const end    = Number(this.args.end);
		const input  = this.args.input.args.buffer;
		const length = end - start;

		const output = new Uint8Array(length);

		for(let i = 0; i < length; i++)
		{
			output[i] = input[i + start];
		}

		const name  = this.args.inputName;
		const startHex = start.toString(16).toUpperCase();
		const endHex   = end.toString(16).toUpperCase();

		const title  = `Sliced ${name} 0x${startHex}-0x${endHex}`;
		const widget = new Canvas({
			buffer: output, panel: rootPanel, title
			, decoder: this.args.input.args.decoder
			, height: this.args.input.args.height
			, width: this.args.input.args.width
			, scale: this.args.input.args.scale
		});

		rootPanel.panels.add(widget.panel);

		this.remove();
	}
}
