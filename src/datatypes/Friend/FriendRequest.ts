/**
 * Define type and used CRUD methods for friend request
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../../ServerConfig';

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
    await dbClient.container(FRIENDREQUEST).items.create(friendRequest);
  }
}
