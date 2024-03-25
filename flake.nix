{
  description = "Nardo Web project with T3 and rust stack deployed to localstack";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    localstack-nix = {
      url = "github:nardoring/localstack-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    rust-overlay.url = "github:oxalica/rust-overlay";
  };
  outputs = inputs @ {
    flake-parts,
    systems,
    nixpkgs,
    localstack-nix,
    rust-overlay,
    ...
  }: let
    athenaUrl = "http://athena.us-east-1.localhost.localstack.cloud:4566/";
    dynamoUrl = "http://dynamodb.us-east-1.localhost.localstack.cloud:4566/";
    sqsUrl = "http://sqs.us-east-1.localhost.localstack.cloud:4566/";
    authorName = "Test Author";
  in
    flake-parts.lib.mkFlake {inherit inputs;} ({...}: {
      systems = ["x86_64-linux"];
      imports = [inputs.treefmt-nix.flakeModule];

      perSystem = {
        self',
        system,
        config,
        ...
      }: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
          overlays = [rust-overlay.overlays.default];
        };

        toolchain = pkgs.rust-bin.fromRustupToolchainFile ./nardo-proc/toolchain.toml;

        nardo-proc = pkgs.callPackage ./nardo-proc {};

        nardo = pkgs.buildNpmPackage {
          # https://create.t3.gg/en/deployment/docker
          pname = "nardo-web";
          version = "0.1.0";
          src = ./.;
          npmDepsHash = "sha256-JrN3Ktjx89XrGW9cnfsgNVI5JVJLLv7l31GaNyH2bSw=";

          npmBuild = "SKIP_ENV_VALIDATION=1 npm run build";

          npmPackFlags = ["--ignore-scripts"];

          installPhase = ''
            mkdir -p $out/app

            cp -r .next $out/app/.next
            cp -r .next/standalone/* $out/app/
            cp -r .next/static $out/app/.next/static
            cp -r public $out/app/public

            cp package.json $out/app/
            cp next.config.mjs $out/app/
          '';
        };

        localstackpro-image = pkgs.dockerTools.pullImage {
          imageName = "localstack/localstack-pro";
          imageDigest = "sha256:945606c6f58f187822db188e4c6354d3ee49931fc00d6b0aad8fcf36b18eae5a";
          sha256 = "sha256-I3foIleIRK8+lVadmxMNwwd6+ZoGdXJsWIbJSt8nKRQ=";
          finalImageName = "localstack/localstack-pro";
          finalImageTag = "latest";
        };

        nardo-image = pkgs.dockerTools.buildImage {
          name = "nardo";
          tag = "latest";

          copyToRoot = pkgs.buildEnv {
            name = "nardo";
            paths = [
              nardo
              pkgs.nodejs
            ];
            pathsToLink = ["/bin /app"];
          };

          runAsRoot = ''
            #!${pkgs.runtimeShell}
            ${pkgs.dockerTools.shadowSetup}
            groupadd --system --gid 1001 nodejs
            useradd --system --uid 1001 --gid nodejs nextjs
          '';

          config = {
            Cmd = ["${pkgs.nodejs}/bin/node" "server.js"];
            ExposedPorts = {
              "3000/tcp" = {};
            };
            Env = [
              # add other environment variables
              "NODE_ENV=production"
              "NEXT_TELEMETRY_DISABLED=1"
              "AWS_REGION=us-east-1"
              "ATHENA_URL=${athenaUrl}"
              "DYNAMO_URL=${dynamoUrl}"
              "SQS_URL=${sqsUrl}"
              "NEXT_PUBLIC_AUTHOR_NAME=${authorName}"
            ];
            WorkingDir = "/app";
            User = "nextjs";
          };
        };

        localstack = builtins.attrValues localstack-nix.packages.${system};
        treefmtPrograms = builtins.attrValues config.treefmt.build.programs;
        # pyEnv = pkgs.python3.withPackages (ps:
        #   with ps; [
        #     awswrangler
        #     pandas
        #     numpy
        #   ]);

        # info on this dataset can be found here
        # https://data.world/data-society/us-air-pollution-data
        dataset = pkgs.fetchurl {
          url = "https://query.data.world/s/mz5ot3l4zrgvldncfgxu34nda45kvb";
          sha256 = "sha256-52Iova39Ao3Xom11rFFF42OjCokxJ8AixLKRTXhi10Q=";
        };
      in {
        treefmt.config = {
          projectRootFile = "flake.nix";
          programs = {
            alejandra.enable = true;
            deadnix.enable = true;
            prettier = {
              enable = true;
              settings = {
                # https://github.com/numtide/treefmt-nix/blob/main/programs/prettier.nix
                # plugins = ["prettier-plugin-tailwindcss"];
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
            rustfmt.enable = true;
            # ruff = {
            #   enable = true;
            #   format = true;
            # };
            shellcheck.enable = true;
            terraform = {
              enable = true;
              package = pkgs.terraform;
            };
          };
          settings.formatter.prettier.excludes = ["./infra/mockdata/rearc-usa-hospital-beds/**"];
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs;
            [
              toolchain
              pkgs.rust-analyzer-unwrapped
              # pyEnv
              nodejs
              nodePackages.eslint
              # parquet-tools
            ]
            ++ localstack
            ++ treefmtPrograms;

          shellHook = ''
            ln -sf ${dataset} ./infra/mockdata/dataset.csv
            node src/utils/dbMockJobGenerator.js
          '';

          RUST_BACKTRACE = 1;
          RUST_SRC_PATH = "${toolchain}/lib/rustlib/src/rust/library";

          LOCALSTACK_API_KEY = "4CVxMCDrKZ";
          LOCALSTACK = "true";
          DEBUG = "1";
          AWS_ACCESS_KEY_ID = "test";
          AWS_SECRET_ACCESS_KEY = "test";
          AWS_DEFAULT_REGION = "us-east-1";
          AWS_REGION = "us-east-1";
          ATHENA_URL = "${athenaUrl}";
          DYNAMO_URL = "${dynamoUrl}";
          SQS_URL = "${sqsUrl}";
          NEXT_PUBLIC_AUTHOR_NAME = "${authorName}";
        };

        packages = {
          nardo = nardo;
          nardo-rust = nardo-proc;
          nardo-image = nardo-image;
          localstackpro-image = localstackpro-image;
        };
        checks.systems = self'.packages.nardo-rust;
      };
    });
}
