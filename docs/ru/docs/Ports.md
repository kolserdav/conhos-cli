# Порты

Порты служат для того чтобы настроить в хостинге веб сервер который будет выводить нужный порт вашего сервиса в интернет.

## Конфигурация [![якорь](https://conhos.ru/images/icons/link.svg)](#config)

Порты являются параметром уровня [Сервиса](./ConfigFile.md#services):

```yml
ports:
  - port: 3000
    type: proxy # proxy | php
    # Опционально
    ws: true # По умолчанию false
    # Опционально
    location: /path-url # По умолчанию "/"
    # Опционально
    proxy_path: / # По умолчанию ""
    # Опционально
    timeout: 60s
    # Опционально
    buffer_size: 64k
    # Опционально
    client_max_body_size: 1m
    # Опционально
    request_buffering: off # По умолчанию on
    # Опционально
    buffering: off # По умолчанию on
    # Опционально
    http_version: '1.1' # По умолчанию 1.0
    # Опционально
    headers:
      'Header-Name': 'Header-Value'
    # Опционально
    static:
      - location: /location
        path: /path
        # Опционально
        index: index.html
```

## Устройство веб сервера [![якорь](https://conhos.ru/images/icons/link.svg)](#web-server)

Далее приведены примеры для каждого типа порта, какого вида конфигурацию `Nginx` создают эти параметры:

---

- **proxy**:

```nginx
server  {
    # Статические расположения
    ${STATIC} # Подробнее ниже на странице

    client_max_body_size ${client_max_body_size};
    client_body_buffer_size ${buffer_size};

    location ${location} {
        # Заголовки по умолчанию
        proxy_set_header    X-Real-IP  $remote_addr;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header    Host $host;
        proxy_set_header    X-Forwarded-Proto $scheme;
        # Таймауты
        client_body_timeout     ${timeout};
        proxy_connect_timeout   ${timeout};
        proxy_send_timeout      ${timeout};
        proxy_read_timeout      ${timeout};
        proxy_request_buffering ${timeout};
        # Буфферизация
        proxy_buffering ${buffering};
        proxy_http_version ${buffering};
        # Пользовательские заголовки
        ${HEADERS} # Подробнее ниже на странице
        # Перенаправление на порт контейнера
        proxy_pass          https://${HOST}:${port}${proxy_path};
    }

}
```

---

- **php**

```nginx
server  {
    # Статические расположения кроме /
    ${STATIC} # Подробнее ниже на странице

    location / {
       try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        # Заголовки по умолчанию
        add_header    X-Real-IP  $remote_addr;
        add_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        add_header    Host $host;
        add_header    X-Forwarded-Proto $scheme;
        # Настройки FPM
        fastcgi_pass ${HOST}:${port};
	    fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME ${WORKING_DIR}/$fastcgi_script_name;
        include fastcgi_params;
        # Пользовательские заголовки
        ${HEADERS} # Подробнее ниже на странице
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### Составные параметры

Параметры которые не являются примитивными типами

---

- **HEADERS** [![якорь](https://conhos.ru/images/icons/link.svg)](#web-headers)

Если передан объект заголовков, то на сервере добавляются такие конфигурации, в зависимости от типа порта.

```nginx
proxy_set_header Header-Name "Header-Value"; # proxy
add_header Header-Name "Header-Value"; # php
```

---

- **STATIC** [![якорь](https://conhos.ru/images/icons/link.svg)](#web-static)

  Если передан объект статических путей, то на сервере буду созданы такие локации статичных файлов

```nginx
location /location {
    alias /path;
    index index.html;
}
```

---

## Волшебные параметры

Параметры которые создают сборки кофигурации

---

- **ws** [![якорь](https://conhos.ru/images/icons/link.svg)](#web-socket)

  Конфигурация для вебсокета, _когда передано `true` добавляются следущие поля:_

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";

```

---
