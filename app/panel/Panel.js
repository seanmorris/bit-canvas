import { View } from 'curvature/base/View';
import { Bag  } from 'curvature/base/Bag';

export class Panel extends View
{
	template = require('./panel.html');

	constructor(args, panel)
	{
		super(args, panel);

		this.host = null;

		this.openLeft = 0;
		this.openTop  = 0;

		this.args.title  = this.args.title  || null;
		this.args.widget = this.args.widget || null;
		this.args.left   = 0;
		this.args.top    = 0;
		this.args.z      = 0;

		this.panels = new Bag((i,s,a) => {

			if(a !== Bag.ITEM_ADDED)
			{
				return;
			}

			i.host = this;

			this.openLeft += 57;
			this.openTop  += 93;

			i.args.left = this.openLeft;
			i.args.top  = this.openTop;
			i.args.z    = Object.values(this.panels.list).length;

			this.openLeft %= Math.floor(window.innerWidth / 2);
			this.openTop  %= Math.floor(window.innerHeight / 2);

			i.onRemove(()=>this.panels.remove(i));
		});

		this.args.panels = this.panels.list;
	}

	onAttached(event)
	{
		this.args.bindTo(['left','top'], (v,k)=>{
			const panel = this.tags.panel;

			if(!panel)
			{
				return;
			}

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

			this.args[k] = v;

			this.tags.panel.style({ [`--${k}`] : `${v}px` });
		},{wait: 0});

		this.args.bindTo('z', (v,k)=>{
			this.tags.panel.style({ [`--${k}`] : `${v}` });
		});
	}

	mousedown(event)
	{
		if(!this.host)
		{
			return;
		}

		const panels = Object.values(this.host.panels.list).sort((a,b)=>{
			return b.z > a.z;
		});


		for(const i in panels)
		{
			if(panels[i] === this)
			{
				if(i === 0)
				{
					break;
				}
				continue;
			}

			if(panels[i].args.z > this.args.z)
			{
				panels[i].args.z--;
			}
		}

		this.args.z = panels.length;
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
