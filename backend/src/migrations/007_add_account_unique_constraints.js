/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('pool_accounts', (table) => {
    // Add composite unique index for route + customer name + address
    // This prevents exact duplicate accounts within the same route
    table.unique(['route_id', 'customer_name', 'street', 'city', 'state', 'zip_code'], 'unique_account_per_route');

    // Add index on customer phone for faster duplicate checking
    table.index('customer_phone', 'idx_customer_phone');

    // Add index on customer email for faster lookups
    table.index('customer_email', 'idx_customer_email');

    // Add index for geospatial queries (if using text-based coordinates)
    table.index('coordinates', 'idx_coordinates');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('pool_accounts', (table) => {
    table.dropUnique(['route_id', 'customer_name', 'street', 'city', 'state', 'zip_code'], 'unique_account_per_route');
    table.dropIndex('customer_phone', 'idx_customer_phone');
    table.dropIndex('customer_email', 'idx_customer_email');
    table.dropIndex('coordinates', 'idx_coordinates');
  });
};