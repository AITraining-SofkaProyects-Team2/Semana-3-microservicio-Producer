/**
 * Chain of Responsibility — Error handlers.
 *
 * Each handler inspects the error and either handles it (sending
 * a response) or passes it to the next handler via next().
 * Order matters: specific handlers first, generic last.
 */
export { validationErrorHandler } from './validationErrorHandler.js';
export { jsonSyntaxErrorHandler } from './jsonSyntaxErrorHandler.js';
export { messagingErrorHandler } from './messagingErrorHandler.js';
export { httpErrorHandler } from './httpErrorHandler.js';
export { defaultErrorHandler } from './defaultErrorHandler.js';
