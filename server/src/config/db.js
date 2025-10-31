import "./hardcodedEnv.js";

/**
 * Connect to MongoDB if MONGODB_URI is provided.
 * Uses dynamic import for mongoose to avoid hard crash if it's not installed.
 */
export default async function connectDB() {
	// Support both MONGODB_URI and MONGO_URI env names
	const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
	if (!uri) {
		console.warn("[DB] No MONGODB_URI provided. Skipping DB connection.");
		return null;
	}

	try {
		const { default: mongoose } = await import("mongoose");
		mongoose.set("strictQuery", true);
		await mongoose.connect(uri, {
			dbName: process.env.MONGODB_DB || undefined,
		});
		console.log("[DB] Connected to MongoDB");
		return mongoose.connection;
	} catch (err) {
		console.error("[DB] Connection failed:", err?.message || err);
		return null;
	}
}
