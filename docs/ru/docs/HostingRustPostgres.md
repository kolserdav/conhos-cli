# Хостинг Rust с базой данных Postgres

Чтобы разместить на Контейнерном хостинге `Rust` приложение и подключиться из него к базе данных `Postgres` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Rust` с поднятием сервера базы данных `Postgres` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Postgres` контейнера уточнить в [официальном репозитории Postgres](https://hub.docker.com/_/postgres/tags)

```yml
name: my-rust-postgres-project
services:
  rust1:
    image: rust
    size: mili
    active: true
    version: latest
    pwd: examples/rust-postgres
    exclude:
      - target
    command: cargo build --release && ./target/release/main
    ports:
      - port: 3000
        type: proxy
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - postgres0 # сервис postgres0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - POSTGRES_PASSWORD=value0
      - POSTGRES_USER=value1
      - POSTGRES_DB=value2
  postgres0:
    image: postgres
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - POSTGRES_PASSWORD=value0
      - POSTGRES_USER=value1
      - POSTGRES_DB=value2
```

> Хост базы данных будет доступен в контейнере приложения по названию сервиса`postgres0`.

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Rust Redis <<<](./HostingRustRedis.md) | [>>> Хостинг Rust Mysql](./HostingRustMysql.md)
