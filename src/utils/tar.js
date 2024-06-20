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
   *  cwd: string;
   * }} param0
   * @returns {Promise<0>}
   */
  async create({ file, fileList, cwd }) {
    console.info(
      'Recursive compressing the list of files:\n',
      fileList.map((item) => path.normalize(path.resolve(cwd, item))).join('\n')
    );
    return new Promise((resolve, reject) => {
      tar
        .c(
          {
            gzip: true,
            file,
            cwd,
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
