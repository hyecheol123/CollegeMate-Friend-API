/**
 * Define type of User (Profile)
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

export default interface User {
  nickname: string;
  lastLogin: Date | string;
  signUpDate: Date | string;
  nicknameChanged: Date | string;
  deleted: boolean;
  deletedAt?: Date | string;
  locked: boolean;
  lockedDescription?: string;
  lockedAt?: Date | string;
  major: string;
  graduationYear: number;
  tncVersion: string;
}
