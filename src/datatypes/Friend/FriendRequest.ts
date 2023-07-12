/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
// import ServerConfig from '../../ServerConfig';
// import FriendRequestItem from './FriendRequestItem';
// import FriendRequestGetResponseObj from './FriendRequestGetResponseObj';

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

    // friendRequests.concat(
    //   (
    //     await dbClient
    //       .container(FRIENDREQUEST)
    //       .items.query({
    //         query: 'select * from friendRequest p where p.to=@to',
    //         parameters: [
    //           {
    //             name: '@to',
    //             value: 'steve@wisc.edu'
    //           },
    //         ],
    //       })
    //       .fetchAll()
    //   ).resources
    // );
    // console.log(friendRequests);
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
    // console.log(dbOps.resources);
    for (const item of dbOps.resources) {
      friendRequests.push(item);
    }
    // console.log(friendRequests);
    // for (const item of dbOps.resource) {
    //   friendRequests.push(
    //     new FriendRequest(item.id, item.from, item.to, item.createdAt)
    //   );
    // }
    return friendRequests;
  }
}
