CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" uuid NOT NULL,
  "token_hash" text UNIQUE NOT NULL,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT (now())
);

CREATE INDEX ON "refresh_tokens" ("user_id");
CREATE INDEX ON "refresh_tokens" ("token_hash");
CREATE INDEX ON "refresh_tokens" ("expires_at");

ALTER TABLE "refresh_tokens"
  ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;