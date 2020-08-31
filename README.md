Install Docker and Docker Compose and run:

```bash
./build.sh
docker-compose up
```

It will create an 3.5+ GB image

Save and load Docker images with:

```bash
docker save tivolicloud/shared-desktop | gzip > tivoli-shared-desktop.tar.gz
```

```bash
docker load < tivoli-shared-desktop.tar.gz
```
