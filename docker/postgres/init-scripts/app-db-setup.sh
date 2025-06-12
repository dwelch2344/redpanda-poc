psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  create database redpanda_demo;
  create user redpanda_demo with password 'redpanda_demo';
  alter database redpanda_demo owner to redpanda_demo;
EOSQL

psql -v ON_ERROR_STOP=1 --username "redpanda_demo" --dbname "redpanda_demo" <<-EOSQL
  create schema if not exists iam;
  create table if not exists iam.user (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    external_id BIGINT
  );


  CREATE OR REPLACE FUNCTION iam.user_sync(payload JSONB)
    RETURNS void AS \$\$
  BEGIN
    RAISE WARNING 'got a record %', payload;
    insert into iam.user (name, email, external_id)
    select r.*
    from jsonb_to_record(payload) as r(name VARCHAR, email VARCHAR, id BIGINT);
    RAISE WARNING 'inserted %', payload;
  END;
  \$\$ LANGUAGE plpgsql;

  CREATE VIEW iam.user_sync_vw AS
  SELECT NULL::jsonb AS payload;

  CREATE FUNCTION iam.handle_user_sync()
    RETURNS trigger AS \$\$
  BEGIN
    PERFORM iam.user_sync(NEW.payload);
    RETURN NULL;
  END;
  \$\$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_user_sync
    INSTEAD OF INSERT ON iam.user_sync_vw
    FOR EACH ROW
  EXECUTE FUNCTION iam.handle_user_sync();
EOSQL