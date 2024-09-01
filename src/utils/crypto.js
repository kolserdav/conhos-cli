/******************************************************************************************
 * Repository: Conhos cli
 * File name: crypto.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

export default class Crypto {
  /**
   * @public
   * @param {string} text
   * @param {string | Buffer} password
   * @param {string} userId
   * @returns
   */
  encrypt(text, password, userId) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, password, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
      uid: userId,
    };
  }

  /**
   * @public
   * @param {{
   *  iv: string;
   *  content: string;
   * }} hash
   * @param {Buffer} password
   * @returns {string | null}
   */
  decrypt(hash, password) {
    const decipher = crypto.createDecipheriv(ALGORITHM, password, Buffer.from(hash.iv, 'hex'));

    /**
     * @type {Buffer | null}
     */
    let decrpyted = null;
    try {
      decrpyted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, 'hex')),
        decipher.final(),
      ]);
    } catch (e) {
      return null;
    }

    return decrpyted.toString();
  }

  /**
   * @public
   * @param {string} secret
   * @returns
   */
  createHash(secret) {
    return crypto.scryptSync(secret, 'salt', 32);
  }
}
