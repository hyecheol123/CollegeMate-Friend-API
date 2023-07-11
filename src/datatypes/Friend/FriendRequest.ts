/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';
// import FriendRequestItem from './FriendRequestItem';
// import FriendRequestGetResponseObj from './FriendRequestGetResponseObj';

const FRIENDREQUEST = 'friendrequest';

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

  // static async read(dbClient: Cosmos.Database, to: string) : Promise<FriendRequest> {
  //     const dbOps = await dbClient.container(FRIENDREQUEST).item(to).read();

  //     return new FriendRequest(
  //         dbOps.resource.id,
  //         dbOps.resource.from,
  //         dbOps.resource.to,
  //         dbOps.resource.createdAt
  //     );
  // }
  static async read(
    dbClient: Cosmos.Database,
    to: string
  ): Promise<FriendRequest[]> {
    const friendRequests: FriendRequest[] = [];
    const dbOps = await dbClient.container(FRIENDREQUEST).item(to).read();

    for (const item of dbOps.resource) {
      friendRequests.push(
        new FriendRequest(item.id, item.from, item.to, item.createdAt)
      );
    }

    return friendRequests;
  }
}
