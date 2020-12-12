import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

export class Invert extends View
{
	template = require('./invert.html');

	constructor(args,parent)
	{
		super(args, parent);

		this.args.bindTo('input', v => {
			if(!v)
			{
				return;
			}

			this.args.inputName = v.args.input ? v.args.input.name : v.args.title;
			this.args.offset    = v.args.offset;
			this.args.length    = v.args.buffer.length;
		});
	}

	run()
	{
		const rootPanel = this.args.panel;

		const offset = Number(this.args.offset) || 0;
		const length = Number(this.args.length) || 0;
		const input  = this.args.input.args.buffer;

		const output = new Uint8Array(length);

		for(let i = 0; i < input.length; i++)
		{
			output[i] = input[i] ^ 0b11111111;
		}

		const title  = 'Inverted ' + this.args.inputName;
		const widget = new Canvas({
			buffer: output, panel: rootPanel, title
		});

		widget.panel = rootPanel;

		rootPanel.args.panels.push(new Panel({title, widget}));
	}
}
