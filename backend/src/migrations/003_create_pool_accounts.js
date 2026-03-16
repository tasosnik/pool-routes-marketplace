/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('pool_accounts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('route_id').references('id').inTable('routes').onDelete('CASCADE');
    table.string('customer_name').notNullable();
    table.string('customer_email');
    table.string('customer_phone');

    // Address fields
    table.string('street').notNullable();
    table.string('city').notNullable();
    table.string('state').notNullable();
    table.string('zip_code').notNullable();
    table.string('country').defaultTo('USA');
    table.point('coordinates'); // PostGIS point (lat, lng)

    // Service details
    table.enu('service_type', ['weekly', 'biweekly', 'monthly', 'onetime']).notNullable();
    table.enu('frequency', ['weekly', 'biweekly', 'monthly']).notNullable();
    table.decimal('monthly_rate', 8, 2).notNullable();
    table.date('last_service_date');
    table.date('next_service_date');

    // Pool details
    table.enu('pool_type', ['chlorine', 'saltwater', 'natural']).defaultTo('chlorine');
    table.enu('pool_size', ['small', 'medium', 'large', 'xlarge']);
    table.text('equipment_notes');
    table.text('access_instructions');
    table.text('special_requirements');

    // Account status
    table.enu('status', ['active', 'inactive', 'suspended', 'cancelled', 'pending']).defaultTo('active');
    table.date('start_date').notNullable();
    table.date('end_date');
    table.string('churn_reason');

    table.timestamps(true, true);

    // Indexes
    table.index(['route_id']);
    table.index(['status']);
    table.index(['service_type']);
    table.index(['next_service_date']);
    table.index(['customer_name']);
    table.index(['coordinates'], null, 'gist'); // Spatial index
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('pool_accounts');
};