/******************************************************************************************
 * Repository: Conhos cli
 * File name: create-docs.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'path';
import { format } from 'date-fns';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import {
  as,
  ENVIRONMENT_REQUIRED_COMMON,
  isCommonServicePublic,
  SERVICES_COMMON,
  SERVICES_COMMON_PUBLIC,
  SERVICES_CUSTOM,
} from '../types/interfaces.js';

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
 *  BACK_LINK_NAME: string;
 *  BACK_LINK: string;
 *  FORWARD_LINK_NAME: string;
 *  FORWARD_LINK: string;
 * }} DocHosting
 * @typedef {DocHosting & {
 *  DATABASE: ServiceTypeCommon;
 *  DATABASE_UPPERCASE: string;
 *  DATABASE_NAME: string;
 *  ENVIRONMENT: string;
 * }} DocHostingDatabase
 * @typedef {{
 *  url: string;
 *  title: string;
 *  description: string;
 *  keywords: string;
 * }} Metadata
 */

import { COMMAND_DEFAULT, EXCLUDE_DEFAULT } from '../utils/constants.js';

const CWD = process.cwd();
const DOCS_PATH = resolve(CWD, 'docs');
const RESOURCES_PATH = resolve(CWD, 'resources');
const TMP_PATH = resolve(CWD, 'tmp');
const RESOURCES_GENERATED_PATH = resolve(TMP_PATH, 'generated');
const METADATA_FILE_PREFIX = resolve(RESOURCES_GENERATED_PATH, 'metadata');
const SITEMAP_PATH = resolve(RESOURCES_GENERATED_PATH, 'sitemap.xml');
const TEMPLATES_PATH = resolve(RESOURCES_PATH, 'template-docs');
const MD = '.md';
const MD_REG = new RegExp(`${MD}$`);

if (!existsSync(TEMPLATES_PATH)) {
  console.error('Error: Template directory is missing', TEMPLATES_PATH);
  process.exit(1);
}

if (!existsSync(DOCS_PATH)) {
  console.error('Error: Docs directory is missing', DOCS_PATH);
  process.exit(1);
}

if (!existsSync(RESOURCES_GENERATED_PATH)) {
  mkdirSync(RESOURCES_GENERATED_PATH);
}

const tempDir = readdirSync(TEMPLATES_PATH);

tempDir.forEach((item) => {
  createTemplate(item);
});

/**
 * @param {{
 *  index: number;
 *  array: string[];
 *  postfixArray: string[];
 *  postfixIndex: number;
 *  lang: string;
 *  _currentItem: string
 * }} param0
 * @returns
 */
function getBackLink({ index, array, postfixArray, postfixIndex, lang, _currentItem }) {
  const postfix =
    postfixIndex === 0
      ? ''
      : postfixArray[postfixIndex - 1]
      ? firstCapitalize(
          isCommonServicePublic(as(postfixArray[postfixIndex - 1])) === null
            ? postfixArray[postfixIndex - 1]
            : ''
        )
      : '';
  return {
    BACK_LINK_NAME:
      index === 0 || firstCapitalize(_currentItem) === postfix
        ? lang === 'ru'
          ? 'Начало работы'
          : 'Getting started'
        : array[index - 1]
        ? `${lang === 'ru' ? 'Хостинг ' : 'Hosting '}${firstCapitalize(
            array[index - 1]
          )} ${postfix}`
        : lang === 'ru'
        ? 'Файл конфигурации'
        : 'Config file',
    BACK_LINK:
      index === 0 || firstCapitalize(_currentItem) === postfix
        ? './GettingsStarted.md'
        : array[index - 1]
        ? `./${getDatabaseFileName({
            name: firstCapitalize(array[index - 1]),
            databaseName: '',
          }).replace(MD_REG, '')}${postfix}${MD}`
        : './ConfigFile.md',
    index,
    postfix,
  };
}

/**
 * @param {{
 *  index: number;
 *  array: string[];
 *  postfixArray: string[];
 *  postfixIndex: number;
 *  lang: string;
 *  _currentItem: string;
 * }} param0
 * @returns
 */
function getForwardLink({ index, array, postfixArray, postfixIndex, lang, _currentItem }) {
  const postfix =
    postfixIndex === postfixArray.length - 1
      ? ''
      : postfixArray[postfixIndex + 1]
      ? firstCapitalize(
          isCommonServicePublic(as(postfixArray[postfixIndex + 1])) === null
            ? postfixArray[postfixIndex + 1]
            : postfixArray[0]
        )
      : '';
  return {
    FORWARD_LINK_NAME:
      index === array.length - 1 || firstCapitalize(_currentItem) === postfix
        ? lang === 'ru'
          ? 'Файл конфигурации'
          : 'Config file'
        : array[index + 1]
        ? `${lang === 'ru' ? 'Хостинг ' : 'Hosting '}${firstCapitalize(
            array[index + 1]
          )} ${postfix}`
        : lang === 'ru'
        ? 'Начало работы'
        : 'Getting started',
    FORWARD_LINK:
      index === array.length - 1 || firstCapitalize(_currentItem) === postfix
        ? './ConfigFile.md'
        : array[index + 1]
        ? `./${getDatabaseFileName({
            name: firstCapitalize(array[index + 1]),
            databaseName: postfix,
          })}`
        : './GettingsStarted.md',
    index,
    postfix,
  };
}

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
  SERVICES_CUSTOM.forEach((item, index, array) => {
    const {
      BACK_LINK,
      BACK_LINK_NAME,
      index: indexBackLink,
    } = getBackLink({ index, lang, array, postfixArray: [], postfixIndex: 0, _currentItem: '1' });
    const {
      FORWARD_LINK,
      FORWARD_LINK_NAME,
      index: indexFowardLink,
    } = getForwardLink({
      index,
      lang,
      array,
      postfixArray: [],
      postfixIndex: 0,
      _currentItem: '1',
    });

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
      BACK_LINK,
      BACK_LINK_NAME,
      FORWARD_LINK,
      FORWARD_LINK_NAME,
    };
    SERVICES_COMMON.forEach((_item, _index, _array) => {
      if (SERVICES_COMMON_PUBLIC.indexOf(as(_item)) !== -1) {
        return;
      }

      const DATABASE_NAME = firstCapitalize(_item);
      const dbFilename = getDatabaseFileName({ name: dataItem.NAME, databaseName: DATABASE_NAME });
      dataItem.LINKS +=
        lang === 'en'
          ? `- [${dataItem.NAME} with database ${DATABASE_NAME}](./${dbFilename})  \n`
          : `- [${dataItem.NAME} с базой данных ${DATABASE_NAME}](./${dbFilename})  \n`;

      const {
        BACK_LINK: _BACK_LINK,
        BACK_LINK_NAME: _BACK_LINK_NAME,
        postfix: postfixBack,
      } = getBackLink({
        index: indexBackLink + 1,
        lang,
        array,
        postfixArray: _array,
        postfixIndex: _index,
        _currentItem: _item,
      });
      const {
        FORWARD_LINK: _FORWARD_LINK,
        FORWARD_LINK_NAME: _FORWARD_LINK_NAME,
        postfix: postfixForward,
      } = getForwardLink({
        index: indexFowardLink - 1,
        lang,
        array,
        postfixArray: _array,
        postfixIndex: _index,
        _currentItem: _item,
      });
      if (postfixBack) {
        dataItem.BACK_LINK = _BACK_LINK;
        dataItem.BACK_LINK_NAME = _BACK_LINK_NAME;
      }

      if (postfixForward) {
        dataItem.FORWARD_LINK = _FORWARD_LINK;
        dataItem.FORWARD_LINK_NAME = _FORWARD_LINK_NAME;
      }

      data.push({
        ...dataItem,
        DATABASE_NAME,
        DATABASE: _item,
        DATABASE_UPPERCASE: _item.toUpperCase(),
        ENVIRONMENT: createEnvironment(_item),
      });
    });
    dataD.push(dataItem);
  });

  /**
   * @type {Metadata[]}
   */
  const metadata = [];

  let sitemap = '';

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
    const filename = getDatabaseFileName({ name: item.NAME, databaseName: item.DATABASE_NAME });
    const destPath = resolve(DOCS_PATH, lang, 'docs', filename);
    metadata.push({
      url: `/docs/${filename}`,
      title:
        lang === 'en'
          ? `Hosting ${item.NAME} with database ${item.DATABASE_NAME}`
          : `Хостинг ${item.NAME} с базой данных ${item.DATABASE_NAME}`,
      description:
        lang === 'en'
          ? `Deploy ${item.NAME} application on hosting and connect it to the database ${item.DATABASE_NAME}. Without the need to maintain a dedicated server.`
          : `Развернуть ${item.NAME} приложение на хостинге и подключить его к базе данных ${item.DATABASE_NAME}. Без необходимости содержания выделенного сервера.`,
      keywords:
        lang === 'en'
          ? `hosting,${item.TYPE},${item.DATABASE}`
          : `hosting,${item.TYPE},${item.DATABASE},дешево`,
    });
    if (lang === 'ru') {
      sitemap += createSitemapRecord({ filename });
    }
    writeFileSync(destPath, result);
  });

  dataD.forEach((item) => {
    const keys = Object.keys(item);
    let result = `${template}`;
    keys.forEach((_item) => {
      const reg = getEnvironmentRegexp(_item);
      result = result.replaceAll(reg, item[/** @type {typeof as<keyof DocHosting>} */ (as)(_item)]);
    });
    const filename = `Hosting${item.NAME}.md`;
    const destPath = resolve(DOCS_PATH, lang, 'docs', filename);
    writeFileSync(destPath, result);

    metadata.push({
      url: `/docs/${filename}`,
      title: lang === 'en' ? `Hosting ${item.NAME}` : `Хостинг ${item.NAME}`,
      description:
        lang === 'en'
          ? `Deploy ${item.NAME} application on hosting. Without the need to maintain a dedicated server`
          : `Развернуть ${item.NAME} приложение на хостинге. Без необходимости содержания выделенного сервера.`,
      keywords: lang === 'en' ? `hosting,${item.TYPE}` : `хостинг,${item.TYPE},дешево`,
    });

    if (lang === 'ru') {
      sitemap += createSitemapRecord({ filename });
    }
  });

  writeFileSync(`${METADATA_FILE_PREFIX}-${lang}.json`, JSON.stringify(metadata));
  writeFileSync(SITEMAP_PATH, sitemap);
}

/**
 * @param {ServiceTypeCommon} type
 */
function createEnvironment(type) {
  let res = '';
  ENVIRONMENT_REQUIRED_COMMON[type].forEach((item, index) => {
    const newLine = ENVIRONMENT_REQUIRED_COMMON[type][index + 1] === undefined ? '' : '\n';
    res += `      - ${item}=value${index}${newLine}`;
  });
  return res;
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

/**
 * @param {{
 *   filename: string;
 * }} param0
 * @returns
 */
function createSitemapRecord({ filename }) {
  return `<url>
  <loc>https://conhos.ru/ru-RU/docs/${filename}</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://conhos.ru/en-US/docs/${filename}" />
  <lastmod>${format(new Date(), 'yyyy-MM-dd')}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>\n`;
}
