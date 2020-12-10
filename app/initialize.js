import { View } from 'curvature/base/View';
import { Tag  } from 'curvature/base/Tag';

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
	const canvas  = new Tag('<canvas>');
	const upload  = new Tag('<input type = "file">');
	const width   = new Tag('<input type = "number">');
	const scale   = new Tag('<input type = "number">');

	document.body.append('file');
	document.body.append(upload.node);
	document.body.append('width');
	document.body.append(width.node);
	document.body.append('scale');
	document.body.append(scale.node);
	document.body.append('map');
	document.body.append(canvas.node);
	
	const context = canvas.getContext('2d');

	let file = null;

	upload.addEventListener('input', event => {
		file = event.target.files[0];
		if(file)
		{
			drawDots(file, context);
		}
	});

	width.addEventListener('input', event => {
		if(file)
		{
			drawDots(file, context);
		}
		
		canvas.style.width = (event.target.value) + 'px';
		canvas.width = Number(event.target.value)
	});
	
	scale.addEventListener('input', event => {
		canvas.style({'--scale': event.target.value});
	});

	canvas.style.width = (width.value = 128) + 'px';
	canvas.width = Number(width.value = 128);

	scale.value = 3;
});
