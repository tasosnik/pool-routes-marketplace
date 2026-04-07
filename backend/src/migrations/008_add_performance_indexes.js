/**
 * Performance Indexes Migration
 *
 * Adds compound indexes based on actual query patterns identified in the codebase.
 * These indexes optimize common operations like marketplace filtering, service scheduling,
 * payment analysis, and import tracking.
 *
 * See: /docs/database-optimization-strategy.md for detailed rationale
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Add compound indexes for payment_history
    .alterTable('payment_history', function(table) {
      // Index for date range queries (used in analytics and reporting)
      table.index(['due_date', 'payment_date'], 'idx_payment_history_date_range');

      // Index for status-based queries with amount (used for filtering paid/late/missed payments)
      table.index(['status', 'amount'], 'idx_payment_history_status_amount');

      // Composite index for account-specific payment history
      table.index(['account_id', 'due_date'], 'idx_payment_history_account_date');
    })

    // Add compound indexes for route_listings
    .alterTable('route_listings', function(table) {
      // Index for marketplace filtering by price and revenue (most common query pattern)
      table.index(['status', 'asking_price', 'monthly_revenue'], 'idx_route_listings_market_filter');

      // Index for revenue multiple analysis
      table.index(['revenue_multiple', 'asking_price'], 'idx_route_listings_valuation');

      // Index for seller-specific active listings
      table.index(['seller_id', 'status'], 'idx_route_listings_seller_status');

      // Index for recently listed routes
      table.index(['listed_at', 'status'], 'idx_route_listings_recent');
    })

    // Add compound indexes for import_logs
    .alterTable('import_logs', function(table) {
      // Index for processing time analysis
      table.index(['started_at', 'completed_at'], 'idx_import_logs_processing_time');

      // Index for user import history
      table.index(['user_id', 'started_at'], 'idx_import_logs_user_history');

      // Index for failed import analysis
      table.index(['status', 'error_count'], 'idx_import_logs_error_analysis');

      // Index for route-specific import tracking
      table.index(['route_id', 'status', 'started_at'], 'idx_import_logs_route_tracking');
    })

    // Add performance indexes for pool_accounts
    .alterTable('pool_accounts', function(table) {
      // Remove existing simple coordinates index (will be replaced with spatial index)
      table.dropIndex(['coordinates'], 'pool_accounts_coordinates_index');

      // Composite index for service scheduling
      table.index(['status', 'next_service_date'], 'idx_pool_accounts_service_schedule');

      // Index for revenue analysis
      table.index(['route_id', 'status', 'monthly_rate'], 'idx_pool_accounts_revenue');

      // Index for customer search
      table.index(['customer_name', 'status'], 'idx_pool_accounts_customer_search');
    })

    // Add performance indexes for routes
    .alterTable('routes', function(table) {
      // Remove existing simple service_area_center index (will be replaced with spatial index)
      table.dropIndex(['service_area_center'], 'routes_service_area_center_index');

      // Composite index for marketplace queries
      table.index(['is_for_sale', 'status', 'monthly_revenue'], 'idx_routes_marketplace');

      // Index for owner route management
      table.index(['owner_id', 'status'], 'idx_routes_owner_management');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('payment_history', function(table) {
      table.dropIndex(['due_date', 'payment_date'], 'idx_payment_history_date_range');
      table.dropIndex(['status', 'amount'], 'idx_payment_history_status_amount');
      table.dropIndex(['account_id', 'due_date'], 'idx_payment_history_account_date');
    })

    .alterTable('route_listings', function(table) {
      table.dropIndex(['status', 'asking_price', 'monthly_revenue'], 'idx_route_listings_market_filter');
      table.dropIndex(['revenue_multiple', 'asking_price'], 'idx_route_listings_valuation');
      table.dropIndex(['seller_id', 'status'], 'idx_route_listings_seller_status');
      table.dropIndex(['listed_at', 'status'], 'idx_route_listings_recent');
    })

    .alterTable('import_logs', function(table) {
      table.dropIndex(['started_at', 'completed_at'], 'idx_import_logs_processing_time');
      table.dropIndex(['user_id', 'started_at'], 'idx_import_logs_user_history');
      table.dropIndex(['status', 'error_count'], 'idx_import_logs_error_analysis');
      table.dropIndex(['route_id', 'status', 'started_at'], 'idx_import_logs_route_tracking');
    })

    .alterTable('pool_accounts', function(table) {
      table.dropIndex(['status', 'next_service_date'], 'idx_pool_accounts_service_schedule');
      table.dropIndex(['route_id', 'status', 'monthly_rate'], 'idx_pool_accounts_revenue');
      table.dropIndex(['customer_name', 'status'], 'idx_pool_accounts_customer_search');

      // Restore simple coordinates index
      table.index(['coordinates']);
    })

    .alterTable('routes', function(table) {
      table.dropIndex(['is_for_sale', 'status', 'monthly_revenue'], 'idx_routes_marketplace');
      table.dropIndex(['owner_id', 'status'], 'idx_routes_owner_management');

      // Restore simple service_area_center index
      table.index(['service_area_center']);
    });
};