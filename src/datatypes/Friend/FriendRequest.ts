/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';

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
   * Read sent friend request and return the request object
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} from "from" field of friend request
   * @returns sent friend request object
   */
  static async readSent(
    dbClient: Cosmos.Database,
    from: string
  ): Promise<FriendRequest[]> {
    const friendRequests: FriendRequest[] = [];

    const querySpec = {
      query: `SELECT f.id, f['from'], f['to'], f.createdAt FROM ${FRIENDREQUEST} f WHERE f['from']=@from`,
      parameters: [
        {
          name: '@from',
          value: from,
        },
      ],
    };
    const dbOps = await dbClient
      .container(FRIENDREQUEST)
      .items.query(querySpec)
      .fetchAll();

    for (const item of dbOps.resources) {
      friendRequests.push(item);
    }

    return friendRequests;
  }
}
