/**
 * Define type of User
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

export default interface User {
  id: string;
  nickname: string;
  searchTerm: string;
  lastLogin: Date | string;
  signUpDate: Date | string;
  nicknameChanged: Date | string;
  major: string;
  graduationYear: number;
  tncVersion: string;
  deleted: boolean;
  locked: boolean;
  deletedAt?: Date | string;
  lockedDescription?: string;
  lockedAt?: Date | string;
}
