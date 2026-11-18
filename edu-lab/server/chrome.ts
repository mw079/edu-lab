// Headless Chrome for the checks and the card pictures: the installed Chrome if there is one, otherwise
// Playwright's own Chromium.
import { chromium, type Browser } from "playwright";

export const launchChrome = (): Promise<Browser> => chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
