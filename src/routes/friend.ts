/**
 * Express Router middeware for Friend APIs
 *
 * @author Hyecheol (Jerry) Jang
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import AuthToken from '../datatypes/Token/AuthToken';
import ForbiddenError from '../exceptions/ForbiddenError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import verifyAccessToken from '../functions/JWT/verifyAccessToken';
import FriendRequest from '../datatypes/Friend/FriendRequest';
import User from '../datatypes/User/User';
import NotFoundError from '../exceptions/NotFoundError';
import Friend from '../datatypes/Friend/Friend';
import ConflictError from '../exceptions/ConflictError';

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

        const yourEmail = req.body.targetEmail;
        const myEmail = tokenContents.id;

        try {
            await User.read(dbClient,yourEmail);
        }
        catch(e){
            if (e instanceof Cosmos.ErrorResponse && e.statusCode === 404) {
                throw new NotFoundError();
            }
            else {
                throw e;
            }
        }

        const friendList = await Friend.read(dbClient, myEmail);
        for (let index = 0; index < friendList.length; index++) {
            if (friendList === yourEmail) {
            throw new ConflictError();
            }
        }
        res.status(201).send();
    }
    catch(e) {
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
