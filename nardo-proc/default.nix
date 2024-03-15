{
  lib,
  pkg-config,
  rustPlatform,
}:
rustPlatform.buildRustPackage {
  name = "nardo-proc";
  version = "0.1.0";

  src = lib.cleanSource ./.;

  cargoHash = "sha256-pNuxoO3IYtrUCd5FBKy+I6Xf9ZRczIeimRvHhLtQi0Q=";

  nativeBuildInputs = [pkg-config];

  checkFlags = [
    # reason for disabling test
    # "--skip=example::tests:example_test"
  ];
}
