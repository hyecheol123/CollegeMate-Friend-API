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
   * @param {string} id unique id representing the friend relationship
   * @param {string} email1 email of user 1
   * @param {string} email2 email of user 2
   * @param {Date} since date of friendship
   */
  constructor(id: string, email1: string, email2: string, since: Date) {
    this.email1 = email1;
    this.email2 = email2;
    this.id = id;
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

  /**
   * Get a friend relationship object
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id unique id representing the friend entry
   */
  static async read(dbClient: Cosmos.Database, id: string): Promise<Friend> {
    const result = await dbClient.container(FRIEND).item(id).read<Friend>();
    if (result.statusCode === 404 || result.resource === undefined) {
      throw new NotFoundError();
    }

    return new Friend(
      result.resource.id,
      result.resource.email1,
      result.resource.email2,
      new Date(result.resource.since)
    );
  }

  /**
   * Get list of all friends of a user
   *
   * @param {Cosmos.Database} dbClient Cosmos DB client
   * @param {string} email email of user
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
      /* istanbul ignore else */
      if (e instanceof Cosmos.ErrorResponse && e.code === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }
  }
}
