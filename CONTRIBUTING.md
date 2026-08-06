# Contributing

Thanks for considering a contribution. This is a small, single-component
library with no native code, so the feedback loop is fast and almost any change
is easy to try out in the example app.

## Getting set up

The repo is a Yarn workspace: the library at the root, a runnable Expo app in
[`example/`](example). Yarn is pinned through `packageManager`, so Corepack
picks the right version.

```bash
corepack enable
yarn install
```

`yarn install` runs `bob build` through the `prepare` hook, so a successful
install also means the package built.

## Working on a change

```bash
yarn lint        # ESLint
yarn autofix     # ESLint with --fix
yarn typecheck   # tsc --noEmit
yarn test        # Jest, run from example/
yarn build       # react-native-builder-bob
```

CI runs lint, typecheck and test on every push to `main` and every pull
request. Running those three locally covers the same ground.

If tests fail with a `MODULE_NOT_FOUND` error mentioning `jest-cli`, your
`node_modules` is out of date rather than your change being broken - remove it
and reinstall.

## Trying it in the example app

The example app is the fastest way to see a gesture change. It needs a dev
client rather than Expo Go, because it consumes the library from source.

```bash
cd example
yarn installDevBuild:ios      # or :android, once
yarn start                    # subsequently
```

The example imports the library through the workspace, so edits to `src/` show
up on reload without a rebuild.

## Code style

ESLint enforces the house style and `yarn autofix` handles the mechanical part.
The short version: two-space indent, single quotes, no semicolons.

Gesture and animation code runs on the UI thread through Reanimated worklets.
Keep worklet bodies free of anything that needs the JS thread, and reach for
`scheduleOnRN` when you genuinely need to cross back.

## Pull requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Describe what changed and why. For a gesture or animation change, a short
screen recording from the example app says more than any description.

## Reporting bugs

Open an [issue](https://github.com/kesha-antonov/react-native-zoom-reanimated/issues)
with your React Native, Reanimated and Gesture Handler versions, whether you are
on Expo or bare, the platform, and a reproduction if you can manage one. For
anything gesture related, a screen recording helps enormously.
