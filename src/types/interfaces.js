export const EXEC_CONNECT_URL_MESSAGE = 'Connection url';

/**
 * @typedef {{
 *  close: {
 *    message: string;
 *  };
 * }} ExecMessageData
 */

/**
 * @template {keyof ExecMessageData} T
 * @typedef {{
 *  type: T;
 *  connId: string;
 *  data: ExecMessageData[T];
 * }} ExecMessage
 */
