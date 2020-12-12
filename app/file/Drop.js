import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Icon } from './Icon';

export class Drop extends View
{
	template = require('./drop.html');

	constructor(args, parent)
	{
		super(args, parent);

		this.args.files = [];
	}

	drop(event)
	{
		event.preventDefault();

		const rootPanel = this.args.panel;

		const file   = event.dataTransfer.files[0];
		const title  = file.name
		const widget = new Canvas({
			input: file, panel: rootPanel
		});

		rootPanel.args.panels.push(new Panel({title, widget}));

		this.args.files.push({name: file.name, file});
	}

	dragover(event)
	{
		event.preventDefault();
	}
}
