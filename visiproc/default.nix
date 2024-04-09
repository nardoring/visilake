{
  lib,
  pkg-config,
  rustPlatform,
}:
rustPlatform.buildRustPackage {
  name = "visiproc";
  version = "0.1.0";

  src = lib.cleanSource ./.;

  cargoHash = "sha256-3jWhvjwAheovgglJlRCXKlCg0htiEwNRIykhVIiqDuA=";

  nativeBuildInputs = [pkg-config];

  checkFlags = [
    ## Integration tests
    # requires stack to be deployed to localstack
    "--skip=aws::athena::tests::test_query_execution_and_fetch_results"
    "--skip=aws::athena::tests::test_ctas_execution_and_check_table_exists"
    # requires a writeable directory outside of the nix store
    "--skip=tasks::queue::tests::test_simulated_job_run"
  ];
}
