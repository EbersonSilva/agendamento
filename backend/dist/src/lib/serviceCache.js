import { prisma } from './prisma.js';
const SERVICE_CACHE_TTL_MS = 60000;
let cachedServices = null;
let cachedAt = 0;
let pendingLoad = null;
let cacheGeneration = 0;
async function loadServicesFromDatabase() {
    return prisma.service.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}
export function invalidateServiceCache() {
    cachedServices = null;
    cachedAt = 0;
    cacheGeneration += 1;
}
export async function getCachedServices() {
    const isCacheFresh = cachedServices !== null && Date.now() - cachedAt < SERVICE_CACHE_TTL_MS;
    if (isCacheFresh) {
        return cachedServices;
    }
    if (!pendingLoad) {
        const loadGeneration = cacheGeneration;
        pendingLoad = loadServicesFromDatabase()
            .then((services) => {
            if (loadGeneration === cacheGeneration) {
                cachedServices = services;
                cachedAt = Date.now();
            }
            return services;
        })
            .finally(() => {
            pendingLoad = null;
        });
    }
    return pendingLoad;
}
