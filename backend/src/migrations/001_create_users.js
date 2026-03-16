/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone');
    table.string('company');
    table.enu('role', ['buyer', 'seller', 'operator', 'admin']).defaultTo('operator');
    table.boolean('email_verified').defaultTo(false);
    table.string('verification_token');
    table.timestamp('verification_token_expires');
    table.string('reset_password_token');
    table.timestamp('reset_password_expires');
    table.timestamps(true, true);

    // Indexes
    table.index(['email']);
    table.index(['role']);
    table.index(['verification_token']);
    table.index(['reset_password_token']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};