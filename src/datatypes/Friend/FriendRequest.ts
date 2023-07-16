/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';

const FRIENDREQUEST = 'friendRequest';

export default class FriendRequest {
  requestId: string;
  from: string;
  to: string;
  createdAt: Date | string;

  constructor(id: string, from: string, to: string, createdAt: Date) {
    this.requestId = id;
    this.from = from;
    this.to = to;
    this.createdAt = createdAt;
  }

  static async readFrom(
    dbClient: Cosmos.Database,
    from: string
  ): Promise<FriendRequest[]> {
    const friendRequests: FriendRequest[] = [];

    const querySpec = {
      query: `SELECT f.requestId, f['from'], f['to'], f.createdAt FROM ${FRIENDREQUEST} f WHERE f['from']=@from`,
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
