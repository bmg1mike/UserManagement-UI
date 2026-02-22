import CryptoJS from 'crypto-js'

interface EncryptionConfig {
  encryptionKey: string
  encryptionIV: string
  origin?: string
}

interface EncryptionResponse {
  data: EncryptionConfig
  message: string
  success: boolean
  errorCodes: string
  responseCode: string
}

let encryptionConfig: EncryptionConfig | null = null

/**
 * Fetch encryption configuration from the API
 */
export const fetchEncryptionConfig = async (): Promise<EncryptionConfig> => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY || 'H0RH8X1E44VA'
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5208/api'
    
    console.log('Fetching encryption config...')
    console.log('Base URL:', baseUrl)
    console.log('API Key:', apiKey)
    console.log('Full URL:', `${baseUrl}/Auth/non-fetch`)
    
    const response = await fetch(`${baseUrl}/Auth/non-fetch`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Response status:', response.status)
      console.error('Response data:', errorData)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: EncryptionResponse = await response.json()
    console.log('Encryption config response:', data)
    encryptionConfig = data.data
    return data.data
  } catch (error) {
    console.error('Error fetching encryption config:', error)
    throw error
  }
}

/**
 * Get encryption configuration (fetch if not already cached)
 */
const getEncryptionConfig = async (): Promise<EncryptionConfig> => {
  if (!encryptionConfig) {
    await fetchEncryptionConfig()
  }
  return encryptionConfig!
}

/**
 * Encrypt a plaintext string using AES-256-CBC
 * @param plaintext - The string to encrypt
 * @returns The encrypted string (base64 encoded)
 */
export const encrypt = async (plaintext: string): Promise<string> => {
  const config = await getEncryptionConfig()
  
  const key = CryptoJS.enc.Utf8.parse(config.encryptionKey)
  const iv = CryptoJS.enc.Utf8.parse(config.encryptionIV)
  
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  
  return encrypted.toString()
}

/**
 * Decrypt an encrypted string using AES-256-CBC
 * @param ciphertext - The encrypted string (base64 encoded)
 * @returns The decrypted plaintext string
 */
export const decrypt = async (ciphertext: string): Promise<string> => {
  const config = await getEncryptionConfig()
  
  const key = CryptoJS.enc.Utf8.parse(config.encryptionKey)
  const iv = CryptoJS.enc.Utf8.parse(config.encryptionIV)
  
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  
  return decrypted.toString(CryptoJS.enc.Utf8)
}

/**
 * Clear cached encryption configuration (useful for testing or forcing refresh)
 */
export const clearEncryptionConfig = (): void => {
  encryptionConfig = null
}
