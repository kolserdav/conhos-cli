// @ts-check
import path from 'path';
import tar from 'tar';
import { CWD } from './constants.js';

export default class Tar {
  /**
   * @public
   * @param {{
   *  file: string;
   *  fileList: string[];
   * }} param0
   * @returns
   */
  async create({ file, fileList }) {
    console.info(
      'Recursive compressing the list of files and dirs:\n',
      fileList.map((item) => path.normalize(path.resolve(CWD, item))).join('\n')
    );
    return new Promise((resolve) => {
      tar
        .c(
          {
            gzip: true,
            file,
          },
          fileList
        )
        .then(() => {
          console.info('Tarball created', file);
          resolve(0);
        })
        .catch((e) => {
          console.error('Failed create tarball', e);
          resolve(1);
        });
    });
  }
}
