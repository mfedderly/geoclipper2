## Publishing

```
git fetch origin
git checkout origin/main
pnpm version (patch|minor|major)
git push --force origin HEAD:main --tags
```

Go into Github UI and create a release from the tag that was just pushed
