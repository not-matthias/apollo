{
  description = "Apollo - A modern and minimalistic blog theme for Zola";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          zola
          pre-commit
          just
          bun

          # Formatters
          treefmt
          nodePackages.prettier
          alejandra
          djlint

          # For minifying assets
          minify
        ];

        shellHook = ''
          # Install pre-commit hooks if not already installed
          if [ ! -f .git/hooks/pre-commit ]; then
            echo "Installing pre-commit hooks..."
            pre-commit install
          fi
        '';
      };
    });
}
