# Fleetr Device Association Script

Este script automatiza la creación y asociación de dispositivos, conductores y vehículos en la plataforma Fleetr, utilizando la API v1 del backend.

## Requisitos

- Node.js v14 o superior
- Conexión a internet
- Token de acceso válido (`ACCESS_TOKEN`)
- Usuario y contraseña de administrador para obtener un token dinámico

## Instalación

1. Clona el repositorio o copia los archivos en un directorio local.
2. Instala las dependencias necesarias:

```bash
npm install node-fetch abort-controller
```
3. Crea un archivo .env si prefieres almacenar tus credenciales de forma segura (opcional).

## Uso
Edita el archivo fleetr-batch.js para incluir:

Tu token de acceso o lógica para autenticarte.

Los payloads que deseas procesar.

Luego ejecuta el script con:
```bash
node fleetr-batch.js
```
## Estructura del Payload
Cada objeto dentro del arreglo payloads debe tener esta forma:
```bash
{
  "imei": "865640067963162",
  "tenant": "TENANT_ID",
  "status": "preactive",
  "driver_name": "Nombre del conductor",
  "driver_email": "email@dominio.com",
  "vehicle_patent": "Patente123",
  "vehicle_year": 2025,
  "vehicle_alias": "AliasVehículo"
}
```
## Funcionalidades

- Autenticación automática
- Reintentos con backoff exponencial
- Timeout configurable para llamadas HTTP
- Asociación de dispositivos y conductores a un tenant

## Licencia
Este script es de uso interno. No redistribuir sin autorización.
