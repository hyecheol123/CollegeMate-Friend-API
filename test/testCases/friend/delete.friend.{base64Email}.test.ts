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

const FRIEND = 'friend';
describe('GET /friend - Friend List', () => {
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

  test('Fail - Wrong Access Token', async () => {});

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
    let friendList: string[] = [];
    type FriendInfo = {email: string};
    friendList = friendList.concat(
      (
        await testEnv.dbClient
          .container(FRIEND)
          .items.query<FriendInfo>({
            query: `SELECT f.email1 AS email FROM ${FRIEND} f WHERE f.email2 = @email`,
            parameters: [
              {
                name: '@email',
                value: 'steve@wisc.edu',
              },
            ],
          })
          .fetchAll()
      ).resources.map(friend => friend.email)
    );
    friendList = friendList.concat(
      (
        await testEnv.dbClient
          .container(FRIEND)
          .items.query<FriendInfo>({
            query: `SELECT f.email2 AS email FROM ${FRIEND} f WHERE f.email1 = @email`,
            parameters: [
              {
                name: '@email',
                value: 'steve@wisc.edu',
              },
            ],
          })
          .fetchAll()
      ).resources.map(friend => friend.email)
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
    friendList = [];
    friendList = friendList.concat(
      (
        await testEnv.dbClient
          .container(FRIEND)
          .items.query<FriendInfo>({
            query: `SELECT f.email1 AS email FROM ${FRIEND} f WHERE f.email2 = @email`,
            parameters: [
              {
                name: '@email',
                value: 'steve@wisc.edu',
              },
            ],
          })
          .fetchAll()
      ).resources.map(friend => friend.email)
    );
    friendList = friendList.concat(
      (
        await testEnv.dbClient
          .container(FRIEND)
          .items.query<FriendInfo>({
            query: `SELECT f.email2 AS email FROM ${FRIEND} f WHERE f.email1 = @email`,
            parameters: [
              {
                name: '@email',
                value: 'steve@wisc.edu',
              },
            ],
          })
          .fetchAll()
      ).resources.map(friend => friend.email)
    );

    expect(friendList).toHaveLength(2);
    expect(friendList).toContain('steve@wisc.edu');
    expect(friendList).not.toContain('daekyun@wisc.edu');
    expect(friendList).not.toContain('jeonghyeon@wisc.edu');
    expect(friendList).not.toContain('drag@wisc.edu');
  });
});
