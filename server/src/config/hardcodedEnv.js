const hardcodedEnv = Object.freeze({
  PORT: "4000",
  NODE_ENV: "development",
  MONGO_URI: "mongodb+srv://builtattic_api:built2025attic@cluster-builtattic.jxpzbpr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-Builtattic",
  MONGO_DBNAME: "Builtattic_Prod",
  JWT_ACCESS_SECRET: "a3f8c9d2b7e1a0f35c4d7e8a92b1c0d4e7f6a5b31c2d3e4f8a9b0c1df0e1d2c3",
  JWT_REFRESH_SECRET:
    "9f1a2b3c4d5e6f70a1b2c3d4e5f6071829ab3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2fa3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6",
  JWT_ACCESS_EXPIRES: "15m",
  JWT_REFRESH_EXPIRES: "7d",
  CORS_ORIGIN: "*",
  EMAIL_HOST: "smtp.gmail.com",
  EMAIL_PORT: "587",
  EMAIL_USER: "arnav@builtattic.com",
  EMAIL_PASS: "pobp nrzr usdn vjjy",
  EMAIL_FROM: "Builtattic <sup@builtattic.com>",
  PAYMENTS_ENABLED: "false",
  RAZORPAY_KEY_ID: "",
  RAZORPAY_KEY_SECRET: "",
  RAZORPAY_WEBHOOK_SECRET: "",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  REDIS_URL: "redis://localhost:6379",
  GEMINI_API_KEY: "AIzaSyBscFqosSRIpQ9KaIEMuMlfyL0yEGAKNgA",
  GEMINI_MODEL: "gemini-2.5-flash",
  GEMINI_IMAGE_MODEL: "gemini-2.5-flash-image",
  OPENWEATHER_API_KEY: "9f9eaba365ccf5b18a3b323155b2205e",
  BLOCKCHAIN_CHAIN_NAME: "Polygon PoS",
  BLOCKCHAIN_EXPLORER_BASE_URL: "https://polygonscan.com/tx/",
  BLOCKCHAIN_PROOF_NAMESPACE: "builtattic-proofs",
  BLOCKCHAIN_SYNC_INTERVAL_MINUTES: "15",
  SERVE_CLIENT_FROM_API: "false"
});

for (const [key, value] of Object.entries(hardcodedEnv)) {
  if (typeof value === "undefined") continue;
  process.env[key] = `${value}`;
}

export default hardcodedEnv;