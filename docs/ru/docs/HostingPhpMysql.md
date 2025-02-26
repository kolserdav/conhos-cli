# Хостинг Php с базой данных Mysql

Чтобы разместить на Контейнерном хостинге `Php` приложение и подключиться из него к базе данных `Mysql` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Php` с поднятием сервера базы данных `Mysql` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Mysql` контейнера уточнить в [официальном репозитории Mysql](https://hub.docker.com/_/mysql/tags)

```yml
name: my-php-mysql-project
services:
  php1:
    image: php
    size: mili
    active: true
    version: latest
    pwd: examples/php-mysql
    exclude:
      - vendor
    command: php-fpm
    ports:
      - port: 3000
        type: proxy
    depends_on: # Сервис должен запускаться только после следующих сервисов
      - mysql0 # сервис mysql0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - MYSQL_ROOT_PASSWORD=value0
      - MYSQL_USER=value1
      - MYSQL_PASSWORD=value2
      - MYSQL_DATABASE=value3
  mysql0:
    image: mysql
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - MYSQL_ROOT_PASSWORD=value0
      - MYSQL_USER=value1
      - MYSQL_PASSWORD=value2
      - MYSQL_DATABASE=value3
```

> Хост базы данных будет доступен в контейнере приложения по названию сервиса`mysql0`.

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Php Postgres <<<](./HostingPhpPostgres.md) | [>>> Хостинг Php Mariadb](./HostingPhpMariadb.md)
