const admin = require('../firebase');

const authenticateToken = async (req, res, next) => {
    try {
        console.log('=== Auth Middleware Debug ===');
        console.log('Request path:', req.path);
        console.log('Request method:', req.method);
        console.log('All headers:', JSON.stringify(req.headers, null, 2));

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({ error: 'No token provided' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log('Authorization header does not start with Bearer');
            return res.status(401).json({ error: 'Invalid token format' });
        }

        const token = authHeader.split('Bearer ')[1];
        console.log('Token received:', token.substring(0, 20) + '...');

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            console.log('Token successfully decoded:', {
                uid: decodedToken.uid,
                email: decodedToken.email,
                email_verified: decodedToken.email_verified
            });
            req.user = decodedToken;
            next();
        } catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = { authenticateToken }; 