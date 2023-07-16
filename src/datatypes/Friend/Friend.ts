/**
 * Define type and CRUD methods for each user entry
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';

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
    // Delete Friend Relationship
    try {
      // TODO: use composite key
      await dbClient.container(FRIEND).
    } catch (e) {
      if (e instanceof Cosmos.ErrorResponse && e.code === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }
}
