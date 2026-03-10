import type {NextApiHandler, NextApiRequest, NextApiResponse} from 'next';
import type {MockRequest, MockResponse} from 'node-mocks-http';

interface ErrorHandlingOptions {
    createRequest: () => {req: MockRequest<NextApiRequest>; res: MockResponse<NextApiResponse>};
    causeError: () => void;
}

export function describeErrorHandling(
    handler: NextApiHandler,
    options: ErrorHandlingOptions,
) {
    describe('error handling', () => {
        it('returns 500 with error message when an unhandled error occurs', async () => {
            options.causeError();
            const {req, res} = options.createRequest();
            await handler(req, res);
            expect(res.statusCode).toBe(500);
            const data = JSON.parse(res._getData());
            expect(data).toEqual({error: expect.any(String)});
        });
    });
}
