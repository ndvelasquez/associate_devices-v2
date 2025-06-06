import fetch from 'node-fetch';

const API_URL = 'https://api01.fleetr.app/api/v1/core/';
const API_KEY = '?access_token=02Zs9iG8DXFaHLGT76OpnL5SXtlxU9VcBd5l1OGD';

// Espera en milisegundos
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

async function auth(email, password) {
  const options = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          email: email,
          password: password
      })
  };
  const response = await fetchJson('https://api01.fleetr.app/api/v1/' + 'auth/admin/local' + API_KEY, options);
  return response.token;
  
}

async function getEntity(entityType, filter, authResponse) {
    const response = await fetchJson(API_URL + entityType + authResponse + '&filter=' + JSON.stringify(filter));
    return response[0];
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

async function processPayload(payload) {
    try {
        const deviceImei = payload.imei;

        const authResponse = '?access_token=' + await auth('nvelasquez@fleetr.app','Fleetr2023+');

        const device = await getEntity('devices', {
            imei: deviceImei
        },authResponse);

        await updateEntity('devices', device._id, {
            id: device._id,
            status: payload.status,
            vehicle: payload.vehicle,
            user: payload.driver,
            warehouse: '5ed18fd67ebee14f4aac4046'
        },authResponse);

        await associateEntity('device', payload.tenant, device._id, authResponse);
        await associateEntity('user', payload.tenant, payload.driver, authResponse);

        console.log(`✅ Procesado IMEI ${deviceImei} correctamente.`);
    } catch (error) {
        console.error(`❌ Error al procesar IMEI ${payload.imei}:`, error.message);
    }
}

async function main(payloadList) {
    for (const payload of payloadList) {
        await processPayload(payload);
        await delay(2000); // Esperar 2 segundos antes de la siguiente petición
    }
}

// Llama a main con tu lista de objetos payload (copiado tal cual de tu ejemplo)
main(
    [
        {
          "imei": 352252066473142,
          "tenant": "6033ad6ff45e9d0fed5c8f46",
          "status": "active",
          "driver": "6033ae971142411016448322",
          "vehicle": "6033ae981142411016448323"
        },
        {
          "imei": 353162071100664,
          "tenant": "6033a340cb3de30e14d0c514",
          "status": "active",
          "driver": "6033a45a565e480e45cfa0ae",
          "vehicle": "6033a45a565e480e45cfa0af"
        }
      ]
);