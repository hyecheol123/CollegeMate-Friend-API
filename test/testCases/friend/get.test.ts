/**
 * Jest unit test for GET /friend method
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

describe('GET /friend - Friend List', () => {
  let testEnv: TestEnv;
  const accessTokenMap = {
    steve: '',
    jerry: '',
    wrong: '',
    expired: '',
  };

  beforeEach(async () => {
    // Setup TestEnv
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Create Access Token
    // Steve Access Token
    let tokenContent: AuthToken = {
      id: 'steve@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.steve = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
    );

    // Jerry Access Token
    tokenContent = {
      id: 'jerry@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.jerry = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
    );

    // Wrong Access Token
    // Token Content
    tokenContent = {
      id: 'wrong@wisc.edu',
      type: 'refresh',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.wrong = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '10m',
      }
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
      {
        algorithm: 'HS512',
        expiresIn: '1ms',
      }
    );
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Neither from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request from wrong origin
    let response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrongaddress.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request from wrong app
    response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': '<Android-App-v2>'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request from no origin
    response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request from no access token
    const response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Wrong Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request with expired access token
    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    let response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with wrong access token
    response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web
    let response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.friendList).toBeInstanceOf(Array);
    expect(response.body.friendList).toHaveLength(3);
    expect(response.body.friendList).toContain('jerry@wisc.edu');
    expect(response.body.friendList).toContain('daekyun@wisc.edu');
    expect(response.body.friendList).toContain('jeonghyeon@wisc.edu');
    expect(response.body.friendList).not.toContain('drag@wisc.edu');

    // Request From App
    response = await request(testEnv.expressServer.app)
      .get('/friend')
      .set({'X-ACCESS-TOKEN': accessTokenMap.jerry})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.friendList).toHaveLength(2);
    expect(response.body.friendList).toContain('steve@wisc.edu');
    expect(response.body.friendList).not.toContain('daekyun@wisc.edu');
    expect(response.body.friendList).not.toContain('jeonghyeon@wisc.edu');
    expect(response.body.friendList).toContain('drag@wisc.edu');
  });
});
