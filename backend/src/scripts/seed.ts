import dotenv from 'dotenv';
import { db } from '../config/database';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Run migrations first
    console.log('📦 Running database migrations...');
    await db.migrate.latest();
    console.log('✅ Migrations completed');

    // Run seeds
    console.log('🌱 Seeding demo data...');
    await db.seed.run();
    console.log('✅ Database seeding completed successfully');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await db.destroy();
    console.log('👋 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
}

export { seedDatabase };