import { Model } from 'curvature/model/Model';

export class FileModel extends Model
{
	static keyProps = ['name']

	lastModified;
	name;
	size;
	type;
}
