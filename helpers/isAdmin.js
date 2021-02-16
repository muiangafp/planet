module.exports = {
    isAdmin: function(req, res, next){
        if(req.isAuthenticated() && req.user.role == 1){
            return next();
        }

        req.flash("error_msg", "You have to be logged in to get into this path")
        res.redirect("/")
    }
}