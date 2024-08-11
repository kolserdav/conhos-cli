# Хостинг Golang

## Ссылки

- [Golang с базой данных Redis](./HostingGolangRedis.md)  
- [Golang с базой данных Postgres](./HostingGolangPostgres.md)  
- [Golang с базой данных Mysql](./HostingGolangMysql.md)  
- [Golang с базой данных Mariadb](./HostingGolangMariadb.md)  
- [Golang с базой данных Mongo](./HostingGolangMongo.md)  
- [Golang с базой данных Rabbitmq](./HostingGolangRabbitmq.md)  


Чтобы разместить на Контейнерном хостинге `Golang` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Golang`. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Golang` контейнера уточнить в [официальном репозитории Golang](https://hub.docker.com/_/golang/tags)

```yml
name: my-awesome-project
services:
  golang0:
    type: golang
    size: mili
    active: true
    pwd: examples/golang
    exclude:
      - vendor
    version: latest
    command: go build -o main && ./main
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

---

Продолжить изучение

[Хостинг Golang Mongo <<<](./HostingGolangMongo.md) | [>>> Хостинг Golang Redis](./HostingGolangRedis.md)
