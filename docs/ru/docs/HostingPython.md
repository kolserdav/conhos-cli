# Хостинг Python

## Ссылки

- [Python с базой данных Redis](./HostingPythonRedis.md)  
- [Python с базой данных Postgres](./HostingPythonPostgres.md)  
- [Python с базой данных Mysql](./HostingPythonMysql.md)  
- [Python с базой данных Mariadb](./HostingPythonMariadb.md)  
- [Python с базой данных Mongo](./HostingPythonMongo.md)  
- [Python с базой данных Rabbitmq](./HostingPythonRabbitmq.md)  


Чтобы разместить на Контейнерном хостинге `Python` приложение необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то воспользуйтесь [Инструкцией](./GettingStarted.md#введение) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Python`. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Python` контейнера уточнить в [официальном репозитории Python](https://hub.docker.com/_/python/tags)

```yml
name: my-awesome-project
services:
  python0:
    image: python
    size: mili
    active: true
    pwd: examples/python
    exclude:
      - venv
    version: latest
    command: pip install -r requirements.txt && python main.py
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

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Python Mongo <<<](./HostingPythonMongo.md) | [>>> Хостинг Python Redis](./HostingPythonRedis.md)
