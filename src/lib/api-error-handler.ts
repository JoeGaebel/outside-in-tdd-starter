import type {NextApiHandler} from 'next';

export function withErrorHandling(handler: NextApiHandler): NextApiHandler {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal server error';
            res.status(500).json({error: message});
        }
    };
}
