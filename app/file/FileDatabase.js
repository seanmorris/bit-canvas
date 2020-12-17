import { Database } from 'curvature/model/Database';

export class FileDatabase extends Database
{
	_version_1(database)
	{
		const fileStore = this.createObjectStore('files', {keyPath: 'name'});

		fileStore.createIndex('name', 'name', {unique: true});
	}
}
