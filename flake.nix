{
  description = "Nardo Web project with T3 and rust stack";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = {
    self,
    nixpkgs,
    rust-overlay,
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      overlays = [rust-overlay.overlays.default];
    };

    # toolchain = pkgs.rust-bin.fromRustupToolchainFile ./toolchain.toml;

    awscli-local = pkgs.callPackage ./awscli-local.nix {};
  in {
    devShells.${system}.default = pkgs.mkShell {
      packages = [
        # rust
        # toolchain
        # pkgs.rust-analyzer-unwrapped

        # web
        pkgs.awscli2
        pkgs.nodejs
        pkgs.yarn
        # pkgs.nodePackages_latest.serverless
        pkgs.nodePackages.tailwindcss
        pkgs.nodePackages.prettier
        pkgs.nodePackages.eslint

        # testing/deployment
        pkgs.localstack
        awscli-local
      ];

      # RUST_SRC_PATH = "${toolchain}/lib/rustlib/src/rust/library";

      # Localstack/AWS env vars
      LOCALSTACK = "true";
      AWS_ACCESS_KEY_ID = "test";
      AWS_SECRET_ACCESS_KEY = "test";
      AWS_DEFAULT_REGION = "us-east-1";

      shellHook = ''
        echo "Welcome to the Nardo Web development environment!"
        echo "Run yarn dev to start the development server."
      '';
    };
  };
}
