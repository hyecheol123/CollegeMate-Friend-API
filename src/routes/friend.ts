/**
 * Express Router middeware for Friend APIs
 *
 * @author Hyecheol (Jerry) Jang
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import AuthToken from '../datatypes/Token/AuthToken';
import ForbiddenError from '../exceptions/ForbiddenError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import FriendRequest from '../datatypes/Friend/FriendRequest';
import NotFoundError from '../exceptions/NotFoundError';
import Friend from '../datatypes/Friend/Friend';
import ConflictError from '../exceptions/ConflictError';
import getUser from '../datatypes/User/getUser';
import {validateSendFriendRequest} from '../functions/inputValidator/validateSendFriendRequest';
import BadRequestError from '../exceptions/BadRequestError';
import {Buffer} from 'node:buffer';

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

    // If the request body format is not valid
    const friendRequest: {targetEmail: string} = req.body;
    if (!validateSendFriendRequest(friendRequest)) {
      throw new BadRequestError();
    }

    const yourEmail = req.body.targetEmail;
    const myEmail = tokenContents.id;

    // Read FRIEND database
    const friendList = await Friend.read(dbClient, myEmail);

    // If they are already friend
    for (let index = 0; index < friendList.length; index++) {
      if (friendList[index] === yourEmail) {
        throw new ConflictError();
      }
    }

    try {
      // API call - verify User
      const encodedEmail = Buffer.from(`${yourEmail}`, 'utf-8').toString(
        'base64url'
      );
      await getUser(req, encodedEmail);
    } catch (e) {
      if (e instanceof Cosmos.ErrorResponse && e.status === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }

    await FriendRequest.createRequest(dbClient, myEmail, yourEmail);

    res.status(201).send();
  } catch (e) {
    next(e);
  }
});

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
