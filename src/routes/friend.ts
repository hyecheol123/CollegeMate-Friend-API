/**
 * Express Router middeware for Friend APIs
 *
 * @author Hyecheol (Jerry) Jang
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import ForbiddenError from '../exceptions/ForbiddenError';
import AuthToken from '../datatypes/Token/AuthToken';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import FriendRequest from '../datatypes/Friend/FriendRequest';

// Path: /friend
const friendRouter = express.Router();

// GET: /friend
// friendRouter.get('/', async (req, res, next) => {
//   // TODO;
// });

// DELETE: /friend/{base64Email}
// friendRouter.delete('/:base64Email', async (req, res, next) => {
//   // TODO;
// });

// POST: /friend/request
// friendRouter.post('/request', async (req, res, next) => {
//   // TODO;
// });

// GET: /friend/request/received
// friendRouter.get('/request/received', async (req, res, next) => {
//   // TODO;
// });

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

      const friendRequestId = req.body.friendRequestId;
      const userEmail = tokenContents.id;

      const userReceivedRequests: FriendRequest[] =
        await FriendRequest.readReceived(dbClient, userEmail);

      const canFound: boolean = userReceivedRequests.some(
        (request: FriendRequest) => {
          return request.id === friendRequestId;
        }
      );

      if (!canFound) {
        throw new ForbiddenError();
      }

      await FriendRequest.deleteReceived(dbClient, friendRequestId);
    } catch (e) {
      next(e);
    }
  }
);

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
