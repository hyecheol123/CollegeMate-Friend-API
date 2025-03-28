/**
 * Jest unit test for POST /friend/request/ method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import ServerConfig from '../../../src/ServerConfig';
import FriendRequest from '../../../src/datatypes/FriendRequest/FriendRequest';

describe('POST /friend/request - Send Friend Request', () => {
  const FRIEND_REQUEST = 'friendRequest';
  let testEnv: TestEnv;

  const accessTokenMap = {
    valid: '',
    refresh: '',
    expired: '',
    admin: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Envionment
    await testEnv.start();

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

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust without a token
    const response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    // request with an expired access token from web
    const response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Target User is not Found', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with non-existent email in user DB
    const response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'notFound@wisc.edu'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Target User is already a Friend', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with email that is already a friend
    const response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'daekyun@wisc.edu'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Fail - Bad Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with no request body
    let response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // request with invalid request body property
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({invalidPropertity: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // request with extra request body property
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({
        invalidPropertity: 'invalidValue',
        targetEmail: 'park@wisc.edu',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Already Friend', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // existing request from web
    const response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'jeonghyeon@wisc.edu'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Fail - Existing Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // existing request from web
    let response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'dickdick@wisc.edu'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // existing request from web - other way around
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'dalcmap@wisc.edu'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Fail - Locked or Deleted', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create a new friend request entry
    const friendRequestSample: FriendRequest[] = [];
    friendRequestSample.push(
      {
        id: ServerConfig.hash(
          `steve@wisc.edu/locked@wisc.edu/${new Date(
            '2023-02-10T00:50:43.000Z'
          ).toISOString()}`,
          'steve@wisc.edu',
          'locked@wisc.edu'
        ),
        from: 'park@wisc.edu',
        to: 'locked@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      },
      {
        id: ServerConfig.hash(
          `steve@wisc.edu/deleted@wisc.edu/${new Date(
            '2023-02-10T00:50:43.000Z'
          ).toISOString()}`,
          'steve@wisc.edu',
          'deleted@wisc.edu'
        ),
        from: 'steve@wisc.edu',
        to: 'deleted@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      },
      {
        id: ServerConfig.hash(
          `steve@wisc.edu/lockedAndDeleted@wisc.edu/${new Date(
            '2023-02-10T00:50:43.000Z'
          ).toISOString()}`,
          'steve@wisc.edu',
          'lockedAndDeleted@wisc.edu'
        ),
        from: 'steve@wisc.edu',
        to: 'lockedAndDeleted@wisc.edu',
        createdAt: new Date('2023-02-10T00:50:43.000Z').toISOString(),
      }
    );

    for (let index = 0; index < friendRequestSample.length; index++) {
      await testEnv.dbClient
        .container('friendRequest')
        .items.create(friendRequestSample[index]);
    }

    // Request to locked user
    let response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'locked@wisc.edu'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // Request to deleted user
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'deleted@wisc.edu'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // Request to locked and deleted user
    response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'lockedAndDeleted@wisc.edu'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Success from web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // valid request from web
    const response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'})
      .send({targetEmail: 'park@wisc.edu'});
    expect(response.status).toBe(201);

    // Check if the friend request data is in database
    const dbOps = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .items.query({
        query: `SELECT * FROM ${FRIEND_REQUEST} AS f WHERE f["from"] = @from AND f.to = @to`,
        parameters: [
          {name: '@from', value: 'steve@wisc.edu'},
          {name: '@to', value: 'park@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps.resources).toHaveLength(1);
    expect(dbOps.resources[0].from).toBe('steve@wisc.edu');
    expect(dbOps.resources[0].to).toBe('park@wisc.edu');
  });

  test('Success from app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // valid request from app
    // Generate AccessToken
    const response = await request(testEnv.expressServer.app)
      .post('/friend/request')
      .set({
        'X-ACCESS-TOKEN': jwt.sign(
          {id: 'park@wisc.edu', type: 'access', tokenType: 'user'},
          testEnv.testConfig.jwt.secretKey,
          {algorithm: 'HS512', expiresIn: '10m'}
        ),
      })
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({targetEmail: 'steve@wisc.edu'});
    expect(response.status).toBe(201);

    // Check if the friend request data is in database
    const dbOps = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .items.query({
        query: `SELECT * FROM ${FRIEND_REQUEST} AS f WHERE f["from"] = @from AND f.to = @to`,
        parameters: [
          {name: '@to', value: 'steve@wisc.edu'},
          {name: '@from', value: 'park@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps.resources).toHaveLength(1);
    expect(dbOps.resources[0].to).toBe('steve@wisc.edu');
    expect(dbOps.resources[0].from).toBe('park@wisc.edu');
  });
});
