import { defineConfig } from "wxt";

// The PocketBase URL is read from the environment at build time.
// Set VITE_POCKETBASE_URL in your .env file (see .env.example).
const pbUrl =
	process.env.VITE_POCKETBASE_URL?.replace(/\/$/, "") ??
	"https://pb.watch-this.app";

export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifest: {
		name: "WatchThis!",
		content_security_policy: {
			extension_pages: `script-src 'self'; object-src 'self'; connect-src 'self' ${pbUrl} https://www.youtube.com https://i.ytimg.com;`,
		},
		description: "Recommend YouTube videos directly to your friends' feeds.",
		version: "1.0.3",
		key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqEroWuufzW7V6vVwF8s5mOlEaqD2WkC+nqhiU5VGiLWdGf6GvG71oAhZ61xOpiR2pnftdHP97Ezj9gq1H6O6/2r+FMD9NJqHDuuAsI93nlupQEK6mHxOt/V47VNrA55CN3cifc2+eXev8k8aB+2Hem7OyhxNLPptcnkwdEo/8ha/G4jTzmSUGu489rHNhUp+QtJ3F9BPNg4DXNddIGF5iJY7yI1M/jzDKNtc+F4+Ot/m1CxuJdFLLyzrxxIRaGfbWdVYjSnK+0YJdYI5me0dCMctTwXY2raT8WKHNVs/bCqS21BHznHlmfwmXm9Vyf4ejhE+sqqVAPv3/eq34O8MEQIDAQAB",
		permissions: ["storage", "identity"],
		host_permissions: ["*://*.youtube.com/*", `${pbUrl}/*`],
		web_accessible_resources: [
			{
				resources: ["/icon/*"],
				matches: ["*://*.youtube.com/*"],
			},
		],
		browser_specific_settings: {
			gecko: {
				id: "{b43141bf-c568-49c8-aca7-c3f0f936eab8}",
				// @ts-ignore: `data_collection_permissions` is required for AMO metadata but
				// not present on the wxt manifest typing. Silence the type checker here.
				data_collection_permissions: {
					required: ["none"],
				},
			},
		},
	},
});
