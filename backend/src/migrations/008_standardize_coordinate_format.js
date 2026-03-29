/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Add indexes for JSON coordinate searches (PostgreSQL JSON operators)
    CREATE INDEX IF NOT EXISTS idx_routes_service_area_center_json
      ON routes USING GIN ((service_area_center::jsonb));
    CREATE INDEX IF NOT EXISTS idx_pool_accounts_coordinates_json
      ON pool_accounts USING GIN ((coordinates::jsonb));

    -- Add computed columns for latitude/longitude for better search performance
    ALTER TABLE routes
      ADD COLUMN IF NOT EXISTS service_area_center_lat DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS service_area_center_lng DECIMAL(11, 8);

    ALTER TABLE pool_accounts
      ADD COLUMN IF NOT EXISTS coordinates_lat DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS coordinates_lng DECIMAL(11, 8);

    -- Update computed columns from existing JSON data
    UPDATE routes
    SET
      service_area_center_lat = COALESCE((service_area_center::jsonb->>'latitude')::decimal, 0),
      service_area_center_lng = COALESCE((service_area_center::jsonb->>'longitude')::decimal, 0)
    WHERE service_area_center IS NOT NULL AND service_area_center != '';

    UPDATE pool_accounts
    SET
      coordinates_lat = COALESCE((coordinates::jsonb->>'latitude')::decimal, 0),
      coordinates_lng = COALESCE((coordinates::jsonb->>'longitude')::decimal, 0)
    WHERE coordinates IS NOT NULL AND coordinates != '';

    -- Add indexes for coordinate searches
    CREATE INDEX IF NOT EXISTS idx_routes_service_area_coords
      ON routes (service_area_center_lat, service_area_center_lng);
    CREATE INDEX IF NOT EXISTS idx_pool_accounts_coords
      ON pool_accounts (coordinates_lat, coordinates_lng);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Drop indexes
    DROP INDEX IF EXISTS idx_pool_accounts_coords;
    DROP INDEX IF EXISTS idx_routes_service_area_coords;
    DROP INDEX IF EXISTS idx_pool_accounts_coordinates_json;
    DROP INDEX IF EXISTS idx_routes_service_area_center_json;

    -- Drop computed columns
    ALTER TABLE pool_accounts
      DROP COLUMN IF EXISTS coordinates_lng,
      DROP COLUMN IF EXISTS coordinates_lat;

    ALTER TABLE routes
      DROP COLUMN IF EXISTS service_area_center_lng,
      DROP COLUMN IF EXISTS service_area_center_lat;
  `);
};