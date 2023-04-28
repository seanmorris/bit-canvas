import { Bindable } from 'curvature/base/Bindable';

import { View } from 'curvature/base/View';
import { Panel } from '../panel/Panel';
import { Canvas } from '../canvas/Canvas';

import { Icon } from './Icon';

import { FileDatabase } from './FileDatabase';
import { FileModel } from './FileModel';

import { PokemonRom } from 'pokemon-parser/PokemonRom';

export class Drop extends View
{
	template = require('./drop.html');

	constructor(args, parent)
	{
		super(args, parent);

		this.args.files = [];

		this.fileDb = FileDatabase.open('files', 1);

		this.refresh();
	}

	refresh()
	{
		const query = {store: 'files', index: 'name', type:  FileModel};

		this.args.files = [];

		this.fileDb.then((db)=> db.select(query).each(file => {
			file && this.args.files.push(file);
		}));
	}

	drop(event)
	{
		event.preventDefault();

		this.importFiles(event.dataTransfer.files);

	}

	dragover(event)
	{
		event.preventDefault();
	}

	iconClicked(event, file)
	{
		this.openCanvasPanel(file);
	}

	importFile()
	{
		const input = document.createElement('input');

		input.setAttribute('type', 'file');
		input.addEventListener('change', event => {

			console.log(event);
			this.importFiles(input.files);

		}, {once:true});

		input.click();
	}

	importFiles(files)
	{
		for(const file of files)
		{
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
	}

	openCanvasPanel(file)
	{
		const rootPanel = this.args.panel;

		const canvas = new Canvas({input: file, panel: rootPanel});

		const rom = new PokemonRom;

		rom.preload(new Uint8Array(file.buffer));

		console.log(rom.title);

		rootPanel.panels.add(canvas.panel);
	}
}
