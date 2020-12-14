import { View }   from 'curvature/base/View';
import { Panel }  from '../panel/Panel';

import { Invert } from '../processor/Invert';
import { Deinterlace } from '../processor/Deinterlace';
import { RLE }    from '../processor/RLE';

export class Menu extends View
{
	template = require('./menu.html');

	constructor(args,parent)
	{
		super(args,parent);

		this.args.links = {Invert, RLE, Deinterlace};
	}

	click(event, processor, title)
	{
		const rootPanel = this.args.panel;

		const input  = this.args.input;
		const widget = new processor({input, panel: rootPanel});
		const panel  = new Panel({title, widget});

		rootPanel.args.panels.push(panel);
	}
}
