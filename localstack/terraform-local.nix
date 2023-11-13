{
  python310Packages,
  terraform,
}:
python310Packages.buildPythonApplication rec {
  pname = "terraform-local";
  version = "0.16.0";

  src = python310Packages.fetchPypi {
    inherit pname version;
    hash = "sha256-MZMhPFQnXVokB9AXY3eKh25FoE2qpIxKaYpkgH11eh4=";
  };

  doCheck = true;

  nativeBuildInputs = with python310Packages; [
    bc-python-hcl2
    localstack-client
  ];

  propagatedBuildInputs = with python310Packages; [
    bc-python-hcl2
  ];


  nativeCheckInputs =  [
    terraform
  ];

  checkPhase = ''
    $out/bin/tflocal --version
  '';
}
