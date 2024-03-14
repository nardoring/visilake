{
  lib,
  pkg-config,
  rustPlatform,
}:
rustPlatform.buildRustPackage {
  name = "nardo-proc";
  version = "0.1.0";

  src = lib.cleanSource ./.;

  cargoHash = "sha256-n1whIBWTUR1Ub6+Rz3Bo83EIJa2lLpIkQVHiwnD40oc=";

  nativeBuildInputs = [pkg-config];

  checkFlags = [
    # reason for disabling test
    # "--skip=example::tests:example_test"
  ];
}
