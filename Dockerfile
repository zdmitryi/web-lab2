FROM httpd:2.4

RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-21-jre-headless && \
    rm -rf /var/lib/apt/lists/*

RUN sed -i \
      -e 's/^#LoadModule proxy_module modules\/mod_proxy.so$/LoadModule proxy_module modules\/mod_proxy.so/' \
      -e 's/^#LoadModule proxy_fcgi_module modules\/mod_proxy_fcgi.so$/LoadModule proxy_fcgi_module modules\/mod_proxy_fcgi.so/' \
      /usr/local/apache2/conf/httpd.conf

COPY target/classes /app/classes
COPY fastcgi-lib.jar /app/fastcgi-lib.jar
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

COPY src/main/resources/index.html /usr/local/apache2/htdocs/
COPY src/main/resources/styles.css /usr/local/apache2/htdocs/
COPY src/main/resources/script.js /usr/local/apache2/htdocs/

COPY apache-fcgi.conf /usr/local/apache2/conf/extra/apache-fcgi.conf
RUN echo "Include conf/extra/apache-fcgi.conf" >> /usr/local/apache2/conf/httpd.conf

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
