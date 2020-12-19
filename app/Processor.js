import { Mixin }  from 'curvature/base/Mixin';
import { View }   from 'curvature/base/View';

import { Panelable } from './panel/Panelable';

export class Processor extends View
{
	constructor(args,parent)
	{
		super(args, parent);

		Object.assign(this.panel.args, {widget:  this});

		this.args.bindTo('input', v => {
			if(!v)
			{
				return;
			}

			this.args.inputName = v.args.input ? v.args.input.name : v.args.title;
			this.args.offset    = Number(v.args.firstByte);
			this.args.length    = Number(v.args.buffer.length) - this.args.offset;
		});
	}
}

Mixin.to(Processor, Panelable);
