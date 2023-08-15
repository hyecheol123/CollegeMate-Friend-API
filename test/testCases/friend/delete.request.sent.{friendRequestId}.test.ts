/**
 * Jest unit test for DELETE /friend/request/sent/{friendRequestId} method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 *
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import TestConfig from '../../../src/ServerConfig';

describe('POST /friend/request - Send Friend Request', () => {
  const FRIENDREQUEST = 'friendRequest';
  const validFriendRequestId = TestConfig.hash(
    'jeonghyeon@wisc.edu/steve@wisc.edu',
    'jeonghyeon@wisc.edu',
    'steve@wisc.edu'
  );
  const invalidFriendRequestId = TestConfig.hash(
    'invalid@wisc.edu/requestid@wisc.edu',
    'invalid@wisc.edu',
    'requestid@wisc.edu'
  );
  const notFoundId = 'notfoundId';

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
      .delete(`/friend/request/sent/${validFriendRequestId}`)
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
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - FriendRequestId not Belong to API', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${invalidFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - FriendRequest Not Found', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${notFoundId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Success from Web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    //from Web
    const response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);

    // DB check read emails
    const dbOps = await testEnv.dbClient
      .container(FRIENDREQUEST)
      .items.query('SELECT * FROM c')
      .fetchAll();

    expect(dbOps.resources).toHaveLength(3);
    expect(dbOps.resources[0].to).not.toBe('steve@wisc.edu');
    expect(dbOps.resources[1].to).not.toBe('steve@wisc.edu');
    expect(dbOps.resources[2].to).not.toBe('steve@wisc.edu');
    expect(dbOps.resources[0].id).not.toBe(validFriendRequestId);
    expect(dbOps.resources[1].id).not.toBe(validFriendRequestId);
    expect(dbOps.resources[2].id).not.toBe(validFriendRequestId);
  });

  test('Success from App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    //from Web
    const response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/sent/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);

    // DB check read emails
    const dbOps = await testEnv.dbClient
      .container(FRIENDREQUEST)
      .items.query('SELECT * FROM c')
      .fetchAll();

    expect(dbOps.resources).toHaveLength(3);
    expect(dbOps.resources[0].to).not.toBe('steve@wisc.edu');
    expect(dbOps.resources[1].to).not.toBe('steve@wisc.edu');
    expect(dbOps.resources[2].to).not.toBe('steve@wisc.edu');
    expect(dbOps.resources[0].id).not.toBe(validFriendRequestId);
    expect(dbOps.resources[1].id).not.toBe(validFriendRequestId);
    expect(dbOps.resources[2].id).not.toBe(validFriendRequestId);
  });
});
