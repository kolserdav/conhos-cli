# Хостинг ${{NAME}} с базой данных ${{DATABASE_NAME}}

Чтобы разместить на Контейнерном хостинге `${{NAME}}` приложение и подключиться из него к базе данных `${{DATABASE_NAME}}` необходимо выполнить следующие три шага.

## 1. Установка утилиты для управления проектом

Если вы установили утилиту [conhos](https://www.npmjs.com/package/conhos) ранее, то просто переходите к следующему пункту. Если не установили, то возспользуйтесь [Инструкцией](./GettingStarted.md) для установки.

## 2. Создание файла конфигурации

Файл конфигурации для создания в Контейнерном хостинге сервиса `${{NAME}}` с поднятием сервера базы данных `${{DATABASE_NAME}}` и подключение к нему из приложения, а также опциональный пример поднятия `Adminer` для администрирования баз данных. Подробнее в [Файл конфигурации](./ConfigFile.md).

> Актуальную версию `${{DATABASE_NAME}}` контейнера уточнить в [официальном репозитории ${{DATABASE_NAME}}](${{HUB}}${{DATABASE}}/tags)

```yml
name: name-of-project
services:
  ${{TYPE}}1:
    type: ${{TYPE}}
    size: mili
    active: true
    version: latest
    pwd: examples/${{TYPE}}-${{DATABASE}}
    exclude:
      - ${{EXCLUDE}}
    command: ${{COMMAND}}
    ports:
      - port: 3000
        type: http
    depends_on: # Указываем, что сервис должен иметь внутрениие ссылки на
      - ${{DATABASE}}0 # сервис ${{DATABASE}}0
    environment:
      - PORT=3000
      # Далее пробрасываем переменные для подключения
      - ${{DATABASE_UPPERCASE}}_USER=user
      - ${{DATABASE_UPPERCASE}}_PASSWORD=password
      - ${{DATABASE_UPPERCASE}}_DB=db_name
  ${{DATABASE}}0:
    type: ${{DATABASE}}
    size: mili
    active: true
    version: latest
    environment:
      # Переменные для инициализации базы данных
      - ${{DATABASE_UPPERCASE}}_USER=user
      - ${{DATABASE_UPPERCASE}}_PASSWORD=password
      - ${{DATABASE_UPPERCASE}}_DB=db_name
  adminer0:
    type: adminer
    size: pico
    active: true
    version: latest
    depends_on:
      - ${{DATABASE}}0
```

> Хост базы данных будет доступен в контейнере приложения по переменной окружения `[НАЗВАНИЕ_СЕРВИСА]_HOST`, например для сервиса `${{DATABASE}}0` название переменной хоста внутри контейнера который ссылается на этот сервис через `depends_on` будет `${{DATABASE_UPPERCASE}}0_HOST`

### 3. Запуск проекта в облаке

Для загрузки файлов в облако и запуска сервисов в контейнерах, выполните команду:

```sh
conhos deploy
```
