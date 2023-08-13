/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';

const FRIEND_REQUEST = 'friendRequest';

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
   * Read sent friend request and return the request object
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} from "from" field of friend request
   * @returns sent friend request object
   */
  static async readSent(
    dbClient: Cosmos.Database,
    from: string
  ): Promise<FriendRequest[]> {
    return (
      await dbClient
        .container(FRIEND_REQUEST)
        .items.query({
          query: `SELECT * FROM ${FRIEND_REQUEST} f WHERE f.from=@from`,
          parameters: [{name: '@from', value: from}],
        })
        .fetchAll()
    ).resources;
  }
  /**
   * Read received friend request and return the request object
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} to "to" field of friend request
   * @returns received friend request object
   */
  static async readReceived(
    dbClient: Cosmos.Database,
    to: string
  ): Promise<FriendRequest[]> {
    return (
      await dbClient
        .container(FRIEND_REQUEST)
        .items.query({
          query: `SELECT * FROM ${FRIEND_REQUEST} f WHERE f.to=@to`,
          parameters: [{name: '@to', value: to}],
        })
        .fetchAll()
    ).resources;
  }
}
