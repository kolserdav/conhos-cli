/**
 * @typedef {import("../types/interfaces.js").ServiceType} ServiceType
 * @typedef {import("../types/interfaces.js").ServiceTypeCommon} ServiceTypeCommon
 * @typedef {{
 *  NAME: string;
 *  TYPE: ServiceType;
 *  HUB: string;
 *  EXCLUDE: string;
 *  COMMAND: string;
 *  LINKS: string;
 * }} DocHosting
 * @typedef {Omit<DocHosting, 'LINK'> & {
 *  DATABASE: ServiceTypeCommon;
 *  DATABASE_UPPERCASE: string;
 *  DATABASE_NAME: string;
 * }} DocHostingDatabase
 */

import { resolve } from 'path';
import {
  as,
  SERVICES_COMMON,
  SERVICES_COMMON_PUBLIC,
  SERVICES_CUSTOM,
} from '../types/interfaces.js';
import { COMMAND_DEFAULT, EXCLUDE_DEFAULT } from '../utils/constants.js';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';

const CWD = process.cwd();
const DOCS_PATH = resolve(CWD, 'docs');
const TEMPLATES_PATH = resolve(CWD, 'resources/template-docs');

if (!existsSync(TEMPLATES_PATH)) {
  console.error('Error: Template directory is missing', TEMPLATES_PATH);
  process.exit(1);
}

if (!existsSync(DOCS_PATH)) {
  console.error('Error: Docs directory is missing', DOCS_PATH);
  process.exit(1);
}

const tempDir = readdirSync(TEMPLATES_PATH);

tempDir.forEach((item) => {
  createTemplate(item);
});

/**
 * @param {string} lang
 */
function createTemplate(lang) {
  const templatePath = resolve(TEMPLATES_PATH, lang, 'Hosting.template.md');
  const template = readFileSync(templatePath).toString();
  const templateDatabasePath = resolve(TEMPLATES_PATH, lang, 'HostingDatabase.template.md');
  const templateDatabase = readFileSync(templateDatabasePath).toString();
  /**
   * @type {DocHostingDatabase[]}
   */
  const data = [];
  /**
   * @type {DocHosting[]}
   */
  const dataD = [];
  SERVICES_CUSTOM.forEach((item) => {
    /**
     * @type {DocHosting}
     */
    const dataItem = {
      NAME: firstCapitalize(item),
      TYPE: item,
      HUB: 'https://hub.docker.com/_/',
      COMMAND: COMMAND_DEFAULT[item],
      LINKS: '',
      EXCLUDE: EXCLUDE_DEFAULT[item][0],
    };
    SERVICES_COMMON.forEach((_item) => {
      if (SERVICES_COMMON_PUBLIC.indexOf(as(_item)) !== -1) {
        return;
      }
      const DATABASE_NAME = firstCapitalize(_item);
      const dbFilename = getDatabaseFileName({ name: dataItem.NAME, databaseName: DATABASE_NAME });
      dataItem.LINKS +=
        lang === 'en'
          ? `- [${dataItem.NAME} with database ${DATABASE_NAME}](./${dbFilename})  \n`
          : `- [${dataItem.NAME} с базой данных ${DATABASE_NAME}](./${dbFilename})  \n`;
      data.push({
        ...dataItem,
        DATABASE_NAME,
        DATABASE: _item,
        DATABASE_UPPERCASE: _item.toUpperCase(),
      });
    });
    dataD.push(dataItem);
  });

  data.forEach((item) => {
    const keys = Object.keys(item);
    let result = `${templateDatabase}`;
    keys.forEach((_item) => {
      const reg = getEnvironmentRegexp(_item);
      result = result.replaceAll(
        reg,
        item[/** @type {typeof as<keyof DocHostingDatabase>} */ (as)(_item)]
      );
    });
    const destPath = resolve(
      DOCS_PATH,
      lang,
      'docs',
      getDatabaseFileName({ name: item.NAME, databaseName: item.DATABASE_NAME })
    );
    writeFileSync(destPath, result);
  });

  dataD.forEach((item) => {
    const keys = Object.keys(item);
    let result = `${template}`;
    keys.forEach((_item) => {
      const reg = getEnvironmentRegexp(_item);
      result = result.replaceAll(reg, item[/** @type {typeof as<keyof DocHosting>} */ (as)(_item)]);
    });
    const destPath = resolve(DOCS_PATH, lang, 'docs', `Hosting${item.NAME}.md`);
    writeFileSync(destPath, result);
  });
}

/**
 * @param {{
 *  name: string;
 *  databaseName: string;
 * }} param0
 */
function getDatabaseFileName({ name, databaseName }) {
  return `Hosting${name}${databaseName}.md`;
}

/**
 * @param {string} str
 * @returns
 */
function firstCapitalize(str) {
  let res = '';
  for (let i = 0; str[i]; i++) {
    const val = str[i];
    const sym = i === 0 ? val.toUpperCase() : val;
    res += sym;
  }
  return res;
}

/**
 * @param {string} name
 * @returns
 */
function getEnvironmentRegexp(name) {
  return new RegExp(`\\$\\{\\{${name}\\}\\}`, 'g');
}
