import { View } from 'curvature/base/View';

export class Panel extends View
{
	template = require('./panel.html');

	constructor(args, panel)
	{
		super(args, panel);

		this.args.title  = this.args.title  || null;
		this.args.widget = this.args.widget || null;
		this.args.panels = [];

		this.args.left = 0;
		this.args.top  = 0;

		this.style = {
			'--left':  0
			, '--top': 0
		};
	}

	onAttached(event)
	{
		this.args.bindTo(['left','top'], (v,k)=>{
			const panel = this.tags.panel;
			const body  = document.body;

			const maxX  = body.clientWidth  - panel.clientWidth;
			const maxY  = body.clientHeight - panel.clientHeight;

			if(k === 'left' && v > maxX)
			{
				v = maxX;
			}

			if(k === 'top' && v > maxY)
			{
				v = maxY;
			}

			if(v < 0)
			{
				v = 0;
			}

			this.tags.panel.style({ [`--${k}`] : `${v}px` });
		});
	}

	startFollow()
	{
		this.stopMoving = this.listen(document, 'mousemove', event => {
			this.args.left += event.movementX;
			this.args.top  += event.movementY;
		});

		this.listen(document, 'mouseup', event => {
			this.stopMoving();
			this.stopMoving = false;
		}, {once:true});
	}

	close()
	{
		if(typeof this.args.widget == 'object' && typeof this.args.widget.remove == 'function')
		{
			this.args.widget.remove();
		}

		this.remove();
	}
}
