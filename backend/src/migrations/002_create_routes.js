/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('routes', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('owner_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.string('service_area_name').notNullable();
    table.geometry('service_area_boundaries'); // PostGIS polygon
    table.point('service_area_center'); // PostGIS point
    table.decimal('service_area_radius', 8, 2); // in miles
    table.integer('total_accounts').defaultTo(0);
    table.integer('active_accounts').defaultTo(0);
    table.decimal('monthly_revenue', 10, 2).defaultTo(0);
    table.decimal('average_rate', 8, 2).defaultTo(0);
    table.boolean('is_for_sale').defaultTo(false);
    table.decimal('asking_price', 12, 2);
    table.enu('status', ['active', 'inactive', 'for_sale', 'in_escrow', 'sold']).defaultTo('active');
    table.timestamps(true, true);

    // Indexes
    table.index(['owner_id']);
    table.index(['status']);
    table.index(['is_for_sale']);
    table.index(['service_area_center'], null, 'gist'); // Spatial index
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('routes');
};