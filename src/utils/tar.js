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
    console.log(
      'Compressing:\n',
      fileList.map((item) => path.normalize(path.resolve(cwd, item))).join('\n')
    );
    return new Promise((resolve, reject) => {
      tar
        .c(
          {
            gzip: true,
            file,
            cwd,
            onwarn: (code, message, data) => {
              console.warn(`Create tarbal warning: ${message}, code: ${code}`, data.toString());
            },
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
