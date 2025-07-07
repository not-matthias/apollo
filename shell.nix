let
  pinned_nixpkgs = builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/979daf34c8cacebcd917d540070b52a3c2b9b16e.tar.gz";
    sha256 = "0b0j3m8i2amwzi374am7s3kkhf3dxrvqwgr1lk8csr1v7fw9z85q";
  };
  pkgs-playwright = import pinned_nixpkgs {};
   browsers = (builtins.fromJSON (builtins.readFile "${pkgs-playwright.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head (builtins.filter (x: x.name == "chromium") browsers)).revision;
in
{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
  ] ++ [
    pkgs-playwright.playwright
    pkgs-playwright.playwright-driver.browsers
  ];

  shellHook = ''
    export PLAYWRIGHT_BROWSERS_PATH=${pkgs-playwright.playwright-driver.browsers}
    export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
    export PLAYWRIGHT_NODEJS_PATH="${pkgs.nodejs}/bin/node"
    export PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH="${pkgs-playwright.playwright.browsers}/chromium-${chromium-rev}/chrome-linux/chrome"

  '';
}
