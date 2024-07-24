/* eslint-disable no-await-in-loop -- safe */
import {
  readdir,
  stat as getStat,
  readFile,
  writeFile,
} from "node:fs/promises";
import { extname, join } from "node:path";

export async function implementUseDirectives(appDir: string): Promise<void> {
  await searchTsFiles(appDir);
}

async function searchTsFiles(dir: string): Promise<void> {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = await getStat(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, recursively search it
      await searchTsFiles(filePath);
    } else if (extname(file) === ".ts") {
      // If it's a .ts file, check its content
      const content = await readFile(filePath, "utf8");
      const lines = content.split("\n");

      if (
        lines[0].trim() === '"use api";' ||
        lines[0].trim() === "'use api';"
      ) {
        // Replace the first line
        lines[0] = '"use server";';
        const newContent = lines.join("\n");

        // Write the modified content back to the file
        await writeFile(filePath, newContent, "utf8");
        // eslint-disable-next-line no-console -- safe to ignore
        console.log(`Updated file: ${filePath}`);
      }
    }
  }
}
