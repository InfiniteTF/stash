ALTER TABLE studios
ADD COLUMN stash_id VARCHAR;

ALTER TABLE scenes
ADD COLUMN stash_id VARCHAR;

ALTER TABLE performers
ADD COLUMN stash_id VARCHAR;