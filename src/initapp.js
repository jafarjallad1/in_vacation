import connectDb from '../DB/connection.js';
import authrouter from './modules/auth/auth.router.js';
import chaletRouter from "./modules/chalet/chalet.router.js";
import ownerRouter from './modules/owner/owner.router.js';
import cors from 'cors';
const initapp = (app,express) => {
    // Middleware for parsing JSON request bodies
    connectDb();
    app.use(cors());
    
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


