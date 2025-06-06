// Dependencies
import fetch from 'node-fetch';
import AbortController from 'abort-controller';

const API_URL = 'https://api01.fleetr.app/api/v1/core/';
const AUTH_URL = 'https://api01.fleetr.app/api/v1/auth/admin/local';

// Helper to handle retries with exponential backoff and timeout
async function fetchJsonWithRetry(url, options = {}, retries = 3, delay = 500, timeout = 10000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (err) {
            lastError = err;
            if (i < retries - 1) {
                console.warn(`Attempt ${i + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }
    }
    throw lastError;
}

// Authenticate and get token
async function auth(email, password) {
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    };
    const response = await fetchJsonWithRetry(AUTH_URL, options);
    return response.token;
}

// Core API functions
function getHeaders(token) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function getEntity(entityType, filter, headers) {
    const url = `${API_URL}${entityType}?filter=${encodeURIComponent(JSON.stringify(filter))}`;
    const options = { headers };
    const response = await fetchJsonWithRetry(url, options);
    return response[0];
}

async function createEntity(entityType, data, headers) {
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    };
    return await fetchJsonWithRetry(`${API_URL}${entityType}`, options);
}

async function updateEntity(entityType, entityId, data, headers) {
    const options = {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    };
    return await fetchJsonWithRetry(`${API_URL}${entityType}/${entityId}`, options);
}

async function associateEntity(entityType, tenantId, entityId, headers) {
    const options = {
        method: 'POST',
        headers,
        body: JSON.stringify({ [`${entityType}s`]: [entityId] })
    };
    return await fetchJsonWithRetry(`${API_URL}tenants/${tenantId}/${entityType}s`, options);
}

async function processPayload(payload, headers) {
    const device = await getEntity('devices', { imei: payload.imei }, headers);
    if (!device) {
        console.warn(`Device with IMEI ${payload.imei} not found. Skipping.`);
        return;
    }

    const driver = await createEntity('users', {
        name: payload.driver_name,
        email: payload.driver_email
    }, headers);

    const vehicle = await createEntity('vehicles', {
        patent: payload.vehicle_patent,
        year: payload.vehicle_year,
        alias: payload.vehicle_alias,
        active: true,
        user: driver.id
    }, headers);

    await updateEntity('devices', device._id, {
        id: device._id,
        status: payload.status,
        vehicle: vehicle.id,
        user: driver.id,
        warehouse: '5ed18fd67ebee14f4aac4046'
    }, headers);

    await associateEntity('device', payload.tenant, device._id, headers);
    await associateEntity('user', payload.tenant, driver.id, headers);

    console.log(`Device ${payload.imei} associated with tenant ${payload.tenant}`);
}

async function processBatch(payloads, headers) {
    const promises = payloads.map(async (payload) => {
        try {
            await processPayload(payload, headers);
        } catch (err) {
            console.error(`Error processing payload with IMEI ${payload.imei}:`, err.message);
        }
    });
    await Promise.all(promises);
    console.log('Batch processing completed.');
}

// Main function
async function main() {
    const token = await auth('nvelasquez@fleetr.app', 'Fleetr2023+');
    const headers = getHeaders(token);

    const payloads = [
        {
            imei: 865640067963162,
            tenant: "622a67d971744d00091be8e5",
            status: "preactive",
            driver_name: "Driver32New",
            driver_email: "Driver_FLEETR32New@melvinbelkroofing",
            vehicle_patent: "FLEETR32New",
            vehicle_year: 2025,
            vehicle_alias: "Vehicle32New"
        },
        {
            imei: 865640067990025,
            tenant: "622a67d971744d00091be8e5",
            status: "preactive",
            driver_name: "Driver33New",
            driver_email: "Driver_FLEETR33New@melvinbelkroofing",
            vehicle_patent: "FLEETR33New",
            vehicle_year: 2025,
            vehicle_alias: "Vehicle33New"
        },
        {
            imei: 865640067949567,
            tenant: "622a67d971744d00091be8e5",
            status: "preactive",
            driver_name: "Driver34New",
            driver_email: "Driver_FLEETR34New@melvinbelkroofing",
            vehicle_patent: "FLEETR34New",
            vehicle_year: 2025,
            vehicle_alias: "Vehicle34New"
        }
    ];

    await processBatch(payloads, headers);
}

main().catch(console.error);
// Run the main function to start processing