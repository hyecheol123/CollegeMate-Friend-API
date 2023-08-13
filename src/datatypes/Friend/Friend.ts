/**
 * Define type and CRUD methods for each friend entry
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';
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

  /*
   * Get list of all friends of a user
   *
   * @param dbClient Cosmos DB client
   * @param email email of user
   */
  static async readFriendEmailList(
    dbClient: Cosmos.Database,
    email: string
  ): Promise<string[]> {
    return (
      await dbClient
        .container(FRIEND)
        .items.query({
          query: `SELECT f.email1, f.email2 FROM ${FRIEND} AS f WHERE f.email1=@email OR f.email2=@email`,
          parameters: [{name: '@email', value: email}],
        })
        .fetchAll()
    ).resources.map(friend =>
      friend.email1 === email ? friend.email2 : friend.email1
    );
  }

  /**
   * Delete Friend Relationship - Unfriend
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} email1 email of requested user or friend (alphabetical order)
   * @param {string} email2 email of requested user or friend (alphabetical order)
   */
  static async delete(
    dbClient: Cosmos.Database,
    email1: string,
    email2: string
  ): Promise<void> {
    const temp = email1;
    email1 = email1 < email2 ? email1 : email2;
    email2 = temp < email2 ? email2 : temp;
    const id = ServerConfig.hash(`${email1}/${email2}`, email1, email2);

    // Delete Friend Relationship
    try {
      await dbClient.container(FRIEND).item(id).delete();
    } catch (e) {
      if (e instanceof Cosmos.ErrorResponse && e.code === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }
}
