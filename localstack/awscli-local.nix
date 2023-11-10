{
  python310Packages,
  awscli,
  substituteAll,
}:
python310Packages.buildPythonApplication rec {
  pname = "awscli-local";
  # version = "0.20";
  version = "0.21";

  src = python310Packages.fetchPypi {
    inherit pname version;
    # hash = "sha256-hpREX0/PEeHtFcDPRxULhfWQTMbyeugVcEO4nPn0sWo=";
    hash = "sha256-marWuODP77IJNFOGbLzSTnENfmoVI8rAlp7Q9kRC6nw=";
  };

  doCheck = false;

  nativeBuildInputs = with python310Packages; [
    urllib3
    localstack-client
  ];

  patches = [
    # hardcode paths to aws in awscli2 package
    (substituteAll {
      src = ./fix-path.patch;
      aws = "${awscli}/bin/aws";
    })
  ];

  checkPhase = ''
    $out/bin/awslocal -h
    $out/bin/awslocal --version
  '';
}
