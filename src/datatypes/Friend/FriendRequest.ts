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

  static async read(
    dbClient: Cosmos.Database,
    to: string
  ): Promise<FriendRequest[]> {
    const friendRequests: FriendRequest[] = [];

    const querySpec = {
      query: `SELECT f.requestId, f['from'], f['to'], f.createdAt FROM ${FRIENDREQUEST} f WHERE f['to']=@to`,
      parameters: [
        {
          name: '@to',
          value: to,
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
