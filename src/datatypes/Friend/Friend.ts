/**
 * Define type and CRUD methods for each user entry
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';
import ServerConfig from '../../ServerConfig';

const FRIEND = 'friend';

export default class Friend {
  id: string;
  email1: string;
  email2: string;
  since: Date | string;

  /**
   * Constructor for Friend Relationship
   *
   * @param email1 email of user 1
   * @param email2 email of user 2
   * @param since date of friendship
   */
  constructor(email1: string, email2: string, since: Date) {
    this.email1 = email1 < email2 ? email1 : email2;
    this.email2 = email1 < email2 ? email2 : email1;
    this.id = ServerConfig.hash(
      `${this.email1}/${this.email2}`,
      this.email1,
      this.email2
    );
    this.since = since;
  }

  /**
   * Get list of all friends of a user
   *
   * @param dbClient Cosmos DB client
   * @param email email of user
   */
  static async read(
    dbClient: Cosmos.Database,
    email: string
  ): Promise<string[]> {
    let friendList: string[] = [];
    type FriendInfo = {email: string};

    // Query that returns all friends of a user
    friendList = friendList.concat(
      (
        await dbClient
          .container(FRIEND)
          .items.query<FriendInfo>({
            query: `SELECT f.email1 AS email FROM ${FRIEND} f WHERE f.email2 = @email`,
            parameters: [
              {
                name: '@email',
                value: email,
              },
            ],
          })
          .fetchAll()
      ).resources.map(friend => friend.email)
    );
    friendList = friendList.concat(
      (
        await dbClient
          .container(FRIEND)
          .items.query<FriendInfo>({
            query: `SELECT f.email2 AS email FROM ${FRIEND} f WHERE f.email1 = @email`,
            parameters: [
              {
                name: '@email',
                value: email,
              },
            ],
          })
          .fetchAll()
      ).resources.map(friend => friend.email)
    );

    return friendList;
  }
}