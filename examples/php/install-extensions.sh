#! /usr/bin/bash

if ! php -m | grep -q 'mysqli'; then
    echo 'Installing "mysqli" extension ...'
    docker-php-ext-install mysqli && docker-php-ext-enable mysqli
else
    echo '"mysqli" extension is already installed!';
fi
