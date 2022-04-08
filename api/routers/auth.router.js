const res = require("express/lib/response");
const BaseRouter = require("./base.router");


//AuthRouter hérite de BaseRouter
class AuthRouter extends BaseRouter {


    //*******************creation du constructeur*****************//
    constructor() {
        super();
        this.initalizeRoutes(); // on initialise toute les route de AuthRouter
    }
    /////////////////////////////////////////////////////////////////

    //*****on defini toute les routes avec l'action du controller associé*****//

    initalizeRoutes = () => {
        // /auth/login
        this.router.post("/login", async (req, res) => {
            const response = await this.controller.login(req);
            res.json(response);
            //TODO mettre en 3eme params NEXT voir video du 24/02/22 07:36 mn
        });
        // /auth/register
        this.router.post("/register", async (req, res) => {
            const response = await this.controller.register(req);
            res.json(response);
        });
        // /auth/validate
        this.router.post("/validate", async (req, res) => {
            const response = await this.controller.validate(req);
            res.json(response);
        });
        // /auth/renew
        this.router.post("/renewpass", async (req, res) => {
            const response = await this.controller.renewpass(req);
            res.json(response);
        });
        // /auth/refresh_token
        this.router.post("/refresh_token", async (req, res) => {
            const response = await this.controller.refresh(req);
            res.json(response);
        });
        //auth
        this.router.get("/", async (req, res) => {
            const response = await this.controller.check(req);
            res.json(response);
        });
        this.router.post("/renewmail", async (req, res) => {
            const response = await this.controller.renewmail(req);
            res.json(response);
            console.log(response);
            
        });
    }
}




module.exports = AuthRouter;
