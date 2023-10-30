// @ts-check
const tar = require("tar");

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
    return new Promise((resolve) => {
      tar
        .c(
          {
            gzip: true,
            file,
          },
          fileList
        )
        .then((_) => {
          console.info("Tarball created");
          resolve(0);
        })
        .catch((e) => {
          console.error("Failed create tarball", e);
          resolve(1);
        });
    });
  }

  /**
   *
   * @param {{
   *  file: string;
   *  fileList: string[];
   * }} param0
   * @returns
   */
  async update({ file, fileList }) {
    return new Promise((resolve) => {
      tar
        .u(
          {
            gzip: true,
            file,
          },
          fileList
        )
        .then((_) => {
          console.info("Tarball updated");
          resolve(0);
        })
        .catch((e) => {
          console.error("Failed update tarball", e);
          resolve(1);
        });
    });
  }
};
