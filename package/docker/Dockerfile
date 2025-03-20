FROM httpd:2.4-alpine

# Copy the application files
COPY ./dist/ /usr/local/apache2/htdocs/bahmni-new/
COPY package/docker/httpd_directory.conf /usr/local/apache2/conf/httpd_directory.conf
RUN echo "Include /usr/local/apache2/conf/httpd_directory.conf" >> /usr/local/apache2/conf/httpd.conf