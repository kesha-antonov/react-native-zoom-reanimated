# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.5.x   | ✅ |
| < 1.5   | ❌ |

Fixes land on the latest 1.5.x release.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through
[GitHub Security Advisories](https://github.com/kesha-antonov/react-native-zoom-reanimated/security/advisories/new),
which lets us discuss and fix the issue before it is disclosed. If that is not
an option for you, email <innokenty.longway@gmail.com>.

Useful things to include: the affected version, your React Native, Reanimated
and Gesture Handler versions, what an attacker can do, and a reproduction if you
have one.

This project is maintained in free time, so please allow a few days for a first
response. You will get an acknowledgement, an assessment, and credit in the
advisory unless you would rather stay anonymous.

## Scope

This library is a pure JavaScript view component. It ships no native code, makes
no network requests, reads no files, and has no runtime dependencies of its own -
it renders children inside gesture and animation wrappers from
`react-native-gesture-handler` and `react-native-reanimated`, which are peer
dependencies you install and control.

In scope: anything in this package that can crash a consuming app, hang the UI
or JS thread, or be driven into unbounded memory or layout growth through
gesture input or props.

Out of scope: vulnerabilities in React Native, Reanimated, or Gesture Handler
themselves - please report those to their respective projects.
