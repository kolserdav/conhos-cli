# Хостинг Python с базой данных Mariadb

Чтобы разместить на Контейнерном хостинге `Python` приложение и подключиться из него к базе данных `Mariadb` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Python` с поднятием сервера базы данных `Mariadb` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Mariadb` контейнера уточнить в [официальном репозитории Mariadb](https://hub.docker.com/_/mariadb/tags)

```yml
name: my-python-mariadb-project
services:
  python1:
    image: python
    size: mili
    active: true
    version: latest
    pwd: examples/python-mariadb
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: proxy
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - mariadb0 # сервис mariadb0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - MARIADB_ROOT_PASSWORD=value0
      - MARIADB_USER=value1
      - MARIADB_PASSWORD=value2
      - MARIADB_DATABASE=value3
  mariadb0:
    image: mariadb
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - MARIADB_ROOT_PASSWORD=value0
      - MARIADB_USER=value1
      - MARIADB_PASSWORD=value2
      - MARIADB_DATABASE=value3
```

> Хост базы данных будет доступен в контейнере приложения по названию сервиса`mariadb0`.

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Python Mysql <<<](./HostingPythonMysql.md) | [>>> Хостинг Python Mongo](./HostingPythonMongo.md)
