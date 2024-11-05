const clientUrl = `${process.env.CLIENT_URL}`;
const otherLink1 = `${process.env.OTHER_LINK1}`;
const otherLink2 = `${process.env.OTHER_LINK2}`;
const allowedOrigins = [
  clientUrl,
  `/^https:\/\/${otherLink1}-\d+\.vercel\.app$/`,
  `/^https:\/\/${otherLink2}-\d+\.vercel\.app$/`,
];

const cors = {
  origin: (origin, callback) => {
    if (
      allowedOrigins.some((allowedOrigin) => {
        return allowedOrigin === origin;
      })
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

export default cors;
