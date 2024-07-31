# Хостинг Python с базой данных Mariadb

Чтобы разместить на Контейнерном хостинге `Python` приложение и подключиться из него к базе данных `Mariadb` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `Python` с поднятием сервера базы данных `Mariadb` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `Mariadb` контейнера уточнить в [официальном репозитории Mariadb](https://hub.docker.com/_/mariadb/tags)

```yml
name: name-of-project
services:
  python1:
    type: python
    size: mili
    active: true
    version: latest
    pwd: examples/python-mariadb
    exclude:
      - venv
    command: pip install -r requirements.txt && python main.py
    ports:
      - port: 3000
        type: http
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
    type: mariadb
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
			- MARIADB_ROOT_PASSWORD=value0
			- MARIADB_USER=value1
			- MARIADB_PASSWORD=value2
			- MARIADB_DATABASE=value3
  adminer0:
    type: adminer
    size: pico
    active: true
    version: latest
    depends_on:
      - mariadb0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[НАЗВАНИЕ_СЕРВИСА]_HOST`, например для сервиса `mariadb0` название переменной хоста внутри контейнера который ссылается на этот сервис через `depends_on` будет `MARIADB0_HOST`

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```
