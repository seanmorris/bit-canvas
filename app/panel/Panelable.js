import { Panel } from './Panel';

const MyPanel = Symbol('panel');

export default panelable = {
	get panel() {

		if(!this[MyPanel])
		{
			this[MyPanel] = new Panel(this.args, this);
		}

		return this[MyPanel];

	}

};
