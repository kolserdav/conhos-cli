# Хостинг Python с базой данных Redis

Чтобы разместить на Контейнерном хостинге `Python` приложение и подключиться из него к базе данных `Redis` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Python` с поднятием сервера базы данных `Redis` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `Redis` контейнера уточнить в [официальном репозитории Redis](https://hub.docker.com/_/redis/tags)

```yml
name: name-of-project
services:
  python1:
    type: python
    size: mili
    active: true
    version: latest
    pwd: examples/python-redis
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - redis0 # сервис redis0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - REDIS_PASSWORD=value0
  redis0:
    type: redis
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - REDIS_PASSWORD=value0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[НАЗВАНИЕ_СЕРВИСА]_HOST`, например для сервиса `redis0` название переменной хоста внутри контейнера который ссылается на этот сервис через `depends_on` будет `REDIS0_HOST`

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```

---

Продолжить изучение

[Хостинг Python  <<<](./HostingPython.md) | [>>> Хостинг Python Postgres](./HostingPythonPostgres.md)
