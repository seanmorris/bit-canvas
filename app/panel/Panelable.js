import { Panel } from './Panel';

const RootPanel = Symbol('RootPanel');
const MyPanel   = Symbol('MyPanel');

export const Panelable = {
	get panel() {

		if(!this[MyPanel])
		{
			this[MyPanel] = new Panel({}, this);
		}

		return this[MyPanel];
	}
};
