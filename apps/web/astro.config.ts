import node from "@astrojs/node";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	integrations: [vue()],
	adapter: node({ mode: "standalone" }),
	vite: {
		plugins: [tailwindcss()],
	},
	server: {
		port: 3000,
	},
	output: "server",
});
