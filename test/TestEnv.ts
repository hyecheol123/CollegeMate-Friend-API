/**
 * Setup test environment
 *  - Setup Database for testing
 *  - Build table that will be used during the testing
 *  - Setup express server
 *
 * Teardown test environment after test
 *  - Remove used table and close database connection from the express server
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as crypto from 'crypto';
import * as Cosmos from '@azure/cosmos';
import TestConfig from './TestConfig';
import ExpressServer from '../src/ExpressServer';
import FriendRequest from '../src/datatypes/Friend/FriendRequest';
import Friend from '../src/datatypes/Friend/Friend';

/**
 * Class for Test Environment
 */
export default class TestEnv {
  testConfig: TestConfig; // Configuration Object (to use hash function later)
  expressServer: ExpressServer | undefined; // Express Server Object
  dbClient: Cosmos.Database | undefined; // DB Client Object
  dbIdentifier: string; // unique identifier string for the database

  /**
   * Constructor for TestEnv
   *  - Setup express server
   *  - Setup db client
   *
   * @param identifier Identifier to specify the test
   */
  constructor(identifier: string) {
    // Hash identifier to create new identifier string
    this.dbIdentifier = crypto
      .createHash('md5')
      .update(identifier)
      .digest('hex');

    // Generate TestConfig obj
    this.testConfig = new TestConfig(this.dbIdentifier);
  }

  /**
   * beforeEach test case, run this function
   * - Setup Database for testing
   * - Build table that will be used during the testing
   */
  async start(): Promise<void> {
    // Setup DB
    const dbClient = new Cosmos.CosmosClient({
      endpoint: this.testConfig.db.endpoint,
      key: this.testConfig.db.key,
    });
    const dbOps = await dbClient.databases.create({
      id: this.testConfig.db.databaseId,
    });
    /* istanbul ignore next */
    if (dbOps.statusCode !== 201) {
      throw new Error(JSON.stringify(dbOps));
    }
    this.dbClient = dbClient.database(this.testConfig.db.databaseId);

    // friend container
    let containerOps = await this.dbClient.containers.create({
      id: 'friend',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [{path: '/since/?'}],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }
    // Create a new friend entries
    const friendSample: Friend[] = [];
    friendSample.push(
      {
        id: TestConfig.hash(
          'jeonghyeon@wisc.edu/steve@wisc.edu',
          'jeonghyeon@wisc.edu',
          'steve@wisc.edu'
        ),
        email1: 'jeonghyeon@wisc.edu',
        email2: 'steve@wisc.edu',
        since: new Date().toISOString(),
      },
      {
        id: TestConfig.hash(
          'drag@wisc.edu/jerry@wisc.edu',
          'drag@wisc.edu',
          'jerry@wisc.edu'
        ),
        email1: 'drag@wisc.edu',
        email2: 'jerry@wisc.edu',
        since: new Date().toISOString(),
      },
      {
        id: TestConfig.hash(
          'jerry@wisc.edu/steve@wisc.edu',
          'jerry@wisc.edu',
          'steve@wisc.edu'
        ),
        email1: 'jerry@wisc.edu',
        email2: 'steve@wisc.edu',
        since: new Date().toISOString(),
      },
      {
        id: TestConfig.hash(
          'daekyun@wisc.edu/steve@wisc.edu',
          'daekyun@wisc.edu',
          'steve@wisc.edu'
        ),
        email1: 'daekyun@wisc.edu',
        email2: 'steve@wisc.edu',
        since: new Date().toISOString(),
      }
    );

    for (let index = 0; index < friendSample.length; index++) {
      await this.dbClient.container('friend').items.create(friendSample[index]);
    }

    // friend request container
    containerOps = await this.dbClient.containers.create({
      id: 'friendRequest',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [{path: '/createdAt/?'}],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }
    // Create a new friend request entry
    const friendRequestSample: FriendRequest[] = [];
    friendRequestSample.push(
      {
        id: 'sadf989hvsad93ikj',
        from: 'random@wisc.edu',
        to: 'steve@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      },
      {
        id: 'adsjbzvxn91fdsa',
        from: 'tedpowel123@wisc.edu',
        to: 'steve@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      },
      {
        id: 'adsjbzvxn91fds',
        from: 'dalcmap@wisc.edu',
        to: 'steve@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      }
    );

    for (let index = 0; index < friendRequestSample.length; index++) {
      await this.dbClient
        .container('friendRequest')
        .items.create(friendRequestSample[index]);
    }

    // Setup Express Server
    this.expressServer = new ExpressServer(this.testConfig);
  }

  /**
   * Teardown test environment after test
   *  - Remove used resources (DB)
   *  - close database/redis connection from the express server
   */
  async stop(): Promise<void> {
    // Drop database
    await (this.dbClient as Cosmos.Database).delete();

    // Close database connection of the express server
    await (this.expressServer as ExpressServer).closeServer();

    // Close database connection used during tests
    await (this.dbClient as Cosmos.Database).client.dispose();
  }
}
