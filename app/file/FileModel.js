import { Model } from 'curvature/model/Model';

export class FileModel extends Model
{
	static keyProps(){ return ['name'] }

	lastModified;
	name;
	size;
	type;
}
