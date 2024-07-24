"use server";

import { exec } from "node:child_process";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

// @ts-expect-error-next-line -- an issue with next types
export async function doStuff(): void {
  await setTimeout(1000);
  // eslint-disable-next-line no-console -- safe to ignore
  console.log("Doing stuff");
  // append to a file text-file.txt
  await appendFile(
    path.join(__dirname, "../../../../../text-file.txt"),
    `${new Date().toLocaleTimeString()}\n`
  );

  try {
    exec("open raycast://extensions/raycast/raycast/confetti");
  } catch (error) {
    // ignore
  }
}
