import { Bindable } from 'curvature/base/Bindable';
import { View } from 'curvature/base/View';
import { Bag  } from 'curvature/base/Bag';

import { DeleteConfirm } from '../processor/DeleteConfirm';

export class Panel extends View
{
	template = require('./panel.html');

	constructor(args, panel)
	{
		super(args, panel);

		this.host = null;

		this.openLeft = 0;
		this.openTop  = 0;

		this.args.widgets = Bindable.make(this.args.widgets || []);
		this.args.title   = this.args.title  || null;
		this.args.widget  = this.args.widget || null;
		this.args.left    = 0;
		this.args.top     = 0;
		this.args.z       = 0;

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

		this.args.widgets.bindTo((v,k) => {v.parent = this});

		this.args.panels = this.panels.list;
	}

	onAttached(event)
	{
		this.args.bindTo(['left', 'top', 'contextMenuXL', 'contextMenuXR', 'contextMenuYT', 'contextMenuYB'], (v,k)=>{
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

			if(v == Number(v))
			{
				v = v + 'px';
			}

			this.tags.panel.style({ [`--${k}`] : `${v}` });
		});

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

	contextmenu(event, file, icon)
	{
		event.stopPropagation();
		event.preventDefault();

		if(this.args.type !== 'root')
		{
			return;
		}

		if(!file)
		{
			this.args.contextMenu = [
				{title: 'import', callback: () => {
					icon.args.widgets[0].importFile()
					this.args.contextMenu = [];
				}},
			];
		}
		else
		{
			this.args.contextMenu = [
				{title: 'open',   callback: () => icon.openCanvasPanel(file)},
				{title: 'delete', callback: () => this.openDeleteDialog(file, icon)},
			];
		}

		this.args.contextMenuX = event.pageX;
		const docWidth  = document.body.offsetWidth;
		const docHeight = document.body.offsetHeight;

		if(event.pageX > 0.5 * docWidth)
		{
			this.args.contextMenuXR = (docWidth - event.pageX) + 'px';
			this.args.contextMenuXL = 'initial';
		}
		else
		{
			this.args.contextMenuXR = 'initial';
			this.args.contextMenuXL = event.pageX + 'px';
		}

		if(event.pageY > 0.5 * docHeight)
		{
			this.args.contextMenuYB = (docHeight - event.pageY) + 'px';
			this.args.contextMenuYT = 'initial';
		}
		else
		{
			this.args.contextMenuYT = event.pageY + 'px';
			this.args.contextMenuYB = 'initial';
		}
	}

	contextmenuClicked(event, item, key)
	{
		item.callback(event, key);

		console.log(event, item, key);
		this.args.contextMenu = [];
	}

	openDeleteDialog(file, icon)
	{
		const deleteConfirm = new DeleteConfirm({panel:this, file, icon});

		this.panels.add(deleteConfirm.panel);
	}

	startFollow()
	{
		const stopMoving = this.listen(window, 'mousemove', event => {
			this.args.left = event.pageX - 10;
			this.args.top  = event.pageY - 10;
			this.args.moving = 'moving';
		});

		this.listen(window, 'mouseup', event => {
			this.args.moving = '';

			stopMoving();
		});
	}

	close()
	{
		if(this.args.widgets)
		{
			for(const widget of this.args.widgets)
			{
				if(typeof widget == 'object' && typeof widget.remove == 'function')
				{
					widget.remove();
				}
			}
		}

		this.remove();
	}
}
