/**
 * File to execute when jest test environmet is started.
 * Mocking some modules
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// Get User Mock Data
jest.mock('../src/datatypes/User/getUser', () => ({
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    default: jest.fn(async (_req: Request, encodedEmail: string) => {
        return {
                email: 'park@wisc.edu',
                nickname: 'jeonghyeon',
                major: 'Computer Science',
                graduationYear: new Date('2022-03-10T00:50:43.000Z').toISOString(),
                tncVersion: 'v1.0.1',
        };
    }),
}));
