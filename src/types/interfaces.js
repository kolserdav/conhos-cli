export const EXEC_CONNECT_URL_MESSAGE = 'Connection url';

///////////// Env variables /////////////
// Depends conhos-app/src/utils/constants.ts ENV_VARIABLE_KEY_REGEX
export const ENV_VARIABLE_REGEX = /\$\{[a-zA-Z0-9_]+\}/g;

export const ENV_VARIABLES_CLEAN_REGEX = /[\$\{\}]+/g;

/**
 * @param {string} name
 */
export function getEnvVariableRegex(name) {
  return new RegExp(`\\$\\{${name}\\}`, 'g');
}

///////////// Env variables /////////////

/**
 * @typedef {import("conhos-vscode").DeployData} DeployData
 * @typedef {import("conhos-vscode").ConfigFile} ConfigFile
 * @typedef {import("conhos-vscode").Volumes} Volumes
 * @typedef {import("conhos-vscode").Git} Git
 * @typedef {import("conhos-vscode").Status} Status
 * @typedef {import("conhos-vscode").ServiceTypeCommon} ServiceTypeCommon
 * @typedef {import("cache-changed").CacheItem} CacheItem
 */

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

/**
 * @typedef {object} WSMessageDataCli
 * @property {any} any
 * @property {{
 *   connId: string;
 *   deployData: DeployData;
 * }} setSocketCli
 * @property {{
 *   version: string;
 * }} setSocketServer
 * @property {string} loginCli
 * @property {string} loginServer
 * @property {{
 *   checked: boolean;
 *   skipSetProject: boolean;
 *   errMess?: string;
 * }} checkTokenCli
 * @property {{
 *   skipSetProject: boolean;
 * }} checkTokenServer
 * @property {{
 *   msg: string | number;
 *   end: boolean;
 *   code?: number;
 * }} message
 * @property {{
 *   projectDeleted: boolean;
 *   config: ConfigFile;
 *   configText: string;
 *   volumes: Volumes;
 *   interractive: boolean;
 *   ssl: boolean;
 *   env: Record<string, string>
 * }} prepareDeployServer
 * @property {{
 *   url: string;
 *   serviceName: string;
 * }} deployPrepareVolumeUploadCli
 * @property {{
 *   exclude: string[] | undefined;
 *   pwd: string;
 *   service: string;
 *   cache: CacheItem[];
 *   active: boolean;
 *   git?: Git;
 * }} prepareDeployCli
 * @property {{
 *   git: Git;
 *   pwd: string;
 *   service: string;
 *   last: boolean;
 *   active: boolean;
 * }} deployGitServer
 * @property {{
 *   service: string;
 *   active: boolean;
 *   last: boolean;
 * }} deployGitCli
 * @property {{
 *   service: string;
 *   skip: boolean;
 *   last: boolean;
 *   latest: boolean;
 *   file: string;
 *   num: number;
 * }} deployEndServer
 * @property {{
 *   service: string;
 *   files: string[];
 *   cwd: string;
 *   last: boolean;
 *   pwd: string;
 * }} deployDeleteFilesServer
 * @property {{
 *   service: string;
 *   files: string[];
 *   cwd: string;
 *   last: boolean;
 *   url: string;
 *   pwd: string;
 * }} deployDeleteFilesCli
 * @property {{
 *   nodeName?: string;
 * }} getDeployData
 * @property {DeployData} deployData
 * @property {{
 *   watch: boolean;
 *   timestamps: boolean;
 *   project: string;
 *   serviceName: string;
 *   since: string | undefined;
 *   until: string | undefined;
 *   tail: number | undefined;
 *   clear: boolean;
 *   config: ConfigFile | null;
 * }} getLogsServer
 * @property {{
 *   url: string;
 * } & WSMessageDataCli['getLogsServer']} getLogsCli
 * @property {{
 *   last: boolean;
 *   text: string;
 *   num: number;
 * }} logs
 * @property {{
 *   project: string;
 * }} remove
 * @property {{
 *   serviceName: string;
 *   serviceType: ServiceTypeCommon;
 * }} acceptDeleteCli
 * @property {{
 *   serviceName: string;
 *   accept: boolean;
 * }} acceptDeleteServer
 * @property {{
 *   project: string;
 * }} ipServer
 * @property {{
 *   ip: string;
 * }} ipCli
 * @property {{
 *   project: string;
 *   service: string;
 *   repl: number;
 * }} execServer
 * @property {{
 *   url: string;
 * }} execCli
 * @property {{
 *   name: string;
 *   interractive: boolean;
 * }} projectDeleteServer
 * @property {{
 *   value: boolean;
 *   name: string;
 * }} projectDeleteAcceptServer
 * @property {{
 *   name: string;
 * }} projectDeleteAcceptCli
 *  @property {{
 *   msg: string;
 * }} projectDeleteProgressCli
 * @property {{
 *  msg: string
 * }} deployProgressCli
 * @property {{
 *  project: string;
 *  service: string;
 * }} serviceRestartServer
 * @property {{
 *  msg: string;
 * }} serviceRestartProgressCli
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {{
 *  status: Status;
 *  type: T;
 *  packageName: string;
 *  message: string;
 *  userId: string;
 *  data: WSMessageDataCli[T];
 *  token: string | null;
 *  connId: string;
 * }} WSMessageCli
 */
