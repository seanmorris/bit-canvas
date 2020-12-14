import { View } from 'curvature/base/View';

export class Processor extends View
{
	constructor(args,parent)
	{
		super(args, parent);

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
