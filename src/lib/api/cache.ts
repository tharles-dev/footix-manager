import { Redis } from "@upstash/redis";

// Cache em memória para fallback
const memoryCache = new Map<string, { data: any; expiresAt?: number }>();

// Tenta inicializar o Redis, se falhar usa o cache em memória
let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch (error) {
  console.warn("Redis não disponível, usando cache em memória");
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      return await redis.get<T>(key);
    }

    // Fallback para cache em memória
    const cached = memoryCache.get(key);
    if (!cached) return null;

    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }

    return cached.data as T;
  } catch (error) {
    console.error("Erro ao buscar cache:", error);
    return null;
  }
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  try {
    if (redis) {
      if (ttl) {
        await redis.set(key, data, { ex: ttl });
      } else {
        await redis.set(key, data);
      }
      return;
    }

    // Fallback para cache em memória
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    memoryCache.set(key, { data, expiresAt });
  } catch (error) {
    console.error("Erro ao salvar cache:", error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key);
      return;
    }

    // Fallback para cache em memória
    memoryCache.delete(key);
  } catch (error) {
    console.error("Erro ao invalidar cache:", error);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return;
    }

    // Fallback para cache em memória
    Array.from(memoryCache.keys()).forEach((key) => {
      if (key.match(pattern)) {
        memoryCache.delete(key);
      }
    });
  } catch (error) {
    console.error("Erro ao invalidar cache por padrão:", error);
  }
}
