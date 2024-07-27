# Хостинг Rust

## Ссылки

- [Rust с базой данных Redis](./HostingRustRedis.md)  
- [Rust с базой данных Postgres](./HostingRustPostgres.md)  
- [Rust с базой данных Mysql](./HostingRustMysql.md)  
- [Rust с базой данных Mariadb](./HostingRustMariadb.md)  


Чтобы разместить на Контейнерном хостинге `Rust` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Rust`. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `Rust` контейнера уточнить в [официальном репозитории Node.js](https://hub.docker.com/_/rust/tags)

```yml
name: my-awesome-project
services:
  rust0:
    type: rust
    size: mili
    active: true
    pwd: examples/rust
    exclude:
      - target
    version: latest
    command: cargo build --release && ./target/release/main
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
