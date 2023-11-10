{
  description = "Nardo Web project with T3 and rust stack deployed to localstack";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    # rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = {
    self,
    nixpkgs,
    # rust-overlay,
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      # overlays = [rust-overlay.overlays.default];
    };

    # toolchain = pkgs.rust-bin.fromRustupToolchainFile ./toolchain.toml;

    awscli = pkgs.callPackage ./localstack/awscli-local.nix {};
    awscdk = pkgs.callPackage ./localstack/awscdk-local.nix {};
  in {
    devShells.${system}.default = pkgs.mkShell {
      packages = [
        # rust
        # toolchain
        # pkgs.rust-analyzer-unwrapped

        # web
        pkgs.nodejs
        pkgs.yarn
        pkgs.nodePackages_latest.serverless
        # pkgs.nodePackages.tailwindcss
        pkgs.nodePackages.prettier
        pkgs.nodePackages.eslint

        ## AWS
        pkgs.awscli
        pkgs.nodePackages_latest.aws-cdk
        # local AWS
        pkgs.localstack
        awscli
        awscdk
      ];

      # RUST_SRC_PATH = "${toolchain}/lib/rustlib/src/rust/library";

      # Localstack/AWS env vars
      LOCALSTACK_API_KEY = "1n5HqMitb2"; ## add api key
      LOCALSTACK = "true";
      DEBUG = "1";
      AWS_ACCESS_KEY_ID = "test";
      AWS_SECRET_ACCESS_KEY = "test";
      AWS_DEFAULT_REGION = "us-east-1";
    };
  };
}
