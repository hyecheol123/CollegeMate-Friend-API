/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
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
   * Create a new friend request and save it to the database
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {FriendRequest} friendRequest new friendRequest Object to be created
   */
  static async create(
    dbClient: Cosmos.Database,
    friendRequest: FriendRequest
  ): Promise<void> {
    friendRequest.createdAt = (friendRequest.createdAt as Date).toISOString();
    await dbClient.container(FRIEND_REQUEST).items.create(friendRequest);
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
          query: `SELECT * FROM ${FRIEND_REQUEST} AS f WHERE f["from"]=@from`,
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

  /**
   * Check if friend request exists
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} fromEmail email of sender
   * @param {string} toEmail email of receiver
   * @returns {boolean} friend request object - true if exists, false if not
   */
  static async readCheckExistingRequest(
    dbClient: Cosmos.Database,
    fromEmail: string,
    toEmail: string
  ): Promise<boolean> {
    return (
      (
        await dbClient
          .container(FRIEND_REQUEST)
          .items.query({
            query: `SELECT VALUE COUNT(f.id) FROM ${FRIEND_REQUEST} f WHERE f["from"]=@email1 AND f.to=@email2 OR f["from"]=@email2 AND f.to=@email1`,
            parameters: [
              {name: '@email1', value: fromEmail},
              {name: '@email2', value: toEmail},
            ],
          })
          .fetchAll()
      ).resources[0] > 0
    );
  }
}
