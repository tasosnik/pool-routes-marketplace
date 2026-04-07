#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// LA Area ZIP codes by region
const ZIP_CODES = {
  beverly_hills: ['90210', '90211', '90212'],
  santa_monica: ['90401', '90402', '90403', '90404', '90405'],
  pasadena: ['91101', '91103', '91105', '91106'],
  glendale: ['91201', '91202', '91203', '91204', '91205'],
  burbank: ['91501', '91502', '91503', '91504', '91505']
};

// Street name components for realistic addresses
const STREET_NAMES = [
  'Main', 'Oak', 'Elm', 'Maple', 'Cedar', 'Pine', 'Willow', 'Birch',
  'Sunset', 'Ocean', 'Mountain', 'Valley', 'Park', 'Lake', 'River',
  'Canyon', 'Vista', 'Highland', 'Hillside', 'Garden'
];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Way', 'Ct', 'Pl', 'Rd'];

// Pool service customer name patterns
const FIRST_NAMES = [
  'John', 'Mary', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Patricia',
  'David', 'Barbara', 'James', 'Elizabeth', 'Charles', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'
];

interface PoolAccount {
  customer_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  service_type: string;
  frequency: string;
  monthly_rate: number;
  pool_type: string;
  pool_size: string;
  notes: string;
}

class TestDataGenerator {
  private accountCounter = 0;

  generateRandomName(includeSpouse: boolean = false): string {
    const firstName1 = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

    if (includeSpouse && Math.random() > 0.7) {
      const firstName2 = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      return `${lastName}, ${firstName1} & ${firstName2}`;
    }

    return `${lastName}, ${firstName1}`;
  }

  generateAddress(city: string, zipCodes: string[]): { street: string; zip: string } {
    const streetNum = Math.floor(Math.random() * 9000) + 100;
    const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
    const streetType = STREET_TYPES[Math.floor(Math.random() * STREET_TYPES.length)];
    const zip = zipCodes[Math.floor(Math.random() * zipCodes.length)];

    return {
      street: `${streetNum} ${streetName} ${streetType}`,
      zip
    };
  }

  generatePhone(areaCode: string): string {
    const prefix = Math.floor(Math.random() * 900) + 100;
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return `${areaCode}-${prefix}-${suffix}`;
  }

  generateEmail(name: string, skipEmail: boolean = false): string {
    if (skipEmail || Math.random() > 0.8) return '';

    const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
    const emailName = nameParts[nameParts.length - 1] + '.' + nameParts[0];
    const domains = ['email.com', 'gmail.com', 'yahoo.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];

    return `${emailName}@${domain}`;
  }

  generatePoolAccount(
    city: string,
    zipCodes: string[],
    areaCode: string,
    priceRange: { min: number; max: number }
  ): PoolAccount {
    this.accountCounter++;
    const name = this.generateRandomName(true);
    const address = this.generateAddress(city, zipCodes);
    const skipEmail = Math.random() > 0.85; // 15% without email

    // Service distribution
    const serviceRand = Math.random();
    let service_type = 'weekly';
    let frequency = 'weekly';
    if (serviceRand > 0.9) {
      service_type = 'monthly';
      frequency = 'monthly';
    } else if (serviceRand > 0.7) {
      service_type = 'biweekly';
      frequency = 'biweekly';
    }

    // Pool type distribution
    const poolTypeRand = Math.random();
    let pool_type = 'chlorine';
    if (poolTypeRand > 0.95) {
      pool_type = 'natural';
    } else if (poolTypeRand > 0.65) {
      pool_type = 'saltwater';
    }

    // Pool size distribution
    const poolSizeRand = Math.random();
    let pool_size = 'medium';
    if (poolSizeRand > 0.85) {
      pool_size = 'xlarge';
    } else if (poolSizeRand > 0.6) {
      pool_size = 'large';
    } else if (poolSizeRand < 0.15) {
      pool_size = 'small';
    }

    // Calculate monthly rate based on frequency and pool size
    const baseRate = priceRange.min + Math.random() * (priceRange.max - priceRange.min);
    const sizeMultiplier = { small: 0.8, medium: 1, large: 1.2, xlarge: 1.5 }[pool_size];
    let monthly_rate = Math.round((baseRate * sizeMultiplier) / 25) * 25; // Round to nearest $25

    if (frequency === 'biweekly') {
      monthly_rate = Math.round(monthly_rate * 0.6);
    } else if (frequency === 'monthly') {
      monthly_rate = Math.round(monthly_rate * 0.4);
    }

    // Generate notes
    const notes: string[] = [];
    if (Math.random() > 0.7) {
      const gateCode = Math.floor(Math.random() * 9000) + 1000;
      notes.push(`Gate code: ${gateCode}`);
    }
    if (Math.random() > 0.8) {
      notes.push('Dogs in backyard');
    }
    if (Math.random() > 0.85) {
      notes.push('Prefers morning service');
    }

    return {
      customer_name: name,
      street: address.street,
      city,
      state: 'CA',
      zip: address.zip,
      email: this.generateEmail(name, skipEmail),
      phone: skipEmail ? this.generatePhone(areaCode) : (Math.random() > 0.9 ? '' : this.generatePhone(areaCode)),
      service_type,
      frequency,
      monthly_rate,
      pool_type,
      pool_size,
      notes: notes.join(', ')
    };
  }

  generateRoute(
    city: string,
    zipCodes: string[],
    areaCode: string,
    accountCount: number,
    priceRange: { min: number; max: number }
  ): PoolAccount[] {
    const accounts: PoolAccount[] = [];

    for (let i = 0; i < accountCount; i++) {
      accounts.push(this.generatePoolAccount(city, zipCodes, areaCode, priceRange));
    }

    return accounts;
  }

  exportToCSV(accounts: PoolAccount[], filePath: string): void {
    const csv = stringify(accounts, {
      header: true,
      columns: [
        'customer_name', 'street', 'city', 'state', 'zip', 'email', 'phone',
        'service_type', 'frequency', 'monthly_rate', 'pool_type', 'pool_size', 'notes'
      ]
    });

    fs.writeFileSync(filePath, csv);
    console.log(`✅ Generated ${accounts.length} accounts to ${filePath}`);
  }

  generateLargeTestFile(): void {
    // Generate a large test file with 100+ accounts
    const largeRoute: PoolAccount[] = [];

    // Mix of different areas
    largeRoute.push(...this.generateRoute('Beverly Hills', ZIP_CODES.beverly_hills, '310', 30, { min: 200, max: 400 }));
    largeRoute.push(...this.generateRoute('Santa Monica', ZIP_CODES.santa_monica, '310', 30, { min: 150, max: 350 }));
    largeRoute.push(...this.generateRoute('Pasadena', ZIP_CODES.pasadena, '626', 25, { min: 125, max: 275 }));
    largeRoute.push(...this.generateRoute('Glendale', ZIP_CODES.glendale, '818', 20, { min: 100, max: 250 }));
    largeRoute.push(...this.generateRoute('Burbank', ZIP_CODES.burbank, '818', 20, { min: 100, max: 225 }));

    const outputPath = path.join(__dirname, '..', 'sample-imports', 'large-route.csv');
    this.exportToCSV(largeRoute, outputPath);
  }

  generateMultiRouteFile(): void {
    // Generate a file that simulates multiple routes (for future feature)
    // Add a route_name column
    const multiRoute: any[] = [];

    const route1 = this.generateRoute('Beverly Hills', ZIP_CODES.beverly_hills, '310', 10, { min: 200, max: 400 });
    route1.forEach(account => {
      multiRoute.push({ route_name: 'Beverly Hills Route', ...account });
    });

    const route2 = this.generateRoute('Santa Monica', ZIP_CODES.santa_monica, '310', 10, { min: 150, max: 350 });
    route2.forEach(account => {
      multiRoute.push({ route_name: 'Santa Monica Route', ...account });
    });

    const route3 = this.generateRoute('Pasadena', ZIP_CODES.pasadena, '626', 10, { min: 125, max: 275 });
    route3.forEach(account => {
      multiRoute.push({ route_name: 'Pasadena Route', ...account });
    });

    const csv = stringify(multiRoute, {
      header: true,
      columns: [
        'route_name', 'customer_name', 'street', 'city', 'state', 'zip', 'email', 'phone',
        'service_type', 'frequency', 'monthly_rate', 'pool_type', 'pool_size', 'notes'
      ]
    });

    const outputPath = path.join(__dirname, '..', 'sample-imports', 'multi-route.csv');
    fs.writeFileSync(outputPath, csv);
    console.log(`✅ Generated multi-route file with ${multiRoute.length} accounts to ${outputPath}`);
  }
}

// Main execution
if (require.main === module) {
  const generator = new TestDataGenerator();

  console.log('🚀 Generating test data files...\n');

  // Generate large test file
  generator.generateLargeTestFile();

  // Generate multi-route file
  generator.generateMultiRouteFile();

  console.log('\n✨ Test data generation complete!');
}