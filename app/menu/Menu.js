import { View } from 'curvature/base/View';
import { Panel }  from '../panel/Panel';

import { Invert } from '../processor/Invert';

export class Menu extends View
{
	template = require('./menu.html');

	constructor(args,parent)
	{
		super(args,parent);

		this.args.links = {Invert};
	}

	click(event, processor)
	{
		const rootPanel = this.args.panel;

		const input  = this.args.input;
		const title  = 'Invert'

		const widget = new processor({input, panel: rootPanel});

		const panel  = new Panel({title, widget});

		rootPanel.args.panels.push(panel);

		console.log(this);

		this.remove();
	}
}
