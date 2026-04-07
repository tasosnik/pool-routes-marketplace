/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('import_logs', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Foreign keys
    table.uuid('user_id').notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    table.uuid('route_id').nullable();
    table.foreign('route_id').references('id').inTable('routes').onDelete('SET NULL');

    // Import details
    table.string('file_name', 255).notNullable();
    table.integer('file_size').notNullable();
    table.string('file_type', 50).defaultTo('csv');

    // Import status
    table.enum('status', [
      'pending',
      'validating',
      'processing',
      'completed',
      'failed',
      'partial_success'
    ]).notNullable().defaultTo('pending');

    // Statistics
    table.integer('total_rows').defaultTo(0);
    table.integer('processed_rows').defaultTo(0);
    table.integer('created_accounts').defaultTo(0);
    table.integer('updated_accounts').defaultTo(0);
    table.integer('skipped_accounts').defaultTo(0);
    table.integer('error_count').defaultTo(0);
    table.integer('warning_count').defaultTo(0);

    // Duplicate handling strategy used
    table.enum('duplicate_strategy', ['skip', 'update', 'create_new', 'fail']).defaultTo('skip');

    // Error and warning messages (JSON)
    table.jsonb('errors').nullable();
    table.jsonb('warnings').nullable();

    // Additional metadata (JSON)
    table.jsonb('metadata').nullable();

    // Processing times
    table.timestamp('started_at').notNullable();
    table.timestamp('completed_at').nullable();
    table.integer('processing_time_ms').nullable();

    // Timestamps
    table.timestamps(true, true);

    // Indexes
    table.index('user_id');
    table.index('route_id');
    table.index('status');
    table.index('started_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('import_logs');
};