/**
 * File to execute when jest test environmet is started.
 * Mocking some modules
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import UserGetResponseObj from '../src/datatypes/User/UserGetResponseObj';
import NotFoundError from '../src/exceptions/NotFoundError';

// Get User Mock Data
jest.mock('../src/datatypes/User/getUser', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: jest.fn(async (_req: Request, encodedEmail: string) => {
    const returnEmail = Buffer.from('park@wisc.edu', 'utf-8').toString(
      'base64url'
    );
    let returnValue: UserGetResponseObj;
    switch (encodedEmail) {
      case returnEmail:
        returnValue = {
          id: 'park@wisc.edu',
          nickname: 'steve',
          searchTerm: 'STEVE',
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

      default:
        throw new NotFoundError();
    }
  }),
}));
