# Assets

Replace these placeholder files with real assets before building for production:

- `icon.png` — 1024×1024 app icon (orange theme, #FF6B2B)
- `splash.png` — 1284×2778 splash screen image
- `adaptive-icon.png` — 1024×1024 Android adaptive icon foreground
- `favicon.png` — 48×48 web favicon
- `notification-icon.png` — 96×96 Android notification icon (white on transparent)

Expo will use these during `expo build` / EAS Build.
Run `npx expo install expo-asset` and use `Asset.fromModule()` if you need to
bundle them at runtime.
