# Хостинг Python с базой данных Rabbitmq

Чтобы разместить на Контейнерном хостинге `Python` приложение и подключиться из него к базе данных `Rabbitmq` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

> Если файлы вашего проекта находятся в Git репозитории, то установка утилиты необязательна, так как вы сможете запустить проект из браузера.

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

> Если файлы вашего проекта находятся в Git репозитории, то создание файла конфигурации можно осуществить из браузера.

Файл конфигурации для создания в Контейнерном хостинге сервиса `Python` с поднятием сервера базы данных `Rabbitmq` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md#пример_файла_конфигурации).

> Актуальную версию `Rabbitmq` контейнера уточнить в [официальном репозитории Rabbitmq](https://hub.docker.com/_/rabbitmq/tags)

```yml
name: my-python-rabbitmq-project
services:
  python1:
    image: python
    size: mili
    active: true
    version: latest
    pwd: examples/python-rabbitmq
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: proxy
    depends_on: # Сервис должен запускаться только после следующих сервисов
      - rabbitmq0 # сервис rabbitmq0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - RABBITMQ_DEFAULT_PASS=value0
      - RABBITMQ_DEFAULT_USER=value1
  rabbitmq0:
    image: rabbitmq
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - RABBITMQ_DEFAULT_PASS=value0
      - RABBITMQ_DEFAULT_USER=value1
```

> Хост базы данных будет доступен в контейнере приложения по названию сервиса`rabbitmq0`.

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

<div style="margin-top: 4rem;"></div>

Продолжить изучение

[Хостинг Python Mongo <<<](./HostingPythonMongo.md) | [>>> Хостинг Python Redis](./HostingPythonRedis.md)
