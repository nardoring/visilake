{...}: {
  projectRootFile = "flake.nix";
  programs = {
    alejandra.enable = true;

    prettier = {
      enable = true;
      settings = {
        # https://github.com/numtide/treefmt-nix/blob/main/programs/prettier.nix
        plugins = ["prettier-plugin-tailwindcss"];
        bracketSameLine = false;
        bracketSpacing = true;
        jsxSingleQuote = true;
        printWidth = 80;
        semi = true;
        singleAttributePerLine = true;
        singleQuote = true;
        tabWidth = 2;
        trailingComma = "es5";
      };
    };

    shellcheck.enable = true;
    # terraform.enable = true;
  };
}
