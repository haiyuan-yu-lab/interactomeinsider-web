# interactomeinsider-web
Dockerized version of the interactome insider website 

## How to deploy this

### 1. Static files and database dump

First, you need to get the bed files, as well as donwload files, and extract these in the appropriate locations:

- `bed.tar.gz` should be extracted into `./marsh2/bed/`
- `donwloads.tar.gz` should be extracted into `./marsh2/donwloads/`
- `interactomeinsider-<year>-<month>-<day>.sql` should be placed in `./` (this is, the same location as this README file, and the `docker-compose.yml` file.

Then you make sure the correct version of the SQL file is configured under `volumes` in the docker compose configuration file.

### 2. Configuration file

The only configuration file you need to create is `./env.db.secret`, and it should contain values for the following variables:

```
MARIADB_ROOT_PASSWORD="root-password-goes-here"
MARIADB_DATABASE="database-name-goes-here"
MARIADB_USER="database-user-goes-here"
MARIADB_PASSWORD="database-password-goes-here"
```

### 3. Deploy

Ensure you configure the `docker-compose.yml` file with an available port, and then simply run:

```bash
docker compose up -d
```

and configure your proxy server to point to the configured port.
