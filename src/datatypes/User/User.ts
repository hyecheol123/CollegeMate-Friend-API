/**
 * Define type and CRUD methods for each user entry
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */
import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';

const USER = 'user';

export default class User {
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

  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: false,
    locked: false
  );
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: true,
    locked: false,
    deletedAt: Date
  );
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: false,
    locked: true,
    deletedAt: undefined,
    lockedDescription: string,
    lockedAt: Date
  );
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: true,
    locked: true,
    deletedAt: Date,
    lockedDescription: string,
    lockedAt: Date
  );
  /**
   * Constructor for User Object
   *
   * @param {string} id - email of the user
   * @param {string} nickname - nickname of the user
   * @param {Date} lastLogin - last login date of the user
   * @param {Date} signUpDate - sign up date of the user
   * @param {Date} nicknameChanged - nickname changed date of the user
   * @param {string} major - major of the user
   * @param {number} graduationYear - graduation year of the user
   * @param {string} tncVersion - terms and conditions version of the user
   * @param {boolean} deleted - whether the user is deleted or not
   * @param {boolean} locked - whether the user is locked or not
   * @param {Date | undefined} deletedAt - date when the user is deleted - undefined if the user is not deleted
   * @param {string | undefined} lockedDescription - description of the lock - undefined if the user is not locked
   * @param {Date | undefined} lockedAt - date when the user is locked - undefined if the user is not locked
   */
  constructor(
    id: string,
    nickname: string,
    lastLogin: Date,
    signUpDate: Date,
    nicknameChanged: Date,
    major: string,
    graduationYear: number,
    tncVersion: string,
    deleted: boolean,
    locked: boolean,
    deletedAt?: Date,
    lockedDescription?: string,
    lockedAt?: Date
  ) {
    this.id = id;
    this.nickname = nickname;
    this.searchTerm = nickname.toUpperCase();
    this.lastLogin = lastLogin;
    this.signUpDate = signUpDate;
    this.nicknameChanged = nicknameChanged;
    this.deleted = deleted;
    this.deletedAt = deletedAt;
    this.locked = locked;
    this.lockedDescription = lockedDescription;
    this.lockedAt = lockedAt;
    this.major = major;
    this.graduationYear = graduationYear;
    this.tncVersion = tncVersion;
  }

  /**
   * Retrieve user information from the database
   *
   * @param {Cosmos.Database} dbClient DB Client (Cosmos Database)
   * @param {string} email email of the user
   */
  static async read(dbClient: Cosmos.Database, email: string): Promise<User> {
    // Query that retrieves user information from the database
    const result = await dbClient.container(USER).item(email).read<User>();
    if (result.statusCode === 404 || result.resource === undefined) {
      throw new NotFoundError();
    }

    if (!result.resource.deleted && !result.resource.locked) {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        false,
        false
      );
    } else if (!result.resource.deleted && result.resource.locked) {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        false,
        true,
        undefined,
        result.resource.lockedDescription as string,
        new Date(result.resource.lockedAt as string)
      );
    } else if (result.resource.deleted && !result.resource.locked) {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        true,
        false,
        new Date(result.resource.deletedAt as string)
      );
    } else {
      return new User(
        result.resource.id,
        result.resource.nickname,
        new Date(result.resource.lastLogin),
        new Date(result.resource.signUpDate),
        new Date(result.resource.nicknameChanged),
        result.resource.major,
        result.resource.graduationYear,
        result.resource.tncVersion,
        true,
        true,
        new Date(result.resource.deletedAt as string),
        result.resource.lockedDescription as string,
        new Date(result.resource.lockedAt as string)
      );
    }
  }
}
