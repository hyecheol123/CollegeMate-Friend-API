/**
 * Express Router middeware for Friend APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park  <fishbox0923@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import {Buffer} from 'node:buffer';
import ServerConfig from '../ServerConfig';
import AuthToken from '../datatypes/Token/AuthToken';
import Friend from '../datatypes/Friend/Friend';
import FriendRequest from '../datatypes/FriendRequest/FriendRequest';
import FriendRequestGetResponseObj from '../datatypes/FriendRequest/FriendRequestGetResponseObj';
import getUserProfile from '../datatypes/User/getUserProfile';
import BadRequestError from '../exceptions/BadRequestError';
import ForbiddenError from '../exceptions/ForbiddenError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import NotFoundError from '../exceptions/NotFoundError';
import ConflictError from '../exceptions/ConflictError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import {validateSendFriendRequest} from '../functions/inputValidator/validateSendFriendRequest';
import {validateEmail} from '../functions/inputValidator/validateEmail';

// Path: /friend
const friendRouter = express.Router();

// GET: /friend
friendRouter.get('/', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Header check - access token
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken === undefined) {
      throw new UnauthenticatedError();
    }
    const tokenContents = verifyAccessToken(
      accessToken,
      req.app.get('jwtAccessKey')
    );

    // DB Operation - get list of friends
    const email = tokenContents.id;
    const friendListResponseObj: {friendList: string[]} = {
      friendList: await Friend.readFriendEmailList(dbClient, email),
    };

    res.status(200).json(friendListResponseObj);
  } catch (e) {
    next(e);
  }
});

// DELETE: /friend/{base64Email}
friendRouter.delete('/:base64Email', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Header check - access token
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken === undefined) {
      throw new UnauthenticatedError();
    }
    const tokenContents = verifyAccessToken(
      accessToken,
      req.app.get('jwtAccessKey')
    );

    // Parameter check if received
    const requestUserEmail = Buffer.from(
      req.params.base64Email,
      'base64url'
    ).toString('utf8');

    if (!validateEmail(requestUserEmail)) {
      throw new NotFoundError();
    }

    // DB Operation - delete requested friend
    const email = tokenContents.id;
    await Friend.delete(dbClient, email, requestUserEmail);

    res.status(200).send();
  } catch (e) {
    next(e);
  }
});

// POST: /friend/request
friendRouter.post('/request', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Check access token
    let tokenContents: AuthToken | undefined = undefined;
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken !== undefined) {
      tokenContents = verifyAccessToken(
        accessToken,
        req.app.get('jwtAccessKey')
      );
    } else {
      throw new UnauthenticatedError();
    }

    // Check If the request body format is not valid
    if (!validateSendFriendRequest(req.body)) {
      throw new BadRequestError();
    }
    const toEmail = req.body.targetEmail;
    const fromEmail = tokenContents.id;

    // Check for target user eligibility
    const userProfile = await getUserProfile(toEmail, req);
    if (userProfile.deleted || userProfile.locked) {
      throw new NotFoundError();
    }

    // Check for already existing friend
    const email1 = fromEmail < toEmail ? fromEmail : toEmail;
    const email2 = fromEmail < toEmail ? toEmail : fromEmail;
    const friendRelationId = ServerConfig.hash(
      `${email1}/${email2}`,
      email1,
      email2
    );
    let friendRelation: Friend | undefined;
    try {
      friendRelation = await Friend.read(dbClient, friendRelationId);
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        throw e;
      }
    }
    if (friendRelation !== undefined) {
      throw new ConflictError();
    }

    // Check for already existing friend request (Check both way)
    todo();

    // DB Operation
    const requestCreatedDate = new Date();
    const friendRequest = new FriendRequest(
      ServerConfig.hash(
        `${fromEmail}/${toEmail}/${requestCreatedDate.toISOString()}`,
        fromEmail,
        toEmail
      ),
      fromEmail,
      toEmail,
      requestCreatedDate
    );
    await FriendRequest.create(dbClient, friendRequest);

    res.status(201).send();
  } catch (e) {
    next(e);
  }
});

// GET: /friend/request/received
friendRouter.get('/request/received', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Check access token
    let tokenContents: AuthToken | undefined = undefined;
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken !== undefined) {
      tokenContents = verifyAccessToken(
        accessToken,
        req.app.get('jwtAccessKey')
      );
    } else {
      throw new UnauthenticatedError();
    }

    // DB Operation - get list of received friend requests
    const email = tokenContents.id;
    const receivedRequests = await FriendRequest.readReceived(dbClient, email);

    // Build response object
    const friendRequests: FriendRequestGetResponseObj[] = receivedRequests.map(
      request => ({
        requestId: request.id,
        from: request.from,
      })
    );
    res.status(200).json({friendRequests});
  } catch (e) {
    next(e);
  }
});

// DELETE: /friend/request/received/{friendRequestId}
// friendRouter.delete(
//   '/request/received/:friendRequestId',
//   async (req, res, next) => {
//     // TODO;
//   }
// );

// POST: /friend/request/received/{friendRequestId}/accept
// friendRouter.post(
//   '/request/received/:friendRequestId/accept',
//   async (req, res, next) => {
//     // TODO;
//   }
// );

// GET: /friend/request/sent
friendRouter.get('/request/sent', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin header or application key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // Check access token
    let tokenContents: AuthToken | undefined = undefined;
    const accessToken = req.header('X-ACCESS-TOKEN');
    if (accessToken !== undefined) {
      tokenContents = verifyAccessToken(
        accessToken,
        req.app.get('jwtAccessKey')
      );
    } else {
      throw new UnauthenticatedError();
    }
    // DB Operation - get list of received friend requests
    const email = tokenContents.id;

    // Build response object
    const receivedRequests = await FriendRequest.readSent(dbClient, email);
    const friendRequests: FriendRequestGetResponseObj[] = receivedRequests.map(
      request => ({
        requestId: request.id,
        to: request.to,
      })
    );
    res.status(200).json({friendRequests});
  } catch (e) {
    next(e);
  }
});

// DELETE /friend/request/sent/{friendRequestId}
// friendRouter.delete(
//   '/request/sent/:friendRequestId',
//   async (req, res, next) => {
//     // TODO;
//   }
// );

export default friendRouter;
