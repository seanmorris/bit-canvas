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

		this.args.offset = this.args.input.args.offset;
		this.args.slow = false;

		Object.assign(this.panel.args, {title: 'RLE + Delta'});
	}

	run()
	{
		const {rleDelta, rleWidget} = this.openRleWidget();

		rleWidget.args.loading = true;

		const {merge, mergeWidget} = this.openMergeWidget(rleDelta, rleWidget);

		rleWidget.panel.args.widgets.push(mergeWidget);

		mergeWidget.rendered.then(() => {
			return this.runRle(rleDelta, rleWidget)
		})
		.then(() => {

			mergeWidget.args.loading = true;

			rleWidget.args.loading = false;

			return this.runMerge(merge, mergeWidget);

		}).then(() => {

			mergeWidget.args.loading = false;

		});

		this.remove();
	}

	openRleWidget()
	{
		const inputBuffer = this.args.input.args.buffer;
		const rootPanel   = this.args.panel;
		const input       = inputBuffer.slice(this.args.offset)
		const rleDelta    = new RleDelta(input);
		const offset      = this.args.offset;
		const name        = this.args.inputName;


		const rleWidget = new Canvas({
			buffer:    rleDelta.buffer
			, scale:   3
			, panel:   rootPanel
			, title:   `${name}@0x${offset.toString(16).toUpperCase()}_rle_delta.bin`
			, decoder: 'gameboy-1bit-cols'
			, width:   rleDelta.xSize
			, height:  rleDelta.xSize * 2
		});

		rootPanel.panels.add(rleWidget.panel);

		return {rleDelta, rleWidget};
	}

	runRle(rleDelta, rleWidget)
	{
		if(this.args.slow)
		{
			const iterate = accept => {
				if(rleDelta.iterate())
				{
					setTimeout(() => iterate(accept), 0);
				}
				else
				{
					accept();
				}

				rleWidget.drawDots();
			};

			return new Promise(iterate);
		}

		rleDelta.decompress();
		rleWidget.drawDots();

		return Promise.resolve();
	}

	openMergeWidget(rleDelta, rleWidget)
	{
		const rootPanel = this.args.panel;

		const merge  = new Merge(rleDelta.buffer, rleDelta.xSize);
		const name   = this.args.inputName;
		const offset = this.args.offset;

		const title  = `${name}@0x${offset.toString(16).toUpperCase()}_rle_delta_merged.bin`

		const mergeWidget = new Canvas({
			buffer: merge.buffer
			, panel: rootPanel
			, title
			, width: rleDelta.xSize
			, height: rleDelta.xSize
			, scale: 6
			, decoder: 'bytes'
		});

		// rootPanel.panels.add(mergeWidget.panel);

		return {merge, mergeWidget};
	}

	runMerge(merge, mergeWidget)
	{
		if(this.args.slow)
		{
			const iterate = accept => {
				if(merge.iterate())
				{
					setTimeout(() => iterate(accept), 0);
				}
				else
				{
					accept();
				}

				mergeWidget.drawDots();
			};

			return new Promise(iterate);
		}

		merge.decompress();
		mergeWidget.drawDots();

		return Promise.resolve();
	}
}
