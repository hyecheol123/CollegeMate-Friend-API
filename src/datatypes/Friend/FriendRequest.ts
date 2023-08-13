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
   * Create a new friend request and save it to the database
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} from id of the user who sent the friend request
   * @param {string} to id of the user to whom the friend request is being sent
   */
  static async createRequest(
    dbClient: Cosmos.Database,
    from: string,
    to: string
  ): Promise<void> {
    const id = ServerConfig.hash(`${from}/${to}`, from, to);
    const createdAt = new Date();
    const friendRequest = new FriendRequest(id, from, to, createdAt);
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
}
