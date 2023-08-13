/**
 * Jest unit test for GET /friend/request/received method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 *
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import TestConfig from '../../TestConfig';

describe('GET /friend/request/received - Get Received Friend Requests', () => {
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
      .get('/friend/request/received')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    // request with an expired access token
    const response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success on web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // valid request
    const response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('friendRequests');
    expect(response.body.friendRequests[0]).toHaveProperty('requestId');
    expect(response.body.friendRequests[0]).toHaveProperty('from');
    expect(response.body.friendRequests[1]).toHaveProperty('requestId');
    expect(response.body.friendRequests[1]).toHaveProperty('from');
    expect(response.body.friendRequests[2]).toHaveProperty('requestId');
    expect(response.body.friendRequests[2]).toHaveProperty('from');
    expect(response.body.friendRequests[0].requestId).toBe(
      TestConfig.hash(
        `random@wisc.edu/steve@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'random@wisc.edu',
        'steve@wisc.edu'
      )
    );
    expect(response.body.friendRequests[0].from).toBe('random@wisc.edu');
    expect(response.body.friendRequests[1].requestId).toBe(
      TestConfig.hash(
        `tedpowel123@wisc.edu/steve@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'tedpowel123@wisc.edu',
        'steve@wisc.edu'
      )
    );
    expect(response.body.friendRequests[1].from).toBe('tedpowel123@wisc.edu');
    expect(response.body.friendRequests[2].requestId).toBe(
      TestConfig.hash(
        `dalcmap@wisc.edu/steve@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'dalcmap@wisc.edu',
        'steve@wisc.edu'
      )
    );
    expect(response.body.friendRequests[2].from).toBe('dalcmap@wisc.edu');
    expect(response.body.friendRequests[0]).not.toHaveProperty('to');
    expect(response.body.friendRequests[1]).not.toHaveProperty('to');
    expect(response.body.friendRequests[2]).not.toHaveProperty('to');
  });

  test('Success on app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // valid request
    const response = await request(testEnv.expressServer.app)
      .get('/friend/request/received')
      .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('friendRequests');
    expect(response.body.friendRequests[0]).toHaveProperty('requestId');
    expect(response.body.friendRequests[0]).toHaveProperty('from');
    expect(response.body.friendRequests[1]).toHaveProperty('requestId');
    expect(response.body.friendRequests[1]).toHaveProperty('from');
    expect(response.body.friendRequests[2]).toHaveProperty('requestId');
    expect(response.body.friendRequests[2]).toHaveProperty('from');
    expect(response.body.friendRequests[0].requestId).toBe(
      TestConfig.hash(
        `random@wisc.edu/steve@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'random@wisc.edu',
        'steve@wisc.edu'
      )
    );
    expect(response.body.friendRequests[0].from).toBe('random@wisc.edu');
    expect(response.body.friendRequests[1].requestId).toBe(
      TestConfig.hash(
        `tedpowel123@wisc.edu/steve@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'tedpowel123@wisc.edu',
        'steve@wisc.edu'
      )
    );
    expect(response.body.friendRequests[1].from).toBe('tedpowel123@wisc.edu');
    expect(response.body.friendRequests[2].requestId).toBe(
      TestConfig.hash(
        `dalcmap@wisc.edu/steve@wisc.edu/${new Date(
          '2023-02-10T00:50:43.000Z'
        ).toISOString()}`,
        'dalcmap@wisc.edu',
        'steve@wisc.edu'
      )
    );
    expect(response.body.friendRequests[2].from).toBe('dalcmap@wisc.edu');
    expect(response.body.friendRequests[0]).not.toHaveProperty('to');
    expect(response.body.friendRequests[1]).not.toHaveProperty('to');
    expect(response.body.friendRequests[2]).not.toHaveProperty('to');
  });
});
