import { CorsOptions } from 'cors';

const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost,http://localhost:80,http://127.0.0.1,http://127.0.0.1:80'
)
    .split(',')
    .map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
