const sessionConfig = {
  secret: 'un-secret-molt-molt-segur-canvia-aixo',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

export default sessionConfig;