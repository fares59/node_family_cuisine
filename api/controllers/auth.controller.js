const BaseController = require("./base.controller");
const UserService = require("../services/user.service");
const bcrypt = require("bcrypt");
const { JWT_SECRET , HASH_PREFIX } = require("../configs/auth.config");
const jwt = require("jsonwebtoken");
const MailerService = require("../services/mailer.service");
const authconfig = require("../configs/auth.config");

class AuthController extends BaseController {

    getUser = async(email) =>{
        const service = new UserService();
        const users = await service.select({where:`email = '${email}'`});
        return users.length === 1 ? users.pop(): null;
    }

    /* Checking if the email exists in the database. */
    login = async (req) => {
        const service = new UserService();
        const results = await service.select({
           where: `email = '${req.body.email} '` ,
        });
        const user = results.length === 1 ? results.pop() : null;
        let m = bcrypt.hashSync('test',8);
        console.log(m);
        if(user){
            console.log('req', req.body.password);
            const result = await bcrypt.compare(req.body.password, `${HASH_PREFIX + user.mdp}`);
            if (result){
                const token = jwt.sign({sub: user.Id_utilisateur, email: user.email, role: user.role},JWT_SECRET,{ expiresIn: "1d"}); //dans react sub
                let response = {id:user.Id_utilisateur, email: user.email, role: user.role, token, result: true,message: "bienvenue !"};
                console.log(response);
                return response
            }
            return {result: false, message: "identifiant incorrect !"};
        }
        return "login";
    }
    ///*****mehtod refresh ------ renvoi les infos user a partir du cookie **///
    refresh = async (req) => {
        const token = req.cookies.token;
        console.log('token recupéré',token);
        let payload;
        try{
            payload = jwt.verify(token, JWT_SECRET);
            console.log('payload', payload);
        }
        catch{
            return {result: false, message: "payload incorrect !"};
        }
        if (payload){
            let user = {
                'id':payload.sub,
                'email':payload.email,
                'role':payload.role
            }
            console.log(user);
            if(user){
                return user
            }
            else{
                return {result: false, message: "payload incorrect3 !"};
            }
        }
        return {result: false, message: "payload incorrect2 !"};


    }
    register = async (req) => {
        // return "register";
        if(req.method !== 'POST') return {status:405};
        
        const user = await this.getUser(req.body.email);
        if(!user){
            const payload = {mail:req.body.email,role:1,password:req.body.password};
            const token = jwt.sign(payload, authconfig.JWT_SECRET, { expiresIn: '1d'});

            const html = 
            `

            <b>Confirmez votre Inscription : </b>
            <a href="http://localhost:3000/RegisterValidation?t=${encodeURIComponent(token)}" target="_blank">Confirmer</a>
            `;
            await MailerService.sendMail({to: req.body.email, subject:"Confirmer votre inscription", html});
            return true;
        }
        return false;
    }
 /* This is checking if the token is valid. If it is, it will return the user's role. */
    validate = async (req) => {

        const token = req.body.token;
        let payload;
        try{
            payload = jwt.verify(token, authconfig.JWT_SECRET);
        }
        catch{
            return {data:{completed:false, message:"Désolé une erreur est survenue ..."}};
        }
        if(payload){
            const service = new UserService();
            const password = (await bcrypt.hash(payload.password,8)).replace(authconfig.HASH_PREFIX,'');
            const user = await service.insertOneOrMany({email:payload.mail, mdp:password, role:''+payload.role});
            return user ?
                {data:{completed:true, message:"Bienvenu sur Family Cuisine, votre compte a bien etais activé, vous pouvez vous connecter"}} :
                {data:{completed:false, message:"Une erreur est survenue ...."}} ;
        }
        return {data:{completed:false, message:"L'activation de votre compte a expiré, réinscriver vous ..."}};
    }


        // let data = {completed:true, message: "bienvenue !"};
        // return data;
    
    renew = async (req) => {
        return "renew";
    }
  /* The above code is checking if the user has a valid token. If they do, it will return the user's
  role. */
    check = async (req) => {
        const auth = req.cokies.auth;
        if(auth){
            const result = jwt.verify(auth, config.JWT_SECRET);
            if(result){
                return {result:true, role:result.role}
        }
    }
    return {result:false, role:0}
    }
}

module.exports = AuthController;
