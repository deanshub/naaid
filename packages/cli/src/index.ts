import { subcommands, command, run, restPositionals } from "cmd-ts";
import execa from "execa";
import { implementUseDirectives } from "./directives";

const dev = command({
  name: "dev",
  args: {
    rest: restPositionals(),
  },
  handler: async ({ rest }) => {
    await implementUseDirectives(process.cwd());
    await execa("next", ["dev", ...rest], {
      stdio: "inherit",
    });
  },
});

const nestingSubcommands = subcommands({
  name: "mynext",
  cmds: { dev },
});

void run(nestingSubcommands, process.argv.slice(2));
