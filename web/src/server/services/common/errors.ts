/**
 * Domain Error Classes
 *
 * These error classes represent business domain errors that are thrown from
 * the service layer. They are designed to be caught and transformed into
 * appropriate HTTP/tRPC errors at the router layer.
 */

/**
 * Base class for all domain errors
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

/**
 * Error thrown when a requested entity is not found
 */
export class NotFoundError extends DomainError {
  constructor(entity: string, id: string | number) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * Error thrown when a business rule conflict occurs
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * Error thrown when validation fails at the domain level
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * Error thrown when user lacks permission to access a resource
 */
export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}
