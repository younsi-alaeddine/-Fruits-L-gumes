const axios = require('axios');

const BASE_URL = 'https://fatah-commander.cloud/api';
const TEST_CREDENTIALS = {
  email: 'contact.carreprimeur@gmail.com',
  password: 'admin123'
};

let token = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    token = response.data.accessToken;
    console.log(`${colors.green}✓${colors.reset} Login successful`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Login failed:`, error.message);
    return false;
  }
}

async function testRoute(method, endpoint, description, data = null) {
  try {
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    
    let response;
    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${BASE_URL}${endpoint}`, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(`${BASE_URL}${endpoint}`, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(`${BASE_URL}${endpoint}`, config);
    }
    
    console.log(`${colors.green}✓${colors.reset} ${method.padEnd(6)} ${endpoint.padEnd(40)} - ${description}`);
    return { success: true, status: response.status };
  } catch (error) {
    const status = error.response?.status || 'ERR';
    const msg = error.response?.data?.message || error.message;
    console.log(`${colors.red}✗${colors.reset} ${method.padEnd(6)} ${endpoint.padEnd(40)} - ${description} [${status}] ${msg}`);
    return { success: false, status, error: msg };
  }
}

async function main() {
  console.log(`\n${colors.blue}=== TEST DES ROUTES API ===${colors.reset}\n`);
  
  const results = { total: 0, passed: 0, failed: 0 };
  
  // 1. AUTH ROUTES
  console.log(`\n${colors.yellow}📁 AUTH ROUTES${colors.reset}`);
  if (!await login()) return;
  results.total++; results.passed++;
  
  await testRoute('GET', '/auth/me', 'Get current user').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  await testRoute('GET', '/health', 'Health check').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 2. PRODUCTS ROUTES
  console.log(`\n${colors.yellow}📁 PRODUCTS ROUTES${colors.reset}`);
  await testRoute('GET', '/products', 'List products').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  await testRoute('GET', '/products/search?q=tomate', 'Search products').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  await testRoute('GET', '/products/categories', 'Get categories').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 3. CATEGORIES ROUTES
  console.log(`\n${colors.yellow}📁 CATEGORIES ROUTES${colors.reset}`);
  await testRoute('GET', '/categories', 'List categories').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 4. ORDERS ROUTES
  console.log(`\n${colors.yellow}📁 ORDERS ROUTES${colors.reset}`);
  await testRoute('GET', '/orders', 'List orders').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  await testRoute('GET', '/orders?status=NEW', 'Filter orders by status').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 5. SHOPS ROUTES
  console.log(`\n${colors.yellow}📁 SHOPS ROUTES${colors.reset}`);
  await testRoute('GET', '/shops', 'List shops').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 6. ADMIN ROUTES
  console.log(`\n${colors.yellow}📁 ADMIN ROUTES${colors.reset}`);
  await testRoute('GET', '/admin/users', 'List users (admin)').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  await testRoute('GET', '/admin/stats/dashboard', 'Dashboard stats').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 7. RECURRING ORDERS
  console.log(`\n${colors.yellow}📁 RECURRING ORDERS${colors.reset}`);
  await testRoute('GET', '/recurring-orders', 'List recurring orders').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 8. INVOICES
  console.log(`\n${colors.yellow}📁 INVOICES${colors.reset}`);
  await testRoute('GET', '/invoices', 'List invoices').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 9. PAYMENTS
  console.log(`\n${colors.yellow}📁 PAYMENTS${colors.reset}`);
  await testRoute('GET', '/payments', 'List payments').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 10. STOCK
  console.log(`\n${colors.yellow}📁 STOCK${colors.reset}`);
  await testRoute('GET', '/stock', 'Get stock levels').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 11. NOTIFICATIONS
  console.log(`\n${colors.yellow}📁 NOTIFICATIONS${colors.reset}`);
  await testRoute('GET', '/notifications', 'List notifications').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 12. MESSAGES
  console.log(`\n${colors.yellow}📁 MESSAGES${colors.reset}`);
  await testRoute('GET', '/messages', 'List messages').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // 13. PROMOTIONS
  console.log(`\n${colors.yellow}📁 PROMOTIONS${colors.reset}`);
  await testRoute('GET', '/promotions', 'List promotions').then(r => { results.total++; r.success ? results.passed++ : results.failed++; });
  
  // SUMMARY
  console.log(`\n${colors.blue}=== RÉSUMÉ ===${colors.reset}`);
  console.log(`Total: ${results.total}`);
  console.log(`${colors.green}Réussis: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Échoués: ${results.failed}${colors.reset}`);
  console.log(`Taux de réussite: ${Math.round(results.passed / results.total * 100)}%\n`);
}

main().catch(console.error);
