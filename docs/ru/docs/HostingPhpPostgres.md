# Хостинг Php с базой данных Postgres

Чтобы разместить на Контейнерном хостинге `Php` приложение и подключиться из него к базе данных `Postgres` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Php` с поднятием сервера базы данных `Postgres` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `Postgres` контейнера уточнить в [официальном репозитории Postgres](https://hub.docker.com/_/postgres/tags)

```yml
name: name-of-project
services:
  php1:
    type: php
    size: mili
    active: true
    version: latest
    pwd: examples/php-postgres
    exclude:
      - vendor
    command: php-fpm
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - postgres0 # сервис postgres0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=db_name
  postgres0:
    type: postgres
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=db_name
  adminer0:
    type: adminer
    size: pico
    active: true
    version: latest
    depends_on:
      - postgres0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[НАЗВАНИЕ_СЕРВИСА]_HOST`, например для сервиса `postgres0` название переменной хоста внутри контейнера который ссылается на этот сервис через `depends_on` будет `POSTGRES0_HOST`

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```
