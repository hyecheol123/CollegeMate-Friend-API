/**
 * Jest unit test for POST /friend/request/ method
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

describe('POST /friend/request - Send Friend Request', () => {
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

    // request with an expired access token
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

    const response = await request(testEnv.expressServer.app)
        .post('/friend/request')
        .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
        .set({Origin: 'https://collegemate.app'})
        .send({
            targetEmail : 'steve@wisc.edu'
        });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Target User is already a Friend', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const response = await request(testEnv.expressServer.app)
        .post('/friend/request')
        .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
        .set({Origin: 'https://collegemate.app'})
        .send({
            targetEmail : 'drag@wisc.edu'
        });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Fail - Bad Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    let response = await request(testEnv.expressServer.app)
        .post('/friend/request')
        .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
        .set({Origin: 'https://collegemate.app'})
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    response = await request(testEnv.expressServer.app)
        .post('/friend/request')
        .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
        .set({Origin: 'https://collegemate.app'})
        .send({
            invalidPropertity : 'invalidValue'
        });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    response = await request(testEnv.expressServer.app)
    .post('/friend/request')
    .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
    .set({Origin: 'https://collegemate.app'})
    .send({
        invalidPropertity : 'invalidValue',
        targetEmail : 'park@wisc.edu'
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  })

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const response = await request(testEnv.expressServer.app)
        .post('/friend/request')
        .set({'X-ACCESS-TOKEN': accessTokenMap.valid})
        .set({Origin: 'https://collegemate.app'})
        .send({
            targetEmail : 'park@wisc.edu'
        });
    expect(response.status).toBe(201);
  })


})