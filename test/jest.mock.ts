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

      default:
        throw new NotFoundError();
    }
  }),
}));
