# Ports

Ports are used to configure a web server in the hosting that will output the required port of your service to the Internet.

## Configuration [![anchor](https://conhos.ru/images/icons/link.svg)](#config)

Ports are a parameter of the [Service](./ConfigFile.md#services) level:

```yml
ports:
  - port: 3000
    type: http
    public: true # Defaults to false
    # Required when type: php
    script_filename: /var/www/html/index.php
    # Optional
    location: /path-url # Default "/"
    # Optional
    proxy_path: / # Default ""
    # Optional
    timeout: 60s
    # Optional
    buffer_size: 64k
    # Optional
    client_max_body_size: 1m
    # Optional
    request_buffering: off # Default on
    # Optional
    buffering: off # Default on
    # Optional
    http_version: '1.0' # Default 1.1
    # Optional
    headers:
      'Header-Name': 'Header-Value'
    # Optional
    static:
      - location: /static
        path: static
        # Optional
        index: index.html
```

## Web server setup [![anchor](https://conhos.ru/images/icons/link.svg)](#web-server)

Here are examples for each port type, what kind of `Nginx` configuration these parameters create:

---

- ​​**proxy**:

```nginx
server {
    # Static locations
    ${STATIC} # More details below on the page

    client_max_body_size ${client_max_body_size};
    client_body_buffer_size ${buffer_size};

    location ${location} {
        # Default headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout ${timeout};
        proxy_send_timeout ${timeout};
        proxy_read_timeout ${timeout};
        proxy_request_buffering ${timeout};

        # Buffering
        proxy_buffering ${buffering};
        proxy_http_version ${http_version};

        # Custom headers
        ${HEADERS} # More on page below
        # Redirect to container port
        proxy_pass http://${HOST}:${port}${proxy_path};
    }

}
```

---

- ​​**php**

```nginx
server {
    # Static locations except /
    ${STATIC} # More on page below

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        # Default headers
        add_header X-Real-IP $remote_addr;
        add_header X-Forwarded-For $proxy_add_x_forwarded_for;
        add_header Host $host;
        add_header X-Forwarded-Proto $scheme;

        # FCGI settings
        include /etc/nginx/fastcgi_params;
        fastcgi_index "index.php";
        fastcgi_param SCRIPT_FILENAME "/var/www/html/index.php";
	    fastcgi_pass ${HOST}:${port};

        # Custom headers
        ${HEADERS} # More details below on the page
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### Composite parameters

Parameters that are not primitive types

---

- ​​**HEADERS** [![anchor](https://conhos.ru/images/icons/link.svg)](#web-headers)

If a header object is passed, the following configurations are added to the server, depending on the port type.

```nginx
proxy_set_header Header-Name "Header-Value"; # proxy
add_header Header-Name "Header-Value"; # php
```

---

- ​​**STATIC** [![anchor](https://conhos.ru/images/icons/link.svg)](#web-static)

If a static paths object is passed, then the following static file locations will be created on the server

```nginx
location /location {
    alias /path;
    index index.html;
}
```
