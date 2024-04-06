{
  description = "Visilake Web project with T3 and rust stack deployed to localstack";

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
    athenaResults = "s3://aws-athena-query-results-000000000000-us-east-1";
    dynamoUrl = "http://dynamodb.us-east-1.localhost.localstack.cloud:4566/";
    sqsUrl = "http://sqs.us-east-1.localhost.localstack.cloud:4566/";
    authorName = "Test Author";
    snsUrl = "http://sns.us-east-1.localhost.localstack.cloud:4566/";
    s3Url = "http://s3.us-east-1.localhost.localstack.cloud:4566/";
  in
    flake-parts.lib.mkFlake {inherit inputs;} ({...}: {
      systems = ["x86_64-linux"];
      imports = [inputs.treefmt-nix.flakeModule];

      perSystem = {
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

        visilake-proc = pkgs.callPackage ./nardo-proc {}; # TODO: Rename rust app dir

        visilake = pkgs.buildNpmPackage {
          # https://create.t3.gg/en/deployment/docker
          pname = "visilake";
          version = "0.1.0";
          src = ./.;
          npmDepsHash = "sha256-VMR9H6o8xL7ap3k0TTsvll+hA6DQanInT+0hO7W6XR4=";

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

        visilake-image = pkgs.dockerTools.buildImage {
          name = "visilake";
          tag = "latest";

          copyToRoot = pkgs.buildEnv {
            name = "visilake";
            paths = [
              visilake
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
              "ATHENA_QUERY_RESULTS=${athenaResults}"
              "DYNAMO_URL=${dynamoUrl}"
              "SQS_URL=${sqsUrl}"
              "NEXT_PUBLIC_AUTHOR_NAME=${authorName}"
              "SNS_URL=${snsUrl}"
              "S3_URL=${s3Url}"
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
            ruff = {
              enable = true;
              format = true;
            };
            shellcheck.enable = true;
            terraform = {
              enable = true;
              package = pkgs.terraform;
            };
          };
          settings.formatter.prettier.excludes = ["./infra/mockdata/**"];
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
          ATHENA_QUERY_RESULTS = "${athenaResults}";
          DYNAMO_URL = "${dynamoUrl}";
          SQS_URL = "${sqsUrl}";
          NEXT_PUBLIC_AUTHOR_NAME = "${authorName}";
          SNS_URL = "${snsUrl}";
          S3_URL = "${s3Url}";
        };

        packages = {
          visilake = visilake;
          visilake-rust = visilake-proc;
          visilake-image = visilake-image;
          localstackpro-image = localstackpro-image;
        };
        # checks.systems = self'.packages.visilake-rust;
      };
    });
}
