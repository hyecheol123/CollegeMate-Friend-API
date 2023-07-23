/**
 * Express Router middeware for Friend APIs
 *
 * @author Hyecheol (Jerry) Jang
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import ForbiddenError from '../exceptions/ForbiddenError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import NotFoundError from '../exceptions/NotFoundError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import Friend from '../datatypes/Friend/Friend';
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
// friendRouter.delete(
//   '/request/received/:friendRequestId',
//   async (req, res, next) => {
//     // TODO;
//   }
// );

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

      // Parameter check if received
      const friendRequestId = req.params.friendRequestId;

      // DB Operation - get friend request to check if it belongs to the user
      const friendRequest = await FriendRequest.read(dbClient, friendRequestId);

      if (friendRequest.to !== tokenContents.id) {
        throw new ForbiddenError();
      }

      // DB Operation - delete friend request and add friend
      await FriendRequest.delete(dbClient, friendRequestId);
      await Friend.create(
        dbClient,
        new Friend(friendRequest.from, friendRequest.to, new Date())
      );

      res.status(200).send();
    } catch (e) {
      next(e);
    }
  }
);

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
