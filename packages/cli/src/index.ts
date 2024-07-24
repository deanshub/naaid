import { subcommands, command, run, restPositionals } from "cmd-ts";
import execa from "execa";

const dev = command({
  name: "dev",
  args: {
    rest: restPositionals(),
  },
  handler: async ({ rest }) => {
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
