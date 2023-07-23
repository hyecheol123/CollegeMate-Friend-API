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
   * Create friend relationship
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {Friend} friend Friend object to be created
   */
  static async create(
    dbClient: Cosmos.Database,
    friend: Friend
  ): Promise<void> {
    friend.since = new Date().toISOString();
    await dbClient.container(FRIEND).items.create(friend);
  }
}
