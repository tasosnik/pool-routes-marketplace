/**
 * Data Constraints Migration
 *
 * Adds comprehensive check constraints to enforce business rules and data integrity.
 * These constraints prevent invalid data entry and ensure logical consistency
 * across the application.
 *
 * See: /docs/database-optimization-strategy.md for constraint rationale
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Add constraint to ensure monthly_rate is reasonable
    ALTER TABLE pool_accounts
    ADD CONSTRAINT chk_pool_accounts_monthly_rate
    CHECK (monthly_rate >= 0 AND monthly_rate <= 10000);

    -- Add constraint to ensure service_area_radius is reasonable
    ALTER TABLE routes
    ADD CONSTRAINT chk_routes_service_area_radius
    CHECK (service_area_radius > 0 AND service_area_radius <= 50);

    -- Add constraint to ensure asking_price is positive in routes
    ALTER TABLE routes
    ADD CONSTRAINT chk_routes_asking_price
    CHECK (asking_price IS NULL OR asking_price > 0);

    -- Add constraint to ensure monthly_revenue is non-negative in routes
    ALTER TABLE routes
    ADD CONSTRAINT chk_routes_monthly_revenue
    CHECK (monthly_revenue >= 0);

    -- Add constraint to ensure asking_price is positive in route_listings
    ALTER TABLE route_listings
    ADD CONSTRAINT chk_route_listings_asking_price
    CHECK (asking_price > 0);

    -- Add constraint to ensure monthly_revenue is positive in route_listings
    ALTER TABLE route_listings
    ADD CONSTRAINT chk_route_listings_monthly_revenue
    CHECK (monthly_revenue > 0);

    -- Add constraint to ensure revenue_multiple is reasonable (between 0.1x and 20x)
    ALTER TABLE route_listings
    ADD CONSTRAINT chk_route_listings_revenue_multiple
    CHECK (revenue_multiple >= 0.1 AND revenue_multiple <= 20);

    -- Add constraint to ensure retention_rate is a percentage (0-100)
    ALTER TABLE route_listings
    ADD CONSTRAINT chk_route_listings_retention_rate
    CHECK (retention_rate >= 0 AND retention_rate <= 100);

    -- Add constraint to ensure retention_guarantee_percentage is a percentage (0-100)
    ALTER TABLE route_listings
    ADD CONSTRAINT chk_route_listings_retention_guarantee
    CHECK (retention_guarantee_percentage >= 0 AND retention_guarantee_percentage <= 100);

    -- Add constraint to ensure payment amounts are positive
    ALTER TABLE payment_history
    ADD CONSTRAINT chk_payment_history_amount
    CHECK (amount > 0);

    -- Add constraint to ensure due_date is before or equal to payment_date for paid status
    ALTER TABLE payment_history
    ADD CONSTRAINT chk_payment_history_payment_logic
    CHECK (
      status != 'paid' OR
      (status = 'paid' AND payment_date >= due_date)
    );

    -- Add constraint to ensure file_size is positive in import_logs
    ALTER TABLE import_logs
    ADD CONSTRAINT chk_import_logs_file_size
    CHECK (file_size > 0);

    -- Add constraint to ensure processing counts are non-negative in import_logs
    ALTER TABLE import_logs
    ADD CONSTRAINT chk_import_logs_counts
    CHECK (
      total_rows >= 0 AND
      processed_rows >= 0 AND
      created_accounts >= 0 AND
      updated_accounts >= 0 AND
      skipped_accounts >= 0 AND
      error_count >= 0 AND
      warning_count >= 0 AND
      processed_rows <= total_rows
    );

    -- Add constraint to ensure completed_at is after started_at when completed
    ALTER TABLE import_logs
    ADD CONSTRAINT chk_import_logs_timing
    CHECK (
      completed_at IS NULL OR
      completed_at >= started_at
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Drop all constraints
    ALTER TABLE pool_accounts DROP CONSTRAINT IF EXISTS chk_pool_accounts_monthly_rate;
    ALTER TABLE routes DROP CONSTRAINT IF EXISTS chk_routes_service_area_radius;
    ALTER TABLE routes DROP CONSTRAINT IF EXISTS chk_routes_asking_price;
    ALTER TABLE routes DROP CONSTRAINT IF EXISTS chk_routes_monthly_revenue;
    ALTER TABLE route_listings DROP CONSTRAINT IF EXISTS chk_route_listings_asking_price;
    ALTER TABLE route_listings DROP CONSTRAINT IF EXISTS chk_route_listings_monthly_revenue;
    ALTER TABLE route_listings DROP CONSTRAINT IF EXISTS chk_route_listings_revenue_multiple;
    ALTER TABLE route_listings DROP CONSTRAINT IF EXISTS chk_route_listings_retention_rate;
    ALTER TABLE route_listings DROP CONSTRAINT IF EXISTS chk_route_listings_retention_guarantee;
    ALTER TABLE payment_history DROP CONSTRAINT IF EXISTS chk_payment_history_amount;
    ALTER TABLE payment_history DROP CONSTRAINT IF EXISTS chk_payment_history_payment_logic;
    ALTER TABLE import_logs DROP CONSTRAINT IF EXISTS chk_import_logs_file_size;
    ALTER TABLE import_logs DROP CONSTRAINT IF EXISTS chk_import_logs_counts;
    ALTER TABLE import_logs DROP CONSTRAINT IF EXISTS chk_import_logs_timing;
  `);
};