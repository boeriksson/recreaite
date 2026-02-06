/**
 * Base44 Client - Backward compatibility layer
 *
 * Re-exports from amplifyClient to maintain backward compatibility
 * with existing code that imports from base44Client.
 */

import { base44, amplify } from './amplifyClient';

export { base44, amplify };
export default amplify;
