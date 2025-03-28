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

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то воспользуйтесь [Инструкцией](./GettingStarted.md#введение) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Golang`. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Golang` контейнера уточнить в [официальном репозитории Golang](https://hub.docker.com/_/golang/tags)

```yml
name: my-golang-project
services:
  golang0:
    image: golang
    size: mili
    active: true
    pwd: examples/golang
    exclude:
      - vendor
    version: latest
    command: go build -o main && ./main
    ports:
      - port: 3000
        type: proxy
    environment:
      - PORT=3000
```

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Golang Mongo <<<](./HostingGolangMongo.md) | [>>> Хостинг Golang Redis](./HostingGolangRedis.md)
