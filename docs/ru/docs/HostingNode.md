# Хостинг Node

## Ссылки

- [Node с базой данных Redis](./HostingNodeRedis.md)  
- [Node с базой данных Postgres](./HostingNodePostgres.md)  
- [Node с базой данных Mysql](./HostingNodeMysql.md)  
- [Node с базой данных Mariadb](./HostingNodeMariadb.md)  
- [Node с базой данных Mongo](./HostingNodeMongo.md)  
- [Node с базой данных Rabbitmq](./HostingNodeRabbitmq.md)  


Чтобы разместить на Контейнерном хостинге `Node` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Node`. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `Node` контейнера уточнить в [официальном репозитории Node](https://hub.docker.com/_/node/tags)

```yml
name: my-awesome-project
services:
  node0:
    type: node
    size: mili
    active: true
    pwd: examples/node
    exclude:
      - node_modules
    version: latest
    command: npm i && npm run start
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
