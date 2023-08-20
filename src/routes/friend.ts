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
import HTTPError from '../exceptions/HTTPError';
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
    const email1 = email < requestUserEmail ? email : requestUserEmail;
    const email2 = email < requestUserEmail ? requestUserEmail : email;
    const friendId = ServerConfig.hash(`${email1}/${email2}`, email1, email2);
    await Friend.delete(dbClient, friendId);

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
      /* istanbul ignore if */
      if ((e as HTTPError).statusCode !== 404) {
        throw e;
      }
    }
    if (friendRelation !== undefined) {
      throw new ConflictError();
    }

    // Check for already existing friend request (Check both way)
    if (
      await FriendRequest.readCheckExistingRequest(dbClient, fromEmail, toEmail)
    ) {
      throw new ConflictError();
    }

    const requestCreatedDate = new Date();
    const friendRequestId = ServerConfig.hash(
      `${fromEmail}/${toEmail}/${requestCreatedDate.toISOString()}`,
      fromEmail,
      toEmail
    );

    // DB Operation
    const friendRequest = new FriendRequest(
      friendRequestId,
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
friendRouter.delete(
  '/request/received/:friendRequestId',
  async (req, res, next) => {
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
      let tokenContents: AuthToken | undefined;
      const accessToken = req.header('X-ACCESS-TOKEN');
      if (accessToken !== undefined) {
        tokenContents = verifyAccessToken(
          accessToken,
          req.app.get('jwtAccessKey')
        );
      } else {
        throw new UnauthenticatedError();
      }

      // Retrieve parameters
      const friendRequestId = req.params.friendRequestId;
      const userEmail = tokenContents.id;

      // DB Operation - get friend request to check if it is sent to the user
      const friendRequest = await FriendRequest.read(dbClient, friendRequestId);
      if (friendRequest.to !== userEmail) {
        throw new ForbiddenError();
      }

      // DB Operation - remove friend request
      await FriendRequest.delete(
        dbClient,
        friendRequestId,
        friendRequest.to,
        friendRequest.from
      );

      res.status(200).send();
    } catch (e) {
      next(e);
    }
  }
);

// POST: /friend/request/received/{friendRequestId}/accept
friendRouter.post(
  '/request/received/:friendRequestId/accept',
  async (req, res, next) => {
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

      const friendRequestId = req.params.friendRequestId;

      // DB Operation - get friend request to check if it belongs to the user
      const friendRequest = await FriendRequest.read(dbClient, friendRequestId);

      if (friendRequest.to !== tokenContents.id) {
        throw new ForbiddenError();
      }

      // DB Operation - delete friend request and add friend
      await FriendRequest.delete(
        dbClient,
        friendRequestId,
        friendRequest.to,
        friendRequest.from
      );

      const email1 =
        friendRequest.from < friendRequest.to
          ? friendRequest.from
          : friendRequest.to;
      const email2 =
        friendRequest.from < friendRequest.to
          ? friendRequest.to
          : friendRequest.from;
      const friendId = ServerConfig.hash(`${email1}/${email2}`, email1, email2);

      let friendRelation: Friend | undefined;
      try {
        friendRelation = await Friend.read(dbClient, friendId);
      } catch (e) {
        if ((e as HTTPError).statusCode !== 404) {
          throw e;
        }
      }
      if (friendRelation !== undefined) {
        throw new ConflictError();
      }

      await Friend.create(
        dbClient,
        new Friend(friendId, email1, email2, new Date())
      );

      res.status(200).send();
    } catch (e) {
      next(e);
    }
  }
);

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
friendRouter.delete(
  '/request/sent/:friendRequestId',
  async (req, res, next) => {
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
      let tokenContents: AuthToken | undefined;
      const accessToken = req.header('X-ACCESS-TOKEN');
      if (accessToken !== undefined) {
        tokenContents = verifyAccessToken(
          accessToken,
          req.app.get('jwtAccessKey')
        );
      } else {
        throw new UnauthenticatedError();
      }

      // Receive Parameters
      const friendRequestId = req.params.friendRequestId;
      const userEmail = tokenContents.id;

      // DB Operation - get friend request to check if it sent by the user
      const friendRequest = await FriendRequest.read(dbClient, friendRequestId);
      if (friendRequest.from !== userEmail) {
        throw new ForbiddenError();
      }

      // DB Operation - remove friend request
      await FriendRequest.delete(
        dbClient,
        friendRequestId,
        friendRequest.from,
        friendRequest.to
      );

      res.status(200).send();
    } catch (e) {
      next(e);
    }
  }
);

export default friendRouter;
