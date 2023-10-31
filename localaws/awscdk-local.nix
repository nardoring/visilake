{
  buildNpmPackage,
  fetchFromGitHub,
}:
buildNpmPackage {
  pname = "aws-cdk-local";
  version = "";

  src = fetchFromGitHub {
    owner = "localstack";
    repo = "aws-cdk-local";
    rev = "348de148d30021bb611e9cdb1a8b8ce83d9a59a5";
    sha256 = "sha256-NizjW3cgRjFUR4+kp7mkZT1at0+HP2674gb4H/rO/Sc=";
  };

  npmDepsHash = "sha256-QIiDORj60/1isXRV7o90a18QwdbLLozbM/6iZuqr0a4=";

  # if things get wonky
  # npmPackFlags = ["--ignore-scripts"];
  # NODE_OPTIONS = "--openssl-legacy-provider";

  # no build script in repo
  dontNpmBuild = true;
}
