# Хостинг Rust с базой данных Mongo

Чтобы разместить на Контейнерном хостинге `Rust` приложение и подключиться из него к базе данных `Mongo` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Rust` с поднятием сервера базы данных `Mongo` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `Mongo` контейнера уточнить в [официальном репозитории Mongo](https://hub.docker.com/_/mongo/tags)

```yml
name: name-of-project
services:
  rust1:
    type: rust
    size: mili
    active: true
    version: latest
    pwd: examples/rust-mongo
    exclude:
      - target
    command: cargo build --release && ./target/release/main
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - mongo0 # сервис mongo0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - MONGO_INITDB_ROOT_USERNAME=value0
      - MONGO_INITDB_ROOT_PASSWORD=value1
  mongo0:
    type: mongo
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - MONGO_INITDB_ROOT_USERNAME=value0
      - MONGO_INITDB_ROOT_PASSWORD=value1
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[НАЗВАНИЕ_СЕРВИСА]_HOST`, например для сервиса `mongo0` название переменной хоста внутри контейнера который ссылается на этот сервис через `depends_on` будет `MONGO0_HOST`

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

---

Продолжить изучение

[Хостинг Rust Mariadb <<<](./HostingRustMariadb.md) | [>>> Хостинг Rust Rabbitmq](./HostingRustRabbitmq.md)
