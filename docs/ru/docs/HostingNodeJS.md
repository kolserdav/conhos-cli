# Хостинг Node.js

Чтобы разместить на Контейнерном хостинге `Node.js` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

> Актуальную версию `Node.js` контейнера уточнить в [официальном репозитории Node.js](https://hub.docker.com/_/node/tags)

```yml
name: my-awesome-project
services:
  node0:
    type: node
    size: mili
    active: true
    pwd: ./
    exclude:
      - node_modules
      - dist
    version: 21-alpine3.18
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

### База данных

Если ваше приложение должно работать связке с сервером базы данных, вы можете также запустить сервер базы данных и подключиться к нему из своего приложения. А ещё, если вам понадобится веб панель СУБД для управления базой данных, то её также можно подключить в виде отдельного сервиса.

> Актуальную версию `Postgres` контейнера уточнить в [официальном репозитории Postgres](https://hub.docker.com/_/postgres/tags)

```yml
name: name-of-project
services:
  node1:
    type: node
    size: mili
    active: true
    public: true
    version: 22-alpine3.19
    pwd: examples/postgres
    exclude:
      - tmp
      - node_modules
    command: npm i && npm run start
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
      - POSTGRES_DB=postgres_db
  postgres0:
    type: postgres
    size: mili
    active: true
    public: false
    version: 17beta2-alpine3.19
    environment:
      # Переменные для инициализации базы данных
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=postgres_db
  adminer0:
    type: adminer
    size: mili
    active: true
    public: true
    version: 4.8.1-standalone
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[ТИП_СЕРВИСА]_HOST`, например для базы данных `postgres` название переменной хоста будет `POSTGRES_HOST`
