/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
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
   * Read friend request and return friend request object
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id id of friend request
   * @returns friend request object
   */
  static async read(
    dbClient: Cosmos.Database,
    id: string
  ): Promise<FriendRequest> {
    try {
      const dbOps = await dbClient.container(FRIENDREQUEST).item(id).read();
      return dbOps.resource;
    } catch (e) {
      if (e instanceof Cosmos.ErrorResponse && e.statusCode === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }

  /**
   * Delete friend request and return deleted friend request object
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id id of friend request
   */
  static async delete(dbClient: Cosmos.Database, id: string): Promise<void> {
    try {
      await dbClient.container(FRIENDREQUEST).item(id).delete();
    } catch (e) {
      if (e instanceof Cosmos.ErrorResponse && e.statusCode === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }
}
