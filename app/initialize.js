import { View } from 'curvature/base/View';
import { Tag  } from 'curvature/base/Tag';

import { Panel } from './panel/Panel';
import { Drop } from './file/Drop';

import { FileDatabase } from './file/FileDatabase';
import { FileModel } from './file/FileModel';

import { Elicit } from 'curvature/net/Elicit';

// const drawDots = (file, context) => {

// 	const reader = new FileReader();

// 	reader.readAsArrayBuffer(file);

// 	reader.onload = () => {
// 		const bytes = new Uint8Array(reader.result);

// 		const height = Math.ceil(bytes.length / context.canvas.width);

// 		context.canvas.height = height;

// 		const pixels = context.createImageData(context.canvas.width, context.canvas.height);

// 		let i = 0;

// 		for(const byte of bytes)
// 		{
// 			pixels.data[i++] = byte;
// 			pixels.data[i++] = byte;
// 			pixels.data[i++] = byte;
// 			pixels.data[i++] = 255;
// 		}

// 		context.putImageData(pixels, 0, 0);
// 	};
// };

document.addEventListener('DOMContentLoaded', function() {

	const drop  = new Drop();
	const panel = new Panel({
		contextMenu: [],
		widgets: [drop],
		type: 'root',
	});

	drop.args.panel = panel;

	panel.render(document.body);

	const query = {store: 'files', index: 'name', type:  FileModel};

	FileDatabase.open('files', 1)
	.then(database => {

		database.select(query).then(results => {
			if(results.index)
			{
				// return;
			}

			const sampleUrls = [
				'squirtle_front.bin'
				, 'wartortle_front.bin'
				, 'blastoise_front.bin'
				, 'charmander_front.bin'
				, 'charmeleon_front.bin'
				, 'charizard_front.bin'
				, 'bulbasaur_front.bin'
				, 'ivysaur_front.bin'
				, 'venusar_front.bin'
			];

			const getSamples = Promise.all(sampleUrls.map(u => {

				const e = new Elicit('/samples/' + u, {defer:true});

				Elicit.pool(e);

				return e
				.then(() => e.blob())
				.then(b => b.arrayBuffer())
				.then(b => [u,new Uint8Array(b).buffer]);

			}));

			getSamples.then(s => {
				const inserts = s.map(([u,b]) => {
					console.log(u,b);
					const query = {
						store: 'files'
						, index: 'name'
						, range: [u]
						, type:  FileModel
					};

					const values = {
						name: u
						, id: u
						, lastModified: Date.now()
						, size: b.length
						, type: 'bin'
						, buffer: b
					};

					return database.select(query).one().then(result => {

						let record = result.mapped;

						if(!record)
						{
							record = FileModel.from(values);
							record.id = record.name;
							return database.insert('files', record);
						}
						else
						{
							record.consume(values);
							record.id = record.name;
							return database.update('files', record);
						}
					});
				});

				Promise.all(inserts).then(() => drop.refresh());
			});
		});
	})

});
