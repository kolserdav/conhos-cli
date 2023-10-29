// @ts-check
const fs = require("fs");
const archiver = require("archiver");

module.exports = class Archiver {
  /**
   *
   * @param {{outputPath: string; dir: string}} param0
   */
  constructor({ outputPath, dir }) {
    this.output = fs.createWriteStream(outputPath);
    this.archive = archiver("zip", {
      zlib: { level: 9 },
    });

    this.archive.pipe(this.output);
    this.archive.directory(dir, false);
  }

  async compress() {
    this.archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        console.warn("Creating archive warning: ENOENT");
      } else {
        console.error("Creating archive warning", err);
      }
    });

    this.archive.on("error", function (err) {
      console.error("Failed create archive", err);
    });

    this.archive.finalize();

    return new Promise((resolve) => {
      this.output.on("close", function () {
        if (this.archive) {
          console.info(this.archive.pointer() + " total bytes");
        }
        console.info(
          "archiver has been finalized and the output file descriptor has closed."
        );
        resolve(0);
      });

      this.output.on("end", function () {
        console.info("Data has been drained");
        resolve(0);
      });
    });
  }
};
