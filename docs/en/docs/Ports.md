# Ports

Ports are used to configure a web server in the hosting that will output the required port of your service to the Internet.

## Configuration

Ports are a parameter of the `service` level:

```yml
ports:
  - port: 3000
    type: http
    # Optional
    ws: true # Default false
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
    http_version: '1.1' # Default 1.0
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

## Web server setup

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
        client_body_timeout ${timeout};
        proxy_connect_timeout ${timeout};
        proxy_send_timeout ${timeout};
        proxy_read_timeout ${timeout};
        proxy_request_buffering ${timeout};
        # Buffering
        proxy_buffering ${buffering};
        proxy_http_version ${buffering};
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
        # FPM settings
        fastcgi_pass ${HOST}:${port};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME ${WORKING_DIR}/$fastcgi_script_name;
        include fastcgi_params;
        # Custom headers
        ${HEADERS} # More details below on the page
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### Composite parameters

The following are examples of port parameters that are not primitive types

---

- ​​**HEADERS**

```nginx
proxy_set_header Header-Name "Neader-Value"; # proxy
add_header Header-Name "Neader-Value"; # php
```

---

- ​​**STATIC**

```nginx
location /location {
    alias /path;
    index index.html;
}
```

---
