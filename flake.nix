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
      zolaRelease =
        {
          "x86_64-linux" = {
            target = "x86_64-unknown-linux-gnu";
            hash = "sha256-4uh95EDmlSRhnPYGelvFNP93DUzg/DCjx8ezCS8XsEU=";
          };
          "aarch64-linux" = {
            target = "aarch64-unknown-linux-gnu";
            hash = "sha256-4AqHFH4vhw30KykYdFK0jGYO49TA3O4gCvXVSYcGN74=";
          };
          "x86_64-darwin" = {
            target = "x86_64-apple-darwin";
            hash = "sha256-lzjDE+g8bBun+RAalxJwiReqQS8HHfQs7iw3s3Ol5cU=";
          };
          "aarch64-darwin" = {
            target = "aarch64-apple-darwin";
            hash = "sha256-DQohCQkK7kkBtS2NSlUtYrfGT8C+xOl/I7QObRSDvcE=";
          };
        }.${
          system
        };
      zola = pkgs.stdenvNoCC.mkDerivation {
        pname = "zola";
        version = "0.23.2";
        src = pkgs.fetchurl {
          url = "https://github.com/getzola/zola/releases/download/v0.23.2/zola-v0.23.2-${zolaRelease.target}.tar.gz";
          inherit (zolaRelease) hash;
        };
        installPhase = "install -Dm755 ../zola $out/bin/zola";
      };
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
          prettier
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
