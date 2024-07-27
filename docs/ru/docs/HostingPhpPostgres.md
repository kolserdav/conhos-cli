# Хостинг Php с базой данных Postgres

Если ваше приложение должно работать связке с сервером базы данных, вы можете также запустить сервер базы данных и подключиться к нему из своего приложения. А ещё, если вам понадобится веб панель СУБД для управления базой данных, то её также можно подключить в виде отдельного сервиса.

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
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - postgres0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[ТИП_СЕРВИСА]_HOST`, например для базы данных `postgres` название переменной хоста будет `POSTGRES_HOST`
