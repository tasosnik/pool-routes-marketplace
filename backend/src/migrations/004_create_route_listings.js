/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('route_listings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('route_id').references('id').inTable('routes').onDelete('CASCADE');
    table.uuid('seller_id').references('id').inTable('users').onDelete('CASCADE');

    table.string('title').notNullable();
    table.text('description').notNullable();
    table.decimal('asking_price', 12, 2).notNullable();
    table.integer('account_count').notNullable();
    table.decimal('monthly_revenue', 10, 2).notNullable();
    table.decimal('revenue_multiple', 5, 2).notNullable();
    table.decimal('retention_rate', 5, 2).notNullable(); // percentage
    table.integer('average_account_age').notNullable(); // in months
    table.boolean('equipment_included').defaultTo(false);
    table.boolean('customer_transition').defaultTo(false);
    table.integer('escrow_period').defaultTo(30); // days

    // Retention guarantee
    table.decimal('retention_guarantee_percentage', 5, 2).defaultTo(90);
    table.integer('retention_guarantee_period').defaultTo(90); // days
    table.decimal('retention_penalty_rate', 5, 2).defaultTo(10); // percentage per lost account

    table.json('images'); // Array of image URLs
    table.json('documents'); // Array of document URLs

    table.enu('status', ['draft', 'active', 'pending', 'in_escrow', 'sold', 'withdrawn']).defaultTo('draft');

    table.timestamp('listed_at');
    table.timestamps(true, true);

    // Indexes
    table.index(['route_id']);
    table.index(['seller_id']);
    table.index(['status']);
    table.index(['asking_price']);
    table.index(['monthly_revenue']);
    table.index(['listed_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('route_listings');
};