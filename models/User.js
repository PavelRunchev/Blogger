const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const userSchema = new mongoose.Schema({
    email: { type: mongoose.Schema.Types.String, required: true, unique: true },
    hashedPass: { type: mongoose.Schema.Types.String, required: true },
    firstName: { type: mongoose.Schema.Types.String, required: true },
    lastName: { type: mongoose.Schema.Types.String, required: true },
    age: { type: mongoose.Schema.Types.Number, required: true },
    gender: { type: mongoose.Schema.Types.String, required: true },
    profileImage: { type: mongoose.Schema.Types.String },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: [] }],
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: [] }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: [] }],
    salt: { type: mongoose.Schema.Types.String, required: true },
    roles: [{ type: mongoose.Schema.Types.String }],
    createDate: { type: mongoose.Schema.Types.Date, default: Date.now },
    isOnline: { type: mongoose.Schema.Types.Boolean, default:false },
    acceptCookie: { type: mongoose.Schema.Types.Boolean, default: false }
});

userSchema.path('email').validate(function() {
    return RegExp('^[A-Za-z0-9._-]+@[a-z0-9.-]+.[a-z]{2,4}$').test(this.email)
}, 'Email is incorrect format!');

userSchema.path('firstName').validate(function() {
    return RegExp('^[A-Z][a-z- ]+$').test(this.firstName);
}, 'First name starts with capital letter!');

userSchema.path('lastName').validate(function() {
    return RegExp('^[A-Z][a-z- ]+$').test(this.lastName);
}, 'Last name starts with capital letter!');

userSchema.path('gender').validate(function() {
    return this.gender.toLowerCase() === 'male' || this.gender.toLowerCase() === 'female';
}, 'Gender must be Male or Female!');

userSchema.method({
    matchPassword: function(password) {
        return bcrypt.compare(password, this.hashedPass);
    }
});

userSchema.pre('save', function (next) {
    if (this.isModified('password')) {
      bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) { next(err); return; }
        bcrypt.hash(this.password, salt, (err, hash) => {
          if (err) { next(err); return; }
          this.password = hash;
          next();
        });
      });
      return;
    }
    next();
  });

const User = mongoose.model('User', userSchema);

User.seedAdminUser = async() => {
    try {
        let users = await User.find();
        if (users.length > 0) return;
        bcrypt.genSalt(saltRounds, function(err, salt) {
            if(err) { next(err); return; }
            bcrypt.hash('123', salt, (err, hash) => {
                if(err) { next(err); return; }
                return User.create({
                    email: 'abobo@abv.bg',
                    salt,
                    hashedPass: hash,
                    firstName: 'Abobo',
                    lastName: 'Bobchev',
                    age: 34,
                    gender: 'male',
                    profileImage: '/userProfile/Admin_20122.png',
                    articles: [],
                    messages: [],
                    posts: [],
                    isOnline: false,
                    roles: ['User', 'Admin']
                });
            });
        });
    } catch (next) {
        next();
    }
};

module.exports = User;