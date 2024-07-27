# Хостинг Php

## Ссылки

- [Php с базой данных Redis](./HostingPhpRedis.md)  
- [Php с базой данных Postgres](./HostingPhpPostgres.md)  
- [Php с базой данных Mysql](./HostingPhpMysql.md)  
- [Php с базой данных Mariadb](./HostingPhpMariadb.md)  


Чтобы разместить на Контейнерном хостинге `Php` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Php`. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `Php` контейнера уточнить в [официальном репозитории Php](https://hub.docker.com/_/php/tags)

```yml
name: my-awesome-project
services:
  php0:
    type: php
    size: mili
    active: true
    pwd: examples/php
    exclude:
      - vendor
    version: latest
    command: php-fpm
    ports:
      - port: 3000
        type: http
    environment:
      - PORT=3000
```

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```
