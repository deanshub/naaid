/* eslint-disable @typescript-eslint/no-non-null-assertion -- safe */
/* eslint-disable no-console -- safe */
/* eslint-disable no-await-in-loop -- safe */
import {
  readdir,
  stat as getStat,
  readFile,
  writeFile,
  mkdir,
} from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { findImportingFiles } from "./importings";

export async function implementUseDirectives(appDir: string): Promise<void> {
  await searchTsFiles(join(appDir, "src/app"), appDir);
}

// TODO:
// 1. remove the first line if it's "use api" (V)
// 2. generate a route.ts in api/ based on the file name (V)
// 3. generate the submit handler function inside the relevant component or file (V)
// 4. replace the function usage with the handler function (V)
async function searchTsFiles(
  rootAppDir: string,
  currentDir: string
): Promise<void> {
  const files = await readdir(currentDir);

  for (const file of files) {
    const filePath = join(currentDir, file);
    const stat = await getStat(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, recursively search it
      await searchTsFiles(rootAppDir, filePath);
    } else if (extname(file) === ".ts") {
      // If it's a .ts file, check its content
      const content = await readFile(filePath, "utf8");
      const lines = content.split("\n");

      if (
        lines[0].trim() === '"use api";' ||
        lines[0].trim() === "'use api';"
      ) {
        // Replace the first line with 'use server';
        // lines[0] = lines[0].replace("api", "server");
        // const newContent = lines.join("\n");
        const newContent = lines.slice(1).join("\n");

        // Write the modified content back to the file
        await writeFile(filePath, newContent, "utf8");
        await generateRouteFile(rootAppDir, filePath);
        await generateSubmitHandler(rootAppDir, filePath);

        console.log(`Updated file: ${filePath}`);
      }
    }
  }
}

async function generateRouteFile(
  appDir: string,
  filePath: string
): Promise<void> {
  const routePath = join(
    appDir,
    "api",
    filePath.split("/").slice(-1)[0].replace(".ts", ""),
    "route.ts"
  );

  // file content should be import of all functions from the file and a POST function that calls the function
  const fileContent = `import * as actions from "${relative(
    routePath.replace("/route.ts", ""),
    filePath
  ).replace(".ts", "")}";

export async function POST(req: Request): Promise<Response> {
  const { functionName } = (await req.json()) as Record<string, string>;
  const data = await (actions as Record<string, () => unknown>)[functionName]();
  return Response.json({ ok: true, data });
}
  `;

  await mkdir(routePath.replace("/route.ts", ""), { recursive: true });

  await writeFile(routePath, fileContent, {
    encoding: "utf8",
  });
  console.log(`Generated route file: ${routePath}`);
}

async function generateSubmitHandler(
  rootAppDir: string,
  filePath: string
): Promise<void> {
  // search for files with imports to the file
  const importingFiles = await findImportingFiles(filePath, rootAppDir);

  // add the submit handler function to the file
  for (const importingFile of importingFiles) {
    const content = await readFile(importingFile, "utf-8");
    const importedFunction = new RegExp(
      `import {(?<functionName>.*)} from .*${filePath.split("/").slice(-1)[0].replace(".ts", "")}`
    ).exec(content);

    const contentWithHandler = content.replace(
      "return (",
      `function ${importedFunction!.groups!.functionName.trim()}(_formData: FormData): void {
    void fetch("/api/${filePath.split("/").slice(-1)[0].replace(".ts", "")}", { method: "POST", body: JSON.stringify({ functionName: "${importedFunction!.groups!.functionName.trim()}" })}) ;
    }
    return (`
    );

    // remove the import line
    const newContent = contentWithHandler
      .split("\n")
      .filter(
        (line) =>
          !line.includes(
            `import {${importedFunction!.groups!.functionName}} from`
          )
      )
      .join("\n");

    await writeFile(importingFile, newContent, "utf-8");
    console.log(`Updated file: ${importingFile}`);
  }
}
