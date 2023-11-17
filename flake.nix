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
      imageName = "localstack/localstack";
      imageDigest = "sha256:31300a9a8a80cfe32aa579b0d0873f130dabcf54d7525803bf9a40f76ee1fa62";
      sha256 = "0rrd2swcpal7yswx933ig016zarpazmdfgxvzk9v98szc554ssc8";
      finalImageName = "localstack/localstack";
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
      packages = [
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
        pkgs.localstack
        ## local AWS
        localstack.localstack-nix
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

    packages.${system} = {
      localstackImage = localstackImage;
      load-image = load-image;
      nardo = nardo;
      # nardoImage = nardoImage;
    };
  };
}
