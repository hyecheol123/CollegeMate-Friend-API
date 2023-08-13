/**
 * Function to retrieve User Profile from User API
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import {Request} from 'express';
import {Buffer} from 'node:buffer';
import User from './User';

/**
 * Function to retrieve User Profile from User API
 *
 * @param {string} email email address for user
 * @param {Request} req express Request object
 * @return {Promise<User>} User Profile
 */
export default async function getUserProfile(
  email: string,
  req: Request
): Promise<User> {
  const base64Email = Buffer.from(email, 'utf8').toString('base64url');
  let response = await fetch(
    `https://api.collegemate.app/user/profile/${base64Email}`,
    {
      method: 'GET',
      headers: {'X-SERVER-TOKEN': req.app.get('serverAdminToken')},
    }
  );

  if (response.status === 401 || response.status === 403) {
    // Retry with new serverAdminToken
    response = await fetch('https://api.collegemate.app/auth/login', {
      method: 'GET',
      headers: {'X-SERVER-KEY': req.app.get('serverAdminKey')},
    });
    if (response.status !== 200) {
      throw new Error('[Fail on serverAdminToken renewal]');
    }
    const serverAdminTokenReq = (await response.json()).serverAdminToken;
    req.app.set('serverAdminToken', serverAdminTokenReq);

    response = await fetch(
      `https://api.collegemate.app/user/profile/${base64Email}`,
      {
        method: 'GET',
        headers: {'X-SERVER-TOKEN': req.app.get('serverAdminToken')},
      }
    );
  }

  if (response.status !== 200) {
    throw new Error('[Fail on retreiving User Profile]');
  }

  // Found requested user
  const userProfileInfo = await response.json();
  return {
    email: email,
    nickname: userProfileInfo.nickname,
    lastLogin: new Date(userProfileInfo.lastLogin),
    signUpDate: new Date(userProfileInfo.signUpDate),
    nicknameChanged: new Date(userProfileInfo.nicknameChanged),
    deleted: userProfileInfo.deleted,
    deletedAt: userProfileInfo.deleted
      ? new Date(userProfileInfo.deletedAt)
      : undefined,
    locked: false,
    lockedAt: userProfileInfo.locked
      ? new Date(userProfileInfo.lockedAt)
      : undefined,
    lockedDescription: userProfileInfo.locked
      ? userProfileInfo.lockedDescription
      : undefined,
    major: userProfileInfo.major,
    graduationYear: userProfileInfo.graduationYear,
    tncVersion: userProfileInfo.tncVersion,
  };
}
