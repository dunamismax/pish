import { Meilisearch } from "meilisearch";
import { env } from "./env";

export const meili = new Meilisearch({
	host: env.MEILISEARCH_URL,
	apiKey: env.MEILISEARCH_KEY,
});

export const SPECIES_INDEX = "species";
