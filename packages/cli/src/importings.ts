/* eslint-disable no-await-in-loop -- safe */
import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";

export async function findImportingFiles(
  targetFilePath: string,
  searchDir: string
): Promise<string[]> {
  const importingFiles: string[] = [];
  const targetFileName = basename(targetFilePath);

  async function searchFiles(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await searchFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
        const content = await readFile(fullPath, "utf-8");
        const importRegex = new RegExp(
          `import.*from\\s+['"].*${targetFileName.replace(".ts", "")}['"]`,
          "g"
        );

        if (importRegex.test(content)) {
          importingFiles.push(fullPath);
        }
      }
    }
  }

  await searchFiles(searchDir);
  return importingFiles;
}
