import { lstatSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { open, FileHandle, readFile  } from 'node:fs/promises';

export class LocalDatastore {
    constructor(private path: string) {
        // the next code ensures that the given file path is a valid writable file
        if (!existsSync(path)) {
            this.prepareDirectory(path);
            writeFileSync(path, '[]', {mode: '666', encoding: 'utf-8'});
        }

        const fileStats = lstatSync(path);

        if (!fileStats.isFile) {
            throw new Error('the given path is a file');
        }
    }

    public async readAll(): Promise<string> {
        return readFile(this.path, {encoding: 'utf-8'});
    }

    public async writeTransaction(rwHandler: (data: string) => string): Promise<void> {
        const fd: FileHandle = await open(this.path, 'r+');

        try {
            const buf = await fd.readFile();
            const data = rwHandler(buf.toString('utf-8'));
            await fd.truncate();
            await fd.write(data, 0, 'utf-8');
        } catch (e) {
            console.error(e);
        } finally {
            await fd.close();
        }
    }

    private prepareDirectory(path: string): void {
        if (path.replace('./', '').indexOf('/') >= 0) {
            mkdirSync(path.split('/').slice(0, -1).join('/'), {
                mode: '775',
                recursive: true,
            });
        }
    }
}
