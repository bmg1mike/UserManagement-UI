/**
 * Maps ClientRole enum values to role names
 * Based on server-side enum:
 * enum ClientRole { IMTO, ADMIN, COB, USERACCESS, AUDIT, SUPERVISOR }
 */
export const ROLE_MAP: { [key: number]: string } = {
  0: 'IMTO',
  1: 'ADMIN',
  2: 'COB',
  3: 'USERACCESS',
  4: 'AUDIT',
  5: 'SUPERVISOR'
}

/**
 * Converts a role value (number or string) to its string representation
 * @param roleValue - The role value from the API (could be number or string)
 * @returns The role name as a string
 */
export function mapRoleToString(roleValue: number | string | undefined | null): string {
  if (roleValue === undefined || roleValue === null) {
    return 'UNKNOWN'
  }
  
  if (typeof roleValue === 'number') {
    return ROLE_MAP[roleValue] || 'UNKNOWN'
  }
  
  return String(roleValue)
}

/**
 * Normalizes a role string for comparison
 * Removes spaces, underscores, dashes and converts to uppercase
 * @param role - The role string to normalize
 * @returns Normalized role string
 */
export function normalizeRole(role: string): string {
  return role.toUpperCase().replace(/[\s_-]+/g, '')
}
