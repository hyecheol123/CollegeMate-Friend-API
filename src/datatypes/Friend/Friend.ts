/**
 * Define type and CRUD methods for each user entry
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';
import FriendListItem from './FriendListItem';

const FRIEND = 'friend';

export default class Friend {
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
  constructor(email1: string, email2: string, since: Date | string) {
    this.email1 = email1 < email2 ? email1 : email2;
    this.email2 = email1 < email2 ? email2 : email1;
    this.since = since;
  }

  // TODO - figure out what is the best way to retrieve friend list

  /**
   * Get list of all friends of a user
   *
   * @param dbClient Cosmos DB client
   * @param email email of user
   */
  static async read(
    dbClient: Cosmos.Database,
    email: string
  ): Promise<FriendListItem[]> {
    const friendList: FriendListItem[] = [];
    // Query that returns all friends of a user
    friendList.concat(
      (
        await dbClient
          .container(FRIEND)
          .items.query<FriendListItem>({
            query: `SELECT f.email1 AS email, f.since FROM ${FRIEND} f WHERE f.email2 = @email`,
            parameters: [
              {
                name: '@email',
                value: email,
              },
            ],
          })
          .fetchAll()
      ).resources
    );

    friendList.concat(
      (
        await dbClient
          .container(FRIEND)
          .items.query<FriendListItem>({
            query: `SELECT f.email2 AS email, f.since FROM ${FRIEND} f WHERE f.email1 = @email`,
            parameters: [
              {
                name: '@email',
                value: email,
              },
            ],
          })
          .fetchAll()
      ).resources
    );

    return friendList;
  }
}
