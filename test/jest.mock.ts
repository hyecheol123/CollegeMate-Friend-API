/**
 * File to execute when jest test environmet is started.
 * Mocking some modules
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import NotFoundError from '../src/exceptions/NotFoundError';
import User from '../src/datatypes/User/User';

// Get User Mock Data
jest.mock('../src/datatypes/User/getUserProfile', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: jest.fn(async (email: string, req: Request) => {
    let returnValue: User;
    switch (email) {
      case 'park@wisc.edu':
        returnValue = {
          nickname: 'park',
          lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
          signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          deleted: false,
          locked: false,
          major: 'Computer Science',
          graduationYear: 2024,
          tncVersion: 'v1.0.2',
        };
        return returnValue;

      case 'daekyun@wisc.edu':
        returnValue = {
          nickname: 'daekyun',
          lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
          signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          deleted: false,
          locked: false,
          major: 'Animal Science',
          graduationYear: 2023,
          tncVersion: 'v1.0.2',
        };
        return returnValue;

      case 'dickdick@wisc.edu':
        returnValue = {
          nickname: 'dickdick',
          lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
          signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          deleted: false,
          locked: false,
          major: 'Electrical Engineering',
          graduationYear: 2023,
          tncVersion: 'v1.0.2',
        };
        return returnValue;

      case 'dalcmap@wisc.edu':
        returnValue = {
          nickname: 'dalcmap',
          lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
          signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
          deleted: false,
          locked: false,
          major: 'Computer Science',
          graduationYear: 2023,
          tncVersion: 'v1.0.2',
        };
        return returnValue;

        case 'locked@wisc.edu':
          returnValue = {
            nickname: 'locked',
            lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
            signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
            nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
            deleted: false,
            locked: true,
            major: 'Animal Science',
            graduationYear: 2023,
            tncVersion: 'v1.0.2',
          };
          return returnValue;

        case 'deleted@wisc.edu':
          returnValue = {
            nickname: 'deleted',
            lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
            signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
            nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
            deleted: true,
            locked: false,
            major: 'Chemistry',
            graduationYear: 2023,
            tncVersion: 'v1.0.2',
          };
          return returnValue;

        case 'lockedAndDeleted@wisc.edu':
          returnValue = {
            nickname: 'lockedAndDeleted',
            lastLogin: new Date('2023-03-10T00:50:43.000Z').toISOString(),
            signUpDate: new Date('2023-02-10T00:50:43.000Z').toISOString(),
            nicknameChanged: new Date('2023-02-10T00:50:43.000Z').toISOString(),
            deleted: true,
            locked: true,
            major: 'Animal Science',
            graduationYear: 2023,
            tncVersion: 'v1.0.2',
          };
          return returnValue;

      default:
        throw new NotFoundError();
    }
  }),
}));
