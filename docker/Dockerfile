FROM httpd:2.4-alpine

RUN apk add --no-cache --upgrade perl

# Copy the application files
COPY distro/dist/ /usr/local/apache2/htdocs/bahmni-v2/
COPY docker/httpd_directory.conf /usr/local/apache2/conf/httpd_directory.conf
RUN echo "Include /usr/local/apache2/conf/httpd_directory.conf" >> /usr/local/apache2/conf/httpd.conf