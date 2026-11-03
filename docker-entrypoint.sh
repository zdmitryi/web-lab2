#!/bin/sh
set -e

java -DFCGI_PORT=9000 -cp /app/classes:/app/fastcgi-lib.jar org.example.FastCGIServer &

sleep 1

exec httpd-foreground
