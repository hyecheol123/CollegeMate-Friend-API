/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';

const FRIENDREQUEST = 'friendRequest';

export default class FriendRequest {
  id: string;
  from: string;
  to: string;
  createdAt: Date | string;

  constructor(id: string, from: string, to: string, createdAt: Date) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.createdAt = createdAt;
  }

  /**
   * Delete a friend request
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} friendRequestId friend request Id
   */
  static async deleteSent(
    dbClient: Cosmos.Database,
    friendRequestId: string
  ): Promise<void> {
    try {
      await dbClient.container(FRIENDREQUEST).item(friendRequestId).delete();
    } catch (e) {
      if (e instanceof Cosmos.ErrorResponse && e.code === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }

  /**
   * Read friend request and return friend request object
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} friendRequestId id of friend request
   * @returns friend request object
   */
  static async read(
    dbClient: Cosmos.Database,
    friendRequestId: string
  ): Promise<FriendRequest> {
    try {
      const dbOps = await dbClient.container(FRIENDREQUEST).item(friendRequestId).read();
      return dbOps.resource;
    } catch (e) {
      if (e instanceof Cosmos.ErrorResponse && e.statusCode === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }
}
