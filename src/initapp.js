import connectDb from '../DB/connection.js';
import authrouter from './modules/auth/auth.router.js';
const initapp = (app,express) => {
    // Middleware for parsing JSON request bodies
    connectDb();
    app.use(express.json());
    app.use('/auth',authrouter);
    app.use('*',(req, res) => {
return res.status(404).json({message:"page not found"});
    })
}
    
    // Middleware for parsing URL-encoded request bodies

export default initapp;


