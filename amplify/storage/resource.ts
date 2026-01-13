import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'recreaiteStorage',
  access: (allow) => ({
    'images/*': [
      allow.guest.to(['read', 'write', 'delete'])
    ],
  })
});
