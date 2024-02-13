{...}: {
  projectRootFile = "flake.nix";
  programs = {
    alejandra.enable = true;
    prettier.enable = true;
    shellcheck.enable = true;
    # terraform.enable = true;
    yamlfmt.enable = true;
  };
}
