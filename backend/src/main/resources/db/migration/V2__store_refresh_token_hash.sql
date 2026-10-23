-- Revoke existing refresh tokens; they are stored as raw tokens,
-- while the application now looks them up by SHA-256 hash.
DELETE FROM refresh_tokens;

ALTER TABLE refresh_tokens
    DROP CONSTRAINT uq_refresh_tokens_token;

ALTER TABLE refresh_tokens
    DROP COLUMN token;

ALTER TABLE refresh_tokens
    ADD COLUMN token_hash varchar(64) NOT NULL;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash);