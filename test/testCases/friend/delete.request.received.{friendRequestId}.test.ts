/**
 * Jest unit test for DELETE /friend/request/received/{friendRequestId} method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import TestConfig from '../../../src/ServerConfig';

describe('DELETE /friend/request/received/{friendRequestId} - Reject Friend Request', () => {
  const FRIEND_REQUEST = 'friendRequest';
  const validFriendRequestId = TestConfig.hash(
    `tedpowel123@wisc.edu/steve@wisc.edu/${new Date(
      '2023-02-10T00:50:43.000Z'
    ).toISOString()}`,
    'tedpowel123@wisc.edu',
    'steve@wisc.edu'
  );

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
      .delete(`/friend/request/received/${validFriendRequestId}`)
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
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - FriendRequest is not for the user', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    let response = await request(testEnv.expressServer.app)
      .delete(
        `/friend/request/received/${TestConfig.hash(
          `park@wisc.edu/random@wisc.edu/${new Date(
            '2023-02-10T00:50:43.000Z'
          ).toISOString()}`,
          'park@wisc.edu',
          'random@wisc.edu'
        )}`
      )
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    response = await request(testEnv.expressServer.app)
      .delete(
        `/friend/request/received/${TestConfig.hash(
          `steve@wisc.edu/dickdick@wisc.edu/${new Date(
            '2023-02-10T00:50:43.000Z'
          ).toISOString()}`,
          'steve@wisc.edu',
          'dickdick@wisc.edu'
        )}`
      )
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - FriendRequest Not Found', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const response = await request(testEnv.expressServer.app)
      .delete(
        `/friend/request/received/${TestConfig.hash(
          'invalid@wisc.edu/requestid@wisc.edu',
          'invalid@wisc.edu',
          'requestid@wisc.edu'
        )}`
      )
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
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);

    // DB check read emails
    const dbOps1 = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .item(validFriendRequestId)
      .read();
    expect(dbOps1.statusCode).toBe(404);
    expect(dbOps1.resource).toBeUndefined();
    const dbOps2 = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .items.query({
        query:
          'SELECT VALUE COUNT(fr.id) FROM friendRequest AS fr WHERE fr["from"]=@from AND fr.to=@to',
        parameters: [
          {name: '@from', value: 'tedpowel123@wisc.edu'},
          {name: '@to', value: 'steve@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps2.resources[0]).toBe(0);
  });

  test('Success from App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    //from Web
    const response = await request(testEnv.expressServer.app)
      .delete(`/friend/request/received/${validFriendRequestId}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);

    // DB check read emails
    const dbOps1 = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .item(validFriendRequestId)
      .read();
    expect(dbOps1.statusCode).toBe(404);
    expect(dbOps1.resource).toBeUndefined();
    const dbOps2 = await testEnv.dbClient
      .container(FRIEND_REQUEST)
      .items.query({
        query:
          'SELECT VALUE COUNT(fr.id) FROM friendRequest AS fr WHERE fr["from"]=@from AND fr.to=@to',
        parameters: [
          {name: '@from', value: 'tedpowel123@wisc.edu'},
          {name: '@to', value: 'steve@wisc.edu'},
        ],
      })
      .fetchAll();
    expect(dbOps2.resources[0]).toBe(0);
  });
});
