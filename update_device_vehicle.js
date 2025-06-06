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

async function getDevice(deviceImei, authResponse) {
    try {
        const filter = {
            imei: deviceImei
        };
        const params = new URLSearchParams({
            filter: JSON.stringify(filter)
        });
        const response = await fetchJson(API_URL + 'devices' + authResponse + '&' + params.toString());
        if (!Array.isArray(response) || response.length === 0) {
            throw new Error('Device not found or invalid response');
        }
        return {
            id: response[0]._id,
            imei: response[0].imei,
            serial: response[0].serial,
            iccid: response[0].iccid,
            provider: response[0].provider,
            type: response[0].type,
            alias: '',
            firmware: response[0].firmware,
            configVersion: response[0].configVersion,
            modelN: response[0].modelN,
            setupkey: response[0].setupkey,
            status: response[0].status,
            used: false,
            forceVehicle: false,
            tenants: response[0].tenants[0],
            vehicle: response[0].vehicle,
            user: response[0].user,
        };
    } catch (error) {
        console.error('Error fetching device data:', error);
        throw error;
    }
}

async function updateVehicle(device, patent, alias, active, authResponse) {
    try {
        const options = {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "patent": patent,
                "alias": alias,
                "user": device.user,
                "active": active
            })
        };

        const response = await fetchJson(API_URL + 'vehicles/' + device.vehicle + authResponse, options);
        return response.id;
    } catch (error) {
        console.error('Error updating vehicle:', error);
        throw error;
    }
}

async function processDevicesInBatches(devices, batchSize) {
    const token = await getAuthToken();
    const authResponse = '?access_token=' + token;
    for (let i = 0; i < devices.length; i += batchSize) {
        const batch = devices.slice(i, i + batchSize);
        const devicePromises = batch.map(async (item) => {
            try {
                const device = await getDevice(item.imei, authResponse);
                const vehicleId = await updateVehicle(device, item.vehicle_patent, item.vehicle_alias, item.vehicle_active, authResponse);
                console.log('vehicle updated: ', vehicleId);
            } catch (error) {
                console.error(`Error processing device ${item}:`, error.message);
            }
        });
        await Promise.all(devicePromises);
    }
}

async function main() {
    try {
        const devices = 
        [
            {
              "imei": 353380101405420,
              "vehicle_alias": "March 234",
              "vehicle_patent": "March 234",
              "vehicle_active": true
            },
            {
              "imei": 353380101465671,
              "vehicle_alias": "March 236",
              "vehicle_patent": "March 236",
              "vehicle_active": true
            },
            {
              "imei": 353380101303328,
              "vehicle_alias": "Kwid 158",
              "vehicle_patent": "Kwid 158",
              "vehicle_active": true
            }
          ]
        const batchSize = 4; // El tamaño del lote que deseas procesar a la vez
        await processDevicesInBatches(devices, batchSize);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();