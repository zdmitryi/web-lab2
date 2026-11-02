FROM nginx:alpine

COPY src/main/resources/index.html /usr/share/nginx/html/
COPY src/main/resources/styles.css /usr/share/nginx/html/
COPY src/main/resources/script.js /usr/share/nginx/html/

EXPOSE 80
