import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'recreaiteStorage',
  access: (allow) => ({
    'images/*': [
      allow.guest.to(['read', 'write']),  // Temporarily allow guest uploads for testing
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'uploads/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  })
});
