import connectDb from '../DB/connection.js';
import authrouter from './modules/auth/auth.router.js';
import chaletRouter from "./modules/chalet/chalet.router.js";
import ownerRouter from './modules/owner/owner.router.js';
import cors from 'cors';
const initapp = (app,express) => {
    // Middleware for parsing JSON request bodies
    connectDb();
    app.use(cors({
        origin: 'https://example.com',
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
        exposedHeaders: ['Authorization'], // Headers exposed to the frontend
    }));
    
    app.use(express.json());
    app.use('/auth',authrouter);
    app.use('/chalets',chaletRouter);
    app.use('/owner',ownerRouter);

    app.use('*',(req, res) => {
return res.status(404).json({message:"page not found"});
    })
}
    
    // Middleware for parsing URL-encoded request bodies

export default initapp;


