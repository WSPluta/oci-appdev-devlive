# Spring Boot Service with MySQL

Run database server:

```bash
podman run -d --rm \
  --name mysql-server \
  -p 3306:3306 \
  -e MYSQL_DATABASE=db_example \
  -e MYSQL_ROOT_PASSWORD=1234 \
  mysql
```

Get IP address:

```bash
podman inspect \
  -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
  mysql-server
```

Connect with mysql client:
```bash
podman run -it --rm --name mysql-client mysql \
  mysql -h IP_ADDRESS -p
```