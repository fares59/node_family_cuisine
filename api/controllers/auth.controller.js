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
        console.log(users);
    }
    

    /* Checking if the email exists in the database. */

    // login = async (req) => {
    //     const service = new UserService();
    //     const rows = await service.select({
    //       where: `email='${req.body.email}'`,
    //     });
    //     //compare pour comparer le mot de passe crypter et non crypter, ajouter la clef au mot de pass de la bdd.
    
    //     if (rows.length === 1) {
    //       const user = rows.pop();
    //       const result = await bcrypt.compare(req.body.password, `${appConfig.HASH_PREFIX + user.password}`);
    //       if (result == true) {
    //         const token = jwt.sign({ email: user.email, role: user.role, id: user.id_user }, config.JWT_SECRET);
    //         console.log(id_user,"id_user");
    //         console.log(user,"user");
    //         console.log(role,"role");
    //         return { completed: true, cookie: token, role: user.role };
          
    //       }
         

    //       else {

    //         console.log(response,"resp");
    //         console.log(id_user,"id_user");
    //         console.log(user,"user");
    //         console.log(role,"role");
    //         return false;
    //       }
    //     }
    //   }
    login = async (req) => {
        const service = new UserService();
        const results = await service.select({
           where: `email="${req.body.email}"`,
        });
        const user = results.length === 1 ? results.pop() : null;
        let m = bcrypt.hashSync('test',8);
        console.log(m);
        if(user){
            console.log('req', req.body.password);
            const result = await bcrypt.compare(req.body.password, `${HASH_PREFIX + user.mdp}`);
            if (result){
                const token = jwt.sign({id: user.id_user, email: user.email, role: user.role},JWT_SECRET,{ expiresIn: "1d"}); //dans react sub
                let response = {token:token,role:user.role,id:user.id_user, result: true,message: "bienvenue !"};//{id:user.id, email: user.email, role: user.role,} 
                // console.log(response,"resp");
                // console.log(id_user,"id_user");
                // console.log(user,"user");
                // console.log(role,"role");
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
                'id':payload.id_user,
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
            const payload = {mail:req.body.email,role:1,mdp:req.body.password1,mdp:req.body.password2};
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
            let data = {completed:true, message: "bienvenue !"};
            
        }
        catch{
            return {data:{completed:false, message:"Désolé une erreur est survenue ..."}};
        }
        if(payload){
            const service = new UserService();
            const mdp = (await bcrypt.hash(payload.mdp,8)).replace(authconfig.HASH_PREFIX,'');
            const user = await service.insertUser({email:payload.mail, mdp:mdp, role:''+payload.role});
            return user ?
                {data:{completed:true, message:"Bienvenu sur Family Cuisine, votre compte a bien etais activé, vous pouvez vous connecter"}} :
                {data:{completed:false, message:"Une erreur est survenue ...."}} ;
        }
        return {data:{completed:false, message:"L'activation de votre compte a expiré, réinscriver vous ..."}};
    }


    
    
    
       
        //verif mail 
        
        //recueper le token 
        //hash new pass
        //insere new pass bdd
        renewpass = async (req) => {
            if(req.method !== 'POST') return {status:405};
        
            const token = req.body.token;
            let payload
            let user
            try{
              payload = jwt.verify(token,authconfig.JWT_SECRET);
              user = await this.getUser(payload.mail);
            }
            catch{
              return {data:{completed:false, message:"Désolé une erreur est survenue ..."}};
            }
            if(payload){
              const usermodify = new UserService();
              const password = (await bcrypt.hash(req.body.password1,8)).replace(authconfig.HASH_PREFIX,'');
              const rows = await usermodify.updateUser({where : user.Id_user ,mdp:password});
            return true;
          }
          
          return false;
          
        
        
    }
    renewmail = async (req) =>{
        if(req.method !== 'POST') return {status:405};
        
        const user = await this.getUser(req.body.email);
        if(user){
          const payload = {mail: req.body.email};
          const token = jwt.sign(payload, authconfig.JWT_SECRET, { expiresIn: '1d'});
          const html = 
          `
          <b>Confirmez votre inscription : </b>
          <a href="http://localhost:3000/RenewPassword2?t=${encodeURIComponent(token)}" target="_blank">Confirmer</a>
          
          `;
          await MailerService.sendMail({to: req.body.email, subject:"Confirmer votre inscription", html});
            return true;
        }
        return false;
    
      }
  /* The above code is checking if the user has a valid token. If they do, it will return the user's
  role. */
    Account = async (req) => {
        const auth = req.cookies.token.auth;
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
