import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getAuthToken } from './auth.js';

dotenv.config();
const API_URL = process.env.API_BASE_URL + '/core/';

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

async function getEntity(entityType, filter, authResponse) {
    const response = await fetchJson(API_URL + entityType + authResponse + '&filter=' + JSON.stringify(filter));
    return response[0];
}

async function createEntity(entityType, data, authResponse) {
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetchJson(API_URL + entityType + authResponse, options);
    return response;
}

async function updateEntity(entityType, entityId, data, authResponse) {
    const options = {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    const response = await fetchJson(API_URL + entityType + '/' + entityId + authResponse, options);
    return response;
}

async function associateEntity(entityType, tenantId, entityId, authResponse) {
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            [`${entityType}s`]: [entityId]
        })
    };
    const response = await fetch(`${API_URL}tenants/${tenantId}/${entityType}s${authResponse}`, options);
    const result = await response.text();
    return result;
}

async function main(payload) {
    try {
        const deviceImei = payload.imei;
        const token = await getAuthToken();
        const authResponse = '?access_token=' + token;

        const device = await getEntity('devices', {
            imei: deviceImei
        },authResponse);

        const driver = await createEntity('users', {
            name: payload.driver_name,
            email: payload.driver_email
        },authResponse);

        const vehicle = await createEntity('vehicles', {
            patent: payload.vehicle_patent,
            year: payload.vehicle_year,
            alias: payload.vehicle_alias,
            active: true,
            user: driver.id
        },authResponse);

        await updateEntity('devices', device._id, {
            id: device._id,
            status: payload.status,
            vehicle: vehicle.id,
            user: driver.id,
            warehouse: '5ed18fd67ebee14f4aac4046'
        },authResponse);

        await associateEntity('device', payload.tenant, device._id, authResponse);
        await associateEntity('user', payload.tenant, driver.id, authResponse);

        console.log('Device associated with tenant:', payload.tenant);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(
    {
        "imei": 866392060549387,
        "tenant": "663e572298f1b28f341bd512",
        "status": "preactive",
        "driver_name": "Driver14New",
        "driver_email": "Driver_FLEETR14Newpat@lhrfp.com",
        "vehicle_patent": "FLEETR14New",
        "vehicle_year": 2025,
        "vehicle_alias": "Vehicle 14"
    }
);