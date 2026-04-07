const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testImportAPI() {
  try {
    // First login to get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poolroute.com',
      password: 'password123'
    });

    console.log('✅ Login successful');

    const token = loginResponse.data.data.tokens.accessToken;

    if (!token) {
      console.error('No token found in response');
      return;
    }
    console.log('Token obtained:', token.substring(0, 20) + '...');

    // Create test CSV
    const csvContent = `customer_name,street,city,state,zip,email,phone,service_type,frequency,monthly_rate,pool_type,pool_size,notes
John Doe,123 Main St,Los Angeles,CA,90001,john@email.com,213-555-0001,weekly,weekly,200,chlorine,medium,Test note
Jane Smith,456 Oak Ave,Los Angeles,CA,90002,jane@email.com,213-555-0002,biweekly,biweekly,150,saltwater,large,`;

    fs.writeFileSync('/tmp/test.csv', csvContent);

    // Test validation endpoint
    const form = new FormData();
    form.append('file', fs.createReadStream('/tmp/test.csv'));

    const response = await axios.post('http://localhost:3001/api/import/csv/validate', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ CSV Validation Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testImportAPI();