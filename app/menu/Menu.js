import { Mixin }  from 'curvature/base/Mixin';
import { View }   from 'curvature/base/View';

import { Deinterlace } from '../processor/Deinterlace';
import { Invert }      from '../processor/Invert';
import { RLE }         from '../processor/RLE';

import { Panelable } from '../panel/Panelable';
import { Panel }     from '../panel/Panel';

// export class Menu extends View
export class Menu extends View
{
	template = require('./menu.html');

	constructor(args,parent)
	{
		super(args,parent);

		this.args.links = {Invert, RLE, Deinterlace};

		Object.assign(this.panel.args, {
			widget:  this
			, title: 'Select a Processor'
		});
	}

	click(event, processor, title)
	{
		const rootPanel = this.args.panel;

		const input  = this.args.input;
		const widget = new processor({input, panel: rootPanel});

		rootPanel.panels.add(widget.panel);

		this.remove();
	}
}

Mixin.to(Menu, Panelable);
