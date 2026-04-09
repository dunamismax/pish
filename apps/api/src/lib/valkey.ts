import IORedis from "ioredis";
import { env } from "./env";

export const valkey = new IORedis(env.VALKEY_URL, {
	maxRetriesPerRequest: null,
});
