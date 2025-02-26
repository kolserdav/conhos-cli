# Хостинг Ruby

## Ссылки

- [Ruby с базой данных Redis](./HostingRubyRedis.md)  
- [Ruby с базой данных Postgres](./HostingRubyPostgres.md)  
- [Ruby с базой данных Mysql](./HostingRubyMysql.md)  
- [Ruby с базой данных Mariadb](./HostingRubyMariadb.md)  
- [Ruby с базой данных Mongo](./HostingRubyMongo.md)  
- [Ruby с базой данных Rabbitmq](./HostingRubyRabbitmq.md)  


Чтобы разместить на Контейнерном хостинге `Ruby` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то воспользуйтесь [Инструкцией](./GettingStarted.md#введение) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Ruby`. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Ruby` контейнера уточнить в [официальном репозитории Ruby](https://hub.docker.com/_/ruby/tags)

```yml
name: my-ruby-project
services:
  ruby0:
    image: ruby
    size: mili
    active: true
    pwd: examples/ruby
    exclude:
      - vendor
    version: latest
    command: bundle install && ruby server.rb
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

[Хостинг Ruby Mongo <<<](./HostingRubyMongo.md) | [>>> Хостинг Ruby Redis](./HostingRubyRedis.md)
