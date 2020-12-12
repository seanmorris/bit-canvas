import { View } from 'curvature/base/View';
import { Tag  } from 'curvature/base/Tag';

import { Panel } from './panel/Panel';
import { Drop } from './file/Drop';

const drawDots = (file, context) => {

	const reader = new FileReader();

	reader.readAsArrayBuffer(file);

	reader.onload = () => {
		const bytes = new Uint8Array(reader.result);

		const height = Math.ceil(bytes.length / context.canvas.width);

		context.canvas.height = height;

		const pixels = context.createImageData(context.canvas.width, context.canvas.height);

		let i = 0;

		for(const byte of bytes)
		{
			pixels.data[i++] = byte;
			pixels.data[i++] = byte;
			pixels.data[i++] = byte;
			pixels.data[i++] = 255;
		}

		context.putImageData(pixels, 0, 0);
	};
};

document.addEventListener('DOMContentLoaded', function() {
	const drop  = new Drop();
	const panel = new Panel({type: 'root', widget: drop});

	drop.args.panel = panel;

	panel.render(document.body);
});
