import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Processor } from '../Processor';

import { RleDelta } from 'pokemon-parser/decompress/RleDelta';

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
		const widget   = new Canvas({
			buffer:    rleDelta.buffer
			, panel:   rootPanel
			, title:   'RLE+Delta Decoded ' + this.args.inputName
			, width:   rleDelta.sideSize * rleDelta.tileSize
			, height:  rleDelta.sideSize * rleDelta.tileSize * 2
			, scale:   4
			, decoder: 'gameboy-1bit-cols'
			, module:  'rle'
		});

		rootPanel.panels.add(widget.panel);

		this.outputWidget = widget;

		rleDelta.decompress();

		this.outputWidget.drawDots();

		this.remove();
	}
}
