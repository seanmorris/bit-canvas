import { Bindable } from 'curvature/base/Bindable';

import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Icon } from './Icon';
import { FileModel } from './FileModel';
import { FileDatabase } from './FileDatabase';

export class Drop extends View
{
	template = require('./drop.html');

	constructor(args, parent)
	{
		super(args, parent);

		this.args.files = [];

		this.fileDb = FileDatabase.open('files', 1);

		const query = {
			store: 'files'
			, index: 'name'
			, type:  FileModel
		};

		this.fileDb.then((db)=> db.select(query).each(file => {
			file && this.args.files.push(file);
		}));
	}

	drop(event)
	{
		event.preventDefault();

		const file   = event.dataTransfer.files[0];
		const buffer = file.arrayBuffer();
		const fileDb = this.fileDb;

		Promise.all([buffer, fileDb]).then(([buffer, fileDb])=>{

			const query = {
				store: 'files'
				, index: 'name'
				, range: file.name
				, type:  FileModel
			};

			const values = {
				name: file.name
				, lastModified: file.lastModified
				, size: file.size
				, type: file.type
				, buffer: buffer
			};

			fileDb.select(query).one().then(result => {

				let record = result.record;

				if(!record)
				{
					record = FileModel.from(values);
					fileDb.insert('files', record);
				}
				else
				{
					record.consume(values);
					fileDb.update('files', record);
				}

				this.args.files.push(record);

				this.openCanvasPanel(record);
			});
		});
	}

	dragover(event)
	{
		event.preventDefault();
	}

	iconClicked(event, file)
	{
		this.openCanvasPanel(file);
	}

	openCanvasPanel(file)
	{
		const rootPanel = this.args.panel;

		const canvas = new Canvas({input: file, panel: rootPanel});

		rootPanel.panels.add(canvas.panel);
	}
}
