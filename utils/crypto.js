// @ts-check
const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

module.exports = class Crypto {
  /**
   *
   * @param {string} text
   * @param {Buffer} password
   * @returns
   */
  encrypt(text, password) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, password, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
      iv: iv.toString("hex"),
      content: encrypted.toString("hex"),
    };
  }

  /**
   *
   * @param {{
   *  iv: string;
   *  content: string;
   * }} hash
   * @param {Buffer} password
   * @returns {string | null}
   */
  decrypt(hash, password) {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      password,
      Buffer.from(hash.iv, "hex")
    );

    /**
     * @type {Buffer | null}
     */
    let decrpyted = null;
    try {
      decrpyted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, "hex")),
        decipher.final(),
      ]);
    } catch (e) {
      return null;
    }

    return decrpyted.toString();
  }

  /**
   *
   * @param {string} secret
   * @returns
   */
  createHash(secret) {
    return crypto.scryptSync(secret, "salt", 32);
  }
};
