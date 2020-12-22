import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Processor } from '../Processor';

import { RleDelta } from 'pokemon-parser/decompress/RleDelta';
import { Merge }    from 'pokemon-parser/decompress/Merge';

export class RLE extends Processor
{
	template = require('./rle.html');
	table1 = [...Array(16)].map((_,i)=> (2 << i) - 1);

	constructor(args,parent)
	{
		super(args, parent);

		this.sideSize = 7;
		this.tileSize = 8;

		this.args.offset = 16658;
		this.args.offset = 220252;

		Object.assign(this.panel.args, {title: 'RLE + Delta'});
	}

	run()
	{
		const inputBuffer = this.args.input.args.buffer;
		const rootPanel   = this.args.panel;
		const input       = inputBuffer.slice(this.args.offset)

		const rleDelta = new RleDelta(input);

		rleDelta.decompress();

		const merge = new Merge(rleDelta.buffer, rleDelta.xSize);

		const name   = this.args.inputName
		const offset = this.args.offset;

		const title  = `RLE + Delta Decoded ${name}:0x${offset.toString(16).toUpperCase()}`;

		const widget = new Canvas({
			buffer: merge.buffer
			, panel: rootPanel
			, title
			, width: rleDelta.xSize
			, height: rleDelta.xSize
			, scale: 4
			, decoder: 'bytes'
		});

		rootPanel.panels.add(widget.panel);

		merge.decompress();

		widget.drawDots();

		this.remove();
	}
}
