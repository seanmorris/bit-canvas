import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { FileModel } from '../file/FileModel';
import { FileDatabase } from '../file/FileDatabase';

import { Processor } from '../Processor';

export class DeleteConfirm extends Processor
{
	template = require('./delete-confirm.html');
	table1 = [...Array(16)].map((_,i)=> (2 << i) - 1);

	constructor(args,parent)
	{
		super(args, parent);

		Object.assign(this.panel.args, {title: 'Delete?'});
	}

	run()
	{
		const fileDb = FileDatabase.open('files', 1);

		this.args.file.id = this.args.file.name;

		console.log( this.args.file );

		fileDb
		.then(database => database.delete('files', this.args.file))
		.then(() => {
			this.args.icon.refresh();
			this.panel.close();
		});
	}

	close()
	{
		this.panel.close();
	}
}
