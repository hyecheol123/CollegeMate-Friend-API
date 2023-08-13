/**
 * Express Router middeware for Friend APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park  <fishbox0923@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import Friend from '../datatypes/Friend/Friend';
import FriendRequest from '../datatypes/Friend/FriendRequest';
import FriendRequestGetResponseObj from '../datatypes/Friend/FriendRequestGetResponseObj';
import AuthToken from '../datatypes/Token/AuthToken';
import ForbiddenError from '../exceptions/ForbiddenError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';

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
// friendRouter.delete('/:base64Email', async (req, res, next) => {
//   // TODO;
// });

// POST: /friend/request
// friendRouter.post('/request', async (req, res, next) => {
//   // TODO;
// });

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
// friendRouter.get('/request/sent', async (req, res, next) => {
//   // TODO;
// });

// DELETE /friend/request/sent/{friendRequestId}
// friendRouter.delete(
//   '/request/sent/:friendRequestId',
//   async (req, res, next) => {
//     // TODO;
//   }
// );

export default friendRouter;
