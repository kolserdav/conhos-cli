// @ts-check
const tar = require('tar');

module.exports = class Tar {
  /**
   *
   * @param {{
   *  file: string;
   *  fileList: string[];
   * }} param0
   * @returns
   */
  async create({ file, fileList }) {
    console.info('Recursive compressing the list of files:', fileList);
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
};
