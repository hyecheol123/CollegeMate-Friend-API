/**
 * Validate user input - Send Friend Request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import Ajv from 'ajv';

export const validateSendFriendRequest = new Ajv().compile({
  type: 'object',
  properties: {
    targetEmail: {type: 'string'},
  },
  required: ['targetEmail'],
  additionalProperties: false,
});
