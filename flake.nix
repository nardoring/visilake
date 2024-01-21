{
  description = "Nardo Web project with T3 and rust stack deployed to localstack";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    localstack.url = "github:nardoring/localstack-nix";
    # rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = {
    self,
    nixpkgs,
    localstack,
    ...
    # rust-overlay,
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config.allowUnfree = true;
      # overlays = [rust-overlay.overlays.default];
    };

    # Pull Localstack Docker Image
    localstackImage = pkgs.dockerTools.pullImage {
      imageName = "localstack/localstack-pro";
      imageDigest = "sha256:b6bb4d7b1209b47daccd2d58e669b0fb19ace3ecd98572ec6e3e75921768f6f6";
      sha256 = "sha256-oJlIFsIRtvZSLtABjapc+ZJeJUcDi+xhct/H3o/5pck=";
      finalImageName = "localstack/localstack-pro";
      finalImageTag = "latest";
    };

    # Load Localstack Docker Image
    load-image = pkgs.writeShellApplication {
      name = "load-image";
      text = ''
        echo "Loading the Localstack Docker image..."
        docker load < "$(nix path-info .#localstackImage)"
      '';
    };

    nardo = pkgs.buildNpmPackage {
      pname = "nardo-web";
      version = "0.1.0";
      src = ./.;
      npmDepsHash = "sha256-bDtTlun5Oq2hW/Qny2XSDooVx5KMeNEA5qhfHmTKkcg=";
      npmPackFlags = ["--ignore-scripts"];
    };
    # TODO get this working
    # nardoImage = pkgs.dockerTools.buildImage {
    #   name = "nardo-web-app";
    #   tag = "latest";
    #   created = "now";
    #   copyToRoot = pkgs.buildEnv {
    #     name = "image-root";
    #     paths = [pkgs.nodejs nardo];
    #     pathsToLink = ["/"];
    #   };
    #   config = {
    #     WorkingDir = "/app";
    #     ExposedPorts = {
    #       "3000/tcp" = {};
    #     };
    #     Cmd = ["node" "server.js"];
    #   };
    # };
    #
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs =
        [
          ## rust
          # toolchain
          # pkgs.rust-analyzer-unwrapped

          ## web
          pkgs.nodejs
          pkgs.nodePackages.prettier
          pkgs.nodePackages.eslint

          ## AWS
          pkgs.awscli
          pkgs.terraform
          # pkgs.localstack # broken on nixpkgs
        ]
        ++ localstack.devShells.${system}.default.buildInputs;

      # RUST_SRC_PATH = "${toolchain}/lib/rustlib/src/rust/library";

      # Localstack/AWS env vars
      LOCALSTACK_API_KEY = "4CVxMCDrKZ";
      LOCALSTACK = "true";
      DEBUG = "1";
      AWS_ACCESS_KEY_ID = "test";
      AWS_SECRET_ACCESS_KEY = "test";
      AWS_DEFAULT_REGION = "us-east-1";
    };

    packages.${system} = {
      localstackImage = localstackImage;
      load-image = load-image;
      nardo = nardo;
      # nardoImage = nardoImage;
    };
  };
}
