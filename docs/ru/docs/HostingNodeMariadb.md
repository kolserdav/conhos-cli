# Хостинг Node с базой данных Mariadb

Если ваше приложение должно работать связке с сервером базы данных, вы можете также запустить сервер базы данных и подключиться к нему из своего приложения. А ещё, если вам понадобится веб панель СУБД для управления базой данных, то её также можно подключить в виде отдельного сервиса.

> Актуальную версию `Mariadb` контейнера уточнить в [официальном репозитории Mariadb](https://hub.docker.com/_/mariadb/tags)

```yml
name: name-of-project
services:
  node1:
    type: node
    size: mili
    active: true
    version: latest
    pwd: examples/node-mariadb
    exclude:
      - node_modules
    command: npm i && npm run start
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - mariadb0 # сервис mariadb0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - MARIADB_USER=user
      - MARIADB_PASSWORD=password
      - MARIADB_DB=db_name
  mariadb0:
    type: mariadb
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - MARIADB_USER=user
      - MARIADB_PASSWORD=password
      - MARIADB_DB=db_name
  adminer0:
    type: adminer
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - mariadb0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[ТИП_СЕРВИСА]_HOST`, например для базы данных `mariadb` название переменной хоста будет `MARIADB_HOST`
