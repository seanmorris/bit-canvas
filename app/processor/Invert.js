import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Processor } from '../Processor';

export class Invert extends Processor
{
	template = require('./invert.html');

	constructor(args,parent)
	{
		super(args, parent);

		Object.assign(this.panel.args, {title: 'Invert'});
	}

	run()
	{
		const rootPanel = this.args.panel;

		const offset = Number(this.args.offset);
		const length = Number(this.args.length);
		const input  = this.args.input.args.buffer;

		const output = new Uint8Array(length);

		for(let i = 0; i < length; i++)
		{
			output[i] = input[i + offset] ^ 0b11111111;
		}

		const title  = 'Inverted ' + this.args.inputName;
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
