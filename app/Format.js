export class Format
{
	tileWidth  = 1;
	tileHeight = 1;
	outputPos  = 0;
	inputPos   = 0;
	depth      = 1;

	constructor(inputBuffer, outputBuffer, width)
	{
		this.inputBuffer  = inputBuffer;
		this.outputBuffer = outputBuffer;

		this.width = width;
	}

	next()
	{
		console.warn(
			`Error: ${this.constructor.name}::next() has not been implemented.`
		);
	}
}
