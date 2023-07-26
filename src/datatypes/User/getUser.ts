/**
 * Function to retrieve user from User API
 * 
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import {Request} from 'express';
import User from './User';

/**
 * Function to retrieve user from User API
 * @param req req express Request object
 * @param encodedEmail encoded email
 * @returns {Promise<User>} User object
 */
export default async function getUser(
    req: Request,
    encodedEmail: string
): Promise<User>
 {
    const response = await fetch(`https://collegemate.app/user/profile/${encodedEmail}`, {
        method: "GET",
        headers: {'X-APPLICATION-KEY': req.app.get('serverApplicationKey')},
        body: JSON.stringify({encodedEmail: encodedEmail},)
    });

    if (response.status !== 200) {
        throw new Error('[Fail on retreiving User]');
    }

    return await response.json();
 }