/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing data in reverse order of dependencies
  await knex('payment_history').del();
  await knex('pool_accounts').del();
  await knex('route_listings').del();
  await knex('routes').del();
  await knex('users').del();

  // Demo users
  const userIds = {
    admin: '550e8400-e29b-41d4-a716-446655440000',
    operator1: '550e8400-e29b-41d4-a716-446655440001',
    operator2: '550e8400-e29b-41d4-a716-446655440002',
    seller: '550e8400-e29b-41d4-a716-446655440003',
    buyer: '550e8400-e29b-41d4-a716-446655440004'
  };

  // Insert demo users (password: "password123" for all)
  await knex('users').insert([
    {
      id: userIds.admin,
      email: 'admin@poolroute.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBWXLUP3T.BqGy', // password123
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1-555-0100',
      company: 'PoolRoute OS',
      role: 'admin',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: userIds.operator1,
      email: 'john.smith@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBWXLUP3T.BqGy', // password123
      first_name: 'John',
      last_name: 'Smith',
      phone: '+1-555-0101',
      company: 'Crystal Clear Pool Service',
      role: 'operator',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: userIds.operator2,
      email: 'sarah.johnson@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBWXLUP3T.BqGy', // password123
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '+1-555-0102',
      company: 'Blue Wave Pool Care',
      role: 'operator',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: userIds.seller,
      email: 'mike.wilson@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBWXLUP3T.BqGy', // password123
      first_name: 'Mike',
      last_name: 'Wilson',
      phone: '+1-555-0103',
      company: 'Sunset Pool Services',
      role: 'seller',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: userIds.buyer,
      email: 'lisa.brown@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBWXLUP3T.BqGy', // password123
      first_name: 'Lisa',
      last_name: 'Brown',
      phone: '+1-555-0104',
      company: 'AquaPro Pool Solutions',
      role: 'buyer',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Demo routes
  const routeIds = {
    route1: '660e8400-e29b-41d4-a716-446655440000',
    route2: '660e8400-e29b-41d4-a716-446655440001',
    route3: '660e8400-e29b-41d4-a716-446655440002'
  };

  await knex('routes').insert([
    {
      id: routeIds.route1,
      owner_id: userIds.operator1,
      name: 'Beverly Hills Premium Route',
      description: 'High-end residential pool service route in Beverly Hills and surrounding areas.',
      service_area_name: 'Beverly Hills, CA',
      service_area_center: knex.raw("ST_GeomFromText('POINT(-118.4004 34.0736)')"),
      service_area_radius: 5.0,
      total_accounts: 25,
      active_accounts: 23,
      monthly_revenue: 12500.00,
      average_rate: 543.48,
      is_for_sale: false,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: routeIds.route2,
      owner_id: userIds.operator2,
      name: 'Santa Monica Coastal Route',
      description: 'Established pool route serving Santa Monica and Venice Beach areas.',
      service_area_name: 'Santa Monica, CA',
      service_area_center: knex.raw("ST_GeomFromText('POINT(-118.4912 34.0195)')"),
      service_area_radius: 3.5,
      total_accounts: 18,
      active_accounts: 17,
      monthly_revenue: 8500.00,
      average_rate: 500.00,
      is_for_sale: false,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: routeIds.route3,
      owner_id: userIds.seller,
      name: 'Pasadena Family Route',
      description: 'Well-established family-friendly route in Pasadena with loyal customer base.',
      service_area_name: 'Pasadena, CA',
      service_area_center: knex.raw("ST_GeomFromText('POINT(-118.1445 34.1478)')"),
      service_area_radius: 4.0,
      total_accounts: 30,
      active_accounts: 28,
      monthly_revenue: 15000.00,
      average_rate: 535.71,
      is_for_sale: true,
      asking_price: 180000.00,
      status: 'for_sale',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Demo pool accounts for Route 1 (Beverly Hills)
  const beverly_hills_accounts = [
    {
      id: '770e8400-e29b-41d4-a716-446655440000',
      route_id: routeIds.route1,
      customer_name: 'Robert Anderson',
      customer_email: 'robert.anderson@email.com',
      customer_phone: '+1-310-555-0201',
      street: '912 N Beverly Dr',
      city: 'Beverly Hills',
      state: 'CA',
      zip_code: '90210',
      coordinates: knex.raw("ST_GeomFromText('POINT(-118.4009 34.0837)')"),
      service_type: 'weekly',
      frequency: 'weekly',
      monthly_rate: 600.00,
      pool_type: 'saltwater',
      pool_size: 'large',
      status: 'active',
      start_date: new Date('2023-01-15'),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      route_id: routeIds.route1,
      customer_name: 'Jennifer Martinez',
      customer_email: 'jen.martinez@email.com',
      customer_phone: '+1-310-555-0202',
      street: '1018 N Roxbury Dr',
      city: 'Beverly Hills',
      state: 'CA',
      zip_code: '90210',
      coordinates: knex.raw("ST_GeomFromText('POINT(-118.4089 34.0797)')"),
      service_type: 'weekly',
      frequency: 'weekly',
      monthly_rate: 550.00,
      pool_type: 'chlorine',
      pool_size: 'medium',
      status: 'active',
      start_date: new Date('2023-03-01'),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('pool_accounts').insert(beverly_hills_accounts);

  // Demo pool accounts for Route 2 (Santa Monica)
  const santa_monica_accounts = [
    {
      id: '770e8400-e29b-41d4-a716-446655440010',
      route_id: routeIds.route2,
      customer_name: 'David Thompson',
      customer_email: 'david.thompson@email.com',
      customer_phone: '+1-310-555-0301',
      street: '1725 Ocean Ave',
      city: 'Santa Monica',
      state: 'CA',
      zip_code: '90401',
      coordinates: knex.raw("ST_GeomFromText('POINT(-118.4950 34.0194)')"),
      service_type: 'weekly',
      frequency: 'weekly',
      monthly_rate: 475.00,
      pool_type: 'chlorine',
      pool_size: 'medium',
      status: 'active',
      start_date: new Date('2023-02-10'),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440011',
      route_id: routeIds.route2,
      customer_name: 'Emily Chen',
      customer_email: 'emily.chen@email.com',
      customer_phone: '+1-310-555-0302',
      street: '2210 Main St',
      city: 'Santa Monica',
      state: 'CA',
      zip_code: '90405',
      coordinates: knex.raw("ST_GeomFromText('POINT(-118.4873 34.0052)')"),
      service_type: 'biweekly',
      frequency: 'biweekly',
      monthly_rate: 300.00,
      pool_type: 'saltwater',
      pool_size: 'small',
      status: 'active',
      start_date: new Date('2023-04-05'),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('pool_accounts').insert(santa_monica_accounts);

  // Demo pool accounts for Route 3 (Pasadena)
  const pasadena_accounts = [
    {
      id: '770e8400-e29b-41d4-a716-446655440020',
      route_id: routeIds.route3,
      customer_name: 'Michael Rodriguez',
      customer_email: 'michael.rodriguez@email.com',
      customer_phone: '+1-626-555-0401',
      street: '1875 N Lake Ave',
      city: 'Pasadena',
      state: 'CA',
      zip_code: '91104',
      coordinates: knex.raw("ST_GeomFromText('POINT(-118.1306 34.1581)')"),
      service_type: 'weekly',
      frequency: 'weekly',
      monthly_rate: 525.00,
      pool_type: 'chlorine',
      pool_size: 'large',
      status: 'active',
      start_date: new Date('2022-06-15'),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440021',
      route_id: routeIds.route3,
      customer_name: 'Anna Williams',
      customer_email: 'anna.williams@email.com',
      customer_phone: '+1-626-555-0402',
      street: '2401 E Colorado Blvd',
      city: 'Pasadena',
      state: 'CA',
      zip_code: '91107',
      coordinates: knex.raw("ST_GeomFromText('POINT(-118.1089 34.1466)')"),
      service_type: 'weekly',
      frequency: 'weekly',
      monthly_rate: 475.00,
      pool_type: 'saltwater',
      pool_size: 'medium',
      status: 'active',
      start_date: new Date('2022-08-01'),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  await knex('pool_accounts').insert(pasadena_accounts);

  // Demo route listing for Route 3
  await knex('route_listings').insert([
    {
      id: '880e8400-e29b-41d4-a716-446655440000',
      route_id: routeIds.route3,
      seller_id: userIds.seller,
      title: 'Established Pasadena Pool Route - 30 Accounts',
      description: 'Well-maintained pool service route in Pasadena with 30 loyal customers. Strong recurring revenue and excellent customer retention. Perfect for expanding your existing operations or starting a new business in the San Gabriel Valley.',
      asking_price: 180000.00,
      account_count: 30,
      monthly_revenue: 15000.00,
      revenue_multiple: 12.0,
      retention_rate: 95.5,
      average_account_age: 28,
      equipment_included: true,
      customer_transition: true,
      escrow_period: 60,
      retention_guarantee_percentage: 90.0,
      retention_guarantee_period: 90,
      retention_penalty_rate: 10.0,
      status: 'active',
      listed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Demo payment history
  const paymentHistory = [];
  const accounts = [...beverly_hills_accounts, ...santa_monica_accounts, ...pasadena_accounts];

  accounts.forEach(account => {
    // Generate 6 months of payment history
    for (let i = 0; i < 6; i++) {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() - i);

      const dueDate = new Date(paymentDate);
      dueDate.setDate(1); // Due on first of month

      paymentHistory.push({
        id: `990e8400-e29b-41d4-a716-44665544${String(accounts.indexOf(account)).padStart(4, '0')}${String(i).padStart(2, '0')}`,
        account_id: account.id,
        payment_date: paymentDate,
        amount: account.monthly_rate,
        status: Math.random() > 0.05 ? 'paid' : 'late', // 95% on-time payment rate
        due_date: dueDate,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });

  await knex('payment_history').insert(paymentHistory);

  console.log('✅ Demo data seeded successfully');
  console.log(`📊 Created ${Object.keys(userIds).length} users`);
  console.log(`🗺️ Created ${Object.keys(routeIds).length} routes`);
  console.log(`🏊 Created ${accounts.length} pool accounts`);
  console.log(`💰 Created ${paymentHistory.length} payment history records`);
  console.log(`🏪 Created 1 marketplace listing`);
  console.log('');
  console.log('🔐 Demo Login Credentials (password: password123):');
  console.log('  • admin@poolroute.com (Admin)');
  console.log('  • john.smith@example.com (Operator)');
  console.log('  • sarah.johnson@example.com (Operator)');
  console.log('  • mike.wilson@example.com (Seller)');
  console.log('  • lisa.brown@example.com (Buyer)');
};