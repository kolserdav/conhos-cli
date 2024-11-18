# Хостинг Node с базой данных Mysql

Чтобы разместить на Контейнерном хостинге `Node` приложение и подключиться из него к базе данных `Mysql` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Node` с поднятием сервера базы данных `Mysql` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Mysql` контейнера уточнить в [официальном репозитории Mysql](https://hub.docker.com/_/mysql/tags)

```yml
name: name-of-project
services:
  node1:
    image: node
    size: mili
    active: true
    version: latest
    pwd: examples/node-mysql
    exclude:
      - node_modules
    command: npm i && npm run start
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
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

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[НАЗВАНИЕ_СЕРВИСА]_HOST`, например для сервиса `mysql0` название переменной хоста внутри контейнера который ссылается на этот сервис через `depends_on` будет `MYSQL0_HOST`

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Node Postgres <<<](./HostingNodePostgres.md) | [>>> Хостинг Node Mariadb](./HostingNodeMariadb.md)
