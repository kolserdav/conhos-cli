# Хостинг Php

## Ссылки

- [Php с базой данных Redis](./HostingPhpRedis.md)  
- [Php с базой данных Postgres](./HostingPhpPostgres.md)  
- [Php с базой данных Mysql](./HostingPhpMysql.md)  
- [Php с базой данных Mariadb](./HostingPhpMariadb.md)  
- [Php с базой данных Mongo](./HostingPhpMongo.md)  
- [Php с базой данных Rabbitmq](./HostingPhpRabbitmq.md)  


Чтобы разместить на Контейнерном хостинге `Php` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то воспользуйтесь [Инструкцией](./GettingStarted.md#введение) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Php`. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Php` контейнера уточнить в [официальном репозитории Php](https://hub.docker.com/_/php/tags)

```yml
name: my-php-project
services:
  php0:
    image: php
    size: mili
    active: true
    pwd: examples/php
    exclude:
      - vendor
    version: latest
    command: php-fpm
    ports:
      - port: 3000
        type: proxy
    environment:
      - PORT=3000
```

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Php Mongo <<<](./HostingPhpMongo.md) | [>>> Хостинг Php Redis](./HostingPhpRedis.md)
