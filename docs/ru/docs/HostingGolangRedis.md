# Хостинг Golang с базой данных Redis

Чтобы разместить на Контейнерном хостинге `Golang` приложение и подключиться из него к базе данных `Redis` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Golang` с поднятием сервера базы данных `Redis` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md).

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
      - REDIS_PASSWORD=value0
  redis0:
    type: redis
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - REDIS_PASSWORD=value0
  adminer0:
    type: adminer
    size: pico
    active: true
    version: latest
    depends_on:
      - redis0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[НАЗВАНИЕ_СЕРВИСА]_HOST`, например для сервиса `redis0` название переменной хоста внутри контейнера который ссылается на этот сервис через `depends_on` будет `REDIS0_HOST`

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```
