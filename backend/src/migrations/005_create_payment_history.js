/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('payment_history', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('account_id').references('id').inTable('pool_accounts').onDelete('CASCADE');
    table.date('payment_date').notNullable();
    table.decimal('amount', 8, 2).notNullable();
    table.enu('status', ['paid', 'late', 'missed']).notNullable();
    table.date('due_date').notNullable();
    table.text('notes');
    table.timestamps(true, true);

    // Indexes
    table.index(['account_id']);
    table.index(['payment_date']);
    table.index(['due_date']);
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('payment_history');
};