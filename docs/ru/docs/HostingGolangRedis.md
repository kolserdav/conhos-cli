# Хостинг Golang с базой данных Redis

Если ваше приложение должно работать связке с сервером базы данных, вы можете также запустить сервер базы данных и подключиться к нему из своего приложения. А ещё, если вам понадобится веб панель СУБД для управления базой данных, то её также можно подключить в виде отдельного сервиса.

> Актуальную версию `Redis` контейнера уточнить в [официальном репозитории Redis](https://hub.docker.com/_/redis/tags)

```yml
name: name-of-project
services:
  golang1:
    type: golang
    size: mili
    active: true
    version: latest
    pwd: examples/golang-redis
    exclude:
      - vendor
    command: go build -o main && ./main
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - redis0 # сервис redis0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - REDIS_USER=user
      - REDIS_PASSWORD=password
      - REDIS_DB=db_name
  redis0:
    type: redis
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - REDIS_USER=user
      - REDIS_PASSWORD=password
      - REDIS_DB=db_name
  adminer0:
    type: adminer
    size: mili
    active: true
    version: 4.8.1-standalone
    depends_on:
      - redis0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[ТИП_СЕРВИСА]_HOST`, например для базы данных `redis` название переменной хоста будет `REDIS_HOST`
