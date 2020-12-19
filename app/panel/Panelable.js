import { Panel } from './Panel';

const MyPanel   = Symbol('MyPanel');

export class Panelable
{
	get panel() {
		return this[MyPanel] || (this[MyPanel] = new Panel({}, this));
	}
};
