// @ts-check
import path from 'path';
import tar from 'tar';
import { CWD } from './constants.js';
import { console } from './lib.js';

export default class Tar {
  /**
   * @public
   * @param {{
   *  file: string;
   *  fileList: string[];
   * }} param0
   * @returns {Promise<0>}
   */
  async create({ file, fileList }) {
    console.info(
      'Recursive compressing the list of files and dirs:\n',
      fileList.map((item) => path.normalize(path.resolve(CWD, item))).join('\n')
    );
    return new Promise((resolve, reject) => {
      tar
        .c(
          {
            gzip: true,
            file,
          },
          fileList
        )
        .then(() => {
          resolve(0);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}
