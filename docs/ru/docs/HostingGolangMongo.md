# Хостинг Golang с базой данных Mongo

Чтобы разместить на Контейнерном хостинге `Golang` приложение и подключиться из него к базе данных `Mongo` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Golang` с поднятием сервера базы данных `Mongo` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Mongo` контейнера уточнить в [официальном репозитории Mongo](https://hub.docker.com/_/mongo/tags)

```yml
name: my-golang-mongo-project
services:
  golang1:
    image: golang
    size: mili
    active: true
    version: latest
    pwd: examples/golang-mongo
    exclude:
      - vendor
    command: go build -o main && ./main
    ports:
      - port: 3000
        type: proxy
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - mongo0 # сервис mongo0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - MONGO_INITDB_ROOT_USERNAME=value0
      - MONGO_INITDB_ROOT_PASSWORD=value1
  mongo0:
    image: mongo
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - MONGO_INITDB_ROOT_USERNAME=value0
      - MONGO_INITDB_ROOT_PASSWORD=value1
```

> Хост базы данных будет доступен в контейнере приложения по названию сервиса`mongo0`.

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Golang Mariadb <<<](./HostingGolangMariadb.md) | [>>> Хостинг Golang Rabbitmq](./HostingGolangRabbitmq.md)
