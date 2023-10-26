// @ts-check
const { createReadStream, readFileSync } = require("fs");
const https = require("http");
const { SERVER_ADDRESS } = require("./constants");
const UPLOAD_FILE = "/v1/upload-file";

module.exports = class Http {
  /**
   *
   * @param {string} filePath
   * @returns
   */
  async uploadFile(filePath) {
    const fileData = readFileSync(filePath);
    const req = https.request(
      {
        hostname: "localhost",
        port: 3001,
        path: UPLOAD_FILE,
        method: "POST",
        headers: {
          "Content-Type": "bynary",
          "Content-Length": Buffer.byteLength(fileData),
        },
      },
      (res) => {
        console.log("statusCode:", res.statusCode);
        console.log("headers:", res.headers);
      }
    );

    req.on("error", (e) => {
      console.error(e);
    });

    console.log(fileData);
    req.write(fileData);
    req.end();
  }
};
