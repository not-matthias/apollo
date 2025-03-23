{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    zola

    # Formatters
    treefmt
    nodePackages.prettier
    alejandra
    djlint
  ];
}
