// src/lib/connection-secrets.ts
// SOLO SERVIDOR — nunca importar desde componentes con 'use client'.
//
// Abstracción central para manejar secretos dentro de connection_config
// (el campo JSONB de los agentes que almacena credenciales de conexión).
//
// Estado actual: los secretos se almacenan en texto plano en Supabase.
//
// TODO (migración de seguridad pendiente):
//   Cifrar los valores de SECRET_FIELDS antes de guardarlos en DB y
//   descifrarlos al leerlos. Opciones:
//     1. Supabase Vault (pgsodium) — pgsodium.crypto_secretbox_encrypt()
//     2. AES-256-GCM en servidor con process.env.CONNECTION_ENCRYPTION_KEY
//   La migración requiere:
//     - Nueva env var CONNECTION_ENCRYPTION_KEY (256 bits, generada con
//       `openssl rand -hex 32`)
//     - Script de migración que lee todos los connection_config, cifra
//       los campos sensibles, y los vuelve a escribir.
//     - Actualizar prepareSecretsForStorage() y readSecretsFromStorage()
//       para usar cifrado/descifrado.

type ConnectionConfig = Record<string, unknown>

// Campos que contienen secretos sensibles en connection_config
const SECRET_FIELDS = ["api_key", "anthropic_api_key"] as const

/**
 * Enmascara los valores de API key para devolver al cliente.
 * Muestra solo los últimos 4 caracteres del valor real.
 * Nunca devuelve el secreto completo en la respuesta de la API.
 *
 * @example
 * maskConnectionConfig({ api_key: "sk-ant-abc123" })
 * // → { api_key: "••••••c123" }
 */
export function maskConnectionConfig(config: unknown): ConnectionConfig | null {
  if (!config || typeof config !== "object") return null

  const masked = { ...(config as ConnectionConfig) }

  for (const field of SECRET_FIELDS) {
    if (typeof masked[field] === "string") {
      const val = masked[field] as string
      // Mostrar máximo los últimos 4 caracteres; el resto como bullets
      masked[field] =
        val.length > 4
          ? `${"•".repeat(Math.min(val.length - 4, 24))}${val.slice(-4)}`
          : "••••"
    }
  }

  return masked
}

/**
 * Prepara el connection_config para almacenamiento en DB.
 *
 * TODO: cifrar SECRET_FIELDS con AES-256-GCM antes del INSERT/UPDATE.
 * Por ahora pasa el objeto sin modificar — migración pendiente.
 * Ver instrucciones de migración al inicio de este archivo.
 */
export function prepareSecretsForStorage(config: ConnectionConfig): ConnectionConfig {
  // TODO: implementar cifrado antes de la migración a producción
  return config
}

/**
 * Procesa el connection_config al leerlo de la DB antes de usarlo
 * internamente en el servidor (nunca enviar directamente al cliente).
 *
 * TODO: descifrar SECRET_FIELDS si se implementa cifrado en prepareSecretsForStorage.
 * Por ahora devuelve el objeto sin modificar.
 */
export function readSecretsFromStorage(config: unknown): ConnectionConfig | null {
  if (!config || typeof config !== "object") return null
  // TODO: implementar descifrado cuando se implemente el cifrado
  return config as ConnectionConfig
}
