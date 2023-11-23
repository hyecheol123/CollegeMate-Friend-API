/**
 * Jest unit test for DELETE /friend/request/received/{friendRequestId} method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import TestConfig from '../../../src/ServerConfig';
import FriendRequest from '../../../src/datatypes/FriendRequest/FriendRequest';

describe('POST /friend/request/received/{friendRequestId}/accept - Accept Friend Request', () => {
  const FRIEND_REQUEST = 'friendRequest';
  const FRIEND = 'friend';

  let testEnv: TestEnv;

  const accessTokenMap = {
    valid: '',
    dalcmap: '',
    refresh: '',
    expired: '',
    admin: '',
  };
  const friendRequestIdMap = {
    valid: '',
    nonAlphabetical: '',
    reverse: '',
    others: '',
    nonexistent: '',
    existingRelation: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Envionment
    await testEnv.start();

    // Map friend request ids
    friendRequestIdMap.valid = TestConfig.hash(
      `random@wisc.edu/steve@wisc.edu/${new Date(
        '2023-02-10T00:50:43.000Z'
      ).toISOString()}`,
      'random@wisc.edu',
      'steve@wisc.edu'
    );
    friendRequestIdMap.nonAlphabetical = TestConfig.hash(
      `park@wisc.edu/dalcmap@wisc.edu/${new Date(
        '2023-02-10T00:50:43.000Z'
      ).toISOString()}`,
      'park@wisc.edu',
      'dalcmap@wisc.edu'
    );
    friendRequestIdMap.reverse = TestConfig.hash(
      `steve@wisc.edu/dickdick@wisc.edu/${new Date(
        '2023-02-10T00:50:43.000Z'
      ).toISOString()}`,
      'steve@wisc.edu',
      'dickdick@wisc.edu'
    );
    friendRequestIdMap.others = TestConfig.hash(
      `park@wisc.edu/random@wisc.edu/${new Date(
        '2023-02-10T00:50:43.000Z'
      ).toISOString()}`,
      'park@wisc.edu',
      'random@wisc.edu'
    );
    friendRequestIdMap.nonexistent = TestConfig.hash(
      `incorrect@wisc.edu/random@wisc.edu/${new Date(
        '2023-02-10T00:50:43.000Z'
      ).toISOString()}`,
      'incorrect@wisc.edu',
      'random@wisc.edu'
    );
    friendRequestIdMap.existingRelation = TestConfig.hash(
      `jerry@wisc.edu/steve@wisc.edu/${new Date(
        '2023-02-10T00:50:43.000Z'
      ).toISOString()}`,
      'jerry@wisc.edu',
      'steve@wisc.edu'
    );

    // Create Access Token
    // Valid Access Token
    let tokenContent: AuthToken = {
      id: 'steve@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.valid = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Token for "dalcmap"
    tokenContent = {
      id: 'dalcmap@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.dalcmap = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Refresh Token
    // Token Content
    tokenContent = {
      id: 'refresh@wisc.edu',
      type: 'refresh',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.refresh = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Expired Access Token
    // Token Content
    tokenContent = {
      id: 'expired@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.expired = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '1ms'}
    );

    // Admin token
    // Token Content
    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    // Generate AccessToken
    accessTokenMap.admin = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '1ms'}
    );
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Not from Origin Nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust without a token
    const response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired or Wrong Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    // request with an expired access token from web
    response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Token id different from "to" of Friend Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with token id equal to "from" of friend request
    let response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.reverse}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with token id not equal to "from" nor "to" of friend request (other's friend request)
    response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.others}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Nonexistent Friend Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with nonexistent friend request id
    const response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.nonexistent}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Already Existing Friend Relation', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create a new friend request entry for testing / both directions to check if both directions are deleted after accepting
    const friendRequestSample: FriendRequest[] = [];
    friendRequestSample.push(
      {
        id: TestConfig.hash(
          `steve@wisc.edu/jerry@wisc.edu/${new Date(
            '2023-02-10T00:50:43.000Z'
          ).toISOString()}`,
          'steve@wisc.edu',
          'jerry@wisc.edu'
        ),
        from: 'steve@wisc.edu',
        to: 'jerry@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      },
      {
        id: TestConfig.hash(
          `jerry@wisc.edu/steve@wisc.edu/${new Date(
            '2023-02-10T00:50:43.000Z'
          ).toISOString()}`,
          'jerry@wisc.edu',
          'steve@wisc.edu'
        ),
        from: 'jerry@wisc.edu',
        to: 'steve@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      }
    );

    for (let index = 0; index < friendRequestSample.length; index++) {
      await testEnv.dbClient
        .container('friendRequest')
        .items.create(friendRequestSample[index]);
    }

    // request with nonexistent friend request id
    const response = await request(testEnv.expressServer.app)
      .post(
        `/friend/request/received/${friendRequestIdMap.existingRelation}/accept`
      )
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // Check if the friend request data is in database
    const dbOps = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .items.query({
        query: `SELECT VALUE COUNT(f.id) FROM ${FRIEND_REQUEST} f WHERE f["from"]=@email1 AND f.to=@email2 OR f["from"]=@email2 AND f.to=@email1`,
        parameters: [
          {name: '@email1', value: 'jerry@wisc.edu'},
          {name: '@email2', value: 'steve@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps.resources[0]).toBe(0);
  });

  test('Success from Web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create a new friend request entry for testing bidirectional deletion
    const friendRequestSample: FriendRequest = {
      id: TestConfig.hash(
        `steve@wisc.edu/random@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'steve@wisc.edu',
        'random@wisc.edu'
      ),
      from: 'steve@wisc.edu',
      to: 'random@wisc.edu',
      createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
    };
    await testEnv.dbClient
      .container('friendRequest')
      .items.create(friendRequestSample);

    // valid request from web
    const response = await request(testEnv.expressServer.app)
      .post(`/friend/request/received/${friendRequestIdMap.valid}/accept`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);

    // Check if the friend request data is in database
    let dbOps = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .items.query({
        query: `SELECT VALUE COUNT(f.id) FROM ${FRIEND_REQUEST} f WHERE f["from"]=@email1 AND f.to=@email2 OR f["from"]=@email2 AND f.to=@email1`,
        parameters: [
          {name: '@email1', value: 'random@wisc.edu'},
          {name: '@email2', value: 'steve@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps.resources[0]).toBe(0);

    // Check if the friend data was added to database
    dbOps = await testEnv.dbClient
      .container(FRIEND)
      .items.query({
        query: `SELECT VALUE COUNT(f.id) FROM ${FRIEND} AS f WHERE f.email1 = @email1 AND f.email2 = @email2`,
        parameters: [
          {name: '@email1', value: 'random@wisc.edu'},
          {name: '@email2', value: 'steve@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps.resources[0]).toBe(1);
  });

  test('Success from App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create a new friend request entry for testing bidirectional deletion
    const friendRequestSample: FriendRequest = {
      id: TestConfig.hash(
        `dalcmap@wisc.edu/park@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'dalcmap@wisc.edu',
        'park@wisc.edu'
      ),
      from: 'dalcmap@wisc.edu',
      to: 'park@wisc.edu',
      createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
    };
    await testEnv.dbClient
      .container('friendRequest')
      .items.create(friendRequestSample);

    // valid request from web
    const response = await request(testEnv.expressServer.app)
      .post(
        `/friend/request/received/${friendRequestIdMap.nonAlphabetical}/accept`
      )
      .set({'X-ACCESS-TOKEN': accessTokenMap.dalcmap})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);

    // Check if the friend request data is in database
    let dbOps = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .items.query({
        query: `SELECT VALUE COUNT(f.id) FROM ${FRIEND_REQUEST} f WHERE f["from"]=@email1 AND f.to=@email2 OR f["from"]=@email2 AND f.to=@email1`,
        parameters: [
          {name: '@email1', value: 'park@wisc.edu'},
          {name: '@email2', value: 'dalcmap@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps.resources[0]).toBe(0);

    // Check if the friend data was added to database
    dbOps = await testEnv.dbClient
      .container(FRIEND)
      .items.query({
        query: `SELECT VALUE COUNT(f.id) FROM ${FRIEND} AS f WHERE f.email1 = @email1 AND f.email2 = @email2`,
        parameters: [
          {name: '@email1', value: 'dalcmap@wisc.edu'},
          {name: '@email2', value: 'park@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps.resources[0]).toBe(1);
  });
});
