/**
 * Jest unit test for DELETE /friend/{base64Email}
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

const FRIEND = 'friend';
describe('DELETE /friend/{base64Email} - Unfriend', () => {
  let testEnv: TestEnv;
  const encodedEmailMap = {
    steve: Buffer.from('steve@wisc.edu', 'utf8').toString('base64url'),
    drag: Buffer.from('drag@wisc.edu', 'utf8').toString('base64url'),
    jerry: Buffer.from('jerry@wisc.edu', 'utf8').toString('base64url'),
    jeonghyeon: Buffer.from('jeonghyeon@wisc.edu', 'utf8').toString(
      'base64url'
    ),
    daekyun: Buffer.from('daekyun@wisc.edu', 'utf8').toString('base64url'),
  };
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

  test('Fail - Neither from Origin or App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wrong Origin
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://suspicious.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Wrong App Version
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({'X-APPLICATION-KEY': '<Android-App-v2>'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // No Origin
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // No Access Token
    const response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Wrong Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wrong Access Token
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.wrong})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Expired Access Token
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Invalid Email Format', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wrong parameter type
    const response = await request(testEnv.expressServer.app)
      .delete('/friend/notemail')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Friend Relation Not Found', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Non-existent friend relation
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.jerry})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    response = await request(testEnv.expressServer.app)
      .delete(
        `/friend/${Buffer.from('whoisthisuser@wisc.edu', 'utf8').toString(
          'base64url'
        )}`
      )
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web
    let response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.jeonghyeon}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);

    // DB check read emails
    let friendList = (
      await testEnv.dbClient
        .container(FRIEND)
        .items.query({
          query: `SELECT f.email1, f.email2 FROM ${FRIEND} AS f WHERE f.email1=@email OR f.email2=@email`,
          parameters: [{name: '@email', value: 'steve@wisc.edu'}],
        })
        .fetchAll()
    ).resources.map(friend =>
      friend.email1 === 'steve@wisc.edu' ? friend.email2 : friend.email1
    );

    expect(friendList).toHaveLength(2);
    expect(friendList).toContain('jerry@wisc.edu');
    expect(friendList).toContain('daekyun@wisc.edu');
    expect(friendList).not.toContain('jeonghyeon@wisc.edu');
    expect(friendList).not.toContain('drag@wisc.edu');

    // Request From App
    response = await request(testEnv.expressServer.app)
      .delete(`/friend/${encodedEmailMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.jerry})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);

    // DB check
    friendList = (
      await testEnv.dbClient
        .container(FRIEND)
        .items.query({
          query: `SELECT f.email1, f.email2 FROM ${FRIEND} AS f WHERE f.email1=@email OR f.email2=@email`,
          parameters: [{name: '@email', value: 'jerry@wisc.edu'}],
        })
        .fetchAll()
    ).resources.map(friend =>
      friend.email1 === 'jerry@wisc.edu' ? friend.email2 : friend.email1
    );

    expect(friendList).toHaveLength(1);
    expect(friendList).toContain('steve@wisc.edu');
    expect(friendList).not.toContain('daekyun@wisc.edu');
    expect(friendList).not.toContain('jeonghyeon@wisc.edu');
    expect(friendList).not.toContain('drag@wisc.edu');
  });
});
