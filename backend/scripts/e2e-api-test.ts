const BASE_URL = 'http://127.0.0.1:5000/api';

async function runE2E() {
  console.log('--- Starting E2E API Flow ---');

  try {
    // 1. Log In
    console.log('1. Logging in as owner...');
    let res = await fetch(`${BASE_URL}/tenant/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopLicenseKeyOrSlug: 'RWNQ-E2E-TEST-2',
        email: 'owner3@testshop.com',
        password: 'password123',
        deviceFingerprint: 'mock-device-fingerprint-123'
      })
    });
    let loginData = await res.json();
    if (!res.ok) {
      console.log('Login failed with data:', loginData);
      throw new Error(loginData.message || 'Login failed');
    }

    const token = loginData.data.token;
    const shopId = loginData.data.staff.shopId;
    console.log('   Logged in successfully. Token received.');

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    // 2. Add Worker
    console.log('2. Adding an ironer staff member...');
    res = await fetch(`${BASE_URL}/tenant/staff`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'John Doe',
        pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
        role: null,
        workerType: 'ironer',
        payType: 'fixed-per-piece',
        payValue: 5
      })
    });
    let staffResData = await res.json();
    if (!res.ok) {
      console.log('Failed to add worker:', staffResData);
      throw new Error('Failed to add worker');
    }
    console.log('   Staff member added.');

    // 3. Add Price List Entries
    console.log('3. Adding price list entries...');
    await fetch(`${BASE_URL}/tenant/price-list`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        category: 'apparel',
        name: 'Shirt',
        pricing: { fullService: 10, ironOnly: 5 }
      })
    });
    await fetch(`${BASE_URL}/tenant/price-list`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        category: 'carpet',
        name: 'Persian Rug',
        pricePerMeter: 50
      })
    });
    await fetch(`${BASE_URL}/tenant/price-list`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        category: 'linen',
        name: 'Bed Sheet',
        basePrice: 20
      })
    });
    console.log('   Price catalogue entries added.');

    // 4. Change dailyCapacityLimit to 1
    console.log('4. Changing dailyCapacityLimit to 1...');
    await fetch(`${BASE_URL}/tenant/shop/me`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        dailyCapacityLimit: 1
      })
    });
    console.log('   Capacity limit updated.');

    // 5. Create 1st Order (should succeed)
    console.log('5. Creating first order for today...');
    const today = new Date().toISOString();
    let orderRes1 = await fetch(`${BASE_URL}/tenant/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deliveryDate: today,
        items: [{ name: 'Order 1 Item' }]
      })
    });
    let orderData1 = await orderRes1.json();
    console.log(`   First order result: ${orderRes1.status} - ${orderData1.status}`);

    // 6. Create 2nd Order (should fail with 409)
    console.log('6. Attempting to create second order for today (expecting failure)...');
    let orderRes2 = await fetch(`${BASE_URL}/tenant/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deliveryDate: today,
        items: [{ name: 'Order 2 Item' }]
      })
    });
    let orderData2 = await orderRes2.json();
    if (orderRes2.ok) {
      console.log('   ERROR: Second order succeeded unexpectedly!');
    } else {
      console.log(`   Second order failed as expected with status: ${orderRes2.status}`);
      console.log(`   Error payload:`, orderData2);
      if (orderData2?.code === 'CAPACITY_EXCEEDED') {
        console.log('   SUCCESS: CAPACITY_EXCEEDED error confirmed.');
      } else {
        console.log('   ERROR: Did not receive CAPACITY_EXCEEDED code.');
      }
    }

  } catch (error: any) {
    console.error('E2E Flow Failed:', error.message);
  }
}

runE2E();
