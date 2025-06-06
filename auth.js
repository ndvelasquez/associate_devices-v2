import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function getAuthToken() {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    const access_token = process.env.ACCESS_TOKEN;

    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    };

    const result = await fetchJson(`${API_BASE_URL}/auth/admin/local?access_token=${access_token}`, options);
    return result.token;
}
