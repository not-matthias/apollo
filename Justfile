build:
    zola build --output-dir ./dist --force
    minify -r -a -o dist/ dist/

lighthouse: build
    bunx @lhci/cli@0.15.0 autorun

lighthouse-open:
    bunx @lhci/cli@0.15.0 open

ci: build lighthouse

clean:
    rm -rf dist/ public/ .lighthouseci/
